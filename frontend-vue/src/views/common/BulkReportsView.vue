<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Download,
  Loader2,
  Mail,
  Square,
  UserX,
  Award,
  TrendingUp,
  Star,
  Calendar,
  Users
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const classId = route.params.classId as string
const session = ref((route.query.session as string) || '2026/2027')
const term = ref((route.query.term as string) || '2nd')

const classInfo = ref<any>(null)
const students = ref<any[]>([])
const selectedIds = ref<Set<string>>(new Set())
const owingOverrides = ref<Record<string, boolean>>({})
const reports = ref<any[]>([])
const loading = ref(true)
const generating = ref(false)

const notifying = ref(false)
const exportingPDF = ref(false)
const mobilePrintReady = ref(false)
const error = ref('')
const notice = ref('')
const emailSummary = ref<any>(null)

const selectedStudents = computed(() => students.value.filter((student) => selectedIds.value.has(student.studentId)))
const selectedCount = computed(() => selectedIds.value.size)
const owingSelected = computed(() => selectedStudents.value.filter((student) => isOwing(student)))
const clearedSelected = computed(() => selectedStudents.value.filter((student) => !isOwing(student)))
const selectedReports = computed(() => reports.value.filter((report) => selectedIds.value.has(report.student?.studentId)))
const printableReports = computed(() => selectedReports.value.filter((report) => !isOwing(report.student)))
const withheldReports = computed(() => selectedReports.value.filter((report) => isOwing(report.student)).map(r => r.student))

