using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StrawberryControl.Web.Models;
using StrawberryControl.Web.Services;

namespace StrawberryControl.Web.Controllers;

public sealed class AuthController(IAppsScriptApiClient apiClient) : Controller
{
    [AllowAnonymous]
    [HttpGet]
    public IActionResult Login(string? returnUrl = null, bool expired = false)
    {
        if (User.Identity?.IsAuthenticated == true) return RedirectToAction("Index", "Home");
        ViewBag.ReturnUrl = returnUrl;
        ViewBag.Expired = expired;
        return View(new LoginViewModel());
    }

    [AllowAnonymous]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return View(model);

        var result = await apiClient.LoginAsync(model.Username, model.Password, cancellationToken);
        if (!result.Ok || string.IsNullOrWhiteSpace(result.Token) || result.User is null)
        {
            ModelState.AddModelError(string.Empty, result.Message ?? "Usuario o contraseña incorrectos.");
            return View(model);
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, result.User.Id),
            new(ClaimTypes.Name, result.User.Nombre),
            new(ClaimTypes.Role, result.User.Rol),
            new("username", result.User.Usuario),
            new("apps_token", result.Token),
            new("api_version", result.Version ?? string.Empty)
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var expires = result.ExpiresAt ?? DateTimeOffset.Now.AddHours(12);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = model.RememberMe,
                ExpiresUtc = expires,
                AllowRefresh = false
            });

        if (!string.IsNullOrWhiteSpace(returnUrl) && Url.IsLocalUrl(returnUrl)) return LocalRedirect(returnUrl);
        return RedirectToAction("Index", "Home");
    }

    [Authorize]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
    {
        var token = User.ApiToken();
        if (!string.IsNullOrWhiteSpace(token))
        {
            _ = await apiClient.LogoutAsync(token, cancellationToken);
        }

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction(nameof(Login));
    }

    [AllowAnonymous]
    [HttpGet]
    public IActionResult AccessDenied() => View();
}
