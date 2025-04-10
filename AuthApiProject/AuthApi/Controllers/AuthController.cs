// Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Auth.Core.Models;

using Auth.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace MyAuthApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;

        public AuthController(IConfiguration configuration, IUserService userService)
        {
            _configuration = configuration;
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetUserByUsername(request.Username);
            if (user == null)
            {
                return BadRequest(new { message = "Username không tồn tại" });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return BadRequest(new { message = "Mật khẩu không đúng" });
            }

            var token = GenerateJwtToken(user);
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax, // Đảm bảo là Lax
                Expires = DateTime.Now.AddHours(1)
            };
            Response.Cookies.Append("auth-token", token, cookieOptions);
            Response.Headers.Add("Access-Control-Allow-Credentials", "true"); // Thêm nếu cần

            return Ok(new { token });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Xóa cookie
            Response.Cookies.Delete("auth-token");
            return Ok(new { message = "Đăng xuất thành công" });
        }

       
        [HttpGet("me")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public IActionResult GetCurrentUser()
        {
            // Kiểm tra xem người dùng đã đăng nhập chưa (dựa trên token trong cookie)
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized(new { message = "Chưa đăng nhập" });
            }
            Console.WriteLine($"Cookie received: {Request.Cookies["auth-token"]}");
            Console.WriteLine($"Authenticated: {User.Identity.IsAuthenticated}");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            return Ok(new { userId, username });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}