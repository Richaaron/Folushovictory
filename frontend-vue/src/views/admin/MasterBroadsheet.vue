<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Download, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  ArrowLeft
} from 'lucide-vue-next'
import api from '../../services/api'
import PerformanceCharts from '../../components/analytics/PerformanceCharts.vue'
import { generateSessionOptions, getCurrentSession } from '../../utils/sessions'

const route = useRoute()
const classes = ref<any[]>([])
const selectedClassId = ref('')
const selectedSession = ref('')
const selectedTerm = ref('')
const broadsheet = ref<any>(null)
const loading = ref(false)
const error = ref('')
const sessionOptions = ref(generateSessionOptions().reverse())

const fixedClassId = computed(() => String(route.params.classId || route.query.classId || ''))
const fixedClassName = computed(() => String(route.query.className || 'Selected Class'))

const normalizeTerm = (value: any) => {
  const term = String(value || '').trim().toLowerCase()
  if (term === 'first' || term === 'first term' || term === '1') return '1st'
  if (term === 'second' || term === 'second term' || term === '2') return '2nd'
  if (term === 'third' || term === 'third term' || term === '3') return '3rd'
  if (['1st', '2nd', '3rd'].includes(term)) return term
  return ''
}

const fetchSchoolSettings = async () => {
  try {
    const { data } = await api.get('/api/config/school')
    selectedSession.value = String(route.query.session || data.currentSession || getCurrentSession())
    selectedTerm.value = normalizeTerm(route.query.term || data.currentTerm) || '3rd'
    if (selectedSession.value && !sessionOptions.value.includes(selectedSession.value)) {
      sessionOptions.value = [selectedSession.value, ...sessionOptions.value]
    }
  } catch (err) {
    console.error('Error fetching school settings:', err)
    selectedSession.value = getCurrentSession()
    selectedTerm.value = '3rd'
  }
}

const fetchClasses = async () => {
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = data.classes || []
  } catch (err) {
    // If user is a teacher, fetch assigned & form classes
    try {
      const [assignResp, formResp] = await Promise.all([
        api.get('/api/teacher/assignments'),
        api.get('/api/teacher/form-classes')
      ])
      const classMap = new Map<string, any>()
      ;(formResp.data?.classes || []).forEach((c: any) => {
        classMap.set(c.id, { id: c.id, name: c.name, level: c.level })
      })
      ;(assignResp.data?.assignments || []).forEach((a: any) => {
        if (!classMap.has(a.classId)) {
          classMap.set(a.classId, { id: a.classId, name: a.className, level: a.level })
        }
      })
      classes.value = Array.from(classMap.values())
    } catch (teacherErr) {
      console.error('Error fetching teacher classes:', teacherErr)
    }
  }

  // Pre-select if fixedClassId or query param is provided
  const targetId = fixedClassId.value || String(route.query.classId || '')
  if (targetId) {
    selectedClassId.value = targetId
    if (!classes.value.some(c => c.id === targetId)) {
      classes.value.unshift({ id: targetId, name: fixedClassName.value || 'Current Class' })
    }
  } else if (classes.value.length > 0 && !selectedClassId.value) {
    selectedClassId.value = classes.value[0].id
  }
}

const fetchBroadsheet = async () => {
  if (!selectedClassId.value || !selectedSession.value || !selectedTerm.value) return
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
  const classText = `${cls?.level || ''} ${cls?.name || ''} ${broadsheet.value?.class?.level || ''} ${broadsheet.value?.class?.name || ''}`
  return classText.toUpperCase().includes('SSS') || classText.toUpperCase().includes('SS ') || classText.toUpperCase().includes('SENIOR')
})

const isNursery = computed(() => {
  const classText = `${broadsheet.value?.class?.level || ''} ${broadsheet.value?.class?.name || ''}`
  return classText.toUpperCase().includes('NURSERY') || classText.toUpperCase().includes('PRE-NUR')
})

const escapeExcelCell = (value: any) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const formatTermLabel = (term: string) => {
  if (term === '1st') return 'First Term'
  if (term === '2nd') return 'Second Term'
  if (term === '3rd') return 'Third Term'
  return term
}

const safeFilePart = (value: any) => {
  return String(value || 'broadsheet')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
}

