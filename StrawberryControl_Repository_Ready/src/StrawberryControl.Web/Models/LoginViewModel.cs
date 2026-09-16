using System.ComponentModel.DataAnnotations;

namespace StrawberryControl.Web.Models;

public sealed class LoginViewModel
{
    [Required(ErrorMessage = "Ingresa tu usuario.")]
    [Display(Name = "Usuario")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Ingresa tu contraseña.")]
    [DataType(DataType.Password)]
    [Display(Name = "Contraseña")]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Mantener sesión")]
    public bool RememberMe { get; set; }
}