const fetchStudents = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/api/results/class/${classId}/report-students`)
    classInfo.value = data.class
    students.value = data.students || []
    selectedIds.value = new Set(students.value.map((student) => student.studentId))
    owingOverrides.value = Object.fromEntries(
      students.value.map((student) => [student.studentId, Boolean(student.feeStatus?.owesFees)])
    )
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load students for bulk printing.'
  } finally {
    loading.value = false
  }
}

const isOwing = (student: any) => {
  const id = student?.studentId
  if (id && owingOverrides.value[id] !== undefined) return owingOverrides.value[id]
  return Boolean(student?.feeStatus?.owesFees)
}

const toggleStudent = (studentId: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(studentId)) next.delete(studentId)
  else next.add(studentId)
  selectedIds.value = next
}

const selectAll = () => {
  selectedIds.value = new Set(students.value.map((student) => student.studentId))
}

const clearSelection = () => {
  selectedIds.value = new Set()
}

const toggleOwing = (studentId: string) => {
  owingOverrides.value = {
    ...owingOverrides.value,
    [studentId]: !owingOverrides.value[studentId]
  }
}

const getPositionSuffix = (pos: number) => {
  if (!pos) return 'N/A'
  const tens = pos % 100
  if (tens >= 11 && tens <= 13) return `${pos}th`
  if (pos % 10 === 1) return `${pos}st`
  if (pos % 10 === 2) return `${pos}nd`
  if (pos % 10 === 3) return `${pos}rd`
  return `${pos}th`
}

const isPositionBasedClass = (report: any) => {
  const classLabel = `${report.class?.level || ''} ${report.class?.name || ''}`.toUpperCase()
  if (classLabel.includes('SSS') || classLabel.includes('PRE-NURSERY') || classLabel.includes('PRE NURSERY') || classLabel.includes('PRE_NURSERY')) {
    return false
  }
  return classLabel.includes('NURSERY') || classLabel.includes('PRIMARY') || classLabel.includes('PRY') || classLabel.includes('JSS')
}

const getOverallGrade = (report: any) => {
  if (report.result?.overallGrade) return report.result.overallGrade
  const average = Number(report.result?.average || 0)
  if (average >= 80) return 'A'
  if (average >= 70) return 'B'
  if (average >= 60) return 'C'
  if (average >= 50) return 'D'
  if (average >= 40) return 'E'
  if (average > 0) return 'F'
  return 'N/A'
}

const getGradeColor = (grade: string) => {
  if (!grade) return 'grade-neutral'
  if (grade === 'F') return 'grade-danger'
  if (['A', 'A+', 'A-'].includes(grade)) return 'grade-excellent'
  if (['B', 'B+', 'B-'].includes(grade)) return 'grade-strong'
  if (['C', 'C+', 'C-'].includes(grade)) return 'grade-fair'
  return 'grade-neutral'
}

const getSchoolWebsite = (report: any) => report.school?.website?.replace(/^https?:\/\//, '') || ''
const getFormTeacherName = (report: any) => report.formTeacher?.displayName || `${report.class?.name || 'Class'} Form Teacher`


const handlePrintAll = (existingPopup?: Window | null) => {
  const popup = existingPopup || window.open('', '_blank', 'width=900,height=700')
  if (!popup) {
    alert('Please allow popups for this site to download the PDF.')
    return
  }
  
  try {
    const el = document.getElementById('print-area-section')
    if (!el) {
      popup.document.write('<h2>Error: Document not ready.</h2>')
      return
    }

    const filename = `bulk-reports-${classInfo.value?.name || 'class'}-${session.value.replace(/\//g, '-')}`

    // Clone the element so we can strip out the no-print action bar
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.no-print').forEach(n => n.remove())

    // Extract all scoped styles from this page (captures the Vue scoped CSS)
    const styles = Array.from(document.querySelectorAll('style'))
      .map(s => s.innerText || s.textContent || '')
      .join('\n')

    // Extract all CSS rules from the main document to inject them synchronously
    let allCss = ''
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            allCss += rule.cssText + '\n'
          }
        } catch (e) {
          console.warn('Could not read cssRules from sheet', e)
        }
      }
    } catch (e) {
      console.error('Error extracting stylesheets', e)
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    ${allCss}
    ${styles}

    /* ── BASE SCREEN STYLES FOR POPUP PREVIEW ── */
    @page { size: A4 portrait; margin: 5mm; }
    body { background: white !important; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .bulk-report-page { width: 200mm !important; max-width: none; padding: 0 !important; margin: 0 auto !important; }
    .print-area { display: block; width: 200mm !important; margin: 0 auto !important; }
    .print-card {
      box-sizing: border-box;
      display: block;
      width: 200mm;
      margin: 0 auto;
      padding: 0;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-card:last-child { page-break-after: auto !important; break-after: auto !important; }
    .withheld-page { page-break-before: always !important; break-before: page !important; }

    /* ── PRINT-TIME OVERRIDES (highest priority) ── */
    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      body { margin: 0 !important; padding: 0 !important; background: white !important; }
      .no-print { display: none !important; }
      .print-area { display: block !important; width: 200mm !important; margin: 0 auto !important; }
      .print-card {
        display: block !important;
        width: 200mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        /* Scale down to force fit on one A4 page */
        zoom: 0.90 !important;
        transform: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
      }
      .print-card:last-child { page-break-after: auto !important; break-after: auto !important; }
      .withheld-page { page-break-before: always !important; break-before: page !important; }
      /* Hide unwanted sections in print */
      .school-contact { display: none !important; }
      .report-footer { display: none !important; }
      /* Enlarge table and remarks to fill the freed vertical space */
      .result-section { margin-top: 25px !important; }
      .result-section th { padding: 18px 10px !important; font-size: 11px !important; }
      .result-section td { padding: 18px 10px !important; font-size: 14px !important; }
      .remarks-section { margin-top: 25px !important; gap: 20px !important; }
      .remark-box { padding: 24px 20px !important; }
      .remark-box p { font-size: 13px !important; line-height: 1.6 !important; }
      .signature-area { margin-top: 20px !important; }
      .signature-image { height: 45px !important; }
      /* Preserve all colors */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-area">
    ${clone.innerHTML}
  </div>
  <script>
    // Wait for full render before printing (window.onload fires too early for large documents)
    setTimeout(function() {
      window.focus();
      window.print();
      window.onafterprint = function() { window.close(); };
    }, 1500);
  <\/script>
</body>
</html>`

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
  } catch (err: any) {
    popup.document.open()
    popup.document.write('<html><body style="font-family:sans-serif;padding:2rem;color:red;"><h2>Error</h2><p>' + err.message + '</p><pre>' + err.stack + '</pre></body></html>')
    popup.document.close()
  }
}

const notifyParents = async () => {
  if (!selectedCount.value) {
    error.value = 'Select at least one student before sending parent notifications.'
    return
  }

  if (!confirm(`Send result notification emails to parents of ${selectedCount.value} selected student(s)?`)) return

  notifying.value = true
  error.value = ''
  notice.value = ''
  emailSummary.value = null
  try {
    const { data } = await api.post(`/api/results/class/${classId}/notify-parents`, {
      session: session.value,
      term: term.value,
      studentIds: Array.from(selectedIds.value)
    })
    emailSummary.value = data
    notice.value = `Emails sent: ${data.sent?.length || 0}. Skipped: ${data.skipped?.length || 0}. Failed: ${data.failed?.length || 0}.`
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to send parent notifications.'
  } finally {
    notifying.value = false
  }
}

// ── PDF Export ──────────────────────────────────────────────────────────────

const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)

const handleExportPDF = async () => {
  const studentIds = Array.from(selectedIds.value)
  if (!studentIds.length) {
    error.value = 'Select at least one student before exporting.'
    return
  }

  exportingPDF.value = true
  generating.value = true
  error.value = ''

  try {
    // Always re-fetch reports fresh
    const res = await api.post(`/api/results/class/${classId}/bulk-reports`, {
      session: session.value,
      term: term.value,
      studentIds
    })
    reports.value = (res.data.reports || []).map((report: any) => ({
      ...report,
      feeStatus: {
        ...(report.feeStatus || {}),
        owesFees: Boolean(owingOverrides.value[report.student?.studentId])
      },
      student: {
        ...report.student,
        feeStatus: {
          ...(report.student?.feeStatus || {}),
          owesFees: Boolean(owingOverrides.value[report.student?.studentId])
        }
      }
    }))

    generating.value = false

    // Wait for Vue to render the report cards in the DOM
    await nextTick()
    // Give Vue extra time to paint all report cards (especially large classes)
    await new Promise(r => setTimeout(r, 1500))

    if (isMobile()) {
      mobilePrintReady.value = true
    } else {
      // For desktop, open popup and print
      handlePrintAll()
    }
    exportingPDF.value = false
  } catch (err: any) {
    generating.value = false
    error.value = err.response?.data?.error || 'Failed to export PDF. Please try again.'
    exportingPDF.value = false
  }
}

// Mobile: print using the popup (opened synchronously from button click)
const executeMobilePrint = () => {
  handlePrintAll()
  mobilePrintReady.value = false
}

onMounted(fetchStudents)
</script>

<template>
  <div class="bulk-report-page mx-auto max-w-7xl space-y-6 p-4 fade-in">
    <div class="no-print flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-950/90 p-4 shadow-xl shadow-black/20 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/60 text-slate-200 transition hover:text-royal-purple border border-slate-700/60">
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-white">Bulk Result Printing</h1>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ classInfo?.name || 'Class' }} Result Cards</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
        <select v-model="session" class="w-full sm:w-auto rounded-xl bg-slate-900/60 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none text-white border border-slate-700/60">
          <option>2026/2027</option>
          <option>2025/2026</option>
          <option>2024/2025</option>
          <option>2023/2024</option>
        </select>
        <select v-model="term" class="w-full sm:w-auto rounded-xl bg-slate-900/60 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none text-white border border-slate-700/60">
          <option value="1st">First Term</option>
          <option value="2nd">Second Term</option>
          <option value="3rd">Third Term</option>
          <option value="First">First</option>
          <option value="Second">Second</option>
          <option value="Third">Third</option>
        </select>

        <button @click="notifyParents" :disabled="notifying || selectedCount === 0" class="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50">
          <Loader2 v-if="notifying" class="h-4 w-4 animate-spin" />
          <Mail v-else class="h-4 w-4" />
          Email Parents
        </button>

        <button @click="handleExportPDF" :disabled="exportingPDF || selectedCount === 0" class="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-rose-600 disabled:opacity-50">
          <Loader2 v-if="exportingPDF" class="h-4 w-4 animate-spin" />
          <Download v-else class="h-4 w-4" />
          Export PDF
        </button>
      </div>
    </div>

    <div v-if="loading" class="no-print flex h-96 flex-col items-center justify-center gap-4">
      <Loader2 class="h-12 w-12 animate-spin text-royal-purple" />
      <p class="text-sm font-bold text-slate-400">Loading students...</p>
    </div>

    <!-- Generating overlay -->
    <div v-if="generating" class="no-print fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900 p-10 shadow-2xl">
        <Loader2 class="h-14 w-14 animate-spin text-royal-purple" />
        <p class="text-base font-black text-white">Generating Report Cards</p>
        <p class="text-xs font-bold text-slate-400">Please wait while we fetch results for {{ selectedCount }} student(s)...</p>
      </div>
    </div>

    <!-- Mobile Print Ready Overlay -->
    <div v-if="mobilePrintReady" class="no-print fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-md px-4">
      <div class="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-emerald-700/50 bg-slate-900 p-8 shadow-2xl text-center">
        <div class="rounded-full bg-emerald-500/20 p-4">
          <CheckSquare class="h-10 w-10 text-emerald-400" />
        </div>
        <div>
          <h2 class="text-xl font-black text-white mb-2">Reports Ready!</h2>
          <p class="text-sm font-bold text-slate-400">The report cards have been generated and are ready to save.</p>
        </div>
        <div class="w-full space-y-3">
          <button @click="executeMobilePrint" class="w-full rounded-xl bg-royal-purple py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-purple-600">
            Open Print / PDF Dialog
          </button>
          <button @click="mobilePrintReady = false" class="w-full rounded-xl bg-slate-800 py-3 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-slate-700 hover:text-white">
            Cancel
          </button>
        </div>
        <p class="text-[10px] text-slate-500 mt-2">
          Note: In the next screen, you can choose "Save to Files" or select a printer.
        </p>
      </div>
    </div>

    <div v-if="error" class="no-print rounded-2xl border border-red-700/50 bg-red-900/20 p-6 text-red-300">
      <div class="flex items-center gap-3">
        <AlertCircle class="h-5 w-5" />
        <p class="text-sm font-bold">{{ error }}</p>
      </div>
    </div>

    <template v-if="!generating && !error">
      <div v-if="notice" class="no-print rounded-2xl border border-emerald-700/50 bg-emerald-900/20 p-5 text-emerald-200">
        <div class="flex items-center gap-3">
          <Mail class="h-5 w-5" />
          <p class="text-sm font-bold">{{ notice }}</p>
        </div>
        <div v-if="emailSummary?.skipped?.length || emailSummary?.failed?.length" class="mt-3 space-y-1 text-xs font-bold text-slate-300">
          <p v-for="item in emailSummary.skipped || []" :key="`skipped-${item.studentId}`">Skipped {{ item.studentName }}: {{ item.reason }}</p>
          <p v-for="item in emailSummary.failed || []" :key="`failed-${item.studentId}`">Failed {{ item.studentName }}: {{ item.error }}</p>
        </div>
      </div>

      <div class="no-print grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-700/60 bg-slate-950/90 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Students</p>
          <strong class="mt-2 block text-3xl font-black text-white">{{ selectedCount }}</strong>
        </div>
        <div class="rounded-2xl border border-emerald-700/50 bg-emerald-900/20 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Ready To Print</p>
          <strong class="mt-2 block text-3xl font-black text-emerald-200">{{ clearedSelected.length }}</strong>
        </div>
        <div class="rounded-2xl border border-amber-700/50 bg-amber-900/20 p-5 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-widest text-amber-300">Fees Owing</p>
          <strong class="mt-2 block text-3xl font-black text-amber-200">{{ owingSelected.length }}</strong>
        </div>
      </div>

      <div class="no-print rounded-2xl border border-slate-700/60 bg-slate-950/90 shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 p-4">
          <p class="text-xs font-black uppercase tracking-widest text-slate-400">Choose students and mark fee status</p>
          <div class="flex gap-2">
            <button @click="selectAll" class="rounded-lg bg-slate-900/60 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white border border-slate-700/60">Select All</button>
            <button @click="clearSelection" class="rounded-lg bg-slate-900/60 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white border border-slate-700/60">Clear</button>
          </div>
        </div>
        <div class="max-h-[520px] overflow-auto">
          <table class="w-full text-left">
            <thead class="sticky top-0 bg-slate-900/60">
              <tr>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Print</th>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/40">
              <tr v-for="student in students" :key="student.studentId">
                <td class="px-5 py-4">
                  <button @click="toggleStudent(student.studentId)" class="text-royal-purple">
                    <CheckSquare v-if="selectedIds.has(student.studentId)" class="h-5 w-5" />
                    <Square v-else class="h-5 w-5" />
                  </button>
                </td>
                <td class="px-5 py-4">
                  <p class="text-sm font-black text-white">{{ student.lastName }} {{ student.firstName }}</p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ student.studentId }}</p>
                </td>
                <td class="px-5 py-4">
                  <button
                    @click="toggleOwing(student.studentId)"
                    class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                    :class="isOwing(student) ? 'bg-amber-700/20 text-amber-200 border border-amber-700/30' : 'bg-emerald-700/20 text-emerald-200 border border-emerald-700/30'"
                  >
                    {{ isOwing(student) ? 'Owing Fees' : 'Fees Cleared' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="reports.length" id="print-area-section" class="print-area space-y-8">
        <article v-for="report in printableReports" :key="report.student.studentId" class="report-card print-card">
          <!-- Background Watermark Logo -->
          <div class="watermark-logo">
            <img :src="report.school?.logoUrl || '/logo.png'" :alt="report.school?.name || 'School logo'" />
          </div>

          <!-- Top Neon Line -->
          <div class="report-top-line"></div>

          <!-- Header -->
          <header class="report-header">
            <div class="brand-panel">
              <div class="logo-mark">
                <img :src="report.school?.logoUrl || '/logo.png'" :alt="report.school?.name || 'School logo'" />
              </div>
              <div class="brand-copy">
                <p class="document-kicker">
                  <Star class="inline h-3 w-3" /> Official Academic Report
                </p>
                <h1>{{ report.school?.name || 'School Name' }}</h1>
                <p class="motto">{{ report.school?.motto || 'Excellence in Education' }}</p>
              </div>
            </div>

            <div class="term-panel">
              <Calendar class="mb-2 h-6 w-6" />
              <span>Academic Session</span>
              <strong>{{ report.session }}</strong>
              <small>{{ report.term }} Term</small>
            </div>
          </header>

          <!-- School Contact -->
          <section class="school-contact" aria-label="School contact information">
            <div v-if="report.school?.address" class="contact-item">
              <span class="contact-label">Address</span>
              <p>{{ report.school.address }}</p>
            </div>
            <div v-if="report.school?.phone" class="contact-item">
              <span class="contact-label">Phone</span>
              <p>{{ report.school.phone }}</p>
            </div>
            <div v-if="report.school?.email" class="contact-item">
              <span class="contact-label">Email</span>
              <p>{{ report.school.email }}</p>
            </div>
            <div v-if="getSchoolWebsite(report)" class="contact-item">
              <span class="contact-label">Website</span>
              <p>{{ getSchoolWebsite(report) }}</p>
            </div>
          </section>

          <!-- Student Info -->
          <section class="student-band">
            <div class="info-card">
              <span>Student Name</span>
              <strong>{{ report.student.lastName }} {{ report.student.firstName }}</strong>
            </div>
            <div class="info-card">
              <span>Student ID</span>
              <strong>{{ report.student.studentId }}</strong>
            </div>
            <div class="info-card">
              <span>Class</span>
              <strong>{{ report.class.name }} ({{ students?.length || 'N/A' }} Students)</strong>
            </div>
            <div class="info-card">
              <span>Gender</span>
              <strong>{{ report.student.gender || 'N/A' }}</strong>
            </div>
            <div class="info-card">
              <span>Status</span>
              <strong>Fees Cleared</strong>
            </div>
          </section>

          <!-- Performance Summary -->
          <section class="performance-summary">
            <div class="stat-card stat-purple">
              <Award class="stat-icon" />
              <span>Total Scores</span>
              <strong>{{ report.result?.total ?? 'N/A' }}</strong>
            </div>
            <div class="stat-card stat-blue">
              <TrendingUp class="stat-icon" />
              <span>Average</span>
              <strong>{{ report.result?.average ?? 'N/A' }}%</strong>
            </div>
            <div class="stat-card stat-cyan">
              <Star class="stat-icon" />
              <span>{{ isPositionBasedClass(report) ? 'Position' : 'Grade' }}</span>
              <strong>{{ isPositionBasedClass(report) ? getPositionSuffix(report.result?.position) : getOverallGrade(report) }}</strong>
            </div>
            <div class="stat-card stat-pink">
              <Users class="stat-icon" />
              <span>Total Students</span>
              <strong>{{ students?.length || 'N/A' }}</strong>
            </div>
          </section>

          <!-- Academic Performance Table -->
          <section class="result-section">
            <div class="section-title">
              <span>Academic Performance</span>
              <strong>{{ report.term }} Term Results</strong>
            </div>

            <div class="table-frame">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>1st CA</th>
                    <th>2nd CA</th>
                    <th>Exam</th>
                    <th>Total Scores</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sub in report.result?.perSubject || []" :key="sub.subjectId">
                    <td class="subject-name">{{ sub.subjectName }}</td>
                    <td>{{ sub.ca1 ?? '-' }}</td>
                    <td>{{ sub.ca2 ?? '-' }}</td>
                    <td>{{ sub.exam ?? '-' }}</td>
                    <td class="total-cell">{{ sub.total ?? '-' }}</td>
                    <td><span class="grade-badge" :class="getGradeColor(sub.grade)">{{ sub.grade || '-' }}</span></td>
                    <td>{{ sub.remark || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Cumulative Record -->
          <section v-if="report.cumulative" class="cumulative-section">
            <div class="section-title">
              <span>Cumulative Record</span>
              <strong>Session Progress</strong>
            </div>
            <div class="cumulative-grid">
              <div v-for="item in report.cumulative.previousTerms" :key="item.term" class="cumulative-card">
                <span>{{ item.term }} Term</span>
                <strong>{{ item.average }}%</strong>
                <small>Total: {{ item.total }}</small>
              </div>
              <div v-if="report.cumulative.sessionAverage" class="cumulative-card cumulative-highlight">
                <span>Session Average</span>
                <strong>{{ report.cumulative.sessionAverage }}%</strong>
                <small>Total: {{ report.cumulative.sessionTotal }}</small>
              </div>
            </div>
          </section>

          <!-- Remarks Section -->
          <section class="remarks-section">
            <div class="remark-box teacher-box">
              <span>Class Teacher's Remark</span>
              <p>{{ report.teacherRemark || 'Remark will be added by the class teacher.' }}</p>
              <div class="signature-area">
                <div v-if="report.formTeacher?.signatureUrl" class="signature-image">
                  <img :src="report.formTeacher.signatureUrl" alt="Teacher signature" />
                </div>
                <div v-else class="signature-line"></div>
                <div class="teacher-name">{{ getFormTeacherName(report) }}</div>
                <small>Class Teacher's Signature & Date</small>
              </div>
            </div>

            <div class="remark-box principal-box">
              <span>Principal's Remark</span>
              <p>{{ report.principalRemark || 'Highly commendable academic performance.' }}</p>
              <div class="signature-area">
                <div v-if="report.school?.principalSignatureUrl" class="signature-image">
                  <img :src="report.school.principalSignatureUrl" alt="Principal signature" />
                </div>
                <div v-else class="signature-line"></div>
                <strong>{{ report.school?.principalName || 'Principal' }}</strong>
                <small>Principal's Signature & Stamp</small>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <footer class="report-footer">
            <div class="footer-brand">
              <strong>{{ report.school?.name || 'School Name' }}</strong>
              <span>Academic Excellence</span>
            </div>
            <div class="footer-copy">
              <p>Generated on {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            </div>
          </footer>

          <!-- Bottom Neon Line -->
          <div class="report-bottom-line"></div>
        </article>

        <section v-if="withheldReports.length" class="withheld-page bg-white p-8 text-slate-900">
          <div class="mb-6 flex items-center gap-3">
            <UserX class="h-7 w-7 text-amber-600" />
            <div>
              <h2 class="text-2xl font-black">Students With Outstanding Fees</h2>
              <p class="text-sm font-bold text-slate-500">{{ classInfo?.name }} - {{ session }} {{ term }} Term</p>
            </div>
          </div>
          <table class="withheld-table">
            <thead><tr><th>Student ID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="student in withheldReports" :key="student.studentId">
                <td>{{ student.studentId }}</td>
                <td>{{ student.lastName }} {{ student.firstName }}</td>
                <td>Owing Fees</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Action bar at bottom of preview -->
        <div class="no-print mt-12 flex justify-center pb-20">
          <button @click="() => handlePrintAll()" class="flex items-center gap-3 rounded-full bg-royal-purple px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-purple-900/50 transition hover:bg-purple-600 hover:-translate-y-1">
            <Download class="h-5 w-5" />
            Download all as PDF
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.report-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  color: #172033;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
}

/* Apply Comic Sans to ALL text inside the report card */
.report-card *:not(svg):not(path) {
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive !important;
}

/* Watermark Logo */
.watermark-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  width: 60%;
  max-width: 500px;
  opacity: 0.04;
  pointer-events: none;
  z-index: 0;
}

.watermark-logo img {
  width: 100%;
  height: auto;
  filter: grayscale(100%);
}

/* Top & Bottom Neon Lines */
.report-top-line,
.report-bottom-line {
  height: 4px;
  background: linear-gradient(90deg, #a855f7, #3b82f6, #06b6d4, #a855f7);
  background-size: 200% 100%;
  animation: gradient-flow 4s ease infinite;
}

@keyframes gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Header */
.report-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 28px;
  padding: 40px 46px;
  background: linear-gradient(135deg, rgba(10, 14, 39, 0.98), rgba(17, 22, 56, 0.98));
  backdrop-filter: blur(20px);
}

.brand-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.logo-mark {
  display: flex;
  width: 110px;
  height: 110px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(168, 85, 247, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
}

.logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 12px;
}

.brand-copy {
  min-width: 0;
}

.document-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #a855f7;
}

.brand-copy h1 {
  margin: 0;
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
  background: linear-gradient(135deg, #ffffff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.motto {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.term-panel {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  border: 2px solid rgba(168, 85, 247, 0.3);
  border-radius: 16px;
  background: rgba(168, 85, 247, 0.1);
  backdrop-filter: blur(10px);
  text-align: center;
  color: white;
}

.term-panel strong {
  margin: 8px 0;
  font-size: 30px;
  font-weight: 900;
  background: linear-gradient(135deg, #ffffff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.term-panel small {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.term-panel span {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

/* School Contact */
.school-contact {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: #e2e8f0;
  border-bottom: 3px solid #a855f7;
}

.contact-item {
  padding: 12px 16px;
  background: #ffffff;
}

.contact-label {
  display: block;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.contact-item p {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: #334155;
}

/* Student Band */
.student-band {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  padding: 24px 38px 0;
}

.info-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.info-card span {
  display: block;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.info-card strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
}

/* Performance Summary */
.performance-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 20px 38px 0;
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 16px;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.stat-purple::before {
  background: linear-gradient(90deg, #a855f7, #ec4899);
}

.stat-blue::before {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
}

.stat-cyan::before {
  background: linear-gradient(90deg, #06b6d4, #10b981);
}

.stat-pink::before {
  background: linear-gradient(90deg, #ec4899, #a855f7);
}

.stat-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 1.5rem;
  height: 1.5rem;
  opacity: 0.15;
}

.stat-card span {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.stat-card strong {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
}

/* Section Title */
.result-section,
.cumulative-section,
.remarks-section {
  padding: 26px 38px 0;
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
}

.section-title strong {
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Table */
.table-frame {
  overflow: hidden;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 14px 10px;
  background: linear-gradient(135deg, #0a0e27, #111638);
  color: white;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

th:first-child,
td:first-child {
  width: 26%;
  text-align: left;
  white-space: normal;
}

td {
  padding: 12px 10px;
  border-top: 1px solid #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

.subject-name {
  font-weight: 800;
  color: #0f172a;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
}

.table-frame tbody tr {
  transition: background 0.2s ease;
}

.table-frame tbody tr:hover {
  background: rgba(168, 85, 247, 0.05);
}

.table-frame tbody tr:nth-child(even) {
  background: #f8fafc;
}

.total-cell {
  color: #0f172a;
  font-weight: 900;
  font-size: 13px;
}

.grade-badge {
  display: inline-flex;
  min-width: 36px;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 900;
}

.grade-excellent {
  color: #581c87;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border: 2px solid #d8b4fe;
}

.grade-strong {
  color: #854d0e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #fcd34d;
}

.grade-fair {
  color: #b45309;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #fcd34d;
}

.grade-danger {
  color: #b91c1c;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border: 2px solid #fca5a5;
}

.grade-neutral {
  color: #475569;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
}

/* Cumulative Section */
.cumulative-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.cumulative-card {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.cumulative-highlight {
  border-color: #a855f7;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(59, 130, 246, 0.05));
}

.cumulative-card span,
.cumulative-card small {
  display: block;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.cumulative-card strong {
  display: block;
  margin: 6px 0;
  font-size: 22px;
  font-weight: 900;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Remarks Section */
.remarks-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  padding-bottom: 28px;
}

.remark-box {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
  position: relative;
  overflow: hidden;
}

.remark-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
}

.teacher-box::before {
  background: linear-gradient(90deg, #a855f7, #ec4899);
}

.principal-box::before {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
}

.teacher-box {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.03), #ffffff);
}

.principal-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), #ffffff);
}

.remark-box span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.remark-box p {
  min-height: 50px;
  margin: 10px 0 14px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  font-style: italic;
  line-height: 1.5;
}

.signature-area {
  margin-top: auto;
}

.signature-line,
.signature-image {
  height: 80px;
  margin-top: auto;
  border-bottom: 2px solid #cbd5e1;
}

.signature-image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-image img {
  max-width: 260px;
  max-height: 76px;
  object-fit: contain;
}

.teacher-name {
  font-family: 'Brush Script MT', 'Segoe Script', cursive;
  font-size: 22px;
  color: #0a0e27;
  text-align: center;
  line-height: 1.1;
  margin-top: 6px;
}

.remark-box strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
}

.remark-box small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

/* Footer */
.report-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: center;
  padding: 20px 38px;
  background: linear-gradient(135deg, #0a0e27, #111638);
  color: white;
}

.footer-brand strong {
  display: block;
  font-size: 14px;
  font-weight: 900;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
  background: linear-gradient(135deg, #ffffff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-brand span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.footer-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

/* Withheld Table (Preserved for "Owing Fees" page) */
.withheld-table {
  width: 100%;
  margin: 22px 0 0;
  border-collapse: collapse;
}

.withheld-table th {
  background: #241036;
  color: white;
  font-size: 10px;
  padding: 10px;
  text-transform: uppercase;
}

.withheld-table td {
  border: 1px solid #e2e8f0;
  padding: 10px 10px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* =============================================
   MOBILE RESPONSIVE STYLES (≤ 640px)
   ============================================= */
@media (max-width: 640px) {
  /* Use readable system font stack for mobile */
  .report-card,
  .report-card *:not(svg):not(path) {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
    font-style: normal !important;
  }

  /* Ensure remarks aren't italic on mobile */
  .remark-box p {
    font-style: normal !important;
  }

  /* Report card full-width, no side shadow */
  .report-card {
    border-radius: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }

  /* Header stacks logo + name on top, term below */
  .report-header {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
    padding: 20px 16px !important;
  }

  .term-panel {
    flex-direction: row !important;
    justify-content: space-between !important;
    padding: 14px 16px !important;
    align-items: center !important;
  }

  .brand-copy h1 {
    font-size: 22px !important;
  }

  .logo-mark {
    width: 70px !important;
    height: 70px !important;
  }

  /* School contact: 2 columns instead of 4 */
  .school-contact {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  /* Student info band: 2 columns */
  .student-band {
    grid-template-columns: repeat(2, 1fr) !important;
    padding: 16px !important;
    gap: 10px !important;
  }

  /* Performance stats: 2 columns */
  .performance-summary {
    grid-template-columns: repeat(2, 1fr) !important;
    padding: 16px !important;
    gap: 10px !important;
  }

  /* Table: horizontally scrollable so nothing is clipped */
  .result-section {
    padding: 16px !important;
  }

  .table-frame {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .table-frame table {
    min-width: 500px !important;
  }

  /* Remarks: stack vertically */
  .remarks-section {
    flex-direction: column !important;
    padding: 16px !important;
    gap: 12px !important;
  }

  .remark-box {
    min-width: 0 !important;
    width: 100% !important;
  }

  /* Action buttons: full-width stack */
  .action-bar,
  .controls-bar {
    flex-direction: column !important;
    padding: 12px 16px !important;
    gap: 10px !important;
  }

  .action-bar button,
  .controls-bar button {
    width: 100% !important;
    justify-content: center !important;
  }

  /* Withheld card: readable on mobile */
  .withheld-page {
    padding: 24px 16px !important;
  }
}

@page {
  size: A4;
  margin: 4mm;
}

@media print {
  :global(body) {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print { display: none !important; }

  @page { size: A4 portrait; margin: 5mm; }

  /* Reset outer wrapper for clean print */
  .bulk-report-page {
    max-width: none !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    gap: 0 !important;
  }

  .print-area {
    display: block !important;
  }


  /* ---- ONE PAGE PER STUDENT ---- */
  .report-card, .print-card {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    /* Zoom 0.90 per user request to guarantee it fits entirely on one page */
    zoom: 0.90 !important;
  }

  .print-card:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  .withheld-page {
    page-break-before: always !important;
    break-before: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
  }

  /* ---- HIDE UNNECESSARY SECTIONS ---- */
  .no-print {
    display: none !important;
  }

  /* ---- COLOR PRESERVATION ---- */
  .report-header,
  .performance-summary,
  .term-panel,
  .table-frame table th,
  .grade-badge,
  .remark-box {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* ---- HEADER ---- */
  .report-header {
    padding: 12px 24px !important;
    gap: 12px !important;
    grid-template-columns: 1fr 160px !important;
  }

  .brand-panel { gap: 14px !important; }

  .logo-mark {
    width: 80px !important;
    height: 80px !important;
    border-radius: 12px !important;
    background: transparent !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
    border: 2px solid #ccc !important;
    display: block !important;
  }

  .logo-mark img { 
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    object-fit: contain !important;
    padding: 4px !important; 
    opacity: 1 !important;
    visibility: visible !important;
    print-color-adjust: economy !important;
    -webkit-print-color-adjust: economy !important;
  }

  .document-kicker {
    font-size: 9px !important;
    margin-bottom: 6px !important;
  }

  .brand-copy h1 {
    font-size: 24px !important;
    line-height: 1.1 !important;
    background: none !important;
    -webkit-text-fill-color: #000 !important;
    color: #000 !important;
  }

  .motto {
    font-size: 12px !important;
    margin-top: 4px !important;
  }

  .term-panel {
    padding: 12px 14px !important;
    border-radius: 10px !important;
  }

  .term-panel strong { font-size: 20px !important; margin: 4px 0 !important; }
  .term-panel small { font-size: 13px !important; }
  .term-panel span { font-size: 9px !important; }

  /* ---- STUDENT INFO BAND ---- */
  .student-band {
    padding: 10px 24px 0 !important;
    gap: 8px !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  }

  .info-card {
    padding: 12px 14px !important;
    border-radius: 10px !important;
  }

  .info-card span { font-size: 9px !important; }
  .info-card strong { font-size: 15px !important; margin-top: 4px !important; }

  /* ---- PERFORMANCE STATS ---- */
  .performance-summary {
    padding: 10px 24px 0 !important;
    gap: 8px !important;
  }

  .stat-card {
    padding: 12px 14px !important;
    border-radius: 10px !important;
  }

  .stat-card span { font-size: 9px !important; }
  .stat-card strong { font-size: 26px !important; margin-top: 4px !important; }

  /* ---- SECTION TITLE ---- */
  .result-section {
    padding: 10px 24px 0 !important;
  }

  .section-title { margin-bottom: 10px !important; }
  .section-title strong { font-size: 14px !important; }
  .section-title span { font-size: 10px !important; }

  /* ---- TABLE ---- */
  .table-frame {
    border-radius: 8px !important;
    border-width: 1px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .table-frame table th {
    padding: 12px 8px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #000 !important;
  }

  .table-frame table td {
    padding: 10px 8px !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    color: #000 !important;
    line-height: 1.3 !important;
  }

  .grade-badge {
    font-size: 12px !important;
    padding: 3px 6px !important;
  }

  /* ---- REMARKS ---- */
  .remarks-section {
    padding: 14px 24px 10px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    gap: 14px !important;
  }

  .remark-box {
    min-height: 85px !important;
    padding: 14px 16px !important;
    border-radius: 8px !important;
  }

  .remark-box p {
    font-size: 13px !important;
    margin: 4px 0 6px !important;
    line-height: 1.4 !important;
  }

  .remark-box span { font-size: 11px !important; }

  .signature-line,
  .signature-image {
    height: 42px !important;
    margin-top: 4px !important;
  }

  .teacher-name { font-size: 12px !important; }
  .signature-area small { font-size: 9px !important; }

  @page { size: A4 portrait; margin: 8mm !important; }
}
</style>
