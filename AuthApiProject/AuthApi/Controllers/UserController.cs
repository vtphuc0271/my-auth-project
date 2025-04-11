using Auth.Core.Interfaces;
using Auth.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Auth.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Auth.Core.DTOs;
using System.Security.Claims; // Thêm để lấy UserId từ token

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

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", null));
            }

            if (request.Password != request.ConfirmPassword)
            {
                return BadRequest(new ApiResponse<object>(false, "Mật khẩu xác nhận không khớp", null));
            }

            var existingUser = await _userService.GetUserByUsername(request.Username);
            if (existingUser != null)
            {
                return BadRequest(new ApiResponse<object>(false, "Username đã tồn tại", null));
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PhoneNumber = null
            };

            await _userService.AddUser(user);

            return Ok(new ApiResponse<object>(true, "Đăng ký thành công", null));
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsers();
            return Ok(new ApiResponse<IEnumerable<User>>(true, "Lấy danh sách người dùng thành công", users));
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
            return Ok(new ApiResponse<object>(true, "Cập nhật mật khẩu thành công", null));
        }

        [Authorize]
        [HttpPost("update-phone")]
        public async Task<IActionResult> UpdatePhone([FromBody] UpdatePhoneRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", null));
            }

            // Lấy UserId từ JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new ApiResponse<object>(false, "Không thể xác định người dùng", null));
            }

            // Tìm user trong DB
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            // Cập nhật PhoneNumber
            user.PhoneNumber = request.PhoneNumber;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>(true, "Cập nhật số điện thoại thành công", null));
        }
    }
}