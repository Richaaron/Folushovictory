<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShieldCheck, UserCheck, GraduationCap, Users, ArrowLeft } from 'lucide-vue-next'

type PortalKey = 'admin' | 'teacher' | 'parent' | 'student'

const route = useRoute()
const portal = computed<PortalKey>(() => {
  const raw = Array.isArray(route.params.portal) ? route.params.portal[0] : route.params.portal
  const normalized = String(raw || 'admin').toLowerCase()
  return ['admin', 'teacher', 'parent', 'student'].includes(normalized) ? (normalized as PortalKey) : 'admin'
})

const portalMeta: Record<PortalKey, {
  title: string
  icon: any
  badge: string
  helpText: string
  cta: string
}> = {
  admin: {
    title: 'Administrator',
    icon: ShieldCheck,
    badge: 'IT Administration',
    helpText: 'Lost your staff credential? Ask the school IT administrator or board to initiate a secure account reset for your administrative portal access.',
    cta: 'Return to Admin Login'
  },
  teacher: {
    title: 'Academic Staff',
    icon: UserCheck,
    badge: 'Faculty Access',
    helpText: 'Need a new staff passphrase? Contact your school administration office to refresh your teacher access code securely.',
    cta: 'Return to Teacher Login'
  },
  parent: {
    title: 'Parent / Guardian',
    icon: Users,
    badge: 'Family Portal',
    helpText: 'If you forgot your Parent Access Code or Student ID link, please contact the administrative registry for a verified recovery path.',
    cta: 'Return to Parent Login'
  },
  student: {
    title: 'Student Portal',
    icon: GraduationCap,
    badge: 'Learner Account',
    helpText: 'Forgot your student PIN? Ask your form teacher or school administrator to reset it. Your admission number alone cannot be used to unlock your portal.',
    cta: 'Return to Student Login'
  }
}

const current = computed(() => portalMeta[portal.value])
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-transparent px-4 py-8 sm:py-12">
    <div class="w-full max-w-lg space-y-6">
      
      <!-- Recovery Card -->
      <div class="bg-white rounded-3xl border-2 border-[#BAE6FD] shadow-xl shadow-sky-900/10 p-6 sm:p-10 space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-3">
          <div class="mx-auto inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-sky-100 border border-sky-300 text-sky-800 shadow-sm">
            <component :is="current.icon" class="w-8 h-8 text-sky-800" />
          </div>

          <div class="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider">
            {{ current.badge }}
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-[#0C4A6E] tracking-tight">
            {{ current.title }} Recovery
          </h1>

          <p class="text-sm sm:text-base font-medium text-slate-700 leading-relaxed max-w-md mx-auto">
            {{ current.helpText }}
          </p>
        </div>

        <!-- Security Notice -->
        <div class="rounded-2xl bg-sky-50/80 border border-sky-200 p-5 space-y-2">
          <p class="text-xs font-black uppercase tracking-wider text-sky-900">
            Verified School Protocol
          </p>
          <p class="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
            For maximum student data protection, credentials cannot be reset via unverified emails. Please visit or contact the Folusho Victory administrative office.
          </p>
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <router-link
            :to="`/login/${portal}`"
            class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-black text-sm uppercase tracking-wider py-3.5 px-6 shadow-md transition-all"
          >
            <ArrowLeft class="w-4 h-4 text-white" />
            <span>{{ current.cta }}</span>
          </router-link>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="text-center space-y-1 text-xs font-bold text-slate-700">
        <p class="tracking-wide">FOLUSHO VICTORY COLLEGE • SECURE ACCESS</p>
        <p class="text-slate-600 font-medium">Return to login for your designated portal anytime.</p>
      </div>

    </div>
  </div>
</template>
