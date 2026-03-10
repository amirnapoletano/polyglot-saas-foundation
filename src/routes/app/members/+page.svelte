<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  export let data: {
  currentUserRole?: string;
  plan?: string;
  seatLimit?: number;
  usedSeats?: number;
    members: Array<{
      id: string;
      user_id: string;
      role: string;
      profile: {
        email: string | null;
        display_name: string | null;
      };
    }>;
    invites: Array<{
      id: string;
      email: string;
      role: string;
      token: string;
      expires_at?: string | null;
    }>;
  };

  let email = '';
  let inviteLink = '';
  let successMessage = '';
  let errorMessage = '';
  let loading = false;

  const canManageTeam =
    data.currentUserRole === 'owner' || data.currentUserRole === 'admin';

  async function invite() {
    errorMessage = '';
    successMessage = '';

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      errorMessage = 'Email is required.';
      return;
    }

    loading = true;

    try {
      const res = await fetch('/api/invites/create', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
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
    } catch {
      errorMessage = 'Something went wrong while creating the invite.';
    } finally {
      loading = false;
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      successMessage = 'Invite link copied.';
    } catch {
      errorMessage = 'Could not copy invite link.';
    }
  }

  async function cancelInvite(inviteId: string) {
    const confirmed = window.confirm('Cancel this invite?');
    if (!confirmed) return;

    errorMessage = '';
    successMessage = '';

    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE'
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        errorMessage = result?.message ?? `Failed to cancel invite (HTTP ${res.status}).`;
        return;
      }

      successMessage = 'Invite cancelled.';
      await invalidateAll();
    } catch {
      errorMessage = 'Something went wrong while cancelling the invite.';
    }
  }

  async function removeMember(memberUserId: string) {
    const confirmed = window.confirm('Remove this member from the organization?');
    if (!confirmed) return;

    errorMessage = '';
    successMessage = '';

    try {
      const res = await fetch(`/api/members/${memberUserId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        errorMessage = result?.message ?? 'Failed to remove member.';
        return;
      }

      successMessage = 'Member removed.';
      await invalidateAll();
    } catch {
      errorMessage = 'Something went wrong while removing the member.';
    }
  }

  function formatDate(value?: string | null) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString();
  }

    async function changeRole(memberUserId: string, nextRole: string) {
    errorMessage = '';
    successMessage = '';

    try {
      const res = await fetch(`/api/members/${memberUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        errorMessage = result?.message ?? 'Failed to update role.';
        return;
      }

      successMessage = 'Role updated.';
      await invalidateAll();
    } catch {
      errorMessage = 'Something went wrong while updating the role.';
    }
  }

</script>

<svelte:head>
  <title>Team Members</title>
</svelte:head>

<main class="page">
  <div class="header">
  <h1>Team Members</h1>
  <p class="muted">Manage organization access, invites, and roles.</p>
  <p class="muted">
    Plan: {data.plan ?? 'free'} · Seats used: {data.usedSeats ?? 0}/{data.seatLimit ?? 0}
  </p>
</div>

  <section class="card">
    <h2>Invite Member</h2>

    {#if canManageTeam}
      <div class="invite-row">
        <input
          placeholder="email@example.com"
          bind:value={email}
          type="email"
          autocomplete="off"
        />

        <button on:click={invite} disabled={loading || (data.usedSeats ?? 0) >= (data.seatLimit ?? 0)}>
          {#if loading}
            Sending...
          {:else}
            Send Invite
          {/if}
        </button>
      </div>
    {:else}
      <p class="muted">You do not have permission to invite members.</p>
    {/if}

    {#if successMessage}
      <p class="success">{successMessage}</p>
    {/if}

    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    {#if inviteLink}
      <div class="invite-link-box">
        <p class="invite-label">Invite link</p>
        <code>{inviteLink}</code>
        <button class="secondary" on:click={copyInviteLink}>
          Copy link
        </button>
      </div>
    {/if}
    
    {#if (data.usedSeats ?? 0) >= (data.seatLimit ?? 0)}
  <p class="error">Seat limit reached for your plan.</p>
{/if}
  </section>

  <section class="card">
    <h2>Members</h2>

    {#if data.members.length === 0}
      <p class="muted">No members found.</p>
    {:else}
      <ul class="list">
        {#each data.members as member}
          <li class="row">
            <div>
              <div class="primary">
                {member.profile.display_name ?? member.profile.email ?? member.user_id}
              </div>
              {#if member.profile.email && member.profile.display_name}
                <div class="muted">{member.profile.email}</div>
              {/if}
            </div>

              <div class="row-right">
                {#if canManageTeam}
                  <select
                    class="role-select"
                    value={member.role}
                    disabled={member.role === 'owner'}
                    on:change={(e) =>
                      changeRole(member.user_id, (e.currentTarget as HTMLSelectElement).value)}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                {:else}
                  <span class="badge">{member.role}</span>
                {/if}

                {#if canManageTeam && member.role !== 'owner'}
                  <button
                    class="danger"
                    on:click={() => removeMember(member.user_id)}
                  >
                    Remove
                  </button>
                {/if}
              </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="card">
    <h2>Pending Invitations</h2>

    {#if data.invites.length === 0}
      <p class="muted">No pending invitations.</p>
    {:else}
      <ul class="list">
        {#each data.invites as invite}
          <li class="row">
            <div>
              <div class="primary">{invite.email}</div>
              <div class="muted">
                Role: {invite.role}
                {#if formatDate(invite.expires_at)}
                  · Expires {formatDate(invite.expires_at)}
                {/if}
              </div>
            </div>

            <div class="row-right">
              <span class="badge pending">invited</span>

              {#if canManageTeam}
                <button
                  class="danger"
                  on:click={() => cancelInvite(invite.id)}
                >
                  Cancel
                </button>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 1.25rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .card {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    background: #fff;
  }

  .invite-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }

  input {
    min-width: 280px;
    padding: 0.75rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.75rem;
  }

  button {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 0;
    background: #111;
    color: white;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary {
    margin-top: 0.75rem;
  }

  .danger {
    background: #b91c1c;
  }

  .invite-link-box {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .invite-label {
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  code {
    display: block;
    overflow-wrap: anywhere;
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 0.75rem;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: grid;
    gap: 0.75rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .role-select {
  padding: 0.55rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 0.875rem;
}

.role-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

  .primary {
    font-weight: 600;
  }

  .badge {
    display: inline-block;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    background: #f3f4f6;
    text-transform: capitalize;
    font-size: 0.875rem;
  }

  .pending {
    background: #fef3c7;
  }

  .muted {
    opacity: 0.7;
  }

  .success {
    color: #166534;
    margin-top: 0.75rem;
  }

  .error {
    color: #b91c1c;
    margin-top: 0.75rem;
  }
</style>