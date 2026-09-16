using System.Text.Json;

namespace StrawberryControl.Web.Models;

public sealed class ApiUser
{
    public string Id { get; init; } = string.Empty;
    public string Usuario { get; init; } = string.Empty;
    public string Nombre { get; init; } = string.Empty;
    public string Rol { get; init; } = string.Empty;
    public bool Activo { get; init; }
}

public sealed class LoginApiResult
{
    public bool Ok { get; init; }
    public string? Token { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    public ApiUser? User { get; init; }
    public string? Version { get; init; }
    public string? Code { get; init; }
    public string? Message { get; init; }
}

public sealed class GatewayRequest
{
    public string Action { get; set; } = string.Empty;
    public Dictionary<string, JsonElement>? Payload { get; set; }
}

public sealed class ApiCallResult
{
    public bool Ok { get; init; }
    public string RawJson { get; init; } = "{}";
    public string? Code { get; init; }
    public string? Message { get; init; }
}
