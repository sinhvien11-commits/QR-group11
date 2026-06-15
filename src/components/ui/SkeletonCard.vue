<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skel skel-title" />
    <div class="skel-meta">
      <div class="skel skel-chip" />
      <div class="skel skel-chip" />
      <div class="skel skel-chip" />
      <div class="skel skel-chip" />
    </div>
    <div class="skel-actions">
      <div class="skel skel-btn" />
      <div class="skel skel-btn" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skel {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--border) 25%,
    color-mix(in srgb, var(--border) 60%, var(--bg)) 50%,
    var(--border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skel-title {
  height: 16px;
  width: 60%;
}

.skel-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.skel-chip {
  height: 32px;
}

.skel-actions {
  display: flex;
  gap: 8px;
}

.skel-btn {
  height: 30px;
  width: 80px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
