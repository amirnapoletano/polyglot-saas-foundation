<script lang="ts">
  export let data: {
    plan?: string;
    isActive?: boolean;
    billing?: {
      status?: string | null;
      current_period_end?: string | null;
    } | null;
  };

  let loading = false;

  const planRaw = data?.plan ?? 'free';

  const planLabel =
    planRaw.charAt(0).toUpperCase() + planRaw.slice(1);

  const statusLabel = data?.billing?.status ?? 'inactive';

  function formatDate(date: string | null | undefined) {
    if (!date) return null;

    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async function subscribe() {
    if (loading) return;
    loading = true;

    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Checkout failed');
        throw new Error(msg);
      }

      const json = await res.json().catch(() => null);
      if (json?.url) {
        window.location.href = json.url;
        return;
      }

      throw new Error('Checkout URL missing');
    } catch (e: any) {
      alert(e?.message ?? 'Checkout failed');
    } finally {
      loading = false;
    }
  }

  async function manageBilling() {
    if (loading) return;
    loading = true;

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Portal failed');
        throw new Error(msg);
      }

      const json = await res.json().catch(() => null);
      if (json?.url) {
        window.location.href = json.url;
        return;
      }

      throw new Error('Portal URL missing');
    } catch (e: any) {
      alert(e?.message ?? 'Portal failed');
    } finally {
      loading = false;
    }
  }
</script>

<main>
  <h1>Premium</h1>

  <p><strong>Plan:</strong> {planLabel}</p>
  <p><strong>Status:</strong> {statusLabel}</p>

  {#if data?.billing?.current_period_end}
    <p>
      <strong>Next billing:</strong>
      {formatDate(data.billing.current_period_end)}
    </p>
  {/if}

  {#if data?.isActive}
    <p>Your org has an active billing status ✅</p>

    <section>
      <h2>Premium Features</h2>
      <p>Unlocked.</p>
    </section>

    <button on:click={manageBilling} disabled={loading}>
      {loading ? 'Loading…' : 'Manage billing'}
    </button>
  {:else}
    <p>This is a premium feature. Upgrade to unlock it.</p>

    <button on:click={subscribe} disabled={loading}>
      {loading ? 'Loading…' : 'Subscribe'}
    </button>
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 1.25rem;
  }

  button {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 0;
    cursor: pointer;
    background: #111;
    color: #fff;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  section {
    margin-top: 1.25rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
  }
</style>.   