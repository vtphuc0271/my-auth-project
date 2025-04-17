namespace AuthApi.DTOs
{
    public class RegisterRequest
    {
        public string UserName { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
    }
}
