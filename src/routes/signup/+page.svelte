<script lang="ts">
  export let form;
</script>
<form method="POST">
  <label>
    Email
    <input name="email" type="email" required />
  </label>

  <label>
    Password
    <input name="password" type="password" required />
  </label>

  <button type="submit">Create account</button>
</form>
{#if form?.message}
  <p style="color:red">{form.message}</p>
{/if} 