using Auth.Core.Models;

namespace Auth.Core.Interfaces
{
    public interface IUserService
    {
        Task<User?> AuthenticateAsync(string username, string password);
        Task<User> GetUserByUsername(string username);
        Task AddUser(User user);
        Task<List<User>> GetAllUsers();
    }
}