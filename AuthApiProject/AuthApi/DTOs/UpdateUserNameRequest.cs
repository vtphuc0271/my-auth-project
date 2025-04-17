using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AuthApi.DTOs
{
    public class UpdateUserNameRequest
    {
        [Required(ErrorMessage = "tên người dùng là bắt buộc")]
        public string newUsername { get; set; }
    }
}
