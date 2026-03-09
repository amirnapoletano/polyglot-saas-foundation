<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  export let data;

  let email = '';
  let inviteLink = '';
  let successMessage = '';
  let errorMessage = '';

  async function invite() {
    errorMessage = '';
    successMessage = '';

    const res = await fetch('/api/invites/create', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await res.json().catch(() => null);

    if (!res.ok) {
      errorMessage = result?.message ?? 'Failed to create invite';
      return;
    }

    inviteLink = result?.invite_link
      ? `${window.location.origin}${result.invite_link}`
      : '';

    successMessage = 'Invite created successfully.';
    email = '';

    await invalidateAll();
  }
</script>

<h1>Team Members</h1>
<h2>Invite Member</h2>

<input
  placeholder="email@example.com"
  bind:value={email}
/>

<button on:click={invite}>
  Send Invite
</button>

{#if successMessage}
  <p>{successMessage}</p>
{/if}

{#if errorMessage}
  <p>{errorMessage}</p>
{/if}

{#if inviteLink}
  <p>
    Invite link:
    <code>{inviteLink}</code>
  </p>
{/if}

<h2>Members</h2>

<ul>
  {#each data.members as member}
    <li>
      {member.profile?.email} — {member.role}
    </li>
  {/each}
</ul>

<h2>Pending Invitations</h2>

<ul>
  {#each data.invites as invite}
    <li>
      {invite.email} — invited
    </li>
  {/each}
</ul>