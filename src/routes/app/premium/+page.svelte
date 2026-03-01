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
</script>

<main>
  <h1>Premium</h1>

  {#if data?.isActive}
    <p>Your org has an active billing status ✅</p>

    <section>
      <h2>Premium Features</h2>
      <p>Unlocked.</p>
    </section>
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