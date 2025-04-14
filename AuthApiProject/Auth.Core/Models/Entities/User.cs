using System.ComponentModel.DataAnnotations;

namespace Auth.Core.Models.Entities
{
    public class User
    {
        [Key]
        public Guid UserID { get; set; } // Đổi Id thành UserID để khớp với DB
        public string Username { get; set; }
        public string PasswordHash { get; set; } // Đổi từ Password thành PasswordHash
        public string? Email { get; set; } // Nullable theo DB
        public string? PhoneNumber { get; set; }
    }
}