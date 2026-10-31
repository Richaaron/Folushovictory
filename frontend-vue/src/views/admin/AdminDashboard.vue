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

const loading = ref(true)
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
    color: 'text-[#1E3A8A]',
    bg: 'bg-[#EFF6FF]',
    border: 'border-l-4 border-l-[#1E3A8A]'
  },
  { 
    name: 'Active Faculty', 
    key: 'teachersCount', 
    value: '0', 
    icon: Users, 
    route: '/admin/teachers',
    color: 'text-[#059669]',
    bg: 'bg-[#ECFDF5]',
    border: 'border-l-4 border-l-[#059669]'
  },
  { 
    name: 'Classes', 
    key: 'classesCount', 
    value: '0', 
    icon: BookOpen, 
    route: '/admin/classes',
    color: 'text-[#D97706]',
    bg: 'bg-[#FFFBEB]',
    border: 'border-l-4 border-l-[#D97706]'
  },
  { 
    name: 'Avg. Score', 
    key: 'avgPerformance', 
    value: '0%', 
    icon: TrendingUp, 
    route: '/admin/broadsheet',
    color: 'text-[#9333EA]',
    bg: 'bg-[#FAF5FF]',
    border: 'border-l-4 border-l-[#9333EA]'
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
  <div class="space-y-6 text-[#1E293B]">
    
    <!-- Welcome Header Card -->
    <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs font-bold">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Folusho Victory Administrative Center</span>
        </div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight">
          Institutional Dashboard
        </h1>
        <p class="text-xs sm:text-sm text-[#475569]">
          Real-time oversight of student enrollment, faculty rosters, broadsheets, and examination reports.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] shrink-0">
        <div class="h-9 w-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#D97706] shadow-sm">
          <Calendar class="w-4 h-4" />
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Current Session</span>
          <span class="text-xs sm:text-sm font-black text-[#0F172A] block">{{ activeTermLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Stat Cards Grid (2 cols on phone, 4 on desktop) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div
        v-for="stat in stats"
        :key="stat.name"
        @click="router.push(stat.route)"
        class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between active:bg-[#F8FAFC]"
        :class="stat.border"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#475569]">
            {{ stat.name }}
          </span>
          <div class="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center" :class="[stat.bg, stat.color]">
            <component :is="stat.icon" class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            {{ stat.value }}
          </span>
          <div class="flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A] mt-1.5">
            <span>View section</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Section: Activity & Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      
      <!-- Activity Feed (8 cols on desktop) -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm flex flex-col">
        <div class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E2E8F0]">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center">
              <Bell class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-[#0F172A]">System Operational Feed</h2>
              <p class="text-[11px] text-[#475569]">Recent teacher and administrative activities</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button 
              @click="fetchActivityLogs" 
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-[#334155] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] transition-colors flex items-center gap-1"
            >
              <Activity class="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span class="hidden sm:inline">Refresh</span>
            </button>
            <button 
              v-if="recentActivity.length" 
              @click="clearAllLogs" 
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#991B1B] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
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
              class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
            >
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#1E3A8A]">
                    {{ item.type }}
                  </span>
                  <span class="text-[11px] font-bold text-[#64748B]">{{ item.time }}</span>
                </div>
                <p class="font-bold text-[#0F172A] truncate">{{ item.text }}</p>
              </div>

              <button
                @click="deleteLog(item.id)"
                class="p-1.5 rounded-lg text-[#64748B] hover:text-[#991B1B] transition-colors shrink-0"
                title="Dismiss"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
          <template v-else>
            <div class="py-10 text-center text-[#64748B]">
              <p class="text-xs sm:text-sm font-bold text-[#0F172A]">No recent activity recorded.</p>
              <p class="text-xs mt-1">Actions performed by staff or administrators will appear here.</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Quick Operations Sidebar (4 cols on desktop) -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Result Broadsheet Card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
              <FileCheck2 class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A]">Terminal Broadsheet</h3>
              <p class="text-[11px] text-[#475569]">Master results & grade publish</p>
            </div>
          </div>
          <p class="text-xs text-[#334155] leading-relaxed">
            Review submitted scores across all Pre-Nursery, Primary, and Secondary classes, and release reports to parents.
          </p>
          <router-link
            to="/admin/broadsheet"
            class="w-full py-2.5 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <span class="text-white">Open Master Broadsheet</span>
            <ArrowUpRight class="w-3.5 h-3.5 text-white" />
          </router-link>
        </div>

        <!-- Faculty Management Card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#0F172A]">Faculty & Allocations</h3>
              <p class="text-[11px] text-[#475569]">Teacher codes & classes</p>
            </div>
          </div>
          <p class="text-xs text-[#334155] leading-relaxed">
            Assign form teachers, update subject allocations, and invite new educators with registration codes.
          </p>
          <router-link
            to="/admin/teachers"
            class="w-full py-2.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Manage Faculty</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

      </div>

    </div>

  </div>
</template>
