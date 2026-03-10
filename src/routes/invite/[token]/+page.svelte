<script lang="ts">
export let data:
  | {
      status: 'accepted' | 'expired' | 'wrong-account';
      invite: {
        email: string;
        role: string;
      };
    }
  | undefined;
</script>

<svelte:head>
  <title>Invite</title>
</svelte:head>

<main>
  {#if data.status === 'accepted'}
    <h1>Invite already accepted</h1>
    <p>This invitation has already been used.</p>
    <a href="/app/members">Go to members</a>
  {:else if data.status === 'expired'}
    <h1>Invite expired</h1>
    <p>This invitation is no longer valid.</p>
    <a href="/app/members">Back to app</a>
  {:else if data.status === 'wrong-account'}
    <h1>Wrong account</h1>
    <p>
      This invite was sent to <strong>{data.invite.email}</strong>.
    </p>
    <p>Please sign in with that account to accept the invitation.</p>
    <a href="/app/logout">Log out</a>
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 4rem 1.25rem;
  }

  a {
    display: inline-block;
    margin-top: 1rem;
  }
</style>