using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Auth.Core.Models;
using Auth.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Auth.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Twilio.Rest.Api.V2010.Account;
using Twilio;
using Auth.Core.DTOs;

namespace MyAuthApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;
        private readonly IWebHostEnvironment _environment;
        private readonly AppDbContext _dbContext;

        public AuthController(IConfiguration configuration, IUserService userService, IWebHostEnvironment environment, AppDbContext dbContext)
        {
            _configuration = configuration;
            _userService = userService;
            _environment = environment;
            _dbContext = dbContext;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", null));
            }

            var user = await _userService.AuthenticateAsync(request.Username, request.Password);
            if (user == null)
            {
                return Unauthorized(new ApiResponse<object>(false, "Tài khoản hoặc mật khẩu không đúng", null));
            }

            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                var otpCode = new Random().Next(100000, 999999).ToString();
                var otp = new OtpRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    OtpCode = otpCode,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                    IsUsed = false
                };

                _dbContext.OtpRecords.Add(otp);
                await _dbContext.SaveChangesAsync();

                // Mock gửi OTP trong môi trường development
                if (_environment.IsDevelopment())
                {
                    return Ok(new ApiResponse<object>(true, "OTP đã gửi tới số điện thoại (mock)", new { RequiresOtp = true, UserId = user.Id, OtpCode = otpCode }));
                }

                // Code Twilio thật (chỉ chạy khi không ở môi trường development)
                var twilioAccountSid = _configuration["Twilio:AccountSid"];
                var twilioAuthToken = _configuration["Twilio:AuthToken"];
                var twilioPhoneNumber = _configuration["Twilio:PhoneNumber"];
                TwilioClient.Init(twilioAccountSid, twilioAuthToken);

                string formattedToNumber = user.PhoneNumber.StartsWith("+")
                    ? user.PhoneNumber
                    : $"+84{user.PhoneNumber.TrimStart('0')}";

                string formattedFromNumber = twilioPhoneNumber.StartsWith("+")
                    ? twilioPhoneNumber
                    : $"+84{twilioPhoneNumber.TrimStart('0')}";

                await MessageResource.CreateAsync(
                    body: $"Mã OTP của bạn: {otpCode}",
                    from: new Twilio.Types.PhoneNumber(formattedFromNumber),
                    to: new Twilio.Types.PhoneNumber(formattedToNumber)
                );

                return Ok(new ApiResponse<object>(true, "OTP đã gửi tới số điện thoại", new { RequiresOtp = true, UserId = user.Id }));
            }

            var token = GenerateJwtToken(user);
            var csrfToken = Guid.NewGuid().ToString();

            Response.Cookies.Append("auth-token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false,
                Expires = DateTime.UtcNow.AddMinutes(1),
                Path = "/"
            });

            Response.Cookies.Append("X-CSRF-TOKEN", csrfToken, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Secure = false,
                Expires = DateTime.UtcNow.AddMinutes(1),
                Path = "/"
            });

            return Ok(new ApiResponse<object>(true, "Đăng nhập thành công", null));
        }

        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var otp = await _dbContext.OtpRecords
                .FirstOrDefaultAsync(o => o.UserId == request.UserId && o.OtpCode == request.OtpCode && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow);

            if (otp == null)
            {
                return BadRequest(new ApiResponse<object>(false, "OTP không hợp lệ hoặc đã hết hạn", null));
            }

            otp.IsUsed = true;
            await _dbContext.SaveChangesAsync();

            var user = await _dbContext.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return BadRequest(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            var token = GenerateJwtToken(user);
            var csrfToken = Guid.NewGuid().ToString();

            Response.Cookies.Append("auth-token", token, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.None, // Đổi thành None để hoạt động cross-site
                Secure = true, // Cả frontend và backend dùng https
                Expires = DateTime.UtcNow.AddMinutes(60),
                Path = "/"
            });

            Response.Cookies.Append("X-CSRF-TOKEN", csrfToken, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.None, // Đổi thành None
                Secure = true,
                Expires = DateTime.UtcNow.AddMinutes(60),
                Path = "/"
            });

            return Ok(new ApiResponse<object>(true, "Xác thực OTP thành công", null));
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth-token");
            Response.Cookies.Delete("X-CSRF-TOKEN");
            return Ok(new ApiResponse<object>(true, "Đăng xuất thành công", null));
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized(new ApiResponse<object>(false, "Người dùng chưa được xác thực. Vui lòng đăng nhập.", null));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            return Ok(new ApiResponse<object>(true, "Lấy thông tin người dùng thành công", new { userId, username }));
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT key is not configured.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}