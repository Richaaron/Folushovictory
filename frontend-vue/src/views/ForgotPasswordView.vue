<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const portal = computed(() => {
  const raw = String(route.params.portal || 'admin').toLowerCase()
  return ['admin', 'teacher', 'parent'].includes(raw) ? raw : 'admin'
})

const portalMeta = {
  admin: {
    title: 'Administrator',
    emoji: '🛡️',
    helpText: 'Lost your staff credential? Ask the IT administrator to initiate a secure account reset for your admin portal access.',
    cta: 'Return to Admin Login'
  },
  teacher: {
    title: 'Academic Staff',
    emoji: '📚',
    helpText: 'Need a new staff passphrase? Contact your admin office to refresh your teacher access code securely.',
    cta: 'Return to Teacher Login'
  },
  parent: {
    title: 'Parent/Guardian',
    emoji: '👪',
    helpText: 'If you forgot your Parent Access Code, contact the school office for a verified recovery path.',
    cta: 'Return to Parent Login'
  }
} as const

const current = computed(() => portalMeta[portal.value])
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-3 sm:px-4 py-8 sm:py-12">
    <div class="w-full max-w-lg space-y-8">
      <div class="rounded-[2rem] bg-white dark:bg-slate-950/95 border border-slate-200/70 dark:border-slate-800 shadow-2xl p-8 sm:p-10">
        <div class="text-center space-y-4">
          <div class="mx-auto inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-inner">
            <span class="text-2xl">{{ current.emoji }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ current.title }} Recovery
          </h1>
          <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ current.helpText }}
          </p>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] items-center">
          <div class="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800">
            <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              For added security, recover access through your school administration. This portal is reserved for role-based account support.
            </p>
          </div>
          <router-link
            :to="`/login/${portal.value}`"
            class="inline-flex items-center justify-center rounded-full bg-nebula-600 text-white px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-nebula-700 transition"
          >
            {{ current.cta }}
          </router-link>
        </div>
      </div>

      <div class="text-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
        <p>Role-aware recovery support</p>
        <p class="mt-2">Return to login for your selected portal anytime.</p>
      </div>
    </div>
  </div>
</template>
