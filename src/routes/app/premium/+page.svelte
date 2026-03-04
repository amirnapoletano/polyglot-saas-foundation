<script lang="ts">
  export let data;

  async function subscribe() {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST'
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Checkout failed');
      alert(msg);
      return;
    }

    const json = await res.json().catch(() => null);
    if (json?.url) {
      window.location.href = json.url;
      return;
    }

    alert('Checkout URL missing');
  }

  async function manageBilling() {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST'
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Portal failed');
      alert(msg);
      return;
    }

    const json = await res.json().catch(() => null);
    if (json?.url) {
      window.location.href = json.url;
      return;
    }

    alert('Portal URL missing');
  }
</script>
<main>
  <h1>Premium</h1>

  <p>Current plan: {data.plan}</p>

  {#if data?.isActive}
    <p>Your org has an active billing status ✅</p>

    <section>
      <h2>Premium Features</h2>
      <p>Unlocked.</p>
    </section>

    <button on:click={manageBilling}>
      Manage billing
    </button>

  {:else}
    <p>This is a premium feature. Upgrade to unlock it.</p>

    <button on:click={subscribe}>
      Subscribe
    </button>

    {#if data?.billing?.status}
      <p style="opacity: 0.7; margin-top: 12px;">
        Current status: {data.billing.status}
      </p>
    {/if}
  {/if}
</main>