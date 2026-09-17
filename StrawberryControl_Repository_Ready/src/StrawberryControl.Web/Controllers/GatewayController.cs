using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrawberryControl.Web.Models;
using StrawberryControl.Web.Services;

namespace StrawberryControl.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/gateway")]
public sealed class GatewayController(
    IAppsScriptApiClient apiClient,
    IGatewayResponseCache responseCache) : ControllerBase
{
    private static readonly HashSet<string> AllowedActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "me", "listOrders", "list", "getOrder", "claimOrder", "releaseOrder", "updateOrder", "update",
        "registerNoAnswer", "registerResponse", "listCallHistory", "operationalDashboard", "states",
        "refreshSummary", "summary", "adminDashboard", "listAdvertising", "saveAdvertising", "deleteAdvertising",
        "getConfig", "updateConfig", "listUsers", "createUser", "updateUser", "resetPassword", "listAudit",
        "forceSync", "reopenOrder"
    };

    private static readonly HashSet<string> AdminActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "refreshSummary", "summary", "adminDashboard", "listAdvertising", "saveAdvertising", "deleteAdvertising",
        "getConfig", "updateConfig", "listUsers", "createUser", "updateUser", "resetPassword", "listAudit",
        "forceSync", "reopenOrder"
    };

    private static readonly HashSet<string> MutationActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "claimOrder", "releaseOrder", "updateOrder", "update", "registerNoAnswer", "registerResponse",
        "refreshSummary", "saveAdvertising", "deleteAdvertising", "updateConfig", "createUser", "updateUser",
        "resetPassword", "forceSync", "reopenOrder"
    };

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Post([FromBody] GatewayRequest request, CancellationToken cancellationToken)
    {
        var action = request.Action?.Trim() ?? string.Empty;
        if (!AllowedActions.Contains(action)) return BadRequest(new { ok = false, message = "Acción no permitida." });
        if (AdminActions.Contains(action) && !User.IsInRole("ADMIN")) return Forbid();

        var token = User.ApiToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized(new { ok = false, code = "AUTH_REQUIRED", message = "Sesión no válida." });
        }

        var payload = new Dictionary<string, object?>();
        if (request.Payload is not null)
        {
            foreach (var pair in request.Payload) payload[pair.Key] = pair.Value;
        }

        var forceFresh = WantsFresh(request.Payload);
        var ttl = CacheTtl(action);
        string? cacheKey = null;

        if (!forceFresh && ttl > TimeSpan.Zero)
        {
            var role = User.IsInRole("ADMIN") ? "ADMIN" : "TRABAJADOR";
            cacheKey = responseCache.Key(action, role, PayloadFingerprint(request.Payload));
            if (responseCache.TryGet(cacheKey, out var cachedJson))
            {
                Response.Headers["X-Strawberry-Cache"] = "HIT";
                return Content(cachedJson, "application/json");
            }
        }

        var result = await apiClient.PostAsync(action, token, payload, cancellationToken);

        if (result.Code is "AUTH_REQUIRED" or "SESSION_EXPIRED" or "USER_DISABLED")
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized(new { ok = false, code = result.Code, message = result.Message ?? "La sesión terminó." });
        }

        if (result.Code == "FORBIDDEN") return StatusCode(StatusCodes.Status403Forbidden, result.RawJson);

        if (result.Ok)
        {
            if (MutationActions.Contains(action))
            {
                responseCache.InvalidateAll();
                Response.Headers["X-Strawberry-Cache"] = "INVALIDATED";
            }
            else if (ttl > TimeSpan.Zero)
            {
                var role = User.IsInRole("ADMIN") ? "ADMIN" : "TRABAJADOR";
                cacheKey ??= responseCache.Key(action, role, PayloadFingerprint(request.Payload));
                responseCache.Set(cacheKey, result.RawJson, ttl);
                Response.Headers["X-Strawberry-Cache"] = "MISS";
            }
        }

        return Content(result.RawJson, "application/json");
    }

    private static TimeSpan CacheTtl(string action) => action.ToLowerInvariant() switch
    {
        "admindashboard" or "operationaldashboard" => TimeSpan.FromSeconds(30),
        "listorders" or "list" => TimeSpan.FromSeconds(30),
        "getorder" => TimeSpan.FromSeconds(8),
        "listcallhistory" => TimeSpan.FromSeconds(10),
        "states" => TimeSpan.FromMinutes(5),
        "summary" => TimeSpan.FromSeconds(30),
        "listadvertising" => TimeSpan.FromSeconds(20),
        "getconfig" => TimeSpan.FromSeconds(45),
        "listusers" => TimeSpan.FromSeconds(30),
        "listaudit" => TimeSpan.FromSeconds(8),
        _ => TimeSpan.Zero
    };

    private static bool WantsFresh(Dictionary<string, JsonElement>? payload)
    {
        if (payload is null) return false;
        foreach (var pair in payload)
        {
            if (!pair.Key.Equals("fresh", StringComparison.OrdinalIgnoreCase)) continue;
            return pair.Value.ValueKind == JsonValueKind.True ||
                   (pair.Value.ValueKind == JsonValueKind.String &&
                    bool.TryParse(pair.Value.GetString(), out var parsed) && parsed);
        }
        return false;
    }

    private static string PayloadFingerprint(Dictionary<string, JsonElement>? payload)
    {
        if (payload is null || payload.Count == 0) return "-";
        return string.Join("&", payload
            .Where(x => !x.Key.Equals("fresh", StringComparison.OrdinalIgnoreCase))
            .OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Select(x => $"{x.Key}={x.Value.GetRawText()}"));
    }
}
