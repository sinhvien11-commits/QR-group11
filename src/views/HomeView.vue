<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/useAuthStore'
import FeatureCard from '@/components/home/FeatureCard.vue'
import WorkflowStep from '@/components/home/WorkflowStep.vue'

const { isAuthenticated } = storeToRefs(useAuthStore())

const features = [
  {
    icon: 'generate' as const,
    title: 'Smart QR Generator',
    description:
      'Encode URLs, text, email, phone numbers, and Wi-Fi credentials — with logo embedding and PNG / SVG export.',
  },
  {
    icon: 'scan' as const,
    title: 'QR Scanner',
    description:
      'Decode any QR code in real time using your device camera. Fast, private, and fully in-browser.',
  },
  {
    icon: 'library' as const,
    title: 'Secure Cloud Library',
    description:
      'Every saved QR code is stored in your private Firestore vault and synced across all your devices.',
  },
  {
    icon: 'ai' as const,
    title: 'AI-powered Assistance',
    description:
      'Gemini AI inspects decoded content for safety, summarises links, and flags potentially harmful payloads.',
  },
]

const steps = [
  {
    step: 1,
    title: 'Create',
    description: 'Choose a content type, fill in the details, and your QR code is ready in seconds.',
  },
  {
    step: 2,
    title: 'Scan',
    description: 'Point your camera at any QR code for instant decoding and AI-powered content analysis.',
  },
  {
    step: 3,
    title: 'Manage',
    description: 'Save, rename, and revisit your codes from your personal cloud library — any time, anywhere.',
  },
]
</script>

<template>
  <main class="home">
    <!-- Hero -->
    <section class="hero" aria-label="Introduction">
      <div class="hero-bg" aria-hidden="true" />
      <div class="hero-content">
        <span class="hero-badge">Group 11 · Capstone Project</span>
        <h1 class="hero-title">QR&nbsp;Group&nbsp;11</h1>
        <p class="hero-tagline">Create, scan, and manage QR codes intelligently.</p>
        <p class="hero-desc">
          A platform that combines modern QR technology with Gemini AI — generate codes for any
          content type, scan with your camera, and let AI analyse what's inside.
        </p>
        <div class="hero-actions">
          <RouterLink to="/generate" class="btn btn-primary">Generate QR Code</RouterLink>
          <RouterLink to="/scan" class="btn btn-ghost">Scan QR Code</RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="section" aria-labelledby="features-heading">
      <h2 id="features-heading" class="section-title">Everything you need</h2>
      <p class="section-sub">Four core capabilities, one cohesive platform.</p>
      <div class="features-grid">
        <FeatureCard
          v-for="f in features"
          :key="f.icon"
          :icon="f.icon"
          :title="f.title"
          :description="f.description"
        />
      </div>
    </section>

    <!-- Workflow -->
    <section class="section" aria-labelledby="workflow-heading">
      <h2 id="workflow-heading" class="section-title">How it works</h2>
      <p class="section-sub">Three steps from idea to archive.</p>
      <div class="workflow-grid">
        <WorkflowStep
          v-for="s in steps"
          :key="s.step"
          :step="s.step"
          :title="s.title"
          :description="s.description"
        />
      </div>
    </section>

    <!-- Auth CTA -->
    <section class="section cta-section" aria-label="Get started">
      <div class="cta-card">
        <template v-if="isAuthenticated">
          <p class="cta-eyebrow">Welcome back</p>
          <h2 class="cta-title">Your library is waiting</h2>
          <p class="cta-desc">View and manage all your saved QR codes.</p>
          <RouterLink to="/library" class="btn btn-primary">Open Library</RouterLink>
        </template>
        <template v-else>
          <p class="cta-eyebrow">Get started for free</p>
          <h2 class="cta-title">Ready to begin?</h2>
          <p class="cta-desc">
            Create a free account to save and manage your QR codes across devices.
          </p>
          <div class="cta-actions">
            <RouterLink to="/register" class="btn btn-primary">Create Account</RouterLink>
            <RouterLink to="/login" class="btn btn-ghost">Sign In</RouterLink>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────── */
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section {
  padding: 72px 40px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--text-h);
  margin: 0 0 6px;
  text-align: center;
}

.section-sub {
  font-size: 15px;
  color: var(--text);
  margin: 0 0 36px;
  text-align: center;
}

/* ── Hero ────────────────────────────────────────── */
.hero {
  position: relative;
  padding: 100px 40px 88px;
  display: flex;
  justify-content: center;
  overflow: hidden;
  text-align: center;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-bg) 0%, transparent 100%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: fade-slide-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  animation: pulse-border 3s ease infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    border-color: var(--accent-border);
  }
  50% {
    border-color: var(--accent);
  }
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -2.5px;
  line-height: 1;
  margin: 0;
  color: var(--text-h);
  background: linear-gradient(
    135deg,
    var(--text-h) 0%,
    color-mix(in srgb, var(--text-h) 70%, var(--accent) 30%) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-tagline {
  font-size: 19px;
  font-weight: 500;
  color: var(--text-h);
  opacity: 0.8;
  margin: 0;
}

.hero-desc {
  font-size: 15px;
  line-height: 165%;
  color: var(--text);
  max-width: 480px;
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

/* ── Buttons ─────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 28px;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition:
    opacity 0.2s,
    background 0.2s,
    transform 0.15s;
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-ghost {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.btn-ghost:hover {
  background: var(--accent-bg);
}

.btn-ghost:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Features ────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 760px;
}

/* ── Workflow ─────────────────────────────────────── */
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 760px;
}

/* ── Auth CTA ─────────────────────────────────────── */
.cta-section {
  padding-bottom: 96px;
}

.cta-card {
  width: 100%;
  max-width: 460px;
  padding: 40px 36px;
  border: 1px solid var(--accent-border);
  border-radius: 16px;
  background: var(--accent-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.cta-eyebrow {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin: 0;
}

.cta-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
  letter-spacing: -0.4px;
}

.cta-desc {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 4px;
  line-height: 155%;
  max-width: 320px;
}

.cta-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .hero {
    padding: 64px 20px 56px;
  }

  .hero-title {
    font-size: 38px;
    letter-spacing: -1.5px;
  }

  .hero-tagline {
    font-size: 16px;
  }

  .section {
    padding: 48px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .workflow-grid {
    grid-template-columns: 1fr;
  }

  .cta-card {
    padding: 28px 20px;
  }

  .cta-section {
    padding-bottom: 64px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 30px;
    letter-spacing: -1px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
}
</style>
