﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AuthApi.DTOs
{
    public class VerifyOtpRequest
    {
        public Guid UserId { get; set; }
        public string OtpCode { get; set; }
    }
}
