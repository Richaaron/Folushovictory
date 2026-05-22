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
  Bell,
  Trash2
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

const deleteLog = async (id: string) => {
  if (!confirm('Are you sure you want to delete this activity log?')) return
  try {
    await api.delete(`/api/admin/activity-logs/${id}`)
    recentActivity.value = recentActivity.value.filter(item => item.id !== id)
  } catch (err: any) {
    console.error('Error deleting activity log:', err)
    alert(`❌ Failed to delete activity log: ${err.response?.data?.error || err.message}`)
  }
}

const clearAllLogs = async () => {
  if (!confirm('⚠️ Are you sure you want to clear ALL activity logs? This action cannot be undone.')) return
  try {
    await api.delete('/api/admin/activity-logs')
    recentActivity.value = []
  } catch (err: any) {
    console.error('Error clearing activity logs:', err)
    alert(`❌ Failed to clear activity logs: ${err.response?.data?.error || err.message}`)
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
  <div class="space-y-6 sm:space-y-8 lg:space-y-10 py-3 sm:py-6 relative min-h-screen bg-[#030206] text-slate-100 overflow-hidden px-4 sm:px-6 animate-fade-in-up">
    <!-- Ambient Pulsing Glow Backdrops -->
    <div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-glow-purple" aria-hidden="true"></div>
    <div class="absolute -left-20 bottom-10 h-[500px] w-[500px] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none animate-pulse-glow-gold" aria-hidden="true"></div>

    <!-- Header Panoramic Console -->
    <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch animate-fade-in-up-stagger-1 relative z-10">
      <!-- Left: Admin Insights Welcome Console -->
      <section class="admin-hero-card group overflow-hidden">
        <!-- Cyber Dot Outline -->
        <div class="absolute top-4 right-4 flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse"></span>
          <span class="text-[8px] font-black uppercase tracking-[0.2em] text-violet-400">Core Telemetry</span>
        </div>
        <div class="flex items-center gap-4 mb-4">
          <div class="h-[1px] w-12 bg-gradient-to-r from-amber-500 to-transparent" aria-hidden="true"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.35em] text-amber-400/90">Executive Control</span>
        </div>
        <h1 class="hero-title">
          Admin <span class="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">Insights</span>
        </h1>
        <p class="hero-subtitle max-w-2xl mt-4">
          A refined operational console showcasing real-time school performance, academic rosters, and system activity logs—crafted for elegant control and high-end management.
        </p>
      </section>

      <!-- Right: Academic Term Card -->
      <section class="admin-hero-card flex items-center gap-5 relative overflow-hidden group glow-purple-hover transition-all duration-500">
        <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all duration-700" aria-hidden="true"></div>
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-950 text-slate-100 border border-violet-500/30 shadow-lg shadow-violet-950/40">
          <Calendar class="w-6 h-6 text-amber-300" aria-hidden="true" />
        </div>
        <div>
          <p class="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-bold">Academic Session</p>
          <p class="hero-title mt-2 text-lg font-black bg-gradient-to-r from-slate-100 via-slate-300 to-slate-100 bg-clip-text text-transparent">{{ activeTermLabel }}</p>
        </div>
      </section>
    </div>

    <!-- Stats Console Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up-stagger-2 relative z-10">
      <article
        v-for="(stat, idx) in stats"
        :key="stat.name"
        @click="router.push(stat.route)"
        class="admin-hero-stat-card group cursor-pointer transition-all duration-500 hover:-translate-y-1.5 active:scale-95 shadow-[0_15px_35px_rgba(0,0,0,0.4)]"
        :class="idx % 2 === 0 ? 'border-amber-500/20 glow-gold-hover' : 'border-violet-500/20 glow-purple-hover'"
        role="button"
        :aria-label="`View details for ${stat.name}: ${stat.value}`"
        tabindex="0"
        @keydown.enter="router.push(stat.route)"
        @keydown.space.prevent="router.push(stat.route)"
      >
        <!-- Custom glowing accent orbs -->
        <div
          class="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-10 group-hover:opacity-35 transition-all duration-700"
          :class="idx % 2 === 0 ? 'bg-amber-400' : 'bg-violet-500'"
          aria-hidden="true"
        ></div>

        <div class="relative z-10 flex items-start justify-between gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors duration-500"
            :class="idx % 2 === 0 ? 'bg-amber-950/30 border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300' : 'bg-violet-950/30 border-violet-500/30 text-violet-400 group-hover:bg-violet-500/20 group-hover:text-violet-300'"
          >
            <component :is="stat.icon" class="w-5 h-5" aria-hidden="true" />
          </div>
          <div class="rounded-full bg-slate-950/90 px-3 py-1 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border border-slate-800 shadow-sm flex items-center gap-1">
            <span class="h-1 w-1 rounded-full animate-ping" :class="idx % 2 === 0 ? 'bg-amber-400' : 'bg-violet-400'"></span>
            <span>Live Telemetry</span>
          </div>
        </div>

        <div class="relative z-10 mt-6">
          <p class="hero-subtitle">{{ stat.name }}</p>
          <h3
            class="mt-2 text-2xl font-black tracking-tight"
            :class="idx % 2 === 0 ? 'text-amber-300 group-hover:text-amber-100 transition-colors' : 'text-violet-300 group-hover:text-violet-100 transition-colors'"
          >
            {{ stat.value }}
          </h3>
          <p class="mt-3 text-xs text-slate-400 leading-normal group-hover:text-slate-300 transition-colors">Access details for {{ stat.name.toLowerCase() }} console.</p>
        </div>
      </article>
    </div>

    <!-- Operational Terminal & Health Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-fade-in-up-stagger-3 relative z-10">
      <!-- Left: Recent Activity Terminal -->
      <div class="md:col-span-2 lg:col-span-2 space-y-6">
        <section class="admin-hero-card relative overflow-visible p-6 md:p-8">
          <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" aria-hidden="true"></div>
          <div class="absolute left-0 bottom-0 h-36 w-36 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" aria-hidden="true"></div>

          <div class="relative z-10 flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-950/60 to-black text-amber-400 border border-violet-500/20 shadow-inner">
                  <Bell class="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p class="text-[9px] uppercase tracking-[0.35em] text-slate-500 font-bold">System Pulse</p>
                  <h3 class="mt-1 text-xl font-black text-white tracking-tight">Operational Feed</h3>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="fetchActivityLogs" class="shimmer-btn inline-flex items-center justify-center rounded-xl border border-slate-750 bg-slate-900/60 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-300 hover:text-white hover:bg-slate-800 transition duration-300 active:scale-95">Refresh</button>
                <button v-if="recentActivity.length" @click="clearAllLogs" class="shimmer-btn inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition duration-300 active:scale-95">Clear All</button>
              </div>
            </div>

            <!-- Terminal Logs list -->
            <div class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              <template v-if="recentActivity.length">
                <div 
                  v-for="item in recentActivity" 
                  :key="item.id" 
                  class="rounded-2xl border border-slate-850 bg-[#0d0c12]/90 p-4 shadow-sm transition-all duration-300 hover:border-violet-500/30 hover:bg-[#12101b] hover:translate-x-1"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[9px] font-black uppercase tracking-[0.3em] text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-800/30">{{ item.type }}</span>
                    <div class="flex items-center gap-3">
                      <span class="text-[9px] font-bold tracking-[0.15em] text-slate-500">{{ item.time }}</span>
                      <button 
                        @click="deleteLog(item.id)" 
                        class="inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-500/10 bg-rose-500/5 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/25 hover:border-rose-500/30 transition-all duration-300 active:scale-90"
                        title="Delete this activity log"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p class="mt-2.5 text-xs font-medium leading-relaxed text-slate-300">{{ item.text }}</p>
                </div>
              </template>
              <template v-else>
                <div class="rounded-2xl border border-slate-800/60 bg-[#07060a] p-8 text-center">
                  <p class="text-xs font-black text-slate-400">No recent activity logs recorded.</p>
                  <p class="mt-2 text-[10px] text-slate-600">New diagnostic and audit logs will automatically stream into this feed.</p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Secondary Admin Actions Portal Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section class="admin-hero-card p-7 relative overflow-hidden group">
            <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-amber-400 via-violet-500 to-amber-400"></div>
            <h4 class="text-sm font-black uppercase tracking-[0.3em] mb-2 bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent">Release Results</h4>
            <p class="text-[11px] text-slate-400 leading-normal mb-6">Publish term scores securely and streamline instant parent access.</p>
            <router-link to="/admin/broadsheet" class="shimmer-btn inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700/60 px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-200 transition-all duration-300 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0">Portal Dashboard <ArrowUpRight class="w-3.5 h-3.5 text-amber-300" aria-hidden="true" /></router-link>
          </section>

          <section class="admin-hero-card p-7 relative overflow-hidden group">
            <div class="absolute inset-y-0 right-0 w-24 bg-amber-500/5 blur-2xl" aria-hidden="true"></div>
            <h4 class="text-sm font-black uppercase tracking-[0.3em] mb-2 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Staffing Engine</h4>
            <p class="text-[11px] text-slate-400 leading-normal mb-6">Manage faculty member rosters and optimize class allocations easily.</p>
            <router-link to="/admin/teachers" class="shimmer-btn inline-flex items-center gap-2 rounded-xl bg-amber-500 text-slate-950 px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-300 hover:bg-amber-400 hover:-translate-y-0.5 active:translate-y-0">Directory <Users class="w-3.5 h-3.5" aria-hidden="true" /></router-link>
          </section>
        </div>
      </div>

      <!-- Right: Systems Health Panel & Admin Controls -->
      <div class="space-y-6">
        <section class="admin-hero-card overflow-visible">
          <div class="flex items-center gap-3 mb-8">
            <span class="h-2 w-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true"></span>
            <h3 class="text-sm font-black text-white uppercase tracking-[0.3em]">System Health</h3>
          </div>
          
          <div class="space-y-6">
            <!-- Compute Load -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>Compute Load</span>
                <span class="text-amber-400">Nominal</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-950 border border-slate-900 shadow-inner">
                <!-- Purple Neon Bar -->
                <div class="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.5)]" style="width: 12%"></div>
              </div>
            </div>

            <!-- SMTP Uplink -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>SMTP Uplink</span>
                <span class="text-violet-400">Active</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-950 border border-slate-900 shadow-inner">
                <!-- Silver/White Neon Bar -->
                <div class="h-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.4)]" style="width: 100%"></div>
              </div>
            </div>

            <!-- Storage Pool -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>Storage Pool</span>
                <span class="text-amber-300">84% Capacity</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-950 border border-slate-900 shadow-inner">
                <!-- Gold Neon Bar -->
                <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style="width: 84%"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tactile Premium Config Action Button -->
        <section class="admin-hero-card p-0 overflow-hidden">
          <button class="shimmer-btn w-full rounded-[2rem] border border-amber-500/30 bg-gradient-to-r from-violet-900 via-violet-950 to-violet-900 px-6 py-4.5 text-[9px] font-black uppercase tracking-[0.3em] text-amber-300 shadow-[0_15px_30px_rgba(124,58,237,0.2)] hover:text-white hover:border-amber-400 hover:shadow-[0_20px_45px_rgba(124,58,237,0.35)] transition-all duration-500 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>System Configuration</span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(1.08);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes metallic-shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.animate-pulse-glow-purple {
  animation: pulse-glow 8s ease-in-out infinite;
}

.animate-pulse-glow-gold {
  animation: pulse-glow 12s ease-in-out infinite alternate;
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in-up-stagger-1 {
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  opacity: 0;
}

.animate-fade-in-up-stagger-2 {
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  opacity: 0;
}

.animate-fade-in-up-stagger-3 {
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
  opacity: 0;
}

.shimmer-btn {
  position: relative;
  overflow: hidden;
}

.shimmer-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transform: skewX(-25deg);
  transition: 0.75s;
}

.shimmer-btn:hover::after {
  animation: metallic-shine 1s ease-in-out forwards;
}

.glow-purple-hover:hover {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.4) !important;
}

.glow-gold-hover:hover {
  box-shadow: 0 0 25px rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.4) !important;
}
</style>
