using Kino.Server.Models;

namespace Kino.Server.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
