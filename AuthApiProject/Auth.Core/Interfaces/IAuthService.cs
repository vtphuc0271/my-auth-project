namespace Auth.Core.Interfaces
{
    public interface IAuthService
    {
        bool Login(string username, string password);
        List<string> GetUsernames();
    }
}