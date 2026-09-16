using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace StrawberryControl.Web.Controllers;

[Authorize]
public sealed class OrdersController : Controller
{
    public IActionResult Index() => View();

    public IActionResult Details(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return RedirectToAction(nameof(Index));
        ViewBag.Pedido = id;
        return View();
    }
}
