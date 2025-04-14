using Auth.Core.Models.Entities;

namespace Auth.Core.Interfaces
{
    public interface IUserService
    {
        Task<User?> AuthenticateAsync(string username, string password);
        Task<User> GetUserByUsername(string username);
        Task<User> GetUserByUserId(Guid userId);
        Task AddUser(User user);
        Task<List<User>> GetAllUsers();

    }
}