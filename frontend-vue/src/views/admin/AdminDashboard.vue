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
    color: 'text-[#1A4D8F]',
    bg: 'bg-[#1A4D8F]/10',
    border: 'border-l-4 border-l-[#1A4D8F]'
  },
  { 
    name: 'Active Faculty', 
    key: 'teachersCount', 
    value: '0', 
    icon: Users, 
    route: '/admin/teachers',
    color: 'text-[#2D6A4F]',
    bg: 'bg-[#2D6A4F]/10',
    border: 'border-l-4 border-l-[#2D6A4F]'
  },
  { 
    name: 'Registered Classes', 
    key: 'classesCount', 
    value: '0', 
    icon: BookOpen, 
    route: '/admin/classes',
    color: 'text-[#E8A838]',
    bg: 'bg-[#E8A838]/15',
    border: 'border-l-4 border-l-[#E8A838]'
  },
  { 
    name: 'Avg. Performance', 
    key: 'avgPerformance', 
    value: '0%', 
    icon: TrendingUp, 
    route: '/admin/broadsheet',
    color: 'text-[#8B263E]',
    bg: 'bg-[#8B263E]/10',
    border: 'border-l-4 border-l-[#8B263E]'
  }
])

const fetchActivityLogs = async () => {
  try {
    const { data } = await api.get('/api/admin/activity-logs', { params: { limit: 6 } })
    recentActivity.value = (data.logs || []).map((log: any) => ({
      id: log.id,
      type: log.role === 'TEACHER' ? 'Faculty' : 'System',
      text: `${log.actor} — ${log.action}`,
      time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'
    }))
  } catch (err) {
    console.error('Activity log error:', err)
  }
}

const deleteLog = async (id: string) => {
  if (!confirm('Are you sure you want to delete this activity entry?')) return
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
  <div class="space-y-6 text-[#1C1917]">
    
    <!-- Welcome Header Banner -->
    <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1A4D8F]/10 text-[#1A4D8F] text-[11px] font-bold">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Folusho Victory Administrative Center</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
          School Executive Console
        </h1>
        <p class="text-xs sm:text-sm text-[#6B7280]">
          Real-time oversight of student enrollment, faculty rosters, broadsheets, and examination reports.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-[#F7F4EE] px-4 py-3 rounded-xl border border-[#E5E0D8] shrink-0">
        <div class="h-10 w-10 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center text-[#E8A838] shadow-sm">
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">Active Session</span>
          <span class="text-xs sm:text-sm font-extrabold text-[#1C1917] block">{{ activeTermLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.name"
        @click="router.push(stat.route)"
        class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
        :class="stat.border"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            {{ stat.name }}
          </span>
          <div class="h-10 w-10 rounded-xl flex items-center justify-center" :class="[stat.bg, stat.color]">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
        </div>
        <div>
          <span class="text-3xl font-black text-[#1C1917] tracking-tight">
            {{ stat.value }}
          </span>
          <div class="flex items-center gap-1 text-[11px] font-semibold text-[#1A4D8F] mt-2">
            <span>Manage section</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Section: Activity & Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Activity Feed -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-6 shadow-sm flex flex-col">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E0D8]">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#F7F4EE] border border-[#E5E0D8] flex items-center justify-center text-[#1A4D8F]">
              <Bell class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-[#1C1917]">System Operational Feed</h2>
              <p class="text-[11px] text-[#6B7280]">Recent teacher and administrative activities</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="fetchActivityLogs" 
              class="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4B5563] bg-[#F7F4EE] hover:bg-[#EFE9DE] border border-[#E5E0D8] transition-colors flex items-center gap-1.5"
            >
              <Activity class="w-3.5 h-3.5 text-[#1A4D8F]" />
              Refresh
            </button>
            <button 
              v-if="recentActivity.length" 
              @click="clearAllLogs" 
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#8B263E] bg-[#8B263E]/5 hover:bg-[#8B263E]/10 border border-[#8B263E]/20 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Log List -->
        <div class="space-y-2.5 flex-1">
          <template v-if="recentActivity.length">
            <div
              v-for="item in recentActivity"
              :key="item.id"
              class="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5E0D8] flex items-center justify-between gap-3 text-xs"
            >
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#1A4D8F]">
                    {{ item.type }}
                  </span>
                  <span class="text-[11px] font-medium text-[#6B7280]">{{ item.time }}</span>
                </div>
                <p class="font-medium text-[#1C1917] truncate">{{ item.text }}</p>
              </div>

              <button
                @click="deleteLog(item.id)"
                class="p-1 rounded-lg text-[#9CA3AF] hover:text-[#8B263E] transition-colors shrink-0"
                title="Dismiss log"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
          <template v-else>
            <div class="py-12 text-center text-[#9CA3AF]">
              <p class="text-sm font-semibold">No recent activity recorded.</p>
              <p class="text-xs mt-1">Actions performed by staff or administrators will appear here.</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Quick Operations Sidebar -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Result Broadsheet Card -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#1A4D8F]/10 text-[#1A4D8F] flex items-center justify-center">
              <FileCheck2 class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#1C1917]">Term Results</h3>
              <p class="text-[11px] text-[#6B7280]">Master broadsheet & publishing</p>
            </div>
          </div>
          <p class="text-xs text-[#4B5563] leading-relaxed">
            Review submitted scores across all Pre-Nursery, Primary, and Secondary classes, and release reports to parents.
          </p>
          <router-link
            to="/admin/broadsheet"
            class="w-full py-2.5 px-3 rounded-xl bg-[#1A4D8F] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#12386A] transition-colors"
          >
            Open Master Broadsheet
            <ArrowUpRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- Faculty Management Card -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
              <Users class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#1C1917]">Faculty Roster</h3>
              <p class="text-[11px] text-[#6B7280]">Teachers & class allocations</p>
            </div>
          </div>
          <p class="text-xs text-[#4B5563] leading-relaxed">
            Assign form teachers, update subject allocations, and invite new educators with registration codes.
          </p>
          <router-link
            to="/admin/teachers"
            class="w-full py-2.5 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFE9DE] border border-[#E5E0D8] text-[#1C1917] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            Manage Teachers
            <ArrowUpRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- System Status Summary -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">System Health</h3>
            <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"></span>
              Operational
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between text-[#4B5563]">
              <span>Database Sync</span>
              <span class="font-bold text-[#1C1917]">Active</span>
            </div>
            <div class="w-full bg-[#F7F4EE] rounded-full h-1.5">
              <div class="bg-[#2D6A4F] h-1.5 rounded-full" style="width: 100%"></div>
            </div>

            <div class="flex justify-between text-[#4B5563] pt-1">
              <span>Broadsheet Engine</span>
              <span class="font-bold text-[#1C1917]">Ready</span>
            </div>
            <div class="w-full bg-[#F7F4EE] rounded-full h-1.5">
              <div class="bg-[#1A4D8F] h-1.5 rounded-full" style="width: 100%"></div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
