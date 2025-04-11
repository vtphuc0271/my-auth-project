using Auth.Core.Interfaces;
using Auth.Core.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Auth.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> AuthenticateAsync(string username, string password)
        {
            // Tìm người dùng theo username trong database
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            // Kiểm tra mật khẩu
            if (user != null && BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                return user;
            }

            return null;
        }

        public async Task<User> GetUserByUsername(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task AddUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task<List<User>> GetAllUsers()
        {
            return await _context.Users.ToListAsync();
        }
    }
}
