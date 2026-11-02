<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Download,
  Printer,
  Smartphone,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BarChart3
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
const savedCount = ref(0)  // number of non-zero scores confirmed saved

const isNurseryClass = ref(false)
const mobileGradingMode = ref<'carousel' | 'list'>('carousel')
const currentCarouselIndex = ref(0)
const nextStudent = () => {
  if (currentCarouselIndex.value < students.value.length - 1) {
    currentCarouselIndex.value++
  }
}
const prevStudent = () => {
  if (currentCarouselIndex.value > 0) {
    currentCarouselIndex.value--
  }
}
const currentStudent = computed(() => students.value[currentCarouselIndex.value] || null)
const gradedCount = computed(() => students.value.filter(s => computeTotal(s) > 0).length)
const gradingProgressPercent = computed(() => {
  if (!students.value.length) return 0
  return Math.round((gradedCount.value / students.value.length) * 100)
})
const subjectMaxScore = ref(100) // per-subject max (50 or 100), only relevant for Nursery

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
      ca1: isNurseryClass.value ? 0 : clampCA(s.ca1),
      ca2: isNurseryClass.value ? 0 : clampCA(s.ca2),
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

// Session/term are always the current active school session — locked for subject teachers
const session = ref('')
const term = ref('')

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
      api.get(`/api/teacher/classes/${classId}/students`, {
        params: { session: session.value, term: term.value }
      }),
      api.get('/api/config/school')
    ])
    const cls = studentsResp.data.class || {}
    const classLevel = (cls.level || '').toUpperCase()
    isNurseryClass.value = ['NURSERY 1', 'NURSERY 2', 'PRE NURSERY'].includes(classLevel) || classLevel.includes('NURSERY')
    
    let filteredStudents = studentsResp.data.students || []
    
    const subjNameUpper = (subjectName || '').toUpperCase()
    const isCRS = subjNameUpper.includes('CHRISTIAN') || subjNameUpper === 'CRS' || subjNameUpper === 'CRK'
    const isIRS = subjNameUpper.includes('ISLAMIC') || subjNameUpper === 'IRS' || subjNameUpper === 'IRK'

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
      
      const isCore = coreGeneralSubjects.some(s => s.toUpperCase() === subjNameUpper)
      
      if (!isCore) {
        filteredStudents = filteredStudents.filter((student: any) => {
          const studentSubjects = Array.isArray(student.subjectIds) ? student.subjectIds : []
          // 1. Explicitly registered elective / subject
          if (studentSubjects.includes(subjectId)) return true
          
          // 2. Stream-based allocation for track subjects
          const studentStream = String(student.stream || cls.track || '').toUpperCase()
          let streamMatch = false
          Object.entries(trackSubjectNames).forEach(([track, subjects]) => {
            if (studentStream === track.toUpperCase()) {
              if (subjects.some(s => s.toUpperCase() === subjNameUpper)) {
                streamMatch = true
              }
            }
          })
          
          return streamMatch
        })
      }
    } else if (isCRS || isIRS) {
      // Religious Studies filter for JSS / Primary classes
      filteredStudents = filteredStudents.filter((student: any) => {
        const studentSubjects = Array.isArray(student.subjectIds) ? student.subjectIds : []
        if (studentSubjects.includes(subjectId)) return true
        if (studentSubjects.length > 0) return false
        return true
      })
    }

    students.value = filteredStudents.map((s: any) => ({
      ...s,
      ca1: '',
      ca2: '',
      exam: '',
      rating: ''
    }))
    // Always lock to the current active session — subject teachers cannot enter scores for past sessions
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
          const matched = broadsheetSubjects.find((sub: any) =>
            sub.id === subjectId || (Array.isArray(sub.aliasIds) && sub.aliasIds.includes(subjectId))
          )
          if (matched && isNurseryClass.value) {
            subjectMaxScore.value = Number(matched.maxScore) === 50 ? 50 : 100
          }
          return matched?.id || subjectId
        })()

        students.value = students.value.map((s: any) => {
          const studentScore = data.students.find((ds: any) => ds.studentId === s.studentId)
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
const clampExam = (val: any) => Math.min(isNurseryClass.value ? subjectMaxScore.value : 60, Math.max(0, Number(val || 0)))

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
  
  // Only submit scores for students who have at least one score entered
  const scores = students.value
    .filter(s => (s.ca1 !== '' && s.ca1 !== undefined && s.ca1 !== null) ||
                 (s.ca2 !== '' && s.ca2 !== undefined && s.ca2 !== null) ||
                 (s.exam !== '' && s.exam !== undefined && s.exam !== null))
    .map(s => ({
      studentId: s.studentId,
      ca1: isNurseryClass.value ? 0 : clampCA(s.ca1),
      ca2: isNurseryClass.value ? 0 : clampCA(s.ca2),
      exam: clampExam(s.exam)
    }))

  if (scores.length === 0) {
    error.value = 'Please enter assessment or examination scores for at least one student before publishing.'
    saving.value = false
    return
  }

  savedCount.value = scores.length

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

const exportScoreSheetExcel = () => {
  if (!students.value.length) {
    alert('No students found to export.')
    return
  }

  const safePart = (str: string) => String(str || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
  const escapeXml = (str: string) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  let rowsHtml = ''
  students.value.forEach((s, idx) => {
    const name = `${s.lastName || ''} ${s.firstName || ''}`.trim()
    rowsHtml += `
      <tr>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${escapeXml(s.studentId)}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: left; font-weight: bold;">${escapeXml(name)}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${escapeXml(s.gender || '')}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${s.ca1 !== '' && s.ca1 !== undefined ? s.ca1 : ''}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${s.ca2 !== '' && s.ca2 !== undefined ? s.ca2 : ''}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;">${s.exam !== '' && s.exam !== undefined ? s.exam : ''}</td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #64748b; padding: 8px; text-align: center;"></td>
      </tr>
    `
  })

  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: 'Comic Sans MS', Arial, sans-serif; font-size: 12px; }
          th { border: 1px solid #475569; padding: 10px; background: #0f172a; color: #ffffff; font-weight: bold; }
          .header-title { font-size: 20px; font-weight: bold; text-align: center; color: #0f172a; padding: 12px; }
          .meta-info { font-size: 13px; font-weight: bold; text-align: center; background: #f1f5f9; padding: 8px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td class="header-title" colspan="9">FOLUSHO VICTORY SCHOOLS</td></tr>
          <tr><td class="meta-info" colspan="9">OFFICIAL SUBJECT SCORE SHEET | Class: ${escapeXml(className)} | Subject: ${escapeXml(subjectName)} | Session: ${escapeXml(session.value)} | Term: ${escapeXml(term.value)} Term</td></tr>
          <tr>
            <th style="width: 40px;">S/N</th>
            <th style="width: 120px;">Student ID</th>
            <th style="width: 240px; text-align: left;">Student Name</th>
            <th style="width: 80px;">Gender</th>
            <th style="width: 90px;">1st CA (20)</th>
            <th style="width: 90px;">2nd CA (20)</th>
            <th style="width: 90px;">Exam (60)</th>
            <th style="width: 90px;">Total (100)</th>
            <th style="width: 160px;">Remarks</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
    </html>
  `

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ScoreSheet_${safePart(className)}_${safePart(subjectName)}_${safePart(session.value)}_${safePart(term.value)}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const printScoreSheet = () => {
  window.print()
}
</script>

<template>
  <div class="space-y-6 fade-in pb-2">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="h-11 w-11 shrink-0 rounded-2xl bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:text-blue-900 hover:border-blue-400 transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">{{ subjectName }}</h1>
          <p class="text-xs sm:text-sm font-extrabold text-slate-600 uppercase tracking-widest mt-0.5">{{ className }} • Score Entry</p>
        </div>
      </div>

      <!-- Controls row -->
      <div class="flex flex-wrap items-center gap-2 no-print">
        <!-- Active session/term badge (read-only) -->
        <div v-if="session" class="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 rounded-xl text-xs font-black uppercase tracking-wider text-blue-900 border border-blue-200">
          {{ session }} &bull; {{ term }} Term
        </div>

        <!-- Excel download -->
        <button @click="exportScoreSheetExcel" title="Download Excel score sheet"
          class="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-800 transition hover:bg-slate-50 hover:border-blue-400 hover:text-blue-900 shadow-sm">
          <Download class="w-4 h-4 text-slate-700" />
          <span class="hidden sm:inline">Excel</span>
        </button>

        <!-- Print -->
        <button @click="printScoreSheet" title="Print / PDF"
          class="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-800 transition hover:bg-slate-50 hover:border-blue-400 hover:text-blue-900 shadow-sm">
          <Printer class="w-4 h-4 text-slate-700" />
          <span class="hidden sm:inline">Print</span>
        </button>

        <!-- Broadsheet -->
        <button @click="router.push({ name: 'teacher-broadsheet', params: { classId }, query: { classId, className, session, term } })" title="Open Master Broadsheet"
          class="flex items-center gap-1.5 rounded-xl bg-white border-2 border-[#BAE6FD] px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0C4A6E] transition hover:bg-sky-50 hover:border-sky-400 shadow-sm active:scale-95">
          <BarChart3 class="w-4 h-4 text-sky-700" />
          <span class="hidden sm:inline">Broadsheet</span>
        </button>

        <!-- Publish (hidden on mobile — sticky bar handles it) -->
        <button @click="handleSave" :disabled="saving || deadlinePassed"
          class="hidden sm:flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition active:scale-95 disabled:opacity-50">
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin text-white" />
          <Save v-else class="w-4 h-4 text-white" />
          <span class="text-white">{{ saving ? 'Saving…' : 'Publish Scores' }}</span>
        </button>
      </div>
    </div>


    <!-- Deadline Banner -->
    <div v-if="resultEntryDeadline" class="rounded-2xl border overflow-hidden shadow-sm"
      :class="deadlinePassed
        ? 'border-red-300 bg-red-50'
        : countdown.days === 0 && countdown.hours === 0 && countdown.minutes < 30
          ? 'border-amber-300 bg-amber-50'
          : 'border-blue-200 bg-blue-50'"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
            :class="deadlinePassed ? 'bg-red-200' : 'bg-white border border-slate-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" :class="deadlinePassed ? 'text-red-700' : 'text-amber-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest" :class="deadlinePassed ? 'text-red-800' : 'text-blue-950'">
              {{ deadlinePassed ? '🔒 Result Entry Paused' : '⏱ Result Entry Deadline' }}
            </p>
            <p class="text-xs sm:text-sm font-bold mt-0.5"
              :class="deadlinePassed ? 'text-red-700' : 'text-slate-700'"
            >
              {{ deadlinePassed
                ? 'The deadline has elapsed. Contact the administrator to re-open result entry.'
                : `Deadline: ${new Date(resultEntryDeadline).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}` }}
            </p>
          </div>
        </div>
        <div v-if="!deadlinePassed" class="flex items-center gap-2 flex-shrink-0">
          <div v-for="(unit, label) in [['Days', countdown.days], ['Hrs', countdown.hours], ['Min', countdown.minutes], ['Sec', countdown.seconds]]" :key="label"
            class="flex flex-col items-center w-14 py-2 rounded-xl bg-white border border-blue-200 shadow-sm"
          >
            <span class="text-lg font-black text-blue-900 tabular-nums">{{ String(unit[1]).padStart(2,'0') }}</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ unit[0] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Draft Banner -->
    <div v-if="draftAvailable" class="rounded-2xl border border-blue-300 bg-blue-50 overflow-hidden shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
            <Save class="w-5 h-5 text-blue-800" />
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-blue-950">
              Unsaved Offline Draft
            </p>
            <p class="text-xs sm:text-sm font-bold mt-0.5 text-blue-900">
              You have unsaved changes saved locally from a previous session ({{ new Date(draftData?.timestamp).toLocaleString() }}).
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button @click="discardDraft" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-slate-100 transition">
            Discard
          </button>
          <button @click="restoreDraft" class="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-black shadow-sm transition">
            Restore Draft
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="p-4 rounded-2xl bg-red-50 text-red-800 flex items-center gap-3 border border-red-300">
      <AlertCircle class="w-5 h-5 flex-shrink-0 text-red-600" />
      <div>
        <p class="text-sm font-black text-red-900">Save Failed</p>
        <p class="text-xs font-bold mt-0.5 text-red-800">{{ error }}</p>
      </div>
    </div>
    <div v-if="success" class="p-4 rounded-2xl bg-emerald-50 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-emerald-300 shadow-sm">
      <div class="flex items-center gap-3">
        <CheckCircle2 class="w-6 h-6 flex-shrink-0 text-emerald-700" />
        <div>
          <p class="text-sm font-black text-emerald-950">Scores Published Successfully!</p>
          <p class="text-xs font-bold mt-0.5 text-emerald-800">{{ savedCount }} student{{ savedCount === 1 ? '' : 's' }} recorded. Your updates are now visible in the master broadsheet.</p>
        </div>
      </div>
      <button
        type="button"
        @click="router.push({ name: 'teacher-broadsheet', params: { classId }, query: { classId, className, session, term } })"
        class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95 shrink-0"
      >
        <BarChart3 class="w-4 h-4 text-white" />
        <span>View in Broadsheet →</span>
      </button>
    </div>

    <!-- Score Table — desktop (sm+) -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden sm:block">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-blue-800 animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b-2 border-slate-200">
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-800">Student Name</th>
              <th v-if="!isNurseryClass" class="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-800 text-center w-28">1st CA (20)</th>
              <th v-if="!isNurseryClass" class="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-800 text-center w-28">2nd CA (20)</th>
              <th class="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-800 text-center w-28">Exam ({{ isNurseryClass ? subjectMaxScore : '60' }})</th>
              <th class="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-800 text-center w-24 bg-slate-100">Total</th>
              <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-800 text-center w-20">Pos.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="st in students" :key="st.studentId" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <p class="text-sm font-black text-slate-900">{{ st.lastName }} {{ st.firstName }}</p>
                <p class="text-xs font-bold text-blue-900 uppercase tracking-wider">{{ st.studentId }}</p>
              </td>
              <td v-if="!isNurseryClass" class="px-3 py-4">
                <input :value="st.ca1" type="number" min="0" max="20" :disabled="deadlinePassed"
                  @input="st.ca1 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-center text-sm font-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-inner" placeholder="0" />
              </td>
              <td v-if="!isNurseryClass" class="px-3 py-4">
                <input :value="st.ca2" type="number" min="0" max="20" :disabled="deadlinePassed"
                  @input="st.ca2 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-center text-sm font-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-inner" placeholder="0" />
              </td>
              <td class="px-3 py-4">
                <input :value="st.exam" type="number" min="0" :max="isNurseryClass ? subjectMaxScore : 60" :disabled="deadlinePassed"
                  @input="st.exam = clampExam(($event.target as HTMLInputElement).value)"
                  class="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-center text-sm font-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-inner" placeholder="0" />
              </td>
              <td class="px-3 py-4 text-center bg-slate-50">
                <span class="text-sm font-black" :class="[computeTotal(st) >= 40 ? 'text-emerald-700' : 'text-red-700', totalFlash.has(st.studentId) ? 'flash-total' : '']">
                  {{ computeTotal(st) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-black text-slate-800">
                  {{ studentPositions.get(st.studentId) || overallPositions.get(st.studentId) || '-' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Score Cards — mobile only (below sm) -->
    <!-- MOBILE-NATIVE RESULT ENTRY (Designed for smartphones) -->
    <div class="sm:hidden space-y-4">
      <div v-if="loading" class="p-16 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-sky-700 animate-spin" />
      </div>

      <template v-else-if="students.length > 0">
        <!-- Mobile Mode Switcher & Progress Header -->
        <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-4 shadow-sm space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">Grading Progress</p>
              <p class="text-sm font-black text-[#0C4A6E]">
                {{ gradedCount }} of {{ students.length }} Graded ({{ gradingProgressPercent }}%)
              </p>
            </div>
            
            <!-- View Mode Switcher -->
            <div class="inline-flex rounded-xl bg-sky-50 p-1 border border-sky-200">
              <button
                @click="mobileGradingMode = 'carousel'"
                type="button"
                class="px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1"
                :class="mobileGradingMode === 'carousel' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-700'"
              >
                <Smartphone class="w-3.5 h-3.5" />
                <span>Focus</span>
              </button>
              <button
                @click="mobileGradingMode = 'list'"
                type="button"
                class="px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1"
                :class="mobileGradingMode === 'list' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-700'"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
                <span>All</span>
              </button>
            </div>
          </div>

          <!-- Visual Progress Bar -->
          <div class="w-full bg-sky-100 rounded-full h-2 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-sky-600 to-amber-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: gradingProgressPercent + '%' }"
            />
          </div>
        </div>

        <!-- 1. MOBILE FOCUS CAROUSEL (One Student at a Time - Fastest & Easiest on Phone) -->
        <div v-if="mobileGradingMode === 'carousel' && currentStudent" class="space-y-4">
          <div class="bg-white rounded-3xl border-2 border-[#BAE6FD] p-5 shadow-md space-y-5">
            
            <!-- Student Header & Selector -->
            <div class="flex items-center justify-between pb-3 border-b border-sky-100">
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-12 w-12 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-900 font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                  {{ currentStudent.firstName?.charAt(0) || 'S' }}
                </div>
                <div class="min-w-0">
                  <h3 class="text-base font-black text-[#0C4A6E] truncate leading-tight">
                    {{ currentStudent.lastName }} {{ currentStudent.firstName }}
                  </h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-black uppercase text-[#0C4A6E] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {{ currentStudent.studentId }}
                    </span>
                    <span class="text-[10px] font-bold text-slate-500">
                      #{{ currentCarouselIndex + 1 }} of {{ students.length }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Computed Total Badge -->
              <div class="text-right shrink-0">
                <div class="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border-2"
                  :class="computeTotal(currentStudent) >= 50 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : computeTotal(currentStudent) >= 40 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-red-50 border-red-300 text-red-800'"
                >
                  <span class="text-2xl font-black leading-none">{{ computeTotal(currentStudent) }}</span>
                  <span class="text-[9px] font-black uppercase tracking-wider mt-0.5">Total /100</span>
                </div>
              </div>
            </div>

            <!-- Jump to Student Select -->
            <div>
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Jump to student:</label>
              <select 
                v-model="currentCarouselIndex" 
                class="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 outline-none"
              >
                <option v-for="(st, idx) in students" :key="st.studentId" :value="idx">
                  {{ idx + 1 }}. {{ st.lastName }} {{ st.firstName }} ({{ computeTotal(st) }}/100)
                </option>
              </select>
            </div>

            <!-- Score Input Fields with Touch Quick Buttons -->
            <div class="space-y-4 pt-1">
              
              <!-- 1st CA (/20) -->
              <div v-if="!isNurseryClass" class="bg-sky-50/50 p-3.5 rounded-2xl border border-sky-200 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">1st Continuous Assessment (Max 20)</label>
                  <span class="text-xs font-extrabold text-slate-600">{{ currentStudent.ca1 || 0 }}/20</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    :value="currentStudent.ca1"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    :disabled="deadlinePassed"
                    @focus="($event.target as HTMLInputElement).select()"
                    @input="currentStudent.ca1 = clampCA(($event.target as HTMLInputElement).value)"
                    placeholder="0"
                    class="w-24 h-12 text-center text-lg font-black bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none shadow-inner"
                  />
                  <!-- Quick preset pills for CA1 -->
                  <div class="flex flex-wrap gap-1.5 flex-1">
                    <button 
                      v-for="val in [10, 15, 18, 20]" 
                      :key="'ca1-' + val"
                      type="button"
                      :disabled="deadlinePassed"
                      @click="currentStudent.ca1 = val"
                      class="px-2.5 py-2 rounded-lg text-xs font-black border transition active:scale-95"
                      :class="currentStudent.ca1 === val ? 'bg-sky-700 text-white border-sky-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-100'"
                    >
                      {{ val }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 2nd CA (/20) -->
              <div v-if="!isNurseryClass" class="bg-sky-50/50 p-3.5 rounded-2xl border border-sky-200 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">2nd Continuous Assessment (Max 20)</label>
                  <span class="text-xs font-extrabold text-slate-600">{{ currentStudent.ca2 || 0 }}/20</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    :value="currentStudent.ca2"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="20"
                    :disabled="deadlinePassed"
                    @focus="($event.target as HTMLInputElement).select()"
                    @input="currentStudent.ca2 = clampCA(($event.target as HTMLInputElement).value)"
                    placeholder="0"
                    class="w-24 h-12 text-center text-lg font-black bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none shadow-inner"
                  />
                  <!-- Quick preset pills for CA2 -->
                  <div class="flex flex-wrap gap-1.5 flex-1">
                    <button 
                      v-for="val in [10, 15, 18, 20]" 
                      :key="'ca2-' + val"
                      type="button"
                      :disabled="deadlinePassed"
                      @click="currentStudent.ca2 = val"
                      class="px-2.5 py-2 rounded-lg text-xs font-black border transition active:scale-95"
                      :class="currentStudent.ca2 === val ? 'bg-sky-700 text-white border-sky-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-100'"
                    >
                      {{ val }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Terminal Examination (/60 or /100) -->
              <div class="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black uppercase tracking-wider text-amber-950">
                    Terminal Examination (Max {{ isNurseryClass ? subjectMaxScore : '60' }})
                  </label>
                  <span class="text-xs font-extrabold text-amber-900">{{ currentStudent.exam || 0 }}/{{ isNurseryClass ? subjectMaxScore : '60' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    :value="currentStudent.exam"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    :max="isNurseryClass ? subjectMaxScore : 60"
                    :disabled="deadlinePassed"
                    @focus="($event.target as HTMLInputElement).select()"
                    @input="currentStudent.exam = clampExam(($event.target as HTMLInputElement).value)"
                    placeholder="0"
                    class="w-24 h-12 text-center text-lg font-black bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none shadow-inner"
                  />
                  <!-- Quick preset pills for Exam -->
                  <div class="flex flex-wrap gap-1.5 flex-1">
                    <button 
                      v-for="val in [30, 40, 50, isNurseryClass ? subjectMaxScore : 60]" 
                      :key="'exam-' + val"
                      type="button"
                      :disabled="deadlinePassed"
                      @click="currentStudent.exam = val"
                      class="px-2.5 py-2 rounded-lg text-xs font-black border transition active:scale-95"
                      :class="currentStudent.exam === val ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100'"
                    >
                      {{ val }}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <!-- Previous / Next Student Stepper Buttons -->
            <div class="flex items-center gap-3 pt-3 border-t border-sky-100">
              <button
                @click="prevStudent"
                :disabled="currentCarouselIndex === 0"
                class="flex-1 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-40"
              >
                <ChevronLeft class="w-4 h-4" />
                <span>Prev Student</span>
              </button>

              <button
                @click="nextStudent"
                :disabled="currentCarouselIndex === students.length - 1"
                class="flex-1 h-12 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md disabled:opacity-40"
              >
                <span>Next Student</span>
                <ChevronRight class="w-4 h-4 text-white" />
              </button>
            </div>

          </div>
        </div>

        <!-- 2. MOBILE ALL CARDS LIST (Alternative Overview Mode) -->
        <div v-else class="space-y-3">
          <div 
            v-for="(st, idx) in students" 
            :key="st.studentId"
            class="bg-white p-4 rounded-2xl border-2 border-[#BAE6FD] shadow-sm space-y-3"
          >
            <!-- Student info -->
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm font-black text-slate-900 truncate">
                  {{ idx + 1 }}. {{ st.lastName }} {{ st.firstName }}
                </p>
                <p class="text-xs font-black text-[#0C4A6E] uppercase tracking-wider mt-0.5">{{ st.studentId }}</p>
              </div>

              <!-- Total Score Pill -->
              <div class="text-right">
                <span class="inline-block px-3 py-1 rounded-xl text-base font-black border"
                  :class="computeTotal(st) >= 50 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : computeTotal(st) >= 40 ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-red-50 text-red-800 border-red-300'"
                >
                  {{ computeTotal(st) }}/100
                </span>
              </div>
            </div>

            <!-- Score Inputs Grid -->
            <div class="grid grid-cols-3 gap-2">
              <div v-if="!isNurseryClass">
                <label class="block text-[11px] font-black uppercase tracking-wider text-[#0C4A6E] mb-1">1st CA /20</label>
                <input 
                  :value="st.ca1" 
                  type="number" 
                  inputmode="numeric" 
                  pattern="[0-9]*"
                  min="0" 
                  max="20" 
                  :disabled="deadlinePassed"
                  @focus="($event.target as HTMLInputElement).select()"
                  @input="st.ca1 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full h-11 px-2 bg-white text-slate-900 border-2 border-slate-300 rounded-xl text-center text-base font-black focus:border-sky-600 outline-none disabled:opacity-40" 
                  placeholder="0" 
                />
              </div>

              <div v-if="!isNurseryClass">
                <label class="block text-[11px] font-black uppercase tracking-wider text-[#0C4A6E] mb-1">2nd CA /20</label>
                <input 
                  :value="st.ca2" 
                  type="number" 
                  inputmode="numeric" 
                  pattern="[0-9]*"
                  min="0" 
                  max="20" 
                  :disabled="deadlinePassed"
                  @focus="($event.target as HTMLInputElement).select()"
                  @input="st.ca2 = clampCA(($event.target as HTMLInputElement).value)"
                  class="w-full h-11 px-2 bg-white text-slate-900 border-2 border-slate-300 rounded-xl text-center text-base font-black focus:border-sky-600 outline-none disabled:opacity-40" 
                  placeholder="0" 
                />
              </div>

              <div :class="{'col-span-3': isNurseryClass}">
                <label class="block text-[11px] font-black uppercase tracking-wider text-amber-950 mb-1">
                  Exam /{{ isNurseryClass ? subjectMaxScore : '60' }}
                </label>
                <input 
                  :value="st.exam" 
                  type="number" 
                  inputmode="numeric" 
                  pattern="[0-9]*"
                  min="0" 
                  :max="isNurseryClass ? subjectMaxScore : 60" 
                  :disabled="deadlinePassed"
                  @focus="($event.target as HTMLInputElement).select()"
                  @input="st.exam = clampExam(($event.target as HTMLInputElement).value)"
                  class="w-full h-11 px-2 bg-white text-slate-900 border-2 border-slate-300 rounded-xl text-center text-base font-black focus:border-amber-600 outline-none disabled:opacity-40" 
                  placeholder="0" 
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="bg-white p-10 rounded-2xl border-2 border-[#BAE6FD] text-center text-slate-600 font-bold uppercase tracking-wider text-xs">
        No students found for this class.
      </div>
    </div>

    <!-- Mobile sticky publish button -->
    <div class="sm:hidden fixed bottom-16 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t-2 border-[#BAE6FD] no-print z-40 shadow-lg">
      <button @click="handleSave" :disabled="saving || deadlinePassed"
        class="w-full flex items-center justify-center gap-3 rounded-xl bg-blue-800 hover:bg-blue-900 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 disabled:opacity-50">
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin text-white" />
        <Save v-else class="w-4 h-4 text-white" />
        <span class="text-white">{{ saving ? 'Saving…' : 'Publish Scores' }}</span>
      </button>
    </div>

    <!-- Bottom padding for mobile sticky bar -->
    <div class="sm:hidden h-36"></div>
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

@media print {
  .no-print {
    display: none !important;
  }
  body, html {
    background: white !important;
    color: black !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 13px !important;
    color: black !important;
  }
  th, td {
    border: 1px solid #000 !important;
    padding: 8px !important;
    color: black !important;
    background: white !important;
  }
  input {
    border: none !important;
    background: transparent !important;
    color: black !important;
    font-size: 13px !important;
    text-align: center !important;
    box-shadow: none !important;
  }
}
</style>
