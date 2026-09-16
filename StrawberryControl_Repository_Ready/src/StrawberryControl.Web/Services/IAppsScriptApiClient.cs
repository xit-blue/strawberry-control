using StrawberryControl.Web.Models;

namespace StrawberryControl.Web.Services;

public interface IAppsScriptApiClient
{
    Task<LoginApiResult> LoginAsync(string username, string password, CancellationToken cancellationToken = default);
    Task<ApiCallResult> PostAsync(string action, string token, IReadOnlyDictionary<string, object?>? payload = null, CancellationToken cancellationToken = default);
    Task<ApiCallResult> LogoutAsync(string token, CancellationToken cancellationToken = default);
}
