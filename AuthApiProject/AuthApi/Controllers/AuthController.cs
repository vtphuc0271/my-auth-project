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
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;
        private readonly IWebHostEnvironment _environment;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IConfiguration configuration,
            IUserService userService,
            IWebHostEnvironment environment,
            AppDbContext dbContext,
            ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _userService = userService;
            _environment = environment;
            _dbContext = dbContext;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation($"Received login request for username: {request?.Username}");

            if (!ModelState.IsValid)
            {
                _logger.LogWarning($"Login request failed due to invalid model state.");
                return BadRequest(new ApiResponse<object>(false, "Invalid data", ModelState.ToDictionary(
                    kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())));
            }

            var user = await _userService.AuthenticateAsync(request.Username, request.Password);

            if (user == null)
            {
                _logger.LogWarning($"Authentication failed for username: {request.Username}. Invalid credentials.");
                return Unauthorized(new ApiResponse<object>(false, "Invalid username or password", null));
            }

            _logger.LogInformation($"User authenticated successfully. User ID: {user.UserID}, Username: {user.Username}");

            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                return await HandleOtpLogin(user);
            }

            return await GenerateTokensAndSetCookies(user);
        }

        private async Task<IActionResult> HandleOtpLogin(User user)
        {
            var otpCode = GenerateSecureOtpCode();
            var otp = new OtpRecord
            {
                Id = Guid.NewGuid(),
                UserId = user.UserID,
                OtpCode = otpCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Otp:ExpiryMinutes", 5)),
                IsUsed = false
            };

            _dbContext.OtpRecords.Add(otp);
            try
            {
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Generated and saved OTP for User ID: {user.UserID}, OTP Code: {otpCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error saving OTP to database for User ID: {user.UserID}. Error: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>(false, "Error saving OTP", null));
            }

            if (_environment.IsDevelopment())
            {
                _logger.LogInformation($"[DEVELOPMENT] Mock OTP sent to User ID: {user.UserID}, OTP Code: {otpCode}");
                return Ok(new ApiResponse<object>(true, "OTP sent to phone (mock)", new { RequiresOtp = true, UserId = user.UserID, OtpCode = otpCode }));
            }

            try
            {
                await SendOtpViaTwilio(user.PhoneNumber, otpCode);
                return Ok(new ApiResponse<object>(true, "OTP sent to phone", new { RequiresOtp = true, UserId = user.UserID }));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending OTP for User ID: {user.UserID}. Error: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>(false, "Error sending OTP", null));
            }
        }

        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var otp = await _dbContext.OtpRecords
                .FirstOrDefaultAsync(o => o.UserId == request.UserId && o.OtpCode == request.OtpCode && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow);

            if (otp == null)
            {
                return BadRequest(new ApiResponse<object>(false, "Invalid or expired OTP", null));
            }

            otp.IsUsed = true;
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return BadRequest(new ApiResponse<object>(false, "User does not exist", null));

            }

            return await GenerateTokensAndSetCookies(user);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth-token");
            Response.Cookies.Delete("X-CSRF-TOKEN");
            _logger.LogInformation("User logged out successfully.");
            return Ok(new ApiResponse<object>(true, "Logout successful", null));
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized(new ApiResponse<object>(false, "User is not authenticated. Please log in.", null));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            return Ok(new ApiResponse<object>(true, "User information retrieved successfully", new { userId, username }));
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
            _logger.LogInformation($"Set 'auth-token' cookie for User ID: {user.UserID}. Expires at: {expires}");

            Response.Cookies.Append("X-CSRF-TOKEN", csrfToken, new CookieOptions
            {
                HttpOnly = false,
                SameSite = sameSite,
                Secure = secure,
                Expires = expires,
                Path = "/"
            });
            _logger.LogInformation($"Set 'X-CSRF-TOKEN' cookie for User ID: {user.UserID}. Expires at: {expires}");

            return Ok(new ApiResponse<object>(true, "Login successful", null));
        }

        private (string token, DateTime expires) GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                _logger.LogError("JWT key is missing in configuration.");
                throw new InvalidOperationException("JWT key is not configured.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:TokenExpirationInMinutes", 30));
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expires);
        }

        private string GenerateSecureOtpCode()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] bytes = new byte[4];
                rng.GetBytes(bytes);
                var number = BitConverter.ToUInt32(bytes, 0) % 900000 + 100000; // Ensures 6-digit OTP (100000-999999)
                return number.ToString("D6");
            }
        }

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

            _logger.LogInformation($"OTP sent successfully via Twilio to: {formattedToNumber}. Message SID: {message.Sid}");
        }
    }
}
