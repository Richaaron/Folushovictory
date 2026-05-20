<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-950 text-white">
    <div class="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(153,76,255,0.26),transparent_28%),radial-gradient(circle_at_top_right,rgba(212,175,55,0.24),transparent_24%)] pointer-events-none" />
    <div class="absolute -right-20 top-1/4 hidden h-72 w-72 rounded-full bg-royal-purple/10 blur-3xl lg:block" />
    <div class="absolute -left-16 bottom-16 hidden h-64 w-64 rounded-full bg-royal-gold/10 blur-3xl lg:block" />

    <div class="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-16 lg:px-8 lg:py-24">
      <div class="grid flex-1 gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div class="relative z-10">
          <div class="mx-auto max-w-3xl text-center">
            <div class="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-royal-gold/25 bg-slate-900/90 shadow-[0_30px_70px_rgba(212,175,55,0.20)]">
              <img src="/logo.png" alt="Folusho Victory Schools logo" class="h-28 w-28 object-contain" />
            </div>

            <p class="mt-8 text-sm uppercase tracking-[0.32em] text-royal-gold">Welcome to</p>
            <h1 class="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Folusho Victory School
            </h1>
            <p class="mt-3 text-lg font-semibold text-slate-300">Result Portal</p>

            <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center hero-actions">
              <button
                @click="navigateToLogin('admin')"
                class="hero-action-btn bg-gradient-to-r from-royal-purple via-royal-purple to-slate-900 text-white shadow-[0_24px_60px_rgba(88,28,135,0.32)]"
              >
                Admin Portal
              </button>

              <button
                @click="navigateToLogin('teacher')"
                class="hero-action-btn bg-gradient-to-r from-royal-gold via-amber-400 to-amber-200 text-slate-950 shadow-[0_24px_40px_rgba(212,175,55,0.28)]"
              >
                Teacher Portal
              </button>

              <button
                @click="navigateToLogin('parent')"
                class="hero-action-btn group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-royal-purple hover:text-royal-purple"
              >
                Parental Access
                <ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div class="mt-12 grid gap-4 sm:grid-cols-2">
            <div class="landing-pill">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Trusted heritage</p>
              <p class="mt-4 text-lg font-black text-white">A strong foundation for every student.</p>
            </div>
            <div class="landing-pill">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Modern learning</p>
              <p class="mt-4 text-lg font-black text-white">Digital classrooms with real-time insights.</p>
            </div>
          </div>
        </div>

        <div class="relative z-10">
          <div class="landing-hero-panel overflow-hidden rounded-[2.5rem] border border-slate-700/50 bg-slate-900/85 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
            <div class="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-slate-700/50 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20">
              <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-royal-purple/10 text-royal-gold ring-1 ring-royal-gold/20">
                <ShieldCheck class="h-7 w-7" />
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.32em] text-slate-400">Academic Pillar</p>
                <h2 class="mt-3 text-2xl font-black text-white">Strategic school governance</h2>
              </div>
            </div>

            <div class="grid gap-5">
              <div class="feature-card">
                <div class="flex h-11 w-11 items-center justify-center rounded-3xl bg-royal-gold/10 text-royal-gold ring-1 ring-royal-gold/20">
                  <span class="text-sm font-black">01</span>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Royal Governance</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">Centralized control of academic records and institutional intelligence.</p>
                </div>
              </div>

              <div class="feature-card">
                <div class="flex h-11 w-11 items-center justify-center rounded-3xl bg-royal-purple/10 text-royal-purple ring-1 ring-royal-purple/20">
                  <span class="text-sm font-black">02</span>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Scholarly Assessment</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">Sophisticated evaluation frameworks for numeric and character development.</p>
                </div>
              </div>

              <div class="feature-card">
                <div class="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-700/70 text-white ring-1 ring-slate-600/30">
                  <span class="text-sm font-black">03</span>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Parental Engagement</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">Real-time academic updates and detailed student performance report cards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing-hero-panel {
  @apply border border-slate-700/50 bg-slate-900/85 backdrop-blur-xl;
}

.landing-pill {
  @apply rounded-3xl border border-slate-700/40 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20;
}

.feature-card {
  @apply flex items-start gap-4 rounded-3xl border border-slate-700/50 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/20;
}

@media (max-width: 640px) {
  .landing-hero-panel,
  .landing-pill,
  .feature-card {
    @apply rounded-[2rem] p-5;
  }
}

.hero-actions {
  gap: 1rem;
}

.hero-action-btn {
  @apply inline-flex items-center justify-center min-w-[13rem] rounded-full px-10 py-4 text-sm font-black uppercase tracking-widest transition duration-300 ease-out;
}

.hero-action-btn:hover {
  transform: translateY(-2px);
}

.hero-action-btn:active {
  transform: scale(0.98);
}
</style>

