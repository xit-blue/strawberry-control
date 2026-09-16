using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace StrawberryControl.Web.Controllers;

[Authorize]
public sealed class HomeController : Controller
{
    public IActionResult Index() => View();

    [AllowAnonymous]
    public IActionResult Error() => View();
}
