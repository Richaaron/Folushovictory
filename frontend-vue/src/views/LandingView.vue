<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ShieldCheck, GraduationCap, Users } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}
</script>

<template>
  <div class="relative overflow-hidden py-12 lg:py-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="grid items-center gap-16 lg:grid-cols-2">
        <div class="fade-in">
          <div class="mb-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-2xl shadow-purple-200 dark:shadow-purple-900/20 border border-purple-50 dark:border-purple-900/30">
            <img src="/fvs_v2_final.png" alt="School Logo" class="object-contain w-full h-full" />
          </div>
          <h1 class="text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-7xl leading-[1.1]">
            Excellence <br/>Defined by <span class="text-royal-purple">Legacy</span>.
          </h1>
          <p class="mt-8 text-lg font-medium leading-8 text-slate-500 dark:text-slate-400 max-w-lg">
            Welcome to the Folusho Victory Schools digital citadel. A sanctuary of academic precision, teacher empowerment, and parental partnership.
          </p>
          <div class="mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-x-6">
            <button 
              @click="navigateToLogin('admin')"
              class="w-full sm:w-auto rounded-2xl purple-gradient px-10 py-5 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 hover:shadow-purple-300 active:scale-95"
            >
              Admin Portal
            </button>
            <button 
              @click="navigateToLogin('teacher')"
              class="w-full sm:w-auto rounded-2xl gold-gradient px-10 py-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-2xl shadow-amber-100 dark:shadow-amber-900/10 transition hover:scale-105 active:scale-95"
            >
              Teacher Portal
            </button>
            <button 
              @click="navigateToLogin('parent')"
              class="group flex items-center justify-center gap-3 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition hover:text-royal-purple dark:hover:text-purple-400"
            >
              Parental Access <ArrowRight class="w-4 h-4 transition group-hover:translate-x-2" />
            </button>
          </div>
        </div>

        <div class="relative">
          <div class="academic-card rounded-[3rem] p-10 float border border-royal-gold/20">
            <div class="mb-10 flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-inner border border-purple-100 dark:border-purple-900/30">
                <ShieldCheck class="w-6 h-6 text-royal-purple" />
              </div>
              <h2 class="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Academic Pillar</h2>
            </div>
            
            <div class="space-y-8 text-left">
              <div class="flex gap-6">
                <div class="mt-1 h-3 w-3 flex-shrink-0 rounded-full gold-gradient shadow-lg"></div>
                <div>
                  <h3 class="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">Royal Governance</h3>
                  <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Centralized control of academic records and institutional intelligence.</p>
                </div>
              </div>
              
              <div class="flex gap-6">
                <div class="mt-1 h-3 w-3 flex-shrink-0 rounded-full purple-gradient shadow-lg"></div>
                <div>
                  <h3 class="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">Scholarly Assessment</h3>
                  <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Sophisticated evaluation frameworks for numeric and character development.</p>
                </div>
              </div>
              
              <div class="flex gap-6">
                <div class="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-slate-900 dark:bg-white shadow-lg"></div>
                <div>
                  <h3 class="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">Parental Engagement</h3>
                  <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Real-time academic updates and detailed student performance report cards.</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Decorative elements -->
          <div class="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-purple-100/50 dark:bg-purple-900/20 blur-3xl"></div>
          <div class="absolute -bottom-12 -left-12 -z-10 h-64 w-64 rounded-full bg-amber-100/50 dark:bg-amber-900/10 blur-3xl"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.academic-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}
.dark .academic-card {
  background: rgba(15, 23, 42, 0.6);
}
</style>
