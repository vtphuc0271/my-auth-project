﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Auth.Core.DTOs
{
    public class RegisterRequest
    {
   
            public string Username { get; set; }
            public string Password { get; set; }
            public string ConfirmPassword { get; set; }
        
    }
}
