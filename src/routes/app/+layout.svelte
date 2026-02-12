<div class="app">
  <aside class="sidebar">
    <a class="brand" href="/app/dashboard">Polyglot</a>
    <nav>
      <a href="/app/dashboard">Dashboard</a>
      <a href="/app/settings">Settings</a>
    </nav>
    <a class="logout" href="/app/logout">Log out</a>
  </aside>

  <main class="main">
    <slot />
  </main>
</div>

<style>
  .app { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
  .sidebar { padding: 1.25rem; border-right: 1px solid #e5e7eb; display: grid; gap: 1rem; align-content: start; }
  nav { display: grid; gap: .35rem; }
  a { color: #111; text-decoration: none; padding: .55rem .65rem; border-radius: .75rem; }
  a:hover { background: #f3f4f6; }
  .brand { font-weight: 700; padding: 0; }
  .logout { margin-top: 1rem; color: #6b7280; }
  .main { padding: 1.5rem; }
  @media (max-width: 900px) {
    .app { grid-template-columns: 1fr; }
    .sidebar { border-right: 0; border-bottom: 1px solid #e5e7eb; }
  }
</style>