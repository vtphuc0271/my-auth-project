namespace AuthApi.DTOs
{
    public class LoginRequest
    {
        public string? PhoneNumber { get; set; }
        public string? Password { get; set; }
    }
}