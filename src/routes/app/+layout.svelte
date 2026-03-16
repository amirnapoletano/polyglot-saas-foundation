<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  export let data: {
    activeOrgId?: string | null;
    organizations?: Array<{
      organization_id: string;
      role: string;
      organization: {
        id: string;
        name: string;
      } | null;
    }>;
  };

  let switching = false;

  async function switchOrganization(organizationId: string) {
    if (!organizationId || switching) return;

    switching = true;

    try {
      const res = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });

      if (!res.ok) {
        return;
      }

      await invalidateAll();
    } finally {
      switching = false;
    }
  }
</script>

<div class="app">
  <aside class="sidebar">
    <a class="brand" href="/app/dashboard">Polyglot</a>

    {#if (data.organizations?.length ?? 0) > 0}
      <div class="org-switcher">
        <label for="org-switch">Workspace</label>
        <select
          id="org-switch"
          value={data.activeOrgId ?? ''}
          disabled={switching}
          on:change={(e) =>
            switchOrganization((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each data.organizations ?? [] as item}
            <option value={item.organization_id}>
              {item.organization?.name ?? item.organization_id}
            </option>
          {/each}
        </select>
      </div>
    {/if}

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

  .org-switcher {
    display: grid;
    gap: 0.4rem;
  }

  .org-switcher label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .org-switcher select {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.75rem;
    background: white;
  }

  @media (max-width: 900px) {
    .app { grid-template-columns: 1fr; }
    .sidebar { border-right: 0; border-bottom: 1px solid #e5e7eb; }
  }
</style>