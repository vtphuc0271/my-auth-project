using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Auth.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Twilio.Rest.Api.V2010.Account;
using Twilio;
using AuthApi.DTOs;
using Auth.Infrastructure.Data;
using Auth.Core.Models.Entities;
using System.Security.Cryptography;

namespace AuthApi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AuthController> _logger;
        private readonly IUserService _userService;
        private readonly AppDbContext _dbContext;

        public AuthController(
            IConfiguration configuration,
            IUserService userService,
            IWebHostEnvironment environment,
            AppDbContext dbContext,
            ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
            _userService = userService;
            _dbContext = dbContext;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation($"Nhận yêu cầu đăng nhập từ người dùng: {request?.PhoneNumber}");

            if (!ModelState.IsValid)
            {
                _logger.LogWarning($"Yêu cầu đăng nhập thất bại vì model không hợp lệ.");
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", ModelState.ToDictionary(
                    kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())));
            }

            var user = await _userService.AuthenticateAsync(request.PhoneNumber, request.Password);

            if (user == null)
            {
                _logger.LogWarning($"Xác thực thất bại cho người dùng: {request.PhoneNumber}. Thông tin xác thực không hợp lệ.");
                return Unauthorized(new ApiResponse<object>(false, "Số điện thoại hoặc mật khẩu không hợp lệ", null));
            }

            _logger.LogInformation($"Xác thực người dùng thành công. User ID: {user.UserID}, Username: {user.Username}");

            return await HandleOtpLogin(user);
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized(new ApiResponse<object>(false, "Chưa xác nhận được người dùng, vui lòng đăng nhập", null));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = _userService.GetUserByUserId(Guid.Parse(userId));

            return Ok(new ApiResponse<object>(true, "Lấy thông tin người dùng thành công", new { userId, user.Result.Username }));
        }

        [Authorize]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            _logger.LogInformation($"Nhận yêu cầu verify OTP cho UserId: {request.UserId}, OtpCode: {request.OtpCode}");
            _logger.LogInformation($"Cookies nhận được: {string.Join(", ", Request.Cookies.Select(c => $"{c.Key}={c.Value}"))}");

            var otp = await _dbContext.OtpRecords
                .FirstOrDefaultAsync(o => o.UserId == request.UserId && o.OtpCode == request.OtpCode && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow);

            if (otp == null)
            {
                _logger.LogWarning($"OTP không hợp lệ hoặc đã hết hạn cho UserId: {request.UserId}");
                return BadRequest(new ApiResponse<object>(false, "Mã OTP không hợp lệ hoặc đã hết hạn.", null));
            }

            otp.IsUsed = true;
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FindAsync(request.UserId);
            if (user == null)
            {
                _logger.LogWarning($"Không tìm thấy người dùng với UserId: {request.UserId}");
                return BadRequest(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            _logger.LogInformation($"Xác thực OTP thành công cho UserId: {request.UserId}");
            return Ok(new ApiResponse<object>(true, "Xác thực OTP thành công.", new { Username = user.Username }));
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth-token");
            Response.Cookies.Delete("X-CSRF-TOKEN");
            _logger.LogInformation("Người dùng đăng xuất thành công.");
            return Ok(new ApiResponse<object>(true, "Đăng xuất thành công", null));
        }

        [AllowAnonymous]
        [HttpPost("generate-qr-code")]
        public async Task<IActionResult> GenerateQrCode()
        {
            var qrCode = Guid.NewGuid().ToString();
            var qrSession = new QrCodeSession
            {
                QrCodeSessionID = Guid.NewGuid(),
                UserID = null,
                Code = qrCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            _dbContext.QrCodeSessions.Add(qrSession);
            await _dbContext.SaveChangesAsync();

            return Ok(new ApiResponse<string>(true, "Tạo mã QR thành công", qrCode));
        }

        [Authorize]
        [HttpPost("verify-qr-code")]
        public async Task<IActionResult> VerifyQrCode([FromBody] VerifyQrCodeRequest request)
        {
            var qrSession = await _dbContext.QrCodeSessions
                .FirstOrDefaultAsync(q => q.Code == request.QrCode && !q.IsUsed && q.ExpiresAt > DateTime.UtcNow);

            if (qrSession == null)
            {
                return BadRequest(new ApiResponse<object>(false, "Mã QR không hợp lệ hoặc đã hết hạn", null));
            }

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new ApiResponse<object>(false, "Không thể xác định người dùng", null));
            }

            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return BadRequest(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            qrSession.UserID = userId;
            qrSession.IsUsed = true;
            await _dbContext.SaveChangesAsync();

            var (token, expires) = GenerateJwtToken(user);
            var csrfToken = Guid.NewGuid().ToString();
            var secure = !_environment.IsDevelopment();
            var sameSite = secure ? SameSiteMode.None : SameSiteMode.Lax;

            Response.Cookies.Append("auth-token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = sameSite,
                Secure = secure,
                Expires = expires,
                Path = "/"
            });

            Response.Cookies.Append("X-CSRF-TOKEN", csrfToken, new CookieOptions
            {
                HttpOnly = false,
                SameSite = sameSite,
                Secure = secure,
                Expires = expires,
                Path = "/"
            });

            return Ok(new ApiResponse<object>(true, "Xác thực QR thành công", null));
        }

        // Xử lý đăng nhập
        private async Task<IActionResult> HandleOtpLogin(User user)
        {
            var otpCode = GenerateSecureOtpCode();
            var otp = new OtpRecord
            {
                Id = Guid.NewGuid(),
                UserId = user.UserID,
                OtpCode = otpCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Otp:số phút hết hạn", 5)),
                IsUsed = false
            };

            _dbContext.OtpRecords.Add(otp);
            try
            {
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Mã OTP được tạo và lưu cho UserId: {user.UserID}, Mã OTP: {otpCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lưu OTP vào CSDL cho UserId: {user.UserID}. Error: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>(false, "Lỗi lưu OTP", null));
            }

            await GenerateTokensAndSetCookies(user);

            if (_environment.IsDevelopment())
            {
                _logger.LogInformation($"[Phát triển] Đã gửi mã OTP giả cho UserId: {user.UserID}, OTP Code: {otpCode}");
                return Ok(new ApiResponse<object>(true, "Đã gửi mã OTP (giả)", new { RequiresOtp = true, UserId = user.UserID, OtpCode = otpCode }));
            }

            try
            {
                await SendOtpViaTwilio(user.PhoneNumber, otpCode);
                return Ok(new ApiResponse<object>(true, "Đã gửi OTP đến điện thoại", new { RequiresOtp = true, UserId = user.UserID }));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi gửi OTP cho UserId: {user.UserID}. Error: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>(false, "Lỗi khi gửi OTP", null));
            }
        }

        // Tạo token và cookie
        private async Task<IActionResult> GenerateTokensAndSetCookies(User user)
        {
            var (token, expires) = GenerateJwtToken(user);
            var csrfToken = Guid.NewGuid().ToString();
            var secure = !_environment.IsDevelopment();
            var sameSite = secure ? SameSiteMode.None : SameSiteMode.Lax;

            Response.Cookies.Append("auth-token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = sameSite,
                Secure = secure,
                Expires = expires,
                Path = "/"
            });
            _logger.LogInformation($"Đã đặt cookie 'auth-token' cho UserId: {user.UserID}, hết hạn: {expires}");

            Response.Cookies.Append("X-CSRF-TOKEN", csrfToken, new CookieOptions
            {
                HttpOnly = false,
                SameSite = sameSite,
                Secure = secure,
                Expires = expires,
                Path = "/"
            });
            _logger.LogInformation($"Đã đặt cookie 'X-CSRF-TOKEN' cho UserId: {user.UserID}, hết hạn: {expires}");

            return Ok(new ApiResponse<object>(true, "Đăng nhập thành công", new { csrfToken }));
        }

        // Tạo JWT token
        private (string token, DateTime expires) GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.MobilePhone, user.PhoneNumber),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                _logger.LogError("Không tìm thấy khóa JWT trong cấu hình.");
                throw new InvalidOperationException("Khóa JWT chưa được cấu hình.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddHours(24); // Tăng thời gian hết hạn lên 24 giờ

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expires);
        }

        // Tạo mã OTP
        private string GenerateSecureOtpCode()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] bytes = new byte[4];
                rng.GetBytes(bytes);
                var number = BitConverter.ToUInt32(bytes, 0) % 900000 + 100000; // Đảm bảo OTP 6 chữ số
                return number.ToString("D6");
            }
        }

        // Gửi OTP qua Twilio
        private async Task SendOtpViaTwilio(string phoneNumber, string otpCode)
        {
            var twilioAccountSid = _configuration["Twilio:AccountSid"];
            var twilioAuthToken = _configuration["Twilio:AuthToken"];
            var twilioPhoneNumber = _configuration["Twilio:PhoneNumber"];

            TwilioClient.Init(twilioAccountSid, twilioAuthToken);

            string formattedToNumber = phoneNumber.StartsWith("+") ? phoneNumber : $"+84{phoneNumber.TrimStart('0')}";
            string formattedFromNumber = twilioPhoneNumber.StartsWith("+") ? twilioPhoneNumber : $"+84{twilioPhoneNumber.TrimStart('0')}";

            var message = await MessageResource.CreateAsync(
                body: $"Your OTP code is: {otpCode}",
                from: new Twilio.Types.PhoneNumber(formattedFromNumber),
                to: new Twilio.Types.PhoneNumber(formattedToNumber)
            );

            _logger.LogInformation($"OTP gửi thành công qua Twilio đến: {formattedToNumber}. Message SID: {message.Sid}");
        }
    }
}