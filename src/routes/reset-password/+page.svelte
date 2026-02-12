<script lang="ts">
  type Data = { ok?: boolean; message?: string };
  let { data } = $props<{ data: Data }>();
  let email = $state('');
</script>
<main class="wrap">
  <h1>Reset password</h1>

  <form method="POST" action="?/reset" class="card">
    <label>
      Email
      <input name="email" type="email" bind:value={email} required />
    </label>

    {#if data?.ok}
      <p class="ok">Reset link sent. Check your email.</p>
    {/if}
    {#if data?.message}
      <p class="error">{data.message}</p>
    {/if}

    <button class="btn" type="submit">Send reset link</button>
    <p class="muted"><a href="/login">Back to login</a></p>
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
  .ok { color: #065f46; margin: 0; font-size: .9rem; }
</style>