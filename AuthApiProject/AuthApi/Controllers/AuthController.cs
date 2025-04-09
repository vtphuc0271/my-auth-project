using Auth.Core.Interfaces;
using Auth.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace AuthApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new ApiResponse<object>(false, "Username and password are required", null));
            }

            bool isAuthenticated = _authService.Login(request.Username, request.Password);
            if (isAuthenticated)
            {
                return Ok(new ApiResponse<object>(true, "Login successful", null));
            }

            return Unauthorized(new ApiResponse<object>(false, "Invalid username or password", null));
        }

        [HttpGet("username")]
        public IActionResult GetUsernames()
        {
            var usernames = _authService.GetUsernames();
            return Ok(new ApiResponse<List<string>>(true, "Usernames retrieved successfully", usernames));
        }
    }
}