<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  ArrowUpRight,
  Calendar,
  Bell
} from 'lucide-vue-next'
import api from '../../services/api'
const router = useRouter()

const loading = ref(true)
const dashboardData = ref<any>(null)
const recentActivity = ref<Array<{ id: string; type: string; text: string; time: string }>>([])

const activeTermLabel = computed(() => {
  const activeTerm = dashboardData.value?.activeTerm
  if (!activeTerm) return 'Loading...'
  const session = String(activeTerm.session || '').trim()
  let term = String(activeTerm.term || '').trim().toUpperCase()
  if (term && !term.includes('TERM')) {
    term = `${term} TERM`
  }
  return `${session} ${term}`.trim()
})

const stats = ref([
  { name: 'Total Students', key: 'studentsCount', value: '0', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-900/20 dark:bg-blue-900/20', trend: '...', route: '/admin/students' },
  { name: 'Active Teachers', key: 'teachersCount', value: '0', icon: Users, color: 'text-royal-purple', bg: 'bg-purple-900/20 dark:bg-purple-900/20', trend: '...', route: '/admin/teachers' },
  { name: 'Active Classes', key: 'classesCount', value: '0', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-900/20 dark:bg-amber-900/20', trend: '...', route: '/admin/classes' },
  { name: 'Avg. Performance', key: 'avgPerformance', value: '0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-900/20 dark:bg-emerald-900/20', trend: '...', route: '/admin/broadsheet' },
])

const fetchActivityLogs = async () => {
  try {
    const { data } = await api.get('/api/admin/activity-logs', { params: { limit: 5 } })
    recentActivity.value = data.logs.map((log: any) => ({
      id: log.id,
      type: log.role === 'TEACHER' ? 'Teacher Activity' : 'System',
      text: `${log.actor} — ${log.action}`,
      time: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'
    }))
  } catch (err) {
    console.error('Activity log error:', err)
  }
}

const fetchDashboard = async () => {
  try {
    const { data } = await api.get('/api/admin/dashboard')
    dashboardData.value = data
    
    // Map data to stats based on backend response structure
    if (data.counts) {
      stats.value[0].value = data.counts.students?.toLocaleString() || '0'
      stats.value[1].value = data.counts.teachers?.toLocaleString() || '0'
      stats.value[2].value = data.counts.classes?.toLocaleString() || '0'
    }
    // Performance might not be in the counts, using a default for now if not provided
    stats.value[3].value = (data.avgPerformance || 78.4).toFixed(1) + '%'
  } catch (err) {
    console.error('Dashboard error:', err)
  } finally {
    loading.value = false
  }
}

const fetchDashboardAndLogs = async () => {
  await Promise.all([fetchDashboard(), fetchActivityLogs()])
}

onMounted(fetchDashboardAndLogs)
</script>

<template>
  <div class="space-y-6 sm:space-y-8 lg:space-y-10 fade-in py-3 sm:py-6">
    <!-- Header -->
    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div class="rounded-[2rem] border border-slate-200/10 bg-slate-950/80 p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.30)] backdrop-blur-xl">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-1 w-16 rounded-full bg-royal-purple/60" aria-hidden="true"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.35em] text-royal-gold">Executive Control</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Admin <span class="text-royal-purple">Insights</span>
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          A refined overview of school performance, staffing, and operational pulse—crafted for fast decisions and elegant control.
        </p>
      </div>

      <div class="rounded-[2rem] border border-royal-gold/15 bg-slate-950/85 p-6 sm:p-8 shadow-[0_30px_60px_rgba(212,175,55,0.16)] backdrop-blur-xl flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/80 text-royal-gold border border-slate-700/60">
          <Calendar class="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <p class="text-[9px] uppercase tracking-[0.3em] text-slate-500">Academic Term</p>
          <p class="mt-2 text-lg font-black text-white">{{ activeTermLabel }}</p>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="stat in stats" 
        :key="stat.name"
        @click="router.push(stat.route)"
        class="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 sm:p-7 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:border-royal-purple/40 shadow-[0_25px_45px_rgba(0,0,0,0.30)]"
        role="button"
        :aria-label="`View details for ${stat.name}: ${stat.value}`"
        tabindex="0"
        @keydown.enter="router.push(stat.route)"
        @keydown.space.prevent="router.push(stat.route)"
      >
        <div :class="[stat.bg]" class="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40" aria-hidden="true"></div>
        <div class="relative z-10 flex items-start justify-between gap-4">
          <div :class="[stat.color]" class="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/80 border border-slate-700/70 shadow-inner">
            <component :is="stat.icon" class="w-6 h-6" aria-hidden="true" />
          </div>
          <div class="rounded-full bg-slate-900/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 border border-slate-700/70">
            Live
          </div>
        </div>

        <div class="relative z-10 mt-6">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{{ stat.name }}</p>
          <h3 class="mt-3 text-3xl font-black text-white tracking-tight">{{ stat.value }}</h3>
          <p class="mt-4 text-sm text-slate-400">Quick access to {{ stat.name.toLowerCase() }} insights.</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity and Charts Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
      <!-- Recent Activity -->
      <div class="md:col-span-2 lg:col-span-2 space-y-8">
        <div class="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.28)]">
          <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-royal-purple/20 blur-3xl" aria-hidden="true"></div>
          <div class="absolute left-0 bottom-0 h-36 w-36 rounded-full bg-royal-gold/10 blur-3xl" aria-hidden="true"></div>

          <div class="relative z-10 flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/80 text-royal-gold border border-slate-700/60">
                  <Bell class="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.35em] text-slate-500">System Pulse</p>
                  <h3 class="mt-2 text-2xl font-black text-white tracking-tight">Operational feed</h3>
                </div>
              </div>
              <button @click="fetchActivityLogs" class="inline-flex items-center justify-center rounded-2xl border border-royal-gold/20 bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold transition hover:bg-royal-gold/10">Refresh</button>
            </div>

            <div class="space-y-4">
              <template v-if="recentActivity.length">
                <div v-for="item in recentActivity" :key="item.id" class="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:border-royal-purple/40">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 bg-slate-800/70 px-2 py-1 rounded-full">{{ item.type }}</span>
                    <span class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{{ item.time }}</span>
                  </div>
                  <p class="mt-3 text-sm font-black leading-snug text-slate-100">{{ item.text }}</p>
                </div>
              </template>
              <template v-else>
                <div class="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-8 text-center">
                  <p class="text-sm font-black text-slate-300">No recent admin activity found.</p>
                  <p class="mt-3 text-xs text-slate-500">New activity will appear here once teachers add scores, remarks, or publish results.</p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          <div class="rounded-[2rem] border border-royal-purple/20 bg-gradient-to-br from-royal-purple via-slate-950 to-slate-900 p-8 text-white shadow-[0_30px_50px_rgba(88,48,163,0.25)] relative overflow-hidden">
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-royal-gold via-royal-purple to-royal-gold"></div>
            <h4 class="text-xl font-black uppercase tracking-[0.3em] mb-4">Release Results</h4>
            <p class="text-sm text-slate-200 leading-7 mb-8">Publish term performance with secure permissions and fast parent access.</p>
            <router-link to="/admin/broadsheet" class="inline-flex items-center gap-3 rounded-full bg-slate-900/70 px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 hover:scale-[1.02]">Go to Portal <ArrowUpRight class="w-4 h-4" aria-hidden="true" /></router-link>
          </div>

          <div class="rounded-[2rem] border border-royal-gold/20 bg-slate-950/85 p-8 text-white shadow-[0_30px_50px_rgba(212,175,55,0.18)] relative overflow-hidden">
            <div class="absolute inset-y-0 right-0 w-24 bg-royal-gold/5 blur-3xl" aria-hidden="true"></div>
            <h4 class="text-xl font-black uppercase tracking-[0.3em] mb-4">Staffing Engine</h4>
            <p class="text-sm text-slate-300 leading-7 mb-8">Streamline teacher assignments and keep the roster aligned with school needs.</p>
            <router-link to="/admin/teachers" class="inline-flex items-center gap-3 rounded-full bg-royal-gold px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-950 transition hover:scale-[1.02]">Directory <Users class="w-4 h-4" aria-hidden="true" /></router-link>
          </div>
        </div>
      </div>

      <!-- Quick Actions / Status -->
      <div class="space-y-6">
        <div class="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-8 shadow-[0_30px_50px_rgba(0,0,0,0.22)]">
          <div class="flex items-center gap-3 mb-8">
            <span class="h-3 w-3 rounded-full bg-royal-gold animate-pulse" aria-hidden="true"></span>
            <h3 class="text-xl font-black text-white uppercase tracking-[0.3em]">System Health</h3>
          </div>
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>Compute Load</span>
                <span class="text-emerald-400">Nominal</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                <div class="h-full bg-royal-gold transition-all duration-1000" style="width: 12%"></div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>SMTP Uplink</span>
                <span class="text-emerald-400">Synchronized</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                <div class="h-full bg-emerald-500 transition-all duration-1000" style="width: 100%"></div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>Storage Pool</span>
                <span class="text-amber-300">84% Capacity</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                <div class="h-full bg-amber-500 transition-all duration-1000" style="width: 84%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-[2rem] border border-royal-gold/20 bg-slate-950/90 p-8 text-center shadow-[0_30px_50px_rgba(212,175,55,0.16)]">
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Term Countdown</p>
          <p class="text-base font-black text-white">Vacation begins in <span class="text-royal-gold text-2xl">24 days</span></p>
        </div>

        <button class="w-full rounded-[2rem] border border-royal-purple/20 bg-royal-purple/95 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white transition hover:bg-royal-purple/80">System Configuration</button>
      </div>
    </div>
  </div>
</template>
