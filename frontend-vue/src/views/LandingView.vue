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
          <div class="inline-flex items-center gap-3 rounded-full border border-royal-gold/25 bg-white/5 px-4 py-2 text-sm text-royal-gold shadow-2xl shadow-purple-900/10 backdrop-blur-sm">
            <span class="inline-flex h-3 w-3 rounded-full bg-royal-purple shadow-[0_0_0_4px_rgba(212,175,55,0.12)]"></span>
            Folusho Victory Schools
          </div>

          <h1 class="mt-10 max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.02]">
            Excellence <span class="text-royal-purple">Defined</span> by Legacy.
          </h1>

          <p class="mt-8 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Welcome to the Folusho Victory Schools digital citadel. A sanctuary of academic precision, teacher empowerment, and parental partnership.
          </p>

          <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              @click="navigateToLogin('admin')"
              class="w-full sm:w-auto rounded-full bg-gradient-to-r from-royal-purple via-royal-purple to-slate-900 px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_24px_60px_rgba(88,28,135,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(88,28,135,0.34)] active:scale-[0.98]"
            >
              Admin Portal
            </button>

            <button
              @click="navigateToLogin('teacher')"
              class="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 px-10 py-4 text-sm font-black uppercase tracking-widest text-slate-950 shadow-[0_24px_40px_rgba(212,175,55,0.28)] transition hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Teacher Portal
            </button>

            <button
              @click="navigateToLogin('parent')"
              class="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-6 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-300 transition hover:border-royal-purple hover:text-royal-purple"
            >
              Parental Access
              <ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
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
</style>

