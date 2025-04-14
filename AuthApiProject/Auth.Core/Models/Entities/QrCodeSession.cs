using System;

namespace Auth.Core.Models.Entities
{
    public class QrCodeSession
    {
        public Guid QrCodeSessionID { get; set; }
        public Guid? UserID { get; set; }
        public string Code { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }

        public User User { get; set; }
    }
}