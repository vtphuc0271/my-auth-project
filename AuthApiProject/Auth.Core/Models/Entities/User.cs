using System.ComponentModel.DataAnnotations;

namespace Auth.Core.Models.Entities
{
    public class User
    {
        [Key]
        public Guid UserID { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }
}