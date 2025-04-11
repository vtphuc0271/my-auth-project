using System;

namespace Auth.Core.Models
{
    public class OtpRecord
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string OtpCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }

        public User User { get; set; } // Navigation property
    }
}