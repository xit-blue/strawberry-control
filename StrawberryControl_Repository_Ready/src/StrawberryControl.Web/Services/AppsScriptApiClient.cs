using System.Net.Http.Json;
using System.Text.Json;
using StrawberryControl.Web.Models;

namespace StrawberryControl.Web.Services;

public sealed class AppsScriptApiClient(HttpClient httpClient, ILogger<AppsScriptApiClient> logger) : IAppsScriptApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<LoginApiResult> LoginAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, object?>
        {
            ["action"] = "login",
            ["username"] = username,
            ["password"] = password
        };

        var result = await SendAsync(payload, cancellationToken);
        try
        {
            using var document = JsonDocument.Parse(result.RawJson);
            var root = document.RootElement;
            var ok = root.TryGetProperty("ok", out var okElement) && okElement.GetBoolean();
            if (!ok)
            {
                return new LoginApiResult
                {
                    Ok = false,
                    Code = TryGetString(root, "code"),
                    Message = TryGetString(root, "message") ?? "No se pudo iniciar sesión."
                };
            }

            ApiUser? user = null;
            if (root.TryGetProperty("user", out var userElement))
            {
                user = JsonSerializer.Deserialize<ApiUser>(userElement.GetRawText(), JsonOptions);
            }

            DateTimeOffset? expiresAt = null;
            var expiresText = TryGetString(root, "expiresAt");
            if (DateTimeOffset.TryParse(expiresText, out var parsedExpiry)) expiresAt = parsedExpiry;

            return new LoginApiResult
            {
                Ok = true,
                Token = TryGetString(root, "token"),
                ExpiresAt = expiresAt,
                User = user,
                Version = TryGetString(root, "version")
            };
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Respuesta inválida de Apps Script durante login: {Body}", result.RawJson);
            return new LoginApiResult { Ok = false, Message = "La API devolvió una respuesta inválida." };
        }
    }

    public Task<ApiCallResult> PostAsync(string action, string token, IReadOnlyDictionary<string, object?>? payload = null, CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object?>
        {
            ["action"] = action,
            ["token"] = token
        };

        if (payload is not null)
        {
            foreach (var item in payload) body[item.Key] = item.Value;
        }

        return SendAsync(body, cancellationToken);
    }

    public Task<ApiCallResult> LogoutAsync(string token, CancellationToken cancellationToken = default)
        => PostAsync("logout", token, null, cancellationToken);

    private async Task<ApiCallResult> SendAsync(Dictionary<string, object?> payload, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.PostAsJsonAsync(string.Empty, payload, JsonOptions, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Apps Script respondió HTTP {Status}. Body: {Body}", response.StatusCode, raw);
                return new ApiCallResult
                {
                    Ok = false,
                    RawJson = string.IsNullOrWhiteSpace(raw) ? "{}" : raw,
                    Code = "UPSTREAM_HTTP_ERROR",
                    Message = $"La API respondió HTTP {(int)response.StatusCode}."
                };
            }

            try
            {
                using var document = JsonDocument.Parse(raw);
                var root = document.RootElement;
                return new ApiCallResult
                {
                    Ok = root.TryGetProperty("ok", out var okElement) && okElement.GetBoolean(),
                    RawJson = raw,
                    Code = TryGetString(root, "code"),
                    Message = TryGetString(root, "message")
                };
            }
            catch (JsonException)
            {
                return new ApiCallResult
                {
                    Ok = false,
                    RawJson = raw,
                    Code = "INVALID_JSON",
                    Message = "La API devolvió una respuesta que no es JSON válido."
                };
            }
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new ApiCallResult { Ok = false, Code = "TIMEOUT", Message = "La API tardó demasiado en responder." };
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Error comunicándose con Apps Script.");
            return new ApiCallResult { Ok = false, Code = "NETWORK_ERROR", Message = "No se pudo conectar con Google Apps Script." };
        }
    }

    private static string? TryGetString(JsonElement root, string property)
        => root.TryGetProperty(property, out var value) && value.ValueKind != JsonValueKind.Null
            ? value.ToString()
            : null;
}
