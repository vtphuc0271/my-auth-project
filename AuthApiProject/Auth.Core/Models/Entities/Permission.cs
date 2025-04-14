using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.Core.Models.Entities
{
    public class Permission
    {
        public Guid PermissionID { get; set; }
        public string PermissionName { get; set; }
    }
}
