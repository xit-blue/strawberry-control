using System.Security.Claims;

namespace StrawberryControl.Web.Services;

public static class UserClaimsExtensions
{
    public static string ApiToken(this ClaimsPrincipal user)
        => user.FindFirst("apps_token")?.Value ?? string.Empty;

    public static string Username(this ClaimsPrincipal user)
        => user.FindFirst("username")?.Value ?? string.Empty;

    public static bool IsAdmin(this ClaimsPrincipal user)
        => user.IsInRole("ADMIN");
}
