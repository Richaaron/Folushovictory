<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const classId = route.query.classId as string
const subjectId = route.query.subjectId as string
const subjectName = route.query.subjectName as string
const className = route.query.className as string

const students = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)

const session = ref('2023/2024')
const term = ref('First')

const fetchStudents = async () => {
  loading.value = true
  try {
    const [studentsResp, schoolResp] = await Promise.all([
      api.get(`/api/teacher/classes/${classId}/students`),
      api.get('/api/config/school')
    ])
    students.value = studentsResp.data.students.map((s: any) => ({
      ...s,
      ca1: '',
      ca2: '',
      exam: ''
    }))
    if (schoolResp.data?.currentSession) session.value = schoolResp.data.currentSession
    if (schoolResp.data?.currentTerm) term.value = schoolResp.data.currentTerm
    // Fetch broadsheet to obtain overall class positions/averages
    try {
      const { data } = await api.get(`/api/results/class/${classId}/broadsheet`, {
        params: { session: session.value, term: term.value }
      })
      overallPositions.value = new Map((data.students || []).map((s: any) => [s.studentId, s.position]))
      overallAverages.value = new Map((data.students || []).map((s: any) => [s.studentId, s.average]))
      
      // Populate existing scores if present in the broadsheet
      if (data.students) {
        students.value = students.value.map((s: any) => {
          const studentScore = data.students.find((ds: any) => ds.studentId === s.studentId)
          const scoreObj = studentScore?.scores?.[subjectId]
          return {
            ...s,
            ca1: scoreObj?.ca1 !== undefined && scoreObj.ca1 !== null ? scoreObj.ca1 : '',
            ca2: scoreObj?.ca2 !== undefined && scoreObj.ca2 !== null ? scoreObj.ca2 : '',
            exam: scoreObj?.exam !== undefined && scoreObj.exam !== null ? scoreObj.exam : ''
          }
        })
      }
    } catch (err) {
      // ignore: broadsheet may not exist yet
      overallPositions.value = new Map()
      overallAverages.value = new Map()
    }
  } catch (err) {
    error.value = 'Failed to load students'
  } finally {
    loading.value = false
  }
}

const computeTotal = (st: any) => {
  const c1 = Number(st.ca1 || 0)
  const c2 = Number(st.ca2 || 0)
  const e = Number(st.exam || 0)
  return c1 + c2 + e
}

// Auto-generate positions locally for preview
const studentPositions = computed(() => {
  const sorted = [...students.value].sort((a, b) => computeTotal(b) - computeTotal(a))
  let lastTotal: number | null = null
  let lastPos = 0
  const posMap = new Map<string, number>()

  sorted.forEach((s, idx) => {
    const t = computeTotal(s)
    if (lastTotal === null || t !== lastTotal) {
      lastPos = idx + 1
      lastTotal = t
    }
    posMap.set(s.studentId, lastPos)
  })

  return posMap
})

const overallPositions = ref<Map<string, number>>(new Map())
const overallAverages = ref<Map<string, number>>(new Map())

// Visual flash when a student's total changes while typing
const totalFlash = ref(new Map())
watch(students, (newVal, oldVal) => {
  newVal.forEach((s: any) => {
    const prev = (oldVal || []).find((o: any) => o.studentId === s.studentId)
    const newTotal = computeTotal(s)
    const oldTotal = prev ? computeTotal(prev) : null
    if (oldTotal !== null && newTotal !== oldTotal) {
      totalFlash.value.set(s.studentId, true)
      setTimeout(() => totalFlash.value.delete(s.studentId), 700)
    }
  })
}, { deep: true })

const handleSave = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  try {
    const scores = students.value.map(s => ({
      studentId: s.studentId,
      ca1: Number(s.ca1 || 0),
      ca2: Number(s.ca2 || 0),
      exam: Number(s.exam || 0)
    }))

    await api.post('/api/teacher/scores', {
      session: session.value,
      term: term.value,
      classId,
      subjectId,
      scores
    })
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to save scores'
  } finally {
    saving.value = false
  }
}

onMounted(fetchStudents)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-royal-purple transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ subjectName }}</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{{ className }} • Score Entry</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex gap-2">
          <select v-model="term" class="px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase tracking-widest outline-none shadow-sm">
            <option>First</option>
            <option>Second</option>
            <option>Third</option>
          </select>
        </div>
        <button 
          @click="handleSave"
          :disabled="saving"
          class="flex items-center gap-3 rounded-2xl purple-gradient px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" /> 
          {{ saving ? 'Saving...' : 'Publish Scores' }}
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center gap-3 border border-red-100 dark:border-red-900/30">
      <AlertCircle class="w-5 h-5" />
      <span class="text-sm font-bold">{{ error }}</span>
    </div>
    <div v-if="success" class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30">
      <CheckCircle2 class="w-5 h-5" />
      <span class="text-sm font-bold">Scores saved successfully!</span>
    </div>

    <!-- Score Table -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Name</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">1st CA (20)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">2nd CA (20)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">Exam (60)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24 bg-slate-100/50 dark:bg-slate-700/50">Total</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24">Pos.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="st in students" :key="st.studentId" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-8 py-6">
                <p class="text-sm font-black text-slate-900 dark:text-white">{{ st.lastName }} {{ st.firstName }}</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ st.studentId }}</p>
              </td>
              <td class="px-4 py-6">
                <input 
                  v-model="st.ca1" 
                  type="number" 
                  max="20"
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6">
                <input 
                  v-model="st.ca2" 
                  type="number" 
                  max="20"
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6">
                <input 
                  v-model="st.exam" 
                  type="number" 
                  max="60"
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6 text-center bg-slate-50/30 dark:bg-slate-800/30">
                <span
                  class="text-sm font-black"
                  :class="[ computeTotal(st) >= 40 ? 'text-emerald-500' : 'text-red-500', totalFlash.has(st.studentId) ? 'flash-total' : '' ]"
                >{{ computeTotal(st) }}</span>
              </td>
              <td class="px-8 py-6 text-center">
                <span class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                  {{ overallPositions.get(st.studentId) || studentPositions.get(st.studentId) || '-' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide arrows in number input */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

.flash-total {
  box-shadow: 0 0 0 8px rgba(212,175,55,0.08);
  transition: box-shadow 0.35s ease-in-out;
  border-radius: 0.5rem;
}
</style>
