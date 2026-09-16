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
public sealed class GatewayController(IAppsScriptApiClient apiClient) : ControllerBase
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

        var result = await apiClient.PostAsync(action, token, payload, cancellationToken);

        if (result.Code is "AUTH_REQUIRED" or "SESSION_EXPIRED" or "USER_DISABLED")
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized(new { ok = false, code = result.Code, message = result.Message ?? "La sesión terminó." });
        }

        if (result.Code == "FORBIDDEN") return StatusCode(StatusCodes.Status403Forbidden, result.RawJson);

        return Content(result.RawJson, "application/json");
    }
}
