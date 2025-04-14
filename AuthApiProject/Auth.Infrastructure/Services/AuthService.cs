using Auth.Core.Interfaces;
using Auth.Core.Models;
using Auth.Infrastructure.Data;
using System.Linq;

namespace Auth.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;

        public AuthService(AppDbContext context)
        {
            _context = context;
        }

        public bool Login(string username, string password)
        {
            // Check username & password từ database (hiện tại chưa hash)
            return _context.Users.Any(u => u.Username == username && u.PasswordHash == password);
        }

        public List<string> GetUsernames()
        {
            return _context.Users.Select(u => u.Username).ToList();
        }
    }
}
