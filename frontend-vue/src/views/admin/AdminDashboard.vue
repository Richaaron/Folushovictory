<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  ArrowUpRight,
  Calendar,
  Bell,
  BarChart3
} from 'lucide-vue-next'
import api from '../../services/api'
const router = useRouter()

const loading = ref(true)
const dashboardData = ref<any>(null)

const stats = ref([
  { name: 'Total Students', key: 'studentsCount', value: '0', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '...', route: '/admin/students' },
  { name: 'Active Teachers', key: 'teachersCount', value: '0', icon: Users, color: 'text-royal-purple', bg: 'bg-purple-50 dark:bg-purple-900/20', trend: '...', route: '/admin/teachers' },
  { name: 'Active Classes', key: 'classesCount', value: '0', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: '...', route: '/admin/classes' },
  { name: 'Avg. Performance', key: 'avgPerformance', value: '0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '...', route: '/admin/broadsheet' },
])

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

onMounted(fetchDashboard)

const recentActivity = [
  { id: 1, type: 'assignment', text: 'Mr. Smith assigned Mathematics to JSS 3A', time: '2 mins ago' },
  { id: 2, type: 'result', text: 'Broadsheet for JSS 1 published by Principal', time: '1 hour ago' },
  { id: 3, type: 'student', text: 'New student enrollment: Oluwaseun Adeleke', time: '3 hours ago' },
]
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin <span class="text-royal-purple">Dashboard</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Institutional Overview & Control</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
          <Calendar class="w-4 h-4 text-royal-purple" />
          <span class="text-xs font-black text-slate-600 dark:text-slate-300">Term: 2026/2027 SECOND TERM</span>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div 
        v-for="stat in stats" 
        :key="stat.name"
        @click="router.push(stat.route)"
        class="academic-card rounded-3xl p-6 border border-slate-100 dark:border-slate-800 cursor-pointer hover:scale-[1.02] transition-all group"
      >
        <div class="flex items-start justify-between">
          <div :class="[stat.bg, stat.color]" class="p-3 rounded-2xl group-hover:scale-110 transition-transform">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
          <div class="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
            <ArrowUpRight class="w-3 h-3" /> {{ stat.trend }}
          </div>
        </div>
        <div class="mt-4">
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest">{{ stat.name }}</p>
          <h3 class="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{{ stat.value }}</h3>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Activity -->
      <div class="lg:col-span-2 space-y-6">
        <div class="academic-card rounded-[2.5rem] p-8">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Bell class="w-5 h-5 text-royal-purple" /> Recent Updates
            </h3>
            <button class="text-[10px] font-black uppercase tracking-widest text-royal-purple hover:underline">View All History</button>
          </div>
          
          <div class="space-y-6">
            <div v-for="item in recentActivity" :key="item.id" class="flex gap-4 group">
              <div class="w-1 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-royal-purple transition-colors"></div>
              <div class="flex-grow pb-6 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ item.text }}</p>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 block">{{ item.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="purple-gradient rounded-[2rem] p-8 text-white relative overflow-hidden group">
            <div class="relative z-10">
              <h4 class="text-lg font-black uppercase tracking-widest mb-2">Publish Results</h4>
              <p class="text-sm font-medium text-purple-100 mb-6">Review and release term broadsheets to parents.</p>
              <router-link to="/admin/broadsheet" class="inline-block bg-white text-royal-purple px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition hover:scale-105 active:scale-95">Go to Broadsheet</router-link>
            </div>
            <BarChart3 class="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
          
          <div class="gold-gradient rounded-[2rem] p-8 text-slate-900 relative overflow-hidden group">
            <div class="relative z-10">
              <h4 class="text-lg font-black uppercase tracking-widest mb-2">Manage Staff</h4>
              <p class="text-sm font-bold text-amber-900/70 mb-6">Create teacher accounts and assign classes.</p>
              <router-link to="/admin/teachers" class="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition hover:scale-105 active:scale-95">Go to Staff</router-link>
            </div>
            <Users class="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      <!-- Quick Actions / Status -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-6">System Health</h3>
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-black uppercase tracking-widest text-slate-400">Database Load</span>
                <span class="text-xs font-black text-emerald-500 uppercase">Optimal</span>
              </div>
              <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 w-[12%]"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-black uppercase tracking-widest text-slate-400">Email Service</span>
                <span class="text-xs font-black text-emerald-500 uppercase">Active</span>
              </div>
              <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 w-[100%]"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="academic-card rounded-[2rem] p-6 text-center border-dashed border-2 border-slate-200 dark:border-slate-700">
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Term ends in <span class="text-royal-purple font-black">24 days</span></p>
        </div>
      </div>
    </div>
  </div>
</template>
