using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace StrawberryControl.Web.Controllers;

[Authorize(Roles = "ADMIN")]
public sealed class AdminController : Controller
{
    public IActionResult Reports() => View();
    public IActionResult Advertising() => View();
    public IActionResult Users() => View();
    public IActionResult Configuration() => View();
    public IActionResult Audit() => View();
}
