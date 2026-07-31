<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import api from '../../services/api'
import { getCurrentSession } from '../../utils/sessions'

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
const savedCount = ref(0)  // number of non-zero scores confirmed saved

// --- Offline & Drafts ---
const isOffline = ref(!navigator.onLine)
const draftAvailable = ref(false)
const draftData = ref<any>(null)
const getDraftKey = () => `draft_scores_${session.value}_${term.value}_${classId}_${subjectId}`

const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

const saveDraftLocally = () => {
  if (loading.value || students.value.length === 0) return
  const draft = {
    timestamp: Date.now(),
    scores: students.value.map(s => ({
      studentId: s.studentId,
      ca1: clampCA(s.ca1),
      ca2: clampCA(s.ca2),
      exam: clampExam(s.exam)
    }))
  }
  localStorage.setItem(getDraftKey(), JSON.stringify(draft))
}

const checkLocalDraft = () => {
  const draftStr = localStorage.getItem(getDraftKey())
  if (draftStr) {
    try {
      draftData.value = JSON.parse(draftStr)
      draftAvailable.value = true
    } catch (e) {
      localStorage.removeItem(getDraftKey())
    }
  }
}

const restoreDraft = () => {
  if (!draftData.value) return
  const savedScores = draftData.value.scores || []
  students.value = students.value.map(s => {
    const saved = savedScores.find((d: any) => d.studentId === s.studentId)
    if (saved) {
      return {
        ...s,
        ca1: saved.ca1,
        ca2: saved.ca2,
        exam: saved.exam
      }
    }
    return s
  })
  draftAvailable.value = false
}

const discardDraft = () => {
  localStorage.removeItem(getDraftKey())
  draftAvailable.value = false
  draftData.value = null
}

const session = ref(getCurrentSession())
const term = ref('First')

// --- Deadline / countdown ---
const resultEntryDeadline = ref<string>('')
const deadlinePassed = ref(false)
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0, label: '' })
let countdownTimer: ReturnType<typeof setInterval> | null = null

const updateCountdown = () => {
  if (!resultEntryDeadline.value) {
    deadlinePassed.value = false
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0, label: '' }
    return
  }
  const now = Date.now()
  const end = new Date(resultEntryDeadline.value).getTime()
  const diff = end - now
  if (diff <= 0) {
    deadlinePassed.value = true
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0, label: 'EXPIRED' }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
    return
  }
  deadlinePassed.value = false
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  parts.push(`${String(seconds).padStart(2, '0')}s`)
  countdown.value = { days, hours, minutes, seconds, label: parts.join(' ') }
}

const startCountdownTimer = () => {
  updateCountdown()
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(updateCountdown, 1000)
}

