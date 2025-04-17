namespace AuthApi.DTOs
{
    public class ResetPasswordRequest
    {
        public string OtpCode { get; set; }
        public string PhoneNumber { get; set; }
        public string NewPassword { get; set; }
    }
}
