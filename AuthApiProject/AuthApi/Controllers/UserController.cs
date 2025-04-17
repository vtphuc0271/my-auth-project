using Auth.Core.Interfaces;
using Auth.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthApi.DTOs;
using System.Security.Claims;
using Auth.Infrastructure.Data;
using Auth.Core.Models.Entities; // Thêm để lấy UserId từ token
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

namespace AuthApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AuthController> _logger;

        public UserController(
            IUserService userService,
            AppDbContext context  ,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _context = context;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", null));
            }


            if (request.Password.Length < 6 && Regex.IsMatch(request.Password, @"\d"))
            {
                return BadRequest(new ApiResponse<object>(false, "Mật khẩu phải có ít nhất 1 số", null));
            }

            var existingUser = await _userService.GetUserByPhone(request.PhoneNumber);

            if (existingUser != null)
            {
                return BadRequest(new ApiResponse<object>(false, "Số điện thoại đã tồn tại", null));
            }

            var user = new User
            {
                UserID = Guid.NewGuid(),
                Username = request.UserName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // Đổi Password thành PasswordHash
                PhoneNumber = request.PhoneNumber,
                Email = null
            };

            await _userService.AddUser(user);

            return Ok(new ApiResponse<object>(true, "Đăng ký thành công", null));
        }

        //[Authorize]
        //[HttpGet]
        //public async Task<IActionResult> GetAll()
        //{
        //    var users = await _userService.GetAllUsers();
        //    return Ok(new ApiResponse<IEnumerable<User>>(true, "Lấy danh sách người dùng thành công", users));
        //}

        [Authorize]
        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePasswords([FromBody] UpdatePasswordRequest request)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized(new ApiResponse<object>(false, "Chưa xác nhận được người dùng, vui lòng đăng nhập", null));
            }

            var phoneNumber = User.FindFirst(ClaimTypes.MobilePhone)?.Value;

            var user = await _userService.GetUserByPhone(phoneNumber);

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                return NotFound(new ApiResponse<object>(false, "Mật khẩu cũ không đúng", null));
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _context.Users.Update(user);

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>(true, "Cập nhật mật khẩu thành công", null));
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>(false, "Dữ liệu không hợp lệ", ModelState));
            }
            Console.WriteLine(request.ToString);
            var user = await _userService.GetUserByPhone(request.PhoneNumber);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            var otp = await _context.OtpRecords
                .Where(o => o.UserId == user.UserID
                            && o.OtpCode == request.OtpCode
                            && !o.IsUsed
                            && o.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otp == null)
            {
                return BadRequest(new ApiResponse<object>(false, "OTP không hợp lệ hoặc đã hết hạn", null));
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            otp.IsUsed = true;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"User {user.UserID} đã đặt lại mật khẩu thành công");
                return Ok(new ApiResponse<object>(true, "Đặt lại mật khẩu thành công", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi đặt lại mật khẩu cho user {user.UserID}");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>(false, "Có lỗi xảy ra trong quá trình đặt lại mật khẩu", null));
            }
        }


        [AllowAnonymous]
        [HttpPost("otp-reset-password")]
        public async Task<IActionResult> OtpResetPassword([FromBody] OtpResetPasswordRequest request)
        {
            var userPhoneNumber = request.PhoneNumber;

            // 2. Lấy thông tin user
            var user = await _userService.GetUserByPhone(userPhoneNumber);

            Console.WriteLine(user);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            // 3. Tạo mã OTP bằng hàm GenerateSecureOtpCode
            var otpCode = GenerateSecureOtpCode();
            var expiresAt = DateTime.UtcNow.AddMinutes(10); // OTP hết hạn sau 10 phút

            // 4. Lưu OTP vào bảng OtpRecords
            var otpRecord = new OtpRecord
            {
                UserId = user.UserID,
                OtpCode = otpCode,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt
            };

            _context.OtpRecords.Add(otpRecord);
            _logger.LogInformation($"Mã OTP được tạo và lưu cho mã người dùng: {user.UserID}, Mã OTP: {otpRecord.OtpCode}");
            // 5. Gửi OTP cho người dùng (qua email, SMS, hoặc phương thức khác)


            // 6. Lưu thay đổi vào database
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new ApiResponse<object>(true, "OTP đã được gửi thành công", otpCode));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lưu OTP cho user {user.UserID}");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new ApiResponse<object>(false, "Có lỗi xảy ra trong quá trình tạo OTP", null));
            }
        }


        [Authorize]
        [HttpPost("update-name")]
        public async Task<IActionResult> UpdateName([FromBody] UpdateUserNameRequest request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new ApiResponse<object>(false, "Không thể xác định người dùng", null));
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>(false, "Người dùng không tồn tại", null));
            }

            user.Username = request.newUsername;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>(true, "Cập nhật số tên người dùng thành công", null));
        }

        // Hàm gửi OTP cho người dùng (cần triển khai)
        private async Task SendOtpToUser(User user, string otpCode)
        {
        }

        // tạo mã OTP
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
    }
}