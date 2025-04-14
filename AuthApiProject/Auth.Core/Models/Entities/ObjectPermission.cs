using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.Core.Models.Entities
{
    public class ObjectPermission
    {
            public Guid ObjectPermissionID { get; set; }
            public Guid ObjectID { get; set; }
            public Guid UserID { get; set; }
            public Guid PermissionID { get; set; }
            public User User { get; set; }
            public Permission Permission { get; set; }
        
    }
}
