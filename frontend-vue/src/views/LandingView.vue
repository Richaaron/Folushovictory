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
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,28,135,0.26),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.18),transparent_30%)] pointer-events-none" />
    <div class="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-royal-purple/15 to-transparent" />
    <div class="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-royal-gold/15 to-transparent" />

    <div class="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-16 lg:px-8 lg:py-24">
      <div class="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <section class="space-y-8">
          <div class="rounded-[2rem] border border-royal-gold/15 bg-slate-950/85 p-10 shadow-[0_35px_100px_rgba(0,0,0,0.30)] backdrop-blur-xl">
            <div class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
              <div class="flex h-24 w-24 items-center justify-center rounded-full border border-royal-gold/20 bg-slate-900/90 text-royal-gold shadow-[0_18px_40px_rgba(212,175,55,0.20)]">
                <img src="/logo.png" alt="Folusho Victory Schools logo" class="h-14 w-14 object-contain" />
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.35em] text-royal-gold">Welcome to</p>
                <h1 class="mt-3 text-5xl font-black tracking-tight text-white sm:text-6xl">Folusho Victory School</h1>
                <p class="mt-3 max-w-xl text-base leading-8 text-slate-300">A refined portal for academic result management, school operations, and guardian engagement — presented with royal purple and gold clarity.</p>
              </div>
            </div>

            <div class="mt-10 grid gap-4 sm:grid-cols-3">
              <button
                @click="navigateToLogin('admin')"
                class="action-pill bg-gradient-to-r from-royal-purple via-royal-purple to-slate-900 text-white"
              >
                Admin Portal
              </button>
              <button
                @click="navigateToLogin('teacher')"
                class="action-pill bg-gradient-to-r from-royal-gold via-amber-400 to-amber-200 text-slate-950"
              >
                Teacher Portal
              </button>
              <button
                @click="navigateToLogin('parent')"
                class="action-pill border border-slate-700 bg-slate-900/85 text-slate-300 hover:border-royal-purple hover:text-royal-purple"
              >
                Parental Access
                <ArrowRight class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article class="panel-card">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Trusted heritage</p>
              <h2 class="mt-4 text-xl font-black text-white">School tradition meets digital speed.</h2>
              <p class="mt-3 text-sm leading-7 text-slate-300">Keep every result, attendance update, and administrative action in one secure portal.</p>
            </article>
            <article class="panel-card">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Modern learning</p>
              <h2 class="mt-4 text-xl font-black text-white">Instant insights for teaching staff.</h2>
              <p class="mt-3 text-sm leading-7 text-slate-300">A polished hub for assignments, student progress, and parent communication.</p>
            </article>
          </div>
        </section>

        <section class="relative rounded-[2.5rem] border border-slate-700/40 bg-slate-950/80 p-8 shadow-[0_45px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div class="absolute -right-10 top-10 h-32 w-32 rounded-full bg-royal-purple/10 blur-3xl" />
          <div class="absolute -left-8 bottom-10 h-24 w-24 rounded-full bg-royal-gold/10 blur-3xl" />
          <div class="relative space-y-8">
            <div class="rounded-[2rem] border border-slate-700/50 bg-slate-900/90 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.30)]">
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-royal-purple/10 text-royal-gold ring-1 ring-royal-gold/20">
                  <ShieldCheck class="h-7 w-7" />
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.32em] text-slate-400">Why this portal</p>
                  <h2 class="mt-2 text-2xl font-black text-white">Trusted for academic control.</h2>
                </div>
              </div>
            </div>

            <div class="grid gap-5">
              <article class="feature-card">
                <span class="feature-index">01</span>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Authority</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">A premium gateway for administrators, teachers, and families.</p>
                </div>
              </article>
              <article class="feature-card">
                <span class="feature-index">02</span>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Clarity</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">Every result and report presented with clean visual hierarchy.</p>
                </div>
              </article>
              <article class="feature-card">
                <span class="feature-index">03</span>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Harmony</p>
                  <p class="mt-2 text-sm leading-6 text-slate-300">Elegant access for school leaders, educators, and guardians.</p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-pill {
  @apply inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest transition duration-300 ease-out;
}

.action-pill:hover {
  transform: translateY(-1px);
}

.panel-card,
.feature-card {
  @apply rounded-[2rem] border border-slate-700/40 bg-slate-950/80 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl;
}

.feature-card {
  @apply grid gap-4;
}

.feature-index {
  @apply inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-royal-purple/10 text-royal-gold font-black;
}

@media (max-width: 768px) {
  .action-pill {
    @apply w-full;
  }
}
</style>