const handleExportExcel = () => {
  if (!broadsheet.value) return

  const sheet = broadsheet.value
  const school = sheet.school || {}
  const subjects = Array.isArray(sheet.subjects) ? sheet.subjects : []
  const students = Array.isArray(sheet.students) ? sheet.students : []
  const isTrait = String(sheet.class?.assessmentType || '').toUpperCase() === 'TRAIT'
  const className = sheet.class?.name || classes.value.find(c => c.id === selectedClassId.value)?.name || 'Class'
  const termLabel = formatTermLabel(selectedTerm.value)
  const subjectColumnSpan = isTrait ? 1 : 5
  const totalColumns = 3 + (subjects.length * subjectColumnSpan) + (isTrait ? 0 : 4)
  const contactLine = [school.address, school.phone, school.email, school.website].filter(Boolean).join(' | ')

  const headerRow = `
    <tr>
      <th rowspan="2">Position</th>
      <th rowspan="2">Student ID</th>
      <th rowspan="2">Student Name</th>
      ${subjects.map((subject: any) => `<th colspan="${subjectColumnSpan}">${escapeExcelCell(subject.name)}</th>`).join('')}
      ${isTrait ? '' : '<th colspan="4">Summary</th>'}
    </tr>
  `

  const subHeaderRow = `
    <tr>
      ${subjects.map(() => (
        isTrait
          ? '<th>Rating</th>'
          : '<th>1st CA</th><th>2nd CA</th><th>Exam</th><th>Total</th><th>Grade/Pos</th>'
      )).join('')}
      ${isTrait ? '' : '<th>Total</th><th>Average</th><th>Position</th><th>Result</th>'}
    </tr>
  `

  const bodyRows = students.map((student: any) => {
    const studentName = `${student.lastName || ''} ${student.firstName || ''}`.trim()
    const subjectCells = subjects.map((subject: any) => {
      if (isTrait) {
        const subjectScore = student.perSubject?.find((item: any) => item.subjectId === subject.id)
        return `<td>${escapeExcelCell(subjectScore?.rating || '')}</td>`
      }

      const subjectScore = student.scores?.[subject.id]
      if (!subjectScore) {
        return '<td></td><td></td><td></td><td></td><td></td>'
      }

      return `
        <td>${escapeExcelCell(subjectScore.ca1)}</td>
        <td>${escapeExcelCell(subjectScore.ca2)}</td>
        <td>${escapeExcelCell(subjectScore.exam)}</td>
        <td>${escapeExcelCell(subjectScore.total)}</td>
        <td>${escapeExcelCell(isSSS.value ? subjectScore.grade : (subjectScore.subjectPosition || ''))}</td>
      `
    }).join('')

    const summaryCells = isTrait
      ? ''
      : `
        <td>${escapeExcelCell(student.total)}</td>
        <td>${escapeExcelCell(student.average)}%</td>
        <td>${escapeExcelCell(student.position)}</td>
        <td>${Number(student.average) >= 40 ? 'PASS' : 'FAIL'}</td>
      `

    return `
      <tr>
        <td>${escapeExcelCell(student.position || '')}</td>
        <td>${escapeExcelCell(student.studentId)}</td>
        <td>${escapeExcelCell(studentName)}</td>
        ${subjectCells}
        ${summaryCells}
      </tr>
    `
  }).join('')

  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
          th, td { border: 1px solid #9ca3af; padding: 6px; text-align: center; }
          th { background: #e5e7eb; font-weight: bold; }
          .school { font-size: 20px; font-weight: bold; text-align: center; }
          .motto, .contact { text-align: center; }
          .meta { text-align: center; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td class="school" colspan="${totalColumns}">${escapeExcelCell(school.name || 'Folusho Victory Schools')}</td></tr>
          ${school.motto ? `<tr><td class="motto" colspan="${totalColumns}">${escapeExcelCell(school.motto)}</td></tr>` : ''}
          ${contactLine ? `<tr><td class="contact" colspan="${totalColumns}">${escapeExcelCell(contactLine)}</td></tr>` : ''}
          <tr><td class="meta" colspan="${totalColumns}">Master Broadsheet | Class: ${escapeExcelCell(className)} | Session: ${escapeExcelCell(selectedSession.value)} | Term: ${escapeExcelCell(termLabel)}</td></tr>
          ${headerRow}
          ${subHeaderRow}
          ${bodyRows}
        </table>
      </body>
    </html>
  `

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFilePart(className)}-${safeFilePart(selectedSession.value)}-${safeFilePart(termLabel)}-broadsheet.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

onMounted(async () => {
  await fetchSchoolSettings()
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
  <div class="space-y-6 sm:space-y-8 fade-in relative text-[#0F172A]">
    <!-- Top Header Card -->
    <section class="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-md no-print">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="flex items-center gap-3.5 sm:gap-4">
          <button 
            @click="$router.back()" 
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 border-2 border-[#BAE6FD] text-sky-800 hover:bg-sky-100 transition no-print shrink-0 active:scale-95 shadow-xs"
            aria-label="Back"
          >
            <ArrowLeft class="w-5 h-5 text-sky-800" />
          </button>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-xs">
                Official Examination Records
              </span>
              <span v-if="broadsheet?.published" class="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                Published
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-[#0C4A6E]">
              Master Broadsheet
            </h1>
            <p class="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
              Consolidated Academic Performance & Assessment Matrix
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="handleExportExcel"
            :disabled="!broadsheet || loading"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-40"
          >
            <Download class="w-4 h-4 text-white" /> 
            <span>Export Excel</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm no-print">
      <div class="space-y-1.5">
        <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E] block ml-1">Academic Session</label>
        <select 
          v-model="selectedSession" 
          class="w-full h-11 px-3.5 bg-white border-2 border-[#BAE6FD] focus:border-sky-600 rounded-xl text-xs sm:text-sm font-black text-[#0F172A] outline-none shadow-xs transition-colors"
        >
          <option v-for="session in sessionOptions" :key="session" :value="session">{{ session }}</option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E] block ml-1">Academic Term</label>
        <select 
          v-model="selectedTerm" 
          class="w-full h-11 px-3.5 bg-white border-2 border-[#BAE6FD] focus:border-sky-600 rounded-xl text-xs sm:text-sm font-black text-[#0F172A] outline-none shadow-xs transition-colors"
        >
          <option value="1st">First Term</option>
          <option value="2nd">Second Term</option>
          <option value="3rd">Third Term</option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E] block ml-1">Select Class</label>
        <select 
          v-model="selectedClassId" 
          class="w-full h-11 px-3.5 bg-white border-2 border-[#BAE6FD] focus:border-sky-600 rounded-xl text-xs sm:text-sm font-black text-[#0F172A] outline-none shadow-xs transition-colors"
        >
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
      </div>
    </div>

    <!-- Broadsheet Content Card -->
    <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] shadow-md overflow-hidden min-h-[500px]">
      
      <!-- Loading State -->
      <div v-if="loading" class="h-[500px] flex items-center justify-center">
        <div class="text-center">
          <Loader2 class="w-12 h-12 text-sky-700 animate-spin mx-auto mb-4" />
          <p class="text-xs font-black uppercase tracking-wider text-slate-700">Compiling Broadsheet Data...</p>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="h-[500px] flex items-center justify-center p-8 text-center">
        <div class="max-w-md">
          <AlertCircle class="w-16 h-16 text-red-600 mx-auto mb-4 opacity-70" />
          <h3 class="text-lg font-black text-[#0C4A6E] mb-2">Compilation Notice</h3>
          <p class="text-xs font-bold text-slate-700 mb-6">{{ error }}</p>
          <button 
            @click="fetchBroadsheet" 
            class="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            Retry Loading
          </button>
        </div>
      </div>

      <!-- Broadsheet Loaded Content -->
      <div v-else-if="broadsheet" class="print:overflow-visible broadsheet-print-section">
        
        <!-- School & Class Header Banner -->
        <div class="px-6 py-6 text-center border-b-2 border-[#BAE6FD] bg-sky-50/60">
          <h2 class="text-xl sm:text-2xl font-black text-[#0C4A6E] tracking-tight">
            {{ broadsheet.school?.name || 'Folusho Victory Schools' }}
          </h2>
          <p v-if="broadsheet.school?.motto" class="mt-1 text-xs font-black uppercase tracking-wider text-amber-700">
            {{ broadsheet.school.motto }}
          </p>
          <p v-if="broadsheet.school?.address" class="mt-1 text-xs font-bold text-slate-700">
            {{ broadsheet.school.address }}
          </p>
          <p class="mt-1 text-[11px] font-bold text-slate-600">
            <span v-if="broadsheet.school?.phone">{{ broadsheet.school.phone }}</span>
            <span v-if="broadsheet.school?.phone && broadsheet.school?.email"> • </span>
            <span v-if="broadsheet.school?.email">{{ broadsheet.school.email }}</span>
          </p>
          
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
            <span class="rounded-xl bg-white border-2 border-[#BAE6FD] px-3.5 py-1.5 text-[#0C4A6E] shadow-xs">
              Class: {{ broadsheet.class?.name }}
            </span>
            <span class="rounded-xl bg-white border-2 border-[#BAE6FD] px-3.5 py-1.5 text-[#0C4A6E] shadow-xs">
              Session: {{ selectedSession }}
            </span>
            <span class="rounded-xl bg-amber-50 border-2 border-amber-300 px-3.5 py-1.5 text-amber-900 shadow-xs">
              {{ formatTermLabel(selectedTerm) }}
            </span>
            <span class="rounded-xl bg-sky-100 border-2 border-sky-300 px-3.5 py-1.5 text-sky-950 shadow-xs">
              Enrolled: {{ broadsheet.students?.length || 0 }} Students
            </span>
          </div>
        </div>

        <!-- 1. DESKTOP BROADSHEET TABLE -->
        <div class="hidden overflow-x-auto lg:block print:block">
          <table class="w-full border-collapse print:table text-xs">
            <thead>
              <!-- Top Row: Subject Names Header -->
              <tr class="bg-sky-900 text-white">
                <th rowspan="2" class="px-4 py-4 border-b-2 border-r border-sky-800 text-[10px] font-black uppercase tracking-wider min-w-[200px] text-left">
                  Student Profile
                </th>
                <th 
                  v-for="sub in broadsheet.subjects" 
                  :key="sub.id" 
                  colspan="5" 
                  class="px-2 py-3 border-b border-r border-sky-800 text-[11px] font-black uppercase tracking-wider text-amber-300 text-center"
                >
                  {{ sub.name }}
                </th>
                <th colspan="4" class="px-4 py-3 border-b border-sky-800 text-[11px] font-black uppercase tracking-wider text-white text-center bg-sky-950">
                  Summary
                </th>
              </tr>

              <!-- Sub-header Row: Assessment Components -->
              <tr class="bg-sky-800 text-sky-100">
                <template v-for="sub in broadsheet.subjects" :key="sub.id + '-sub'">
                  <th class="px-1 py-2 border-b-2 border-r border-sky-700 text-[9px] font-extrabold text-center w-12">1st CA</th>
                  <th class="px-1 py-2 border-b-2 border-r border-sky-700 text-[9px] font-extrabold text-center w-12">2nd CA</th>
                  <th class="px-1 py-2 border-b-2 border-r border-sky-700 text-[9px] font-extrabold text-center w-12">Exam</th>
                  <th class="px-1 py-2 border-b-2 border-r border-sky-700 text-[9px] font-black text-amber-300 text-center w-12 bg-sky-900">Total</th>
                  <th class="px-1 py-2 border-b-2 border-r border-sky-700 text-[9px] font-extrabold text-center w-10">
                    {{ isSSS ? 'Grade' : 'Pos' }}
                  </th>
                </template>
                <th class="px-2 py-2 border-b-2 border-r border-sky-700 text-[9px] font-black text-white text-center bg-sky-950">TOT</th>
                <th class="px-2 py-2 border-b-2 border-r border-sky-700 text-[9px] font-black text-amber-300 text-center bg-sky-950">AVG</th>
                <th class="px-2 py-2 border-b-2 border-r border-sky-700 text-[9px] font-black text-white text-center bg-sky-950">POS</th>
                <th class="px-2 py-2 border-b-2 border-sky-700 text-[9px] font-black text-white text-center bg-sky-950">RES</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-200">
              <tr 
                v-for="student in broadsheet.students" 
                :key="student.studentId" 
                class="hover:bg-sky-50/50 transition-colors bg-white"
              >
                <!-- Student Profile Cell -->
                <td class="px-4 py-3.5 border-r border-slate-200 bg-white">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xs font-black text-amber-700 w-5 text-center">
                      #{{ student.position || '-' }}
                    </span>
                    <div 
                      @click="$router.push({ 
                        name: 'student-report', 
                        params: { studentId: student.studentId },
                        query: { session: selectedSession, term: selectedTerm }
                      })"
                      class="cursor-pointer group/name"
                    >
                      <p class="text-xs font-black text-[#0C4A6E] uppercase truncate max-w-[150px] group-hover/name:text-amber-600 transition-colors">
                        {{ student.lastName }} {{ student.firstName }}
                      </p>
                      <p class="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                        {{ student.studentId }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Subject Score Cells -->
                <template v-for="sub in broadsheet.subjects" :key="sub.id + '-score'">
                  <template v-if="student.scores && student.scores[sub.id]">
                    <td class="px-1 py-3 border-r border-slate-200 text-center text-xs font-bold text-slate-800">
                      {{ student.scores[sub.id].ca1 }}
                    </td>
                    <td class="px-1 py-3 border-r border-slate-200 text-center text-xs font-bold text-slate-800">
                      {{ student.scores[sub.id].ca2 }}
                    </td>
                    <td class="px-1 py-3 border-r border-slate-200 text-center text-xs font-bold text-slate-800">
                      {{ student.scores[sub.id].exam }}
                    </td>
                    <td class="px-1 py-3 border-r border-slate-200 text-center text-xs font-black text-[#0C4A6E] bg-sky-50">
                      {{ student.scores[sub.id].total }}
                    </td>
                    <td class="px-1 py-3 border-r border-slate-200 text-center text-xs font-black">
                      <span v-if="isSSS" :class="student.scores[sub.id].grade === 'F' ? 'text-red-700' : 'text-emerald-800'">
                        {{ student.scores[sub.id].grade }}
                      </span>
                      <span v-else class="text-slate-700">
                        {{ student.scores[sub.id].subjectPosition || '-' }}
                      </span>
                    </td>
                  </template>
                  <template v-else>
                    <td colspan="5" class="px-1 py-3 border-r border-slate-200 text-center text-slate-400 font-bold">
                      -
                    </td>
                  </template>
                </template>

                <!-- Summary Cells -->
                <td class="px-2 py-3.5 border-r border-slate-200 text-center text-xs font-black text-slate-900 bg-sky-50/30">
                  {{ student.total }}
                </td>
                <td class="px-2 py-3.5 border-r border-slate-200 text-center text-xs font-black text-amber-700 bg-amber-50/30">
                  {{ student.average }}%
                </td>
                <td class="px-2 py-3.5 border-r border-slate-200 text-center text-xs font-black text-[#0C4A6E] bg-sky-50/30">
                  {{ student.position }}
                </td>
                <td class="px-2 py-3.5 text-center">
                  <span 
                    class="text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider" 
                    :class="student.average >= 40 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'"
                  >
                    {{ student.average >= 40 ? 'PASS' : 'FAIL' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. MOBILE BROADSHEET CARDS (Native for smartphone users) -->
        <div class="space-y-4 p-3 sm:p-5 lg:hidden print:hidden">
          <article
            v-for="student in broadsheet.students"
            :key="student.studentId"
            class="rounded-2xl border-2 border-[#BAE6FD] bg-white p-4 shadow-sm space-y-3.5"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-3 border-b-2 border-sky-100 pb-3">
              <button
                type="button"
                class="min-w-0 text-left"
                :aria-label="`Open report for ${student.lastName} ${student.firstName}`"
                @click="$router.push({
                  name: 'student-report',
                  params: { studentId: student.studentId },
                  query: { session: selectedSession, term: selectedTerm }
                })"
              >
                <span class="block truncate text-sm font-black uppercase text-[#0C4A6E] hover:text-amber-600 transition-colors">
                  {{ student.lastName }} {{ student.firstName }}
                </span>
                <span class="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {{ student.studentId }}
                </span>
              </button>
              
              <span class="shrink-0 rounded-xl bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-black text-amber-900 shadow-xs">
                #{{ student.position || '-' }} in Class
              </span>
            </div>

            <!-- Student Summary Stats Row -->
            <div class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div class="rounded-xl bg-sky-50 border border-sky-200 p-2.5">
                <span class="block text-[9px] font-black uppercase tracking-wider text-slate-600">Total Marks</span>
                <strong class="mt-0.5 block text-base font-black text-slate-900">{{ student.total }}</strong>
              </div>
              <div class="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                <span class="block text-[9px] font-black uppercase tracking-wider text-slate-600">Average</span>
                <strong class="mt-0.5 block text-base font-black text-amber-700">{{ student.average }}%</strong>
              </div>
              <div class="rounded-xl bg-sky-50 border border-sky-200 p-2.5">
                <span class="block text-[9px] font-black uppercase tracking-wider text-slate-600">Position</span>
                <strong class="mt-0.5 block text-base font-black text-[#0C4A6E]">#{{ student.position || '-' }}</strong>
              </div>
              <div class="rounded-xl border p-2.5" :class="student.average >= 40 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'">
                <span class="block text-[9px] font-black uppercase tracking-wider text-slate-600">Terminal Result</span>
                <strong class="mt-0.5 block text-xs font-black uppercase" :class="student.average >= 40 ? 'text-emerald-800' : 'text-red-800'">
                  {{ student.average >= 40 ? 'PASS' : 'FAIL' }}
                </strong>
              </div>
            </div>

            <!-- Subject Breakdown Items -->
            <div class="space-y-2 pt-1">
              <p class="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Subject Performance Details</p>
              
              <div
                v-for="subject in broadsheet.subjects"
                :key="subject.id"
                class="rounded-xl border border-sky-200 bg-sky-50/40 p-3 hover:bg-sky-50 transition-colors"
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span class="text-xs font-black text-[#0C4A6E]">{{ subject.name }}</span>
                  <span class="shrink-0 text-xs font-black px-2.5 py-0.5 rounded-lg border"
                    :class="student.scores?.[subject.id] ? 'bg-sky-100 text-[#0C4A6E] border-sky-300' : 'bg-slate-100 text-slate-500 border-slate-200'"
                  >
                    {{ student.scores?.[subject.id]?.total ?? '-' }}/{{ student.scores?.[subject.id]?.maxScore || subject.maxScore || 100 }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-bold text-slate-700 sm:grid-cols-4">
                  <span v-if="!isNursery">1st CA: <strong class="text-slate-900 font-black">{{ student.scores?.[subject.id]?.ca1 ?? '-' }}</strong></span>
                  <span v-if="!isNursery">2nd CA: <strong class="text-slate-900 font-black">{{ student.scores?.[subject.id]?.ca2 ?? '-' }}</strong></span>
                  <span>Exam: <strong class="text-slate-900 font-black">{{ student.scores?.[subject.id]?.exam ?? '-' }}</strong></span>
                  <span>
                    {{ isSSS ? 'Grade' : 'Position' }}: 
                    <strong class="font-black" :class="isSSS && student.scores?.[subject.id]?.grade === 'F' ? 'text-red-700' : 'text-emerald-800'">
                      {{ isSSS ? (student.scores?.[subject.id]?.grade || '-') : (student.scores?.[subject.id]?.subjectPosition || '-') }}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- Empty Select Prompt -->
      <div v-else class="h-[500px] flex items-center justify-center p-8 text-center text-slate-600">
        <div class="max-w-xs">
          <FileSpreadsheet class="w-16 h-16 mx-auto mb-4 text-sky-400 opacity-60" />
          <p class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Select class and session parameters</p>
          <p class="text-xs font-bold text-slate-600 mt-1">Choose an academic session, term, and class above to compile the broadsheet matrix.</p>
        </div>
      </div>
    </div>

    <!-- Visual Analytics -->
    <div v-if="broadsheet && !loading && !error" class="fade-in no-print">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base sm:text-lg font-black text-[#0C4A6E] flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-amber-600" />
          <span>Visual Performance Insights</span>
        </h2>
        <p class="text-xs font-bold text-slate-600">Class Performance Distribution</p>
      </div>
      <PerformanceCharts :students="broadsheet.students" :subjects="broadsheet.subjects" class="no-print" />
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print { display: none !important; }
  body { background: white !important; }
  table { font-size: 8pt; width: 100%; border: 1pt solid #ccc; }
  th, td { border: 1pt solid #ccc !important; padding: 4pt !important; }
  .broadsheet-print-section {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    overflow: visible !important;
  }
}

/* Custom scrollbar for broadsheet table */
.overflow-x-auto::-webkit-scrollbar { height: 8px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #7dd3fc; }
</style>
