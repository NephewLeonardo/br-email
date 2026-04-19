export function shell({ authMode, status, session, inbox, selectedMessage, composeTo = '' }) {
  if (!session) {
    return `
      <main class="page auth-page">
        <section class="card hero-card">
          <h1>br-email</h1>
          <p>E-mail com E2EE real, zero-knowledge e foco em privacidade.</p>
          <div class="tabs">
            <button data-auth-tab="login" class="${authMode === 'login' ? 'active' : ''}">Entrar</button>
            <button data-auth-tab="register" class="${authMode === 'register' ? 'active' : ''}">Criar conta</button>
          </div>
          <form id="auth-form" class="stack">
            ${authMode === 'register' ? '<input name="displayName" placeholder="Nome exibido" required />' : ''}
            <input name="email" type="email" placeholder="voce@br-email.local" required />
            <input name="password" type="password" placeholder="Senha" required />
            <button type="submit">${authMode === 'login' ? 'Entrar' : 'Registrar'}</button>
          </form>
          <small class="muted">As chaves privadas ficam somente neste navegador.</small>
        </section>
        ${status ? `<div class="status">${status}</div>` : ''}
      </main>
    `;
  }

  return `
    <main class="page app-page">
      <aside class="sidebar card">
        <div>
          <h2>${session.user.display_name}</h2>
          <p class="muted">${session.user.email}</p>
        </div>
        <button id="compose-button">Nova mensagem</button>
        <button id="refresh-button" class="secondary">Atualizar</button>
        <button id="logout-button" class="secondary danger">Sair</button>
      </aside>
      <section class="list card">
        <h3>Caixa de entrada</h3>
        <div class="message-list">
          ${(inbox || []).map((item) => `
            <button class="message-item" data-message-id="${item.id}">
              <strong>${item.sender_name || item.sender_email}</strong>
              <span>${item.subject_hint}</span>
              <small>${new Date(item.sent_at).toLocaleString()}</small>
            </button>
          `).join('') || '<p class="muted">Nenhuma mensagem.</p>'}
        </div>
      </section>
      <section class="viewer card">
        ${selectedMessage ? `
          <h3>${selectedMessage.subject}</h3>
          <p class="muted">De ${selectedMessage.from} • ${selectedMessage.sentAt}</p>
          <article class="body-text">${selectedMessage.body.replace(/\n/g, '<br/>')}</article>
        ` : `
          <h3>Nova mensagem</h3>
          <form id="compose-form" class="stack">
            <input name="to" type="email" value="${composeTo}" placeholder="destinatario@br-email.local" required />
            <input name="subject" placeholder="Assunto" required />
            <textarea name="body" rows="10" placeholder="Mensagem criptografada" required></textarea>
            <button type="submit">Enviar</button>
          </form>
        `}
        ${status ? `<div class="status inline">${status}</div>` : ''}
      </section>
    </main>
  `;
}
