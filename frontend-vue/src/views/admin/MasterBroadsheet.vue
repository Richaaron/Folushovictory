<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { 
  BarChart3, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Filter,
  Loader2,
  ChevronRight,
  AlertCircle,
  Printer,
  TrendingUp
} from 'lucide-vue-next'
import api from '../../services/api'
import PerformanceCharts from '../../components/analytics/PerformanceCharts.vue'

const classes = ref<any[]>([])
const selectedClassId = ref('')
const selectedSession = ref('2026/2027')
const selectedTerm = ref('2nd')
const broadsheet = ref<any>(null)
const loading = ref(false)
const error = ref('')

const fetchClasses = async () => {
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = data.classes || []
    if (classes.value.length > 0) {
      selectedClassId.value = classes.value[0].id
    }
  } catch (err) {
    console.error('Error fetching classes:', err)
  }
}

const fetchBroadsheet = async () => {
  if (!selectedClassId.value) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/api/results/class/${selectedClassId.value}/broadsheet`, {
      params: { session: selectedSession.value, term: selectedTerm.value }
    })
    broadsheet.value = data
  } catch (err: any) {
    console.error('Error fetching broadsheet:', err)
    error.value = err.response?.data?.error || 'Failed to load broadsheet data.'
  } finally {
    loading.value = false
  }
}

const isSSS = computed(() => {
  if (!selectedClassId.value) return false
  const cls = classes.value.find(c => c.id === selectedClassId.value)
  return String(cls?.level || '').toUpperCase().includes('SSS')
})

const handlePrint = () => {
  window.print()
}

onMounted(async () => {
  await fetchClasses()
  if (selectedClassId.value) {
    await fetchBroadsheet()
  }
})

watch([selectedClassId, selectedSession, selectedTerm], () => {
  fetchBroadsheet()
})
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Master <span class="text-royal-purple">Broadsheet</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Consolidated Academic Performance Records</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="handlePrint"
          class="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 transition hover:text-royal-purple"
        >
          <Printer class="w-4 h-4" /> Print View
        </button>
        <button class="flex items-center gap-3 rounded-2xl purple-gradient px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95">
          <Download class="w-4 h-4" /> Export Excel
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="academic-card rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Session</label>
        <select v-model="selectedSession" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-royal-purple">
          <option>2026/2027</option>
          <option>2025/2026</option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Term</label>
        <select v-model="selectedTerm" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-royal-purple">
          <option value="1st">First Term</option>
          <option value="2nd">Second Term</option>
          <option value="3rd">Third Term</option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Class</label>
        <select v-model="selectedClassId" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-royal-purple">
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
      </div>
    </div>

    <!-- Broadsheet Content -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[500px]">
      <div v-if="loading" class="h-[500px] flex items-center justify-center">
        <div class="text-center">
          <Loader2 class="w-12 h-12 text-royal-purple animate-spin mx-auto mb-4" />
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">Compiling Broadsheet Data...</p>
        </div>
      </div>
      
      <div v-else-if="error" class="h-[500px] flex items-center justify-center p-8 text-center">
        <div class="max-w-md">
          <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-6 opacity-20" />
          <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Compilation Error</h3>
          <p class="text-sm text-slate-500 mb-8">{{ error }}</p>
          <button @click="fetchBroadsheet" class="text-xs font-black uppercase tracking-widest text-royal-purple hover:underline">Retry Compilation</button>
        </div>
      </div>

      <div v-else-if="broadsheet" class="overflow-x-auto print:overflow-visible">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th rowspan="2" class="px-4 py-6 border-b border-r border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-400 min-w-[180px] text-left">Student Profile</th>
              <th v-for="sub in broadsheet.subjects" :key="sub.id" colspan="5" class="px-2 py-3 border-b border-r border-slate-200 dark:border-slate-700 text-[8px] font-black uppercase tracking-widest text-royal-purple text-center">
                {{ sub.name }}
              </th>
              <th colspan="4" class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-amber-500 text-center">Summary</th>
            </tr>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <template v-for="sub in broadsheet.subjects" :key="sub.id + '-sub'">
                <th class="px-1 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[7px] font-black text-slate-400 text-center w-12">1st CA</th>
                <th class="px-1 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[7px] font-black text-slate-400 text-center w-12">2nd CA</th>
                <th class="px-1 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[7px] font-black text-slate-400 text-center w-12">Exam</th>
                <th class="px-1 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[7px] font-black text-slate-600 text-center w-12 bg-slate-100/30">Total</th>
                <th class="px-1 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[7px] font-black text-slate-400 text-center w-10">
                  {{ isSSS ? 'Grade' : 'Pos' }}
                </th>
              </template>
              <th class="px-2 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[8px] font-black text-slate-400 text-center">TOT</th>
              <th class="px-2 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[8px] font-black text-slate-400 text-center">AVG</th>
              <th class="px-2 py-2 border-b border-r border-slate-200 dark:border-slate-700 text-[8px] font-black text-slate-400 text-center">POS</th>
              <th class="px-2 py-2 border-b border-slate-200 dark:border-slate-700 text-[8px] font-black text-slate-400 text-center">RES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="student in broadsheet.students" :key="student.studentId" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-4 py-4 border-r border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-2">
                  <div class="text-[9px] font-black text-slate-400 w-4">{{ student.position }}</div>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{{ student.lastName }} {{ student.firstName }}</p>
                    <p class="text-[8px] font-bold text-slate-400 tracking-widest uppercase">{{ student.studentId }}</p>
                  </div>
                </div>
              </td>
              <template v-for="sub in broadsheet.subjects" :key="sub.id + '-score'">
                <template v-if="student.scores[sub.id]">
                  <td class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-[9px] font-bold text-slate-500">{{ student.scores[sub.id].ca1 }}</td>
                  <td class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-[9px] font-bold text-slate-500">{{ student.scores[sub.id].ca2 }}</td>
                  <td class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-[9px] font-bold text-slate-500">{{ student.scores[sub.id].exam }}</td>
                  <td class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-[9px] font-black text-slate-900 dark:text-white bg-slate-50/30">{{ student.scores[sub.id].total }}</td>
                  <td class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-[9px] font-black">
                    <span v-if="isSSS" :class="student.scores[sub.id].grade === 'F' ? 'text-red-500' : 'text-emerald-500'">{{ student.scores[sub.id].grade }}</span>
                    <span v-else class="text-slate-500">{{ student.scores[sub.id].subjectPosition || '-' }}</span>
                  </td>
                </template>
                <template v-else>
                  <td colspan="5" class="px-1 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-slate-200">-</td>
                </template>
              </template>
              <td class="px-2 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-xs font-black text-slate-900 dark:text-white">
                {{ student.total }}
              </td>
              <td class="px-2 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-xs font-black text-royal-purple">
                {{ student.average }}%
              </td>
              <td class="px-2 py-4 border-r border-slate-200 dark:border-slate-700 text-center text-xs font-black text-royal-gold">
                {{ student.position }}
              </td>
              <td class="px-2 py-4 text-center">
                <span class="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest" :class="[student.average >= 40 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20']">
                  {{ student.average >= 40 ? 'PASS' : 'FAIL' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="h-[500px] flex items-center justify-center p-8 text-center text-slate-400">
        <div class="max-w-xs">
          <FileSpreadsheet class="w-16 h-16 mx-auto mb-6 opacity-10" />
          <p class="text-xs font-black uppercase tracking-widest">Select class and session parameters to generate the master broadsheet.</p>
        </div>
      </div>
    </div>

    <!-- Visual Analytics -->
    <div v-if="broadsheet && !loading && !error" class="fade-in">
      <div class="mb-8 flex items-center justify-between no-print">
        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <TrendingUp class="w-5 h-5 text-royal-purple" /> Visual <span class="text-royal-purple">Analytics</span>
        </h2>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Performance Insights</p>
      </div>
      <PerformanceCharts :students="broadsheet.students" :subjects="broadsheet.subjects" class="no-print" />
    </div>
  </div>
</template>


<style scoped>
@media print {
  .no-print { display: none !important; }
  .academic-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
  body { background: white !important; }
  table { font-size: 8pt; width: 100%; border: 1pt solid #ccc; }
  th, td { border: 1pt solid #ccc !important; padding: 4pt !important; }
}

/* Custom scrollbar for broadsheet table */
.overflow-x-auto::-webkit-scrollbar { height: 8px; }
.overflow-x-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
.dark .overflow-x-auto::-webkit-scrollbar-thumb { background: #334155; }
</style>
