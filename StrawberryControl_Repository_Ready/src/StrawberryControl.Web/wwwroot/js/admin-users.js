(() => {
  'use strict';
  const S = window.Strawberry;
  let users = [];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.getElementById('newUser').addEventListener('click', () => document.getElementById('userDialog').showModal());
    document.getElementById('userForm').addEventListener('submit', createUser);
    document.getElementById('passwordForm').addEventListener('submit', resetPassword);
    document.querySelectorAll('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog')?.close()));
    load();
  }

  async function load() {
    try {
      const data = await S.api('listUsers', {}, { loader: true });
      users = data.users || [];
      render();
    } catch { }
  }

  function render() {
    document.getElementById('usersCount').textContent = `${users.length} usuarios`;
    const body = document.getElementById('usersBody');
    body.innerHTML = users.map(user => `<tr>
      <td><strong>${S.escapeHtml(user.usuario)}</strong></td>
      <td>${S.escapeHtml(user.nombre)}</td>
      <td>${S.escapeHtml(user.rol)}</td>
      <td><span class="status-badge ${user.activo ? 'entregado' : 'cancelado'}">${user.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>${S.dateTime(user.ultimoLogin)}</td>
      <td><div class="table-actions">${user.rol === 'TRABAJADOR' ? `<button class="btn btn-ghost btn-sm" data-toggle="${S.escapeHtml(user.id)}">${user.activo ? 'Desactivar' : 'Activar'}</button><button class="btn btn-ghost btn-sm" data-password="${S.escapeHtml(user.id)}">Contraseña</button>` : '<span class="muted">Principal</span>'}</div></td>
    </tr>`).join('');
    body.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => toggleUser(btn.dataset.toggle)));
    body.querySelectorAll('[data-password]').forEach(btn => btn.addEventListener('click', () => openPassword(btn.dataset.password)));
  }

  async function createUser(event) {
    event.preventDefault();
    try {
      await S.api('createUser', {
        username: document.getElementById('newUsername').value,
        nombre: document.getElementById('newName').value,
        password: document.getElementById('newPassword').value,
        rol: 'TRABAJADOR'
      }, { loader: true });
      document.getElementById('userDialog').close();
      document.getElementById('userForm').reset();
      S.toast('Trabajador creado.', 'success');
      await load();
    } catch { }
  }

  async function toggleUser(id) {
    const user = users.find(x => String(x.id) === String(id));
    if (!user) return;
    if (!S.confirmAction(`${user.activo ? 'Desactivar' : 'Activar'} a ${user.nombre}?`)) return;
    try {
      await S.api('updateUser', { id, nombre: user.nombre, activo: !user.activo }, { loader: true });
      S.toast('Usuario actualizado.', 'success');
      await load();
    } catch { }
  }

  function openPassword(id) {
    document.getElementById('passwordUserId').value = id;
    document.getElementById('resetPasswordValue').value = '';
    document.getElementById('passwordDialog').showModal();
  }

  async function resetPassword(event) {
    event.preventDefault();
    try {
      await S.api('resetPassword', {
        id: document.getElementById('passwordUserId').value,
        password: document.getElementById('resetPasswordValue').value
      }, { loader: true });
      document.getElementById('passwordDialog').close();
      S.toast('Contraseña actualizada. Las sesiones anteriores fueron invalidadas.', 'success', 4500);
    } catch { }
  }
})();
