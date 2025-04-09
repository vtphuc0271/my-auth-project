using System.ComponentModel.DataAnnotations;

namespace Auth.Core.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }  // BỎ khởi tạo Guid.NewGuid() ở đây

        public string Username { get; set; }

        public string Password { get; set; }
    }
}