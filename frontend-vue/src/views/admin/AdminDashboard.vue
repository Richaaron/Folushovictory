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
  <div class="space-y-10 fade-in py-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="h-1 w-12 bg-nebula-500 rounded-full"></div>
          <span class="text-[10px] font-black uppercase tracking-[0.3em] text-nebula-500">Executive Control</span>
        </div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          Admin <span class="text-transparent bg-clip-text nebula-gradient">Insights</span>
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <div class="glass-card px-5 py-3 rounded-2xl flex items-center gap-4 group hover:border-nebula-500/30 transition-all">
          <div class="p-2 bg-nebula-50 dark:bg-nebula-900/30 rounded-xl text-nebula-500 group-hover:rotate-12 transition-transform">
            <Calendar class="w-5 h-5" />
          </div>
          <div class="flex flex-col">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Academic Term</span>
            <span class="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">2026/2027 SECOND TERM</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div 
        v-for="stat in stats" 
        :key="stat.name"
        @click="router.push(stat.route)"
        class="academic-card p-8 cursor-pointer group hover:scale-[1.04] transition-all duration-500 relative overflow-hidden"
      >
        <!-- Background Accent -->
        <div :class="[stat.bg]" class="absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
        
        <div class="flex items-start justify-between relative z-10">
          <div :class="[stat.bg, stat.color]" class="p-4 rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-lg">
            <component :is="stat.icon" class="w-7 h-7" />
          </div>
          <div class="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <ArrowUpRight class="w-3.5 h-3.5" /> {{ stat.trend }}
          </div>
        </div>
        <div class="mt-8 relative z-10">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ stat.name }}</p>
          <div class="flex items-baseline gap-2 mt-1">
            <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{{ stat.value }}</h3>
            <div class="h-1.5 w-1.5 rounded-full bg-nebula-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <!-- Recent Activity -->
      <div class="lg:col-span-2 space-y-8">
        <div class="academic-card p-10 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Bell class="w-48 h-48" />
          </div>
          
          <div class="flex items-center justify-between mb-10 relative z-10">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-nebula-500/10 rounded-2xl text-nebula-500 border border-nebula-500/20">
                <Bell class="w-6 h-6" />
              </div>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Pulse</h3>
            </div>
            <button class="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-nebula-500 hover:text-white transition-all">Audit Log</button>
          </div>
          
          <div class="space-y-8 relative z-10">
            <div v-for="item in recentActivity" :key="item.id" class="flex gap-6 group">
              <div class="relative">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:border-nebula-500/30 transition-all">
                  <TrendingUp class="w-5 h-5 text-slate-400 group-hover:text-nebula-500 transition-colors" />
                </div>
                <div class="absolute top-12 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-100 dark:bg-slate-800 group-last:hidden"></div>
              </div>
              <div class="flex-grow pt-1">
                <p class="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{{ item.text }}</p>
                <div class="flex items-center gap-3 mt-3">
                  <span class="text-[10px] font-black uppercase tracking-widest text-nebula-500 bg-nebula-500/5 px-2 py-1 rounded-md">{{ item.type }}</span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ item.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div class="nebula-gradient rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-nebula-500/20">
            <div class="relative z-10">
              <div class="h-1 w-12 bg-white/30 rounded-full mb-6"></div>
              <h4 class="text-2xl font-black uppercase tracking-tight mb-3">Release<br/>Results</h4>
              <p class="text-sm font-medium text-white/80 mb-8 max-w-[200px]">Securely publish term performance to parents.</p>
              <router-link to="/admin/broadsheet" class="inline-flex items-center gap-3 bg-white text-nebula-600 px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl transition hover:scale-105 active:scale-95 group/btn">
                <span>Go to Portal</span>
                <ArrowUpRight class="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </router-link>
            </div>
            <BarChart3 class="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
          </div>
          
          <div class="bg-slate-900 dark:bg-slate-800 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div class="relative z-10">
              <div class="h-1 w-12 bg-nebula-500 rounded-full mb-6"></div>
              <h4 class="text-2xl font-black uppercase tracking-tight mb-3 text-white">Staffing<br/>Engine</h4>
              <p class="text-sm font-medium text-slate-400 mb-8 max-w-[200px]">Automate teacher onboarding and assignments.</p>
              <router-link to="/admin/teachers" class="inline-flex items-center gap-3 bg-nebula-500 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl transition hover:scale-105 active:scale-95 group/btn">
                <span>Directory</span>
                <Users class="w-4 h-4" />
              </router-link>
            </div>
            <Users class="absolute -right-12 -bottom-12 w-64 h-64 opacity-[0.03] group-hover:-rotate-12 transition-transform duration-1000 text-nebula-500" />
          </div>
        </div>
      </div>

      <!-- Quick Actions / Status -->
      <div class="space-y-8">
        <div class="academic-card p-10">
          <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-10 flex items-center gap-3">
            <div class="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
            System Health
          </h3>
          <div class="space-y-10">
            <div class="group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-nebula-500 transition-colors">Compute Load</span>
                <span class="text-[10px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded-md">Nominal</span>
              </div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1 border border-slate-200/20">
                <div class="h-full bg-nebula-500 rounded-full transition-all duration-1000" style="width: 12%"></div>
              </div>
            </div>
            <div class="group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-nebula-500 transition-colors">SMTP Uplink</span>
                <span class="text-[10px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded-md">Synchronized</span>
              </div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1 border border-slate-200/20">
                <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" style="width: 100%"></div>
              </div>
            </div>
            <div class="group">
              <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-nebula-500 transition-colors">Storage Pool</span>
                <span class="text-[10px] font-black text-amber-500 uppercase px-2 py-1 bg-amber-500/10 rounded-md">84% Capacity</span>
              </div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1 border border-slate-200/20">
                <div class="h-full bg-amber-500 rounded-full transition-all duration-1000" style="width: 84%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="glass-card rounded-[2.5rem] p-8 text-center border-dashed border-2 border-nebula-500/20 bg-nebula-500/[0.02]">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Term Countdown</p>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Vacation begins in <span class="text-transparent bg-clip-text nebula-gradient font-black text-xl">24 days</span></p>
        </div>

        <button class="w-full glass-card p-6 rounded-[2.5rem] flex items-center justify-center gap-4 hover:bg-slate-900 dark:hover:bg-white group transition-all">
          <Settings class="w-5 h-5 text-nebula-500 group-hover:rotate-90 transition-transform duration-500" />
          <span class="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-900">System Configuration</span>
        </button>
      </div>
    </div>
  </div>
</template>
