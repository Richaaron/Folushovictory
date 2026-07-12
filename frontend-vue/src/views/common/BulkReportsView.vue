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
  Printer,
  Square,
  UserX
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
const exportingExcel = ref(false)
const error = ref('')
const notice = ref('')
const emailSummary = ref<any>(null)

const selectedStudents = computed(() => students.value.filter((student) => selectedIds.value.has(student.studentId)))
const selectedCount = computed(() => selectedIds.value.size)
const owingSelected = computed(() => selectedStudents.value.filter((student) => isOwing(student)))
const clearedSelected = computed(() => selectedStudents.value.filter((student) => !isOwing(student)))
const printableReports = computed(() => reports.value.filter((report) => !isOwing(report.student)))
const withheldReports = computed(() => selectedStudents.value.filter((student) => isOwing(student)))

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

const generateReports = async (shouldPrint = false, targetStudentIds: string[] | null = null) => {
  const studentIds = targetStudentIds ?? Array.from(selectedIds.value)
  if (!studentIds.length) {
    error.value = 'Select at least one student before generating reports.'
    return
  }

  generating.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/api/results/class/${classId}/bulk-reports`, {
      session: session.value,
      term: term.value,
      studentIds
    })
    reports.value = (data.reports || []).map((report: any) => ({
      ...report,
      feeStatus: {
        ...(report.feeStatus || {}),
        owesFees: Boolean(owingOverrides.value[report.student.studentId])
      },
      student: {
        ...report.student,
        feeStatus: {
          ...(report.student?.feeStatus || {}),
          owesFees: Boolean(owingOverrides.value[report.student.studentId])
        }
      }
    }))

    await nextTick()
    setTimeout(() => {
      document.getElementById('print-area-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    if (shouldPrint) {
      window.setTimeout(() => window.print(), 500)
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to generate selected report cards.'
  } finally {
    generating.value = false
  }
}

const handlePrintAll = () => {
  const el = document.getElementById('print-area-section')
  if (!el) return

  const filename = `bulk-reports-${classInfo.value?.name || 'class'}-${session.value.replace(/\//g, '-')}`

  // Clone the element so we can strip out the no-print action bar
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.no-print').forEach(n => n.remove())

  // Extract all scoped styles from this page (captures the Vue scoped CSS)
  const styles = Array.from(document.querySelectorAll('style'))
    .map(s => s.innerText || s.textContent || '')
    .join('\n')

  // Also grab link stylesheets
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  ${links}
  <style>
    ${styles}
    @page { size: A4; margin: 4mm; }
    body { background: white !important; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .bulk-report-page { width: 202mm !important; max-width: none; padding: 0 !important; margin: 0 auto !important; }
    .print-area { display: block; width: 202mm !important; margin: 0 auto !important; }
    .print-card {
      box-sizing: border-box;
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    .withheld-page { page-break-before: always; break-before: page; }
    /* Reset transforms for clean PDF rendering */
    .print-card { transform: none !important; }
    /* Preserve colors */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .html2pdf__page-break { display: none !important; }
  </style>
</head>
<body>
  <div class="print-area">
    ${clone.innerHTML}
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`

  const popup = window.open('', '_blank', 'width=900,height=700')
  if (!popup) {
    alert('Please allow popups for this site to download the PDF.')
    return
  }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
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

// ── Excel Export ────────────────────────────────────────────────────────────

const safeFilePart = (value: any) =>
  String(value || 'report')
    .trim()
    .replace(/[\\/:\*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')

const formatTermLabel = (term: string) => {
  if (term === '1st') return 'First'
  if (term === '2nd') return 'Second'
  if (term === '3rd') return 'Third'
  return term
}

const handleExportExcel = async () => {
  const studentIds = Array.from(selectedIds.value)
  if (!studentIds.length) {
    error.value = 'Select at least one student before exporting.'
    return
  }

  exportingExcel.value = true
  error.value = ''
  try {
    let data = reports.value
    if (!data.length) {
      const res = await api.post(`/api/results/class/${classId}/bulk-reports`, {
        session: session.value,
        term: term.value,
        studentIds
      })
      data = (res.data.reports || []).map((report: any) => ({
        ...report,
        feeStatus: { ...(report.feeStatus || {}), owesFees: Boolean(owingOverrides.value[report.student.studentId]) },
        student: { ...report.student, feeStatus: { ...(report.student?.feeStatus || {}), owesFees: Boolean(owingOverrides.value[report.student.studentId]) } }
      }))
    }

    if (!data.length) {
      error.value = 'No report data available to export.'
      return
    }

    const school = data[0]?.school || {}
    const className = data[0]?.class?.name || classInfo.value?.name || 'Class'
    const termLabel = formatTermLabel(term.value)

    // Helper: wrap a string value in a SpreadsheetML Cell
    const cell = (value: any, type: 'String' | 'Number' = 'String', _bold = false, _bg = '', _align = 'Left', _size = 11, mergeAcross = 0) => {
      const mergeAttr = mergeAcross > 0 ? ` ss:MergeAcross="${mergeAcross}"` : ''
      const safeVal = String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      return `<Cell${mergeAttr}><Data ss:Type="${type}">${safeVal}</Data></Cell>`
    }

    const row = (...cells: string[]) => `<Row>${cells.join('')}</Row>`
    const emptyRow = () => `<Row ss:Height="6"/>`

    // Build one worksheet per student
    const buildStudentSheet = (report: any, sheetName: string) => {
      const s = report.student
      const r = report.result || {}
      const perSubject: any[] = r.perSubject || []
      const avg = Number(r.average || 0)
      const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim()

      const subjectRows = perSubject.map((ps: any) =>
        row(
          cell(ps.subjectName || ps.subjectId),
          cell(ps.ca1 ?? ''),
          cell(ps.ca2 ?? ''),
          cell(ps.exam ?? ''),
          cell(ps.total ?? ''),
          cell(ps.grade || ''),
          cell(ps.remark || '')
        )
      ).join('\n')

      return `
        <Worksheet ss:Name="${sheetName.replace(/[\\/?*[\]:]/g, '').substring(0, 31)}">
          <Table ss:DefaultColumnWidth="90">
            <Column ss:Width="180"/>
            <Column ss:Width="55"/>
            <Column ss:Width="55"/>
            <Column ss:Width="55"/>
            <Column ss:Width="55"/>
            <Column ss:Width="45"/>
            <Column ss:Width="120"/>
            ${row(cell(school.name || 'School', 'String', true, '#1e1b4b', 'Center', 16, 6))}
            ${school.motto ? row(cell(school.motto, 'String', false, '', 'Center', 10, 6)) : ''}
            ${emptyRow()}
            ${row(cell(`Class: ${className}  |  Session: ${report.session || session.value}  |  Term: ${report.term || termLabel} Term`, 'String', true, '#e5e7eb', 'Center', 11, 6))}
            ${emptyRow()}
            ${row(cell('Student Name', 'String', true), cell(fullName, 'String', false, '', 'Left', 11, 5))}
            ${row(cell('Student ID', 'String', true), cell(s.studentId || '', 'String', false, '', 'Left', 11, 5))}
            ${row(cell('Gender', 'String', true), cell(s.gender || '', 'String', false, '', 'Left', 11, 5))}
            ${emptyRow()}
            ${row(
              cell('Subject', 'String', true),
              cell('1st CA', 'String', true),
              cell('2nd CA', 'String', true),
              cell('Exam', 'String', true),
              cell('Total', 'String', true),
              cell('Grade', 'String', true),
              cell('Remarks', 'String', true)
            )}
            ${subjectRows}
            ${emptyRow()}
            ${row(cell('Total Score', 'String', true), cell(r.total ?? '', 'String', true, '', 'Center', 11, 5))}
            ${row(cell('Average', 'String', true), cell(avg > 0 ? avg + '%' : '', 'String', true, '', 'Center', 11, 5))}
            ${row(cell('Position in Class', 'String', true), cell(r.position ? `${r.position}` : '', 'String', true, '', 'Center', 11, 5))}
            ${row(cell('Result', 'String', true), cell(avg >= 40 ? 'PASS' : avg > 0 ? 'FAIL' : '', 'String', true, '', 'Center', 11, 5))}
            ${emptyRow()}
            ${row(cell("Class Teacher's Remark", 'String', true), cell(report.teacherRemark || '', 'String', false, '', 'Left', 11, 5))}
            ${row(cell("Principal's Remark", 'String', true), cell(report.principalRemark || '', 'String', false, '', 'Left', 11, 5))}
          </Table>
        </Worksheet>`
    }

    // Build summary sheet
    const summaryRows = data.map((report: any) => {
      const s = report.student
      const r = report.result || {}
      const avg = Number(r.average || 0)
      const fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim()
      return row(
        cell(r.position || ''),
        cell(s.studentId || ''),
        cell(fullName),
        cell(r.total ?? ''),
        cell(avg > 0 ? avg + '%' : ''),
        cell(avg >= 40 ? 'PASS' : avg > 0 ? 'FAIL' : '')
      )
    }).join('\n')

    const summarySheet = `
      <Worksheet ss:Name="Summary">
        <Table ss:DefaultColumnWidth="90">
          <Column ss:Width="50"/>
          <Column ss:Width="120"/>
          <Column ss:Width="200"/>
          <Column ss:Width="80"/>
          <Column ss:Width="80"/>
          <Column ss:Width="70"/>
          ${row(cell(school.name || 'School', 'String', true, '#1e1b4b', 'Center', 16, 5))}
          ${row(cell(`Class: ${className}  |  Session: ${session.value}  |  Term: ${termLabel}`, 'String', true, '#e5e7eb', 'Center', 11, 5))}
          ${emptyRow()}
          ${row(
            cell('Pos', 'String', true),
            cell('Student ID', 'String', true),
            cell('Student Name', 'String', true),
            cell('Total', 'String', true),
            cell('Average', 'String', true),
            cell('Result', 'String', true)
          )}
          ${summaryRows}
        </Table>
      </Worksheet>`

    const usedNames = new Map<string, number>()
    const studentSheets = data.map((report: any) => {
      const s = report.student
      let baseName = `${s.lastName || ''} ${s.firstName || ''}`.trim().substring(0, 28) || s.studentId
      const count = usedNames.get(baseName) || 0
      usedNames.set(baseName, count + 1)
      const sheetName = count > 0 ? `${baseName} (${count + 1})` : baseName
      return buildStudentSheet(report, sheetName)
    }).join('\n')

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${summarySheet}
  ${studentSheets}
</Workbook>`

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeFilePart(className)}-${safeFilePart(session.value)}-${safeFilePart(termLabel)}-bulk-results.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to export Excel. Please generate reports first.'
  } finally {
    exportingExcel.value = false
  }
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

      <div class="flex flex-wrap items-center gap-3">
        <select v-model="session" class="rounded-xl bg-slate-900/60 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none text-white border border-slate-700/60">
          <option>2026/2027</option>
          <option>2025/2026</option>
          <option>2024/2025</option>
          <option>2023/2024</option>
        </select>
        <select v-model="term" class="rounded-xl bg-slate-900/60 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none text-white border border-slate-700/60">
          <option value="1st">First Term</option>
          <option value="2nd">Second Term</option>
          <option value="3rd">Third Term</option>
          <option value="First">First</option>
          <option value="Second">Second</option>
          <option value="Third">Third</option>
        </select>
        <button @click="generateReports(false)" :disabled="generating || selectedCount === 0" class="flex items-center gap-2 rounded-xl bg-slate-900/60 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-50 border border-slate-700/60">
          <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
          {{ generating ? 'Loading...' : 'Preview' }}
        </button>
        <button @click="notifyParents" :disabled="notifying || selectedCount === 0" class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50">
          <Loader2 v-if="notifying" class="h-4 w-4 animate-spin" />
          <Mail v-else class="h-4 w-4" />
          Email Parents
        </button>
        <button @click="generateReports(true, clearedSelected.map(s => s.studentId))" :disabled="generating || selectedCount === 0 || clearedSelected.length === 0" class="flex items-center gap-2 rounded-xl bg-royal-purple px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50">
          <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
          <Printer v-else class="h-4 w-4" />
          Print Cleared
        </button>
        <button @click="handleExportExcel" :disabled="exportingExcel || selectedCount === 0" class="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50">
          <Loader2 v-if="exportingExcel" class="h-4 w-4 animate-spin" />
          <Download v-else class="h-4 w-4" />
          Export Excel
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

    <div v-else-if="error" class="no-print rounded-2xl border border-red-700/50 bg-red-900/20 p-6 text-red-300">
      <div class="flex items-center gap-3">
        <AlertCircle class="h-5 w-5" />
        <p class="text-sm font-bold">{{ error }}</p>
      </div>
    </div>

    <template v-else>
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
        <section v-for="report in printableReports" :key="report.student.studentId" class="print-card bg-white text-slate-900">
          <header class="report-head">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-amber-300">Official Student Report Card</p>
              <h2>{{ report.school?.name || 'School Name' }}</h2>
              <p>{{ report.school?.motto || 'Excellence in Education' }}</p>
            </div>
            <div class="term-box">
              <span>{{ report.session }}</span>
              <strong>{{ report.term }} Term</strong>
            </div>
          </header>

          <div class="student-strip">
            <div><span>Name</span><strong>{{ report.student.lastName }} {{ report.student.firstName }}</strong></div>
            <div><span>ID</span><strong>{{ report.student.studentId }}</strong></div>
            <div><span>Class</span><strong>{{ report.class.name }}</strong></div>
            <div><span>Status</span><strong>Fees Cleared</strong></div>
          </div>

          <div class="summary-strip">
            <div><span>Total Scores</span><strong>{{ report.result?.total ?? 'N/A' }}</strong></div>
            <div><span>Average</span><strong>{{ report.result?.average ?? 'N/A' }}%</strong></div>
            <div><span>Total Students</span><strong>{{ students?.length || 'N/A' }}</strong></div>
            <div>
              <span>{{ isPositionBasedClass(report) ? 'Position' : 'Overall Grade' }}</span>
              <strong>{{ isPositionBasedClass(report) ? getPositionSuffix(report.result?.position) : getOverallGrade(report) }}</strong>
            </div>
          </div>

          <table class="result-table">
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
              <tr v-for="subject in report.result?.perSubject || []" :key="subject.subjectId">
                <td>{{ subject.subjectName }}</td>
                <td>{{ subject.ca1 ?? '-' }}</td>
                <td>{{ subject.ca2 ?? '-' }}</td>
                <td>{{ subject.exam ?? '-' }}</td>
                <td>{{ subject.total ?? '-' }}</td>
                <td>{{ subject.grade || '-' }}</td>
                <td>{{ subject.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="remarks-grid">
            <div>
              <span>Class Teacher's Remark</span>
              <p>{{ report.teacherRemark }}</p>
              <div v-if="report.formTeacher?.signatureUrl" class="signature-image">
                <img :src="report.formTeacher.signatureUrl" alt="Teacher signature" />
              </div>
              <div v-else class="signature-line"></div>
              <strong>{{ report.formTeacher?.displayName || 'Class Teacher' }}</strong>
            </div>
            <div>
              <span>Principal's Remark</span>
              <p>{{ report.principalRemark }}</p>
              <div v-if="report.school?.principalSignatureUrl" class="signature-image">
                <img :src="report.school.principalSignatureUrl" alt="Principal signature" />
              </div>
              <div v-else class="signature-line"></div>
              <strong>{{ report.school?.principalName || 'Principal' }}</strong>
            </div>
          </div>
        </section>

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
          <button @click="handlePrintAll" class="flex items-center gap-3 rounded-full bg-royal-purple px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-purple-900/50 transition hover:bg-purple-600 hover:-translate-y-1">
            <Download class="h-5 w-5" />
            Download all as PDF
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.report-head {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 20px;
  padding: 26px 30px;
  background: #241036;
  color: white;
}

.report-head h2 {
  margin: 6px 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
  font-weight: 900;
  text-transform: uppercase;
}

.term-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 18px;
  text-align: center;
}

.term-box span,
.student-strip span,
.summary-strip span,
.remarks-grid span {
  display: block;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.term-box strong {
  margin-top: 6px;
  font-size: 20px;
}

.student-strip,
.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 18px 30px 0;
}

.student-strip div,
.summary-strip div {
  border: 1px solid #ded3ee;
  padding: 12px;
}

.student-strip strong,
.summary-strip strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 900;
  text-transform: uppercase;
}

.summary-strip div {
  border-top: 4px solid #581c87;
}

.result-table,
.withheld-table {
  width: calc(100% - 60px);
  margin: 22px 30px 0;
  border-collapse: collapse;
}

.result-table th,
.withheld-table th {
  background: #241036;
  color: white;
  font-size: 10px;
  padding: 10px;
  text-transform: uppercase;
}

.result-table td,
.withheld-table td {
  border: 1px solid #e2e8f0;
  padding: 10px 10px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.result-table td:first-child,
.result-table th:first-child,
.withheld-table td:nth-child(2),
.withheld-table th:nth-child(2) {
  text-align: left;
  white-space: nowrap;
}

.remarks-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 22px 30px 28px;
}

.remarks-grid div {
  min-height: 150px;
  border: 1px solid #cbd5e1;
  border-top: 5px solid #581c87;
  padding: 16px;
}

.remarks-grid p {
  min-height: 54px;
  margin: 10px 0 18px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.signature-image {
  height: 42px;
  margin: -4px 0 6px;
  text-align: center;
}

.signature-line,
.signature-image {
  height: 78px;
  margin: -4px 0 6px;
  text-align: center;
}

.signature-line {
  border-bottom: 2px solid #475569;
}

.signature-image img {
  max-width: 260px;
  max-height: 72px;
  object-fit: contain;
}

.teacher-signature {
  font-family: "Brush Script MT", "Segoe Script", cursive;
  font-size: 28px;
  color: #241036;
  text-align: center;
  padding-top: 8px;
  line-height: 1;
  margin-bottom: -6px;
}

.remarks-grid strong {
  display: block;
  border-top: 2px solid #475569;
  padding-top: 8px;
  text-align: center;
  text-transform: uppercase;
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

  :global(html),
  :global(body) {
    width: auto !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  @page {
    size: A4;
    margin: 4mm !important;
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .bulk-report-page {
    width: 202mm !important;
    max-width: none;
    padding: 0 !important;
    margin: 0 auto !important;
    overflow: visible !important;
  }

  .print-area {
    display: block;
    width: 202mm !important;
    overflow: visible !important;
    margin: 0 auto !important;
  }

  .print-card {
    --print-scale: 1.22;
    box-sizing: border-box !important;
    display: block !important;
    width: calc(202mm / var(--print-scale)) !important;
    min-height: 0 !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    transform: scale(var(--print-scale)) !important;
    transform-origin: top left !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    break-inside: avoid-page !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  .print-card:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  .withheld-page {
    page-break-before: always !important;
    break-before: page !important;
    box-shadow: none;
  }

  .print-card,
  .withheld-page {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    break-inside: avoid-page !important;
  }

  .print-card,
  .print-card *,
  .withheld-page,
  .withheld-page * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-head {
    grid-template-columns: 1fr 44mm !important;
    gap: 6mm !important;
    padding: 5mm 8mm 3mm !important;
    background: white !important;
    color: #1e1b4b !important;
    border-bottom: 1mm solid #581c87;
  }

  .report-head h2 {
    margin: 1mm 0 !important;
    font-size: 22px !important;
    line-height: 1.05 !important;
    color: #1e1b4b !important;
  }

  .report-head p {
    color: #581c87 !important;
    font-size: 10px !important;
    line-height: 1.15 !important;
  }

  .report-head .term-box {
    border-color: #581c87 !important;
    color: #1e1b4b !important;
    min-height: 15mm !important;
    padding: 2.2mm !important;
  }

  .report-head .term-box span,
  .report-head .term-box strong {
    color: #1e1b4b !important;
  }

  .report-head .term-box span {
    font-size: 10px !important;
  }

  .report-head .term-box strong {
    font-size: 12px !important;
  }

  .student-strip span,
  .summary-strip span {
    font-size: 8.5px !important;
  }

  .student-strip strong,
  .summary-strip strong {
    font-size: 10.5px !important;
    line-height: 1.1 !important;
  }

  .student-strip div,
  .summary-strip div {
    padding: 1.8mm !important;
  }

  .result-table th,
  .result-table td,
  .withheld-table th,
  .withheld-table td {
    font-size: 15px !important;
    padding: 1.1mm 1.4mm !important;
    line-height: 1.08 !important;
    border-color: #cbd5e1 !important;
  }

  .result-table th,
  .withheld-table th {
    background: #e2e8f0 !important;
    color: #1e1b4b !important;
    font-weight: 700 !important;
  }

  .result-table,
  .withheld-table {
    border-collapse: collapse !important;
    width: calc(100% - 16mm) !important;
    margin: 2mm 8mm 0 !important;
    font-size: 10.5px !important;
    table-layout: fixed !important;
  }

  .result-table th,
  .result-table td,
  .withheld-table th,
  .withheld-table td {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
  }

  .remarks-grid {
    gap: 3mm !important;
    margin-top: 3mm !important;
    padding: 0 8mm 4mm !important;
    width: auto !important;
    page-break-before: avoid !important;
    break-before: avoid !important;
  }

  .remarks-grid div {
    min-height: 28mm !important;
    border: 1px solid #cbd5e1 !important;
    border-top: 0.8mm solid #581c87 !important;
    padding: 2mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .remarks-grid p {
    min-height: auto !important;
    margin: 1mm 0 1.5mm !important;
    font-size: 8.5px !important;
    font-weight: 600 !important;
    line-height: 1.25 !important;
  }

  .remarks-grid span,
  .remarks-grid strong {
    font-size: 8.5px !important;
  }

  .teacher-signature,
  .signature-line,
  .signature-image {
    height: 17mm !important;
    margin: 0 !important;
  }

  .signature-line {
    border-bottom: 1.5px solid #475569 !important;
  }

  .signature-image img {
    max-height: 16mm !important;
    object-fit: contain !important;
  }

  .teacher-signature {
    font-size: 14px !important;
    padding-top: 2px !important;
    margin-bottom: 0 !important;
  }

  .report-head {
    padding: 5mm 8mm 3mm !important;
  }

  .student-strip,
  .summary-strip {
    gap: 1.6mm !important;
    padding: 1.8mm 8mm 0 !important;
  }

  .summary-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }

  .summary-strip div {
    border-top-color: #581c87 !important;
  }
}
</style>
