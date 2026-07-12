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
    .print-card:first-child { page-break-before: auto; break-before: auto; }
    .withheld-page { page-break-before: always; break-before: page; }
    /* Reset transforms for clean PDF rendering */
    .print-card { transform: none !important; }
    /* Preserve colors aggressively */
    html, body, .print-area, .print-card, .print-card * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    /* Force background colors on specific modern elements */
    th, .report-header, .term-panel, .stat-card, .grade-badge, .remark-box, .report-footer, .report-top-line, .report-bottom-line, .cumulative-card, .logo-mark {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
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
.report-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  color: #172033;
  font-family: 'Comic Sans MS', 'Comic Sans', cursive, sans-serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  white-space: nowrap;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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
  font-family: 'Cambria', 'Georgia', serif;
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

  .print-area {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
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
  .watermark-logo,
  .report-top-line,
  .report-bottom-line,
  .cumulative-section,
  .school-contact,
  .report-footer { display: none !important; }

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
    padding: 16px 24px !important;
    gap: 16px !important;
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
  }

  .logo-mark img { padding: 8px !important; }

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
    padding: 12px 24px 0 !important;
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
    padding: 12px 24px 0 !important;
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
    padding: 12px 24px 0 !important;
  }

  .section-title { margin-bottom: 8px !important; }
  .section-title strong { font-size: 13px !important; }
  .section-title span { font-size: 9px !important; }

  /* ---- TABLE ---- */
  .table-frame {
    border-radius: 8px !important;
    border-width: 1px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .table-frame table th {
    padding: 8px 8px !important;
    font-size: 11px !important;
  }

  .table-frame table td {
    padding: 8px 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
  }

  .grade-badge {
    font-size: 11px !important;
    padding: 3px 6px !important;
  }

  /* ---- REMARKS ---- */
  .remarks-section {
    padding: 10px 24px 10px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .remark-box {
    min-height: 80px !important;
    padding: 10px 12px !important;
    border-radius: 8px !important;
  }

  .remark-box p {
    font-size: 11px !important;
    margin: 4px 0 6px !important;
  }

  .remark-box span { font-size: 9px !important; }

  .signature-line,
  .signature-image {
    height: 40px !important;
    margin-top: 4px !important;
  }

  .teacher-name { font-size: 11px !important; }
  .signature-area small { font-size: 8px !important; }

  @page { size: A4 portrait; margin: 8mm !important; }
}
</style>
