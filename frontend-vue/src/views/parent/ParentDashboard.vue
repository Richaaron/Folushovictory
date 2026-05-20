<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  GraduationCap, 
  BarChart3, 
  BookOpen, 
  Download, 
  ArrowUpRight,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-vue-next'
import api from '../../services/api'

const student = ref<any>(null)
const recentScores = ref<any[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const { data: studentData } = await api.get('/api/parent/student')
    student.value = studentData
    
    // Fetch latest report card if session/term are known
    // For now, we might need a way to get current session/term
  } catch (err) {
    console.error('Error fetching parent dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
    <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
  </div>
  <div v-else-if="student" class="space-y-8 fade-in">
    <!-- Student Header Card -->
    <div class="glass-card relative overflow-hidden p-8 sm:p-12 border-royal-gold/15 bg-slate-950/95 shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
      <div class="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(212,175,55,0.14),_transparent_30%)]"></div>
      <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div class="h-32 w-32 rounded-full bg-slate-900/90 border border-royal-gold/20 shadow-xl flex items-center justify-center p-1">
          <div class="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-royal-gold font-black text-4xl">
            {{ student.firstName.charAt(0) }}
          </div>
        </div>
        <div class="text-center md:text-left flex-grow">
          <div class="px-4 py-1 bg-slate-900/70 rounded-full inline-block text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-300 border border-slate-700">
            {{ student.studentId }}
          </div>
          <h1 class="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-white">
            {{ student.firstName }} <span class="text-royal-gold">{{ student.lastName }}</span>
          </h1>
          <p class="text-lg font-medium text-slate-400 flex items-center justify-center md:justify-start gap-2 uppercase tracking-widest text-sm">
            <GraduationCap class="w-5 h-5 text-royal-gold" /> Current Class: {{ student.classId }}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div class="bg-slate-900/80 rounded-3xl p-6 text-center border border-slate-800">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Average</p>
            <p class="text-2xl font-black text-white">--</p>
          </div>
          <div class="bg-slate-900/80 rounded-3xl p-6 text-center border border-slate-800">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Position</p>
            <p class="text-2xl font-black text-royal-gold">--</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Result Center -->
      <div class="lg:col-span-2 space-y-8">
        <div class="glass-card p-8">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <FileText class="w-5 h-5 text-gold-soft" /> Report Card Center
            </h3>
            <div class="flex gap-2">
              <select class="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none">
                <option>2026/2027 SECOND TERM</option>
              </select>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 text-center">
            <div class="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6">
              <TrendingUp class="w-10 h-10" />
            </div>
            <h4 class="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">Result is Available</h4>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">The second term academic performance report has been verified and released.</p>
            <button 
              @click="$router.push({ 
                name: 'student-report', 
                params: { studentId: student.studentId },
                query: { session: '2026/2027', term: '2nd' }
              })"
              class="purple-gradient text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-200 dark:shadow-purple-900/30 flex items-center justify-center gap-3 mx-auto transition hover:scale-105 active:scale-95"
            >
              <Download class="w-4 h-4" /> View Full Report Card
            </button>
          </div>
        </div>

        <div class="glass-card p-8">
          <h3 class="text-lg font-black text-slate-100 tracking-tight mb-6">Continuous Assessment</h3>
          <div class="space-y-4">
            <div v-for="score in recentScores" :key="score.subject" class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-royal-purple">
                  <BookOpen class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-sm font-black text-slate-800 dark:text-slate-200">{{ score.subject }}</p>
                  <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Current Term</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase">CA 1</p>
                  <p class="text-sm font-black text-slate-800 dark:text-slate-200">{{ score.ca1 }}</p>
                </div>
                <div class="text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase">CA 2</p>
                  <p class="text-sm font-black text-slate-800 dark:text-slate-200">{{ score.ca2 }}</p>
                </div>
                <div class="bg-royal-purple text-white px-3 py-2 rounded-xl text-center min-w-[50px]">
                  <p class="text-[8px] font-black opacity-70 uppercase">Sum</p>
                  <p class="text-sm font-black">{{ score.total }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- School Notices -->
      <div class="space-y-6">
        <div class="glass-card p-8 border-royal-gold/15 bg-slate-950/90">
          <h3 class="text-lg font-black text-white tracking-tight mb-6">School Notices</h3>
          <div class="space-y-6">
            <div class="relative pl-6 border-l-2 border-royal-gold">
              <p class="text-sm font-bold text-white">PTA Meeting</p>
              <p class="text-xs text-slate-400 mt-1">Saturday, May 24th @ 10:00 AM</p>
            </div>
            <div class="relative pl-6 border-l-2 border-royal-purple">
              <p class="text-sm font-bold text-white">Inter-house Sports</p>
              <p class="text-xs text-slate-400 mt-1">Friday, June 2nd</p>
            </div>
          </div>
        </div>
        
        <div class="glass-card p-8 border-royal-gold/15 bg-slate-950/90">
          <div class="flex items-center gap-4 mb-4">
            <BarChart3 class="w-8 h-8 text-royal-purple" />
            <h4 class="text-lg font-black uppercase tracking-widest text-white">Growth View</h4>
          </div>
          <p class="text-sm font-bold text-slate-400 mb-6">Analyze academic progress across terms and sessions.</p>
          <button class="bg-royal-purple text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-royal-purple/90 transition">
            View Analytics <ArrowUpRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
