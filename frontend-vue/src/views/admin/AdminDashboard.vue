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
  Activity,
  FileCheck2,
  Sparkles
} from 'lucide-vue-next'
import api from '../../services/api'

const router = useRouter()

const dashboardData = ref<any>(null)
const recentActivity = ref<Array<{ id: string; type: string; text: string; time: string }>>([])

const activeTermLabel = computed(() => {
  const activeTerm = dashboardData.value?.activeTerm
  if (!activeTerm) return 'Current Academic Term'
  const session = String(activeTerm.session || '').trim()
  let term = String(activeTerm.term || '').trim().toUpperCase()
  if (term && !term.includes('TERM')) {
    term = `${term} TERM`
  }
  return `${session} • ${term}`.trim()
})

const stats = ref([
  { 
    name: 'Total Students', 
    key: 'studentsCount', 
    value: '0', 
    icon: GraduationCap, 
    route: '/admin/students',
    color: 'text-sky-700',
    bg: 'bg-sky-100',
    border: 'border-l-4 border-l-sky-600'
  },
  { 
    name: 'Active Faculty', 
    key: 'teachersCount', 
    value: '0', 
    icon: Users, 
    route: '/admin/teachers',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-l-4 border-l-emerald-600'
  },
  { 
    name: 'Classes', 
    key: 'classesCount', 
    value: '0', 
    icon: BookOpen, 
    route: '/admin/classes',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-l-4 border-l-amber-500'
  },
  { 
    name: 'Avg. Score', 
    key: 'avgPerformance', 
    value: '0%', 
    icon: TrendingUp, 
    route: '/admin/broadsheet',
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-l-4 border-l-sky-800'
  }
])

const fetchActivityLogs = async () => {
  try {
    const { data } = await api.get('/api/admin/activity-logs', { params: { limit: 6 } })
    recentActivity.value = (data.logs || []).map((log: any) => ({
      id: log.id,
      type: log.role === 'TEACHER' ? 'Teacher' : 'System',
      text: `${log.actor} — ${log.action}`,
      time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
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
    alert(`Failed to delete log: ${err.response?.data?.error || err.message}`)
  }
}

const clearAllLogs = async () => {
  if (!confirm('Clear all operational activity logs?')) return
  try {
    await api.delete('/api/admin/activity-logs')
    recentActivity.value = []
  } catch (err: any) {
    alert(`Failed to clear logs: ${err.response?.data?.error || err.message}`)
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
    if (data.performance?.schoolAverage) {
      stats.value[3].value = `${Math.round(data.performance.schoolAverage)}%`
    }
  } catch (err) {
    console.error('Dashboard load error:', err)
  }
}

onMounted(async () => {
  await Promise.all([fetchDashboard(), fetchActivityLogs()])
})
</script>

<template>
  <div class="space-y-6 text-[#0F172A]">
    
    <!-- Welcome Header Card -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shadow-xs">
          <Sparkles class="w-3.5 h-3.5 text-amber-700" />
          <span>Folusho Victory Administrative Center</span>
        </div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-[#0C4A6E] tracking-tight">
          Institutional Dashboard
        </h1>
        <p class="text-xs sm:text-sm font-bold text-slate-700">
          Real-time oversight of student enrollment, faculty rosters, broadsheets, and examination reports.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-sky-50 px-4 py-3 rounded-xl border border-[#BAE6FD] shrink-0 shadow-sm">
        <div class="h-10 w-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center text-amber-600 shadow-sm">
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-600 block">Current Session</span>
          <span class="text-xs sm:text-sm font-black text-[#0C4A6E] block">{{ activeTermLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Stat Cards Grid (2 cols on phone, 4 on desktop) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="stat in stats"
        :key="stat.name"
        @click="router.push(stat.route)"
        class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] hover:border-amber-400 p-4 sm:p-5 shadow-md cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between active:bg-sky-50"
        :class="stat.border"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700">
            {{ stat.name }}
          </span>
          <div class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-xs" :class="[stat.bg, stat.color]">
            <component :is="stat.icon" class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            {{ stat.value }}
          </span>
          <div class="flex items-center gap-1 text-[11px] font-black text-sky-700 mt-1.5">
            <span>View section</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Section: Activity & Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      
      <!-- Activity Feed (8 cols on desktop) -->
      <div class="lg:col-span-8 bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md flex flex-col">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#BAE6FD]">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
              <Bell class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-black text-[#0C4A6E]">System Operational Feed</h2>
              <p class="text-xs font-bold text-slate-600">Recent teacher and administrative activities</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="fetchActivityLogs" 
              class="px-3 py-1.5 rounded-lg text-xs font-black text-slate-800 bg-sky-50 hover:bg-sky-100 border border-[#BAE6FD] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Activity class="w-3.5 h-3.5 text-sky-700" />
              <span class="hidden sm:inline">Refresh</span>
            </button>
            <button 
              v-if="recentActivity.length" 
              @click="clearAllLogs" 
              class="px-3 py-1.5 rounded-lg text-xs font-black text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-xs"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Log List -->
        <div class="space-y-2 flex-1">
          <template v-if="recentActivity.length">
            <div
              v-for="item in recentActivity"
              :key="item.id"
              class="p-3.5 rounded-xl bg-sky-50/70 border border-[#BAE6FD] flex items-center justify-between gap-3 text-xs"
            >
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white border border-sky-300 text-sky-900 shadow-xs">
                    {{ item.type }}
                  </span>
                  <span class="text-xs font-bold text-slate-600">{{ item.time }}</span>
                </div>
                <p class="font-extrabold text-[#0F172A] truncate">{{ item.text }}</p>
              </div>

              <button
                @click="deleteLog(item.id)"
                class="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors shrink-0"
                title="Dismiss"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </template>
          <template v-else>
            <div class="py-12 text-center text-slate-600">
              <p class="text-sm font-black text-[#0F172A]">No recent activity recorded.</p>
              <p class="text-xs font-bold mt-1 text-slate-600">Actions performed by staff or administrators will appear here.</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Quick Operations Sidebar (4 cols on desktop) -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Result Broadsheet Card -->
        <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md space-y-3.5">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <FileCheck2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-black text-[#0C4A6E]">Terminal Broadsheet</h3>
              <p class="text-xs font-bold text-slate-600">Master results & grade publish</p>
            </div>
          </div>
          <p class="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
            Review submitted scores across all Pre-Nursery, Primary, and Secondary classes, and release reports to parents.
          </p>
          <router-link
            to="/admin/broadsheet"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <span class="text-white">Open Master Broadsheet</span>
            <ArrowUpRight class="w-4 h-4 text-white" />
          </router-link>
        </div>

        <!-- Faculty Management Card -->
        <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md space-y-3.5">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-black text-[#0C4A6E]">Faculty & Allocations</h3>
              <p class="text-xs font-bold text-slate-600">Teacher codes & classes</p>
            </div>
          </div>
          <p class="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
            Assign form teachers, update subject allocations, and invite new educators with registration codes.
          </p>
          <router-link
            to="/admin/teachers"
            class="w-full py-3 px-4 rounded-xl bg-white hover:bg-sky-50 border-2 border-[#BAE6FD] text-[#0C4A6E] text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <span>Manage Faculty</span>
            <ArrowUpRight class="w-4 h-4" />
          </router-link>
        </div>

      </div>

    </div>

  </div>
</template>
