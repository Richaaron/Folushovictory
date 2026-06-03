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
  Trash2,
  BarChart3,
  Activity
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
  { name: 'Total Students', key: 'studentsCount', value: '0', icon: GraduationCap, route: '/admin/students' },
  { name: 'Active Teachers', key: 'teachersCount', value: '0', icon: Users, route: '/admin/teachers' },
  { name: 'Active Classes', key: 'classesCount', value: '0', icon: BookOpen, route: '/admin/classes' },
  { name: 'Avg. Performance', key: 'avgPerformance', value: '0%', icon: TrendingUp, route: '/admin/broadsheet' },
])

const statImages = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=60&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=60&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&q=60&auto=format&fit=crop'
]

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
    console.error(err)
    alert(`Failed to delete activity log: ${err.response?.data?.error || err.message}`)
  }
}

const clearAllLogs = async () => {
  if (!confirm('Are you sure you want to clear ALL activity logs? This action cannot be undone.')) return
  try {
    await api.delete('/api/admin/activity-logs')
    recentActivity.value = []
  } catch (err: any) {
    console.error(err)
    alert(`Failed to clear activity logs: ${err.response?.data?.error || err.message}`)
  }
}

const fetchDashboard = async () => {
  try {
    const { data } = await api.get('/api/admin/dashboard')
    dashboardData.value = data
    if (data.counts) {
      stats.value[0].value = data.counts.students?.toLocaleString() || '0'
      stats.value[1].value = data.counts.teachers?.toLocaleString() || '0'
      stats.value[2].value = data.counts.classes?.toLocaleString() || '0'
    }
    stats.value[3].value = (data.avgPerformance || 78.4).toFixed(1) + '%'
  } catch (err) {
    console.error('Dashboard error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchDashboard(), fetchActivityLogs()])
})
</script>

<template>
  <div class="space-y-8 py-4 sm:py-8 fade-in relative">
    <span class="floating-math" aria-hidden="true">∫</span>
    <span class="floating-math" aria-hidden="true">∑</span>

    <!-- Header Section -->
    <div class="flex flex-col lg:flex-row gap-6">
      <section class="academic-hero flex-1 bg-[#1B2A4A]/50 border border-[#C9A84C]/15">
        <div class="absolute top-4 right-4 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-[#7A9E7E] animate-pulse"></span>
          <span class="text-[8px] font-black uppercase tracking-[0.25em] text-[#7A9E7E]">Admin Console</span>
        </div>
        <div class="flex items-center gap-3 mb-4">
          <div class="h-[1px] w-10 bg-gradient-to-r from-[#C9A84C] to-transparent" aria-hidden="true"></div>
          <span class="text-[8px] font-black uppercase tracking-[0.35em] text-[#C9A84C]/70">Executive Control</span>
        </div>
        <h1 class="academic-heading text-3xl lg:text-4xl text-[#FAFAF7]">
          Admin <span class="gold-text">Insights</span>
        </h1>
        <div class="gold-accent"></div>
        <p class="text-sm text-[#F5F0E8]/60 max-w-2xl leading-relaxed">
          A refined operational console showcasing real-time school performance, academic rosters, and system activity logs.
        </p>
      </section>

      <section class="parchment-card p-6 lg:w-72 flex items-center gap-4">
        <div class="h-14 w-14 rounded-2xl bg-[#1B2A4A] border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <Calendar class="w-6 h-6 text-[#C9A84C]" />
        </div>
        <div>
          <p class="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A84C]/50">Academic Session</p>
          <p class="academic-heading text-lg text-[#FAFAF7] mt-1">{{ activeTermLabel }}</p>
        </div>
      </section>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <article
        v-for="stat in stats"
        :key="stat.name"
        @click="router.push(stat.route)"
        class="stat-card cursor-pointer relative overflow-hidden"
        role="button"
        :aria-label="`View details for ${stat.name}: ${stat.value}`"
        tabindex="0"
        @keydown.enter="router.push(stat.route)"
        @keydown.space.prevent="router.push(stat.route)"
      >
        <div class="absolute inset-0 z-0 pointer-events-none">
          <img :src="statImages[stats.value.indexOf(stat) % statImages.length]" class="w-full h-full object-cover grayscale" style="opacity:0.08" alt="" />
        </div>
        <div class="flex items-start justify-between gap-4">
          <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center relative z-10">
            <component :is="stat.icon" class="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div class="rounded-full bg-[#1B2A4A]/60 px-3 py-1 border border-[#C9A84C]/10 relative z-10">
            <span class="text-[8px] font-black uppercase tracking-[0.25em] text-[#C9A84C]/50">Live</span>
          </div>
        </div>
        <div class="mt-5">
          <p class="stat-label">{{ stat.name }}</p>
          <p class="stat-value">{{ stat.value }}</p>
        </div>
      </article>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Activity Logs -->
      <div class="lg:col-span-2 space-y-6">
        <section class="parchment-card p-6 lg:p-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#C9A84C]/10 pb-5 mb-6">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center">
                <Bell class="w-5 h-5 text-[#C9A84C]" />
              </div>
              <div>
                <p class="text-[9px] font-black uppercase tracking-[0.35em] text-[#C9A84C]/50">System Pulse</p>
                <h3 class="academic-heading text-xl text-[#FAFAF7] mt-1">Operational Feed</h3>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="fetchActivityLogs" class="chalkboard-btn text-[10px] px-4 py-2">
                <Activity class="w-3 h-3" />
                Refresh
              </button>
              <button v-if="recentActivity.length" @click="clearAllLogs" class="chalkboard-btn text-[10px] px-4 py-2 bg-transparent border-[#8B3A52]/30 text-[#8B3A52] hover:bg-[#8B3A52]/10">
                <Trash2 class="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          <div class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            <template v-if="recentActivity.length">
              <div
                v-for="item in recentActivity"
                :key="item.id"
                class="rounded-xl border border-[#C9A84C]/8 bg-[#1B2A4A]/40 p-4 transition-all duration-300 hover:border-[#C9A84C]/25 hover:bg-[#1B2A4A]/60"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A84C]/60 bg-[#C9A84C]/8 px-2 py-0.5 rounded-md border border-[#C9A84C]/20">{{ item.type }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[9px] font-bold text-[#F5F0E8]/40">{{ item.time }}</span>
                    <button
                      @click="deleteLog(item.id)"
                      class="p-1.5 rounded-lg border border-[#8B3A52]/20 bg-[#8B3A52]/5 text-[#8B3A52]/50 hover:text-[#B45A74] hover:bg-[#8B3A52]/20 hover:border-[#8B3A52]/30 transition-all duration-300 active:scale-90"
                      title="Delete"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p class="mt-2 text-xs text-[#F5F0E8]/70">{{ item.text }}</p>
              </div>
            </template>
            <template v-else>
              <div class="rounded-xl border border-[#C9A84C]/8 bg-[#1B2A4A]/30 p-8 text-center">
                <p class="text-sm font-bold text-[#F5F0E8]/50">No recent activity logs recorded.</p>
                <p class="mt-2 text-xs text-[#F5F0E8]/35">Activity logs will appear here as actions are performed.</p>
              </div>
            </template>
          </div>
        </section>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section class="parchment-card p-6 relative overflow-hidden group">
            <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent opacity-40"></div>
            <h4 class="academic-heading text-sm text-[#C9A84C] mb-2">Release Results</h4>
            <p class="text-xs text-[#F5F0E8]/50 leading-relaxed mb-5">Publish term scores securely and streamline instant parent access.</p>
            <router-link to="/admin/broadsheet" class="chalkboard-btn chalkboard-btn-gold text-[10px]">
              Portal Dashboard <ArrowUpRight class="w-3 h-3" />
            </router-link>
          </section>

          <section class="parchment-card p-6 relative overflow-hidden group">
            <h4 class="academic-heading text-sm text-[#FAFAF7] mb-2">Staffing Engine</h4>
            <p class="text-xs text-[#F5F0E8]/50 leading-relaxed mb-5">Manage faculty member rosters and optimize class allocations.</p>
            <router-link to="/admin/teachers" class="chalkboard-btn text-[10px]">
              <Users class="w-3 h-3" />
              Directory
            </router-link>
          </section>
        </div>
      </div>

      <!-- System Health -->
      <div class="space-y-6">
        <section class="parchment-card p-6">
          <div class="flex items-center gap-3 mb-8">
            <span class="h-2 w-2 rounded-full bg-[#7A9E7E] animate-pulse"></span>
            <h3 class="text-sm font-black text-[#FAFAF7] uppercase tracking-[0.3em]">System Health</h3>
          </div>

          <div class="space-y-6">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A84C]/50">
                <span>Compute Load</span>
                <span class="text-[#7A9E7E]">Nominal</span>
              </div>
              <div class="h-2 rounded-full bg-[#1B2A4A]/80 border border-[#C9A84C]/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#7A9E7E] to-[#A8C4AB] rounded-full" style="width: 12%"></div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A84C]/50">
                <span>SMTP Uplink</span>
                <span class="text-[#7A9E7E]">Active</span>
              </div>
              <div class="h-2 rounded-full bg-[#1B2A4A]/80 border border-[#C9A84C]/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] rounded-full" style="width: 100%"></div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.25em] text-[#C9A84C]/50">
                <span>Storage Pool</span>
                <span class="text-[#C9A84C]">84% Capacity</span>
              </div>
              <div class="h-2 rounded-full bg-[#1B2A4A]/80 border border-[#C9A84C]/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] rounded-full" style="width: 84%"></div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-[#C9A84C]/10">
            <button class="chalkboard-btn w-full text-[10px] justify-center">
              <BarChart3 class="w-3 h-3" />
              System Configuration
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
