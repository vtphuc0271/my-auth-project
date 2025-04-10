using Auth.Core.Interfaces;
using Auth.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Auth.Infrastructure;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;

namespace AuthApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly AppDbContext _context;

        public UserController(IUserService userService, AppDbContext context)
        {
            _userService = userService;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingUser = await _userService.GetUserByUsername(user.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Username đã tồn tại" });
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
            user.Id = Guid.NewGuid();
            await _userService.AddUser(user);

            return Ok(new { message = "Đăng ký thành công!" });
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsers();
            return Ok(users);
        }

        [Authorize]
        [HttpPost("update-passwords")]
        public async Task<IActionResult> UpdatePasswords()
        {
            var users = await _userService.GetAllUsers();
            foreach (var user in users)
            {
                if (!user.Password.StartsWith("$2a$"))
                {
                    user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                    _context.Users.Update(user);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật mật khẩu thành công!" });
        }
    }
}