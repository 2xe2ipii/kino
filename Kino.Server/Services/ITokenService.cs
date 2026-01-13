using Microsoft.AspNetCore.Identity;

namespace Kino.Server.Services
{
    public interface ITokenService
    {
        string CreateToken(IdentityUser user);
    }
}