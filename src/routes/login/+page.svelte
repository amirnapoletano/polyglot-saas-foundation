<script lang="ts">
  import { enhance } from '$app/forms';

  type Data = { message?: string; next?: string };
  let { data } = $props<{ data: Data }>();

  let email = $state('');
  let password = $state('');
</script>

<main class="wrap">
  <h1>Log in</h1>

  <form method="POST" action="?/login" use:enhance class="card">
    <label>
      Email
      <input name="email" type="email" bind:value={email} required />
    </label>

    <label>
      Password
      <input name="password" type="password" bind:value={password} required />
    </label>

    {#if data?.message}
      <p class="error">{data.message}</p>
    {/if}

    <button class="btn" type="submit">Log in</button>

    <p class="muted"><a href="/reset-password">Forgot password?</a></p>
    <p class="muted">No account? <a href="/signup">Create one</a></p>
  </form>
</main>

<style>
  .wrap { max-width: 460px; margin: 0 auto; padding: 4rem 1.25rem; }
  .card { display: grid; gap: 1rem; padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 1rem; }
  label { display: grid; gap: .35rem; font-size: .95rem; }
  input { padding: .7rem .8rem; border: 1px solid #e5e7eb; border-radius: .75rem; }
  .btn { padding: .75rem 1rem; border-radius: .75rem; background: #111; color: #fff; border: 0; cursor: pointer; }
  .muted { color: #6b7280; font-size: .9rem; margin: 0; }
  .error { color: #b91c1c; margin: 0; font-size: .9rem; }
</style>