using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.Core.Models.Entities
{
    public class UserRole
    {
        public Guid UserID { get; set; }
        public Guid RoleID { get; set; }
        public User User { get; set; }
        public Role Role { get; set; }
    }
}