const fetchStudents = async () => {
  loading.value = true
  try {
    const [studentsResp, schoolResp] = await Promise.all([
      api.get(`/api/teacher/classes/${classId}/students`),
      api.get('/api/config/school')
    ])
    const cls = studentsResp.data.class || {}
    const classLevel = (cls.level || '').toUpperCase()
    
    let filteredStudents = studentsResp.data.students || []
    
    if (classLevel === 'SSS') {
      const coreGeneralSubjects = [
        'Mathematics', 'English Language', 'Marketing', 
        'Citizenship and Heritage studies', 'Economics', 'Biology', 'Civic Education'
      ]
      const trackSubjectNames = {
        'Science': ['Chemistry', 'Physics'],
        'Art': ['Government', 'Literature in English'],
        'Commercial': ['Financial Accounting', 'Commerce']
      }
      
      const subjNameUpper = (subjectName || '').toUpperCase()
      const isCore = coreGeneralSubjects.some(s => s.toUpperCase() === subjNameUpper)
      
      if (!isCore) {
        filteredStudents = filteredStudents.filter((student: any) => {
          const studentSubjects = student.subjectIds || []
          if (studentSubjects.includes(subjectId)) return true
          
          const classSubjects = cls.subjectIds || []
          if (classSubjects.includes(subjectId)) return true
          
          const studentStream = student.stream || cls.track || ''
          let streamMatch = false
          Object.entries(trackSubjectNames).forEach(([track, subjects]) => {
            if (studentStream.toUpperCase() === track.toUpperCase()) {
              if (subjects.some(s => s.toUpperCase() === subjNameUpper)) {
                streamMatch = true
              }
            }
          })
          
          return streamMatch
        })
      }
    }

    students.value = filteredStudents.map((s: any) => ({
      ...s,
      ca1: '',
      ca2: '',
      exam: ''
    }))
    if (schoolResp.data?.currentSession) session.value = schoolResp.data.currentSession
    if (schoolResp.data?.currentTerm) term.value = schoolResp.data.currentTerm
    if (schoolResp.data?.resultEntryDeadline) {
      resultEntryDeadline.value = schoolResp.data.resultEntryDeadline
    }
    startCountdownTimer()
    // Fetch broadsheet to obtain overall class positions/averages
    try {
      const { data } = await api.get(`/api/results/class/${classId}/broadsheet`, {
        params: { session: session.value, term: term.value }
      })
      overallPositions.value = new Map((data.students || []).map((s: any) => [s.studentId, s.position]))
      overallAverages.value = new Map((data.students || []).map((s: any) => [s.studentId, s.average]))
      
      // Populate existing scores if present in the broadsheet
      // The broadsheet may key scores by a canonical subject ID (e.g. "Religious Studies")
      // even if the teacher's assignment uses an alias ID (e.g. "IRS SSS").
      // So we try subjectId first, then fall back to any subject whose aliasIds include our subjectId.
      if (data.students) {
        const broadsheetSubjects: any[] = data.subjects || []
        const canonicalSubjectId = (() => {
          if (!broadsheetSubjects.length) return subjectId
          // Try to find a subject in the broadsheet that lists our subjectId as an alias
          const matched = broadsheetSubjects.find((sub: any) =>
            sub.id === subjectId || (Array.isArray(sub.aliasIds) && sub.aliasIds.includes(subjectId))
          )
          return matched?.id || subjectId
        })()

        students.value = students.value.map((s: any) => {
          const studentScore = data.students.find((ds: any) => ds.studentId === s.studentId)
          // Look up by canonical ID first, then by raw subjectId
          const scoreObj = studentScore?.scores?.[canonicalSubjectId] || studentScore?.scores?.[subjectId]
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
    
    checkLocalDraft()
  } catch (err) {
    error.value = 'Failed to load students'
  } finally {
    loading.value = false
  }
}

const clampCA = (val: any) => Math.min(20, Math.max(0, Number(val || 0)))
const clampExam = (val: any) => Math.min(60, Math.max(0, Number(val || 0)))

const computeTotal = (st: any) => {
  const c1 = clampCA(st.ca1)
  const c2 = clampCA(st.ca2)
  const e = clampExam(st.exam)
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
  saveDraftLocally()
}, { deep: true })

const refreshBroadsheet = async (updateScores = false) => {
  try {
    const { data } = await api.get(`/api/results/class/${classId}/broadsheet`, {
      params: { session: session.value, term: term.value }
    })
    overallPositions.value = new Map((data.students || []).map((s: any) => [s.studentId, s.position]))
    overallAverages.value = new Map((data.students || []).map((s: any) => [s.studentId, s.average]))

    // After a successful save, update the student score fields to confirm what was persisted
    if (updateScores && data.students) {
      const broadsheetSubjects: any[] = data.subjects || []
      const canonicalSubjectId = (() => {
        if (!broadsheetSubjects.length) return subjectId
        const matched = broadsheetSubjects.find((sub: any) =>
          sub.id === subjectId || (Array.isArray(sub.aliasIds) && sub.aliasIds.includes(subjectId))
        )
        return matched?.id || subjectId
      })()

      students.value = students.value.map((s: any) => {
        const studentScore = data.students.find((ds: any) => ds.studentId === s.studentId)
        const scoreObj = studentScore?.scores?.[canonicalSubjectId] || studentScore?.scores?.[subjectId]
        return {
          ...s,
          ca1: scoreObj?.ca1 !== undefined && scoreObj.ca1 !== null ? scoreObj.ca1 : 0,
          ca2: scoreObj?.ca2 !== undefined && scoreObj.ca2 !== null ? scoreObj.ca2 : 0,
          exam: scoreObj?.exam !== undefined && scoreObj.exam !== null ? scoreObj.exam : 0
        }
      })
    }
  } catch (err) {
    // broadsheet may not exist yet
  }
}

const handleSave = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  
  const scores = students.value.map(s => ({
    studentId: s.studentId,
    ca1: clampCA(s.ca1),
    ca2: clampCA(s.ca2),
    exam: clampExam(s.exam)
  }))
  savedCount.value = scores.filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0).length

  if (isOffline.value) {
    saveDraftLocally()
    error.value = 'You are currently offline. Your scores have been saved securely on this device as a draft. Please click Publish again when your connection is restored.'
    saving.value = false
    return
  }

  try {
    await api.post('/api/teacher/scores', {
      session: session.value,
      term: term.value,
      classId,
      subjectId,
      scores
    })
    success.value = true
    // Clear draft on successful save
    discardDraft()
    
    // Refresh broadsheet AND update displayed scores so teacher sees confirmed saved values
    await refreshBroadsheet(true)
    setTimeout(() => { success.value = false }, 5000)
  } catch (err: any) {
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      saveDraftLocally()
      error.value = 'Network error. Your scores have been saved securely on this device as a draft. Please try publishing again later.'
    } else {
      error.value = err.response?.data?.error || 'Failed to save scores. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchStudents()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})
onUnmounted(() => { 
  if (countdownTimer) clearInterval(countdownTimer) 
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="h-12 w-12 rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow-sm flex items-center justify-center text-slate-200 hover:text-royal-purple transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ subjectName }}</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{{ className }} • Score Entry</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex gap-2">
          <select v-model="term" class="px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-xs font-black uppercase tracking-widest outline-none shadow-sm">
            <option>First</option>
            <option>Second</option>
            <option>Third</option>
          </select>
        </div>
        <button 
          @click="handleSave"
          :disabled="saving || deadlinePassed"
          class="flex items-center gap-3 rounded-2xl purple-gradient px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" /> 
          {{ saving ? 'Saving...' : 'Publish Scores' }}
        </button>
      </div>
    </div>

    <!-- Deadline Banner -->
    <div v-if="resultEntryDeadline" class="rounded-2xl border overflow-hidden"
      :class="deadlinePassed
        ? 'border-red-700/60 bg-red-950/50'
        : countdown.days === 0 && countdown.hours === 0 && countdown.minutes < 30
          ? 'border-amber-600/60 bg-amber-950/40'
          : 'border-slate-700/60 bg-slate-900/60'"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
            :class="deadlinePassed ? 'bg-red-700/30' : 'bg-slate-800'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" :class="deadlinePassed ? 'text-red-400' : 'text-amber-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest" :class="deadlinePassed ? 'text-red-400' : 'text-slate-300'">
              {{ deadlinePassed ? '🔒 Result Entry Paused' : '⏱ Result Entry Deadline' }}
            </p>
            <p class="text-xs font-bold mt-0.5"
              :class="deadlinePassed ? 'text-red-300' : 'text-slate-400'"
            >
              {{ deadlinePassed
                ? 'The deadline has elapsed. Contact the administrator to re-open result entry.'
                : `Deadline: ${new Date(resultEntryDeadline).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}` }}
            </p>
          </div>
        </div>
        <div v-if="!deadlinePassed" class="flex items-center gap-2 flex-shrink-0">
          <div v-for="(unit, label) in [['Days', countdown.days], ['Hrs', countdown.hours], ['Min', countdown.minutes], ['Sec', countdown.seconds]]" :key="label"
            class="flex flex-col items-center w-14 py-2 rounded-xl bg-slate-800/80 border border-slate-700/40"
          >
            <span class="text-lg font-black text-white tabular-nums">{{ String(unit[1]).padStart(2,'0') }}</span>
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">{{ unit[0] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Draft Banner -->
    <div v-if="draftAvailable" class="rounded-2xl border border-blue-500/40 bg-blue-900/20 overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20">
            <Save class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-blue-300">
              Unsaved Offline Draft
            </p>
            <p class="text-xs font-bold mt-0.5 text-blue-200/80">
              You have unsaved changes saved locally from a previous session ({{ new Date(draftData?.timestamp).toLocaleString() }}).
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button @click="discardDraft" class="px-4 py-2 rounded-xl bg-blue-950/50 text-blue-300 text-xs font-bold hover:bg-blue-900/50 transition">
            Discard
          </button>
          <button @click="restoreDraft" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition">
            Restore Draft
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="p-4 rounded-2xl bg-red-900/20 text-red-300 flex items-center gap-3 border border-red-700/40">
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <div>
        <p class="text-sm font-black">Save Failed</p>
        <p class="text-xs font-bold mt-0.5 opacity-80">{{ error }}</p>
      </div>
    </div>
    <div v-if="success" class="p-4 rounded-2xl bg-emerald-900/20 text-emerald-300 flex items-center gap-3 border border-emerald-700/40">
      <CheckCircle2 class="w-5 h-5 flex-shrink-0" />
      <div>
        <p class="text-sm font-black">Scores Saved Successfully!</p>
        <p class="text-xs font-bold mt-0.5 opacity-80">{{ savedCount }} student{{ savedCount === 1 ? '' : 's' }} with non-zero scores. The table below now reflects the confirmed saved values.</p>
      </div>
    </div>

    <!-- Score Table -->
    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/60">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Name</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">1st CA (20)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">2nd CA (20)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-32">Exam (60)</th>
              <th class="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24 bg-slate-900/30">Total</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24">Pos.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/40">
            <tr v-for="st in students" :key="st.studentId" class="hover:bg-slate-900/20 transition-colors">
              <td class="px-8 py-6">
                <p class="text-sm font-black text-white">{{ st.lastName }} {{ st.firstName }}</p>
                <p class="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{{ st.studentId }}</p>
              </td>
              <td class="px-4 py-6">
                <input 
                  :value="st.ca1"
                  type="number" 
                  min="0"
                  max="20"
                  :disabled="deadlinePassed"
                  @input="st.ca1 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none disabled:opacity-40 disabled:cursor-not-allowed" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6">
                <input 
                  :value="st.ca2"
                  type="number" 
                  min="0"
                  max="20"
                  :disabled="deadlinePassed"
                  @input="st.ca2 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none disabled:opacity-40 disabled:cursor-not-allowed" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6">
                <input 
                  :value="st.exam"
                  type="number" 
                  min="0"
                  max="60"
                  :disabled="deadlinePassed"
                  @input="st.exam = clampExam(($event.target as HTMLInputElement).value)"
                  class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-center text-sm font-black focus:ring-2 focus:ring-royal-purple outline-none disabled:opacity-40 disabled:cursor-not-allowed" 
                  placeholder="0"
                />
              </td>
              <td class="px-4 py-6 text-center bg-slate-900/30">
                <span
                  class="text-sm font-black"
                  :class="[ computeTotal(st) >= 40 ? 'text-emerald-500' : 'text-red-500', totalFlash.has(st.studentId) ? 'flash-total' : '' ]"
                >{{ computeTotal(st) }}</span>
              </td>
              <td class="px-8 py-6 text-center">
                <span class="px-3 py-1 rounded-lg bg-slate-900/60 text-[10px] font-black text-slate-300">
                  {{ studentPositions.get(st.studentId) || overallPositions.get(st.studentId) || '-' }}
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
