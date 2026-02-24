<script lang="ts">
  import { enhance } from '$app/forms';

  type Data = { profile?: any };
  type Form = { message?: string };

  let { data, form } = $props<{ data: Data; form?: Form }>();

  let workspace = $state('');
</script>   

{#if form?.message}
  <p class="error">{form.message}</p>
{/if}

<main class="wrap">
  <h1>Create your workspace</h1>
  <p class="muted">Pick a name to get started.</p>

  <form method="POST" action="?/createWorkspace" use:enhance class="card">
    <label>
      Workspace name
      <input
        name="workspace_name"
        bind:value={workspace}
        required
        minlength="2"
        maxlength="60"
      />
    </label>

    {#if form?.message}
      <p class="error">{form.message}</p>
    {/if}

    <button class="btn" type="submit">Create workspace</button>
  </form>
</main>

<style>
  .wrap { max-width: 520px; margin: 0 auto; padding: 4rem 1.25rem; }
  .card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 1rem; }
  label { display: grid; gap: .35rem; font-size: .95rem; }
  input { padding: .7rem .8rem; border: 1px solid #e5e7eb; border-radius: .75rem; }
  .btn { padding: .75rem 1rem; border-radius: .75rem; background: #111; color: #fff; border: 0; cursor: pointer; }
  .muted { color: #6b7280; margin: 0 0 1rem; }
  .error { color: #b91c1c; margin: 0; font-size: .9rem; }
</style>