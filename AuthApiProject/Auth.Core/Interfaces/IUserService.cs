using Auth.Core.Models.Entities;

namespace Auth.Core.Interfaces
{
    public interface IUserService
    {
        Task<User?> AuthenticateAsync(string phoneNumber, string password);
        Task<User> GetUserByUsername(string username);
        Task<User> GetUserByUserId(Guid userId);
        Task<User> GetUserByPhone(string phoneNumber);
        Task AddUser(User user);
        Task<List<User>> GetAllUsers();

    }
}