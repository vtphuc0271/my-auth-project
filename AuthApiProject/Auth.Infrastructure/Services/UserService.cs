using Auth.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using Auth.Infrastructure.Data;
using Auth.Core.Models.Entities;

namespace Auth.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> AuthenticateAsync(string phoneNumber, string password)
        {
            // Tìm người dùng theo username trong database
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);

            // Kiểm tra mật khẩu
            if (user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
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

        public async Task<User> GetUserByPhone(string phoneNumber)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
        }

        public async Task<User> GetUserByUserId(Guid userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.UserID == userId);
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
