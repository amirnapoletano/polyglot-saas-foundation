<script lang="ts">
  export let data;
</script>

<h1>Dashboard</h1>

{#if data.profile}
  <p>Signed in as: {data.profile.email}</p>
  <p>Plan: {data.profile.plan}</p>
{:else}
  <p>Signed in, but profile not created yet.</p>
{/if}

<p class="muted">Protected route works. Session is server-validated.</p>

<style>
  .muted { color: #6b7280; }
</style>