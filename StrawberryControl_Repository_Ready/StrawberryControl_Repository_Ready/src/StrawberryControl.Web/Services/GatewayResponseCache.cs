using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;

namespace StrawberryControl.Web.Services;

public interface IGatewayResponseCache
{
    bool TryGet(string key, out string json);
    void Set(string key, string json, TimeSpan ttl);
    string Key(string action, string role, string payloadFingerprint);
    void InvalidateAll();
}

public sealed class GatewayResponseCache(IMemoryCache cache) : IGatewayResponseCache
{
    private long _generation;

    public bool TryGet(string key, out string json)
    {
        if (cache.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
        {
            json = value;
            return true;
        }

        json = string.Empty;
        return false;
    }

    public void Set(string key, string json, TimeSpan ttl)
    {
        cache.Set(key, json, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl,
            Size = Math.Max(1, Math.Min(256, json.Length / 1024 + 1))
        });
    }

    public string Key(string action, string role, string payloadFingerprint)
        => $"gw:{Interlocked.Read(ref _generation)}:{role}:{action}:{payloadFingerprint}";

    public void InvalidateAll() => Interlocked.Increment(ref _generation);
}
