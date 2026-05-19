<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
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

const generateReports = async (shouldPrint = false) => {
  if (!selectedCount.value) {
    error.value = 'Select at least one student before generating reports.'
    return
  }

  generating.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/api/results/class/${classId}/bulk-reports`, {
      session: session.value,
      term: term.value,
      studentIds: Array.from(selectedIds.value)
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

    if (shouldPrint) {
      window.setTimeout(() => window.print(), 150)
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to generate selected report cards.'
  } finally {
    generating.value = false
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

onMounted(fetchStudents)
</script>

<template>
  <div class="bulk-report-page mx-auto max-w-7xl space-y-6 p-4 fade-in">
    <div class="no-print flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:text-royal-purple dark:bg-slate-800">
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Bulk Result Printing</h1>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ classInfo?.name || 'Class' }} Result Cards</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <select v-model="session" class="rounded-xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none dark:bg-slate-800">
          <option>2026/2027</option>
          <option>2025/2026</option>
          <option>2024/2025</option>
          <option>2023/2024</option>
        </select>
        <select v-model="term" class="rounded-xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none dark:bg-slate-800">
          <option value="1st">First Term</option>
          <option value="2nd">Second Term</option>
          <option value="3rd">Third Term</option>
          <option value="First">First</option>
          <option value="Second">Second</option>
          <option value="Third">Third</option>
        </select>
        <button @click="generateReports(false)" :disabled="generating || selectedCount === 0" class="rounded-xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:text-royal-purple disabled:opacity-50 dark:bg-slate-800">
          Preview
        </button>
        <button @click="notifyParents" :disabled="notifying || selectedCount === 0" class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50">
          <Loader2 v-if="notifying" class="h-4 w-4 animate-spin" />
          <Mail v-else class="h-4 w-4" />
          Email Parents
        </button>
        <button @click="generateReports(true)" :disabled="generating || selectedCount === 0 || clearedSelected.length === 0" class="flex items-center gap-2 rounded-xl bg-royal-purple px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50">
          <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
          <Printer v-else class="h-4 w-4" />
          Print Cleared
        </button>
      </div>
    </div>

    <div v-if="loading" class="no-print flex h-96 items-center justify-center">
      <Loader2 class="h-12 w-12 animate-spin text-royal-purple" />
    </div>

    <div v-else-if="error" class="no-print rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
      <div class="flex items-center gap-3">
        <AlertCircle class="h-5 w-5" />
        <p class="text-sm font-bold">{{ error }}</p>
      </div>
    </div>

    <template v-else>
      <div v-if="notice" class="no-print rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-700">
        <div class="flex items-center gap-3">
          <Mail class="h-5 w-5" />
          <p class="text-sm font-bold">{{ notice }}</p>
        </div>
        <div v-if="emailSummary?.skipped?.length || emailSummary?.failed?.length" class="mt-3 space-y-1 text-xs font-bold">
          <p v-for="item in emailSummary.skipped || []" :key="`skipped-${item.studentId}`">Skipped {{ item.studentName }}: {{ item.reason }}</p>
          <p v-for="item in emailSummary.failed || []" :key="`failed-${item.studentId}`">Failed {{ item.studentName }}: {{ item.error }}</p>
        </div>
      </div>

      <div class="no-print grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Students</p>
          <strong class="mt-2 block text-3xl font-black text-slate-900 dark:text-white">{{ selectedCount }}</strong>
        </div>
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-900/20">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Ready To Print</p>
          <strong class="mt-2 block text-3xl font-black text-emerald-700 dark:text-emerald-300">{{ clearedSelected.length }}</strong>
        </div>
        <div class="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/20">
          <p class="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Fees Owing</p>
          <strong class="mt-2 block text-3xl font-black text-amber-700 dark:text-amber-300">{{ owingSelected.length }}</strong>
        </div>
      </div>

      <div class="no-print rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <p class="text-xs font-black uppercase tracking-widest text-slate-500">Choose students and mark fee status</p>
          <div class="flex gap-2">
            <button @click="selectAll" class="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800">Select All</button>
            <button @click="clearSelection" class="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800">Clear</button>
          </div>
        </div>
        <div class="max-h-[520px] overflow-auto">
          <table class="w-full text-left">
            <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Print</th>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th class="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="student in students" :key="student.studentId">
                <td class="px-5 py-4">
                  <button @click="toggleStudent(student.studentId)" class="text-royal-purple">
                    <CheckSquare v-if="selectedIds.has(student.studentId)" class="h-5 w-5" />
                    <Square v-else class="h-5 w-5" />
                  </button>
                </td>
                <td class="px-5 py-4">
                  <p class="text-sm font-black text-slate-900 dark:text-white">{{ student.lastName }} {{ student.firstName }}</p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ student.studentId }}</p>
                </td>
                <td class="px-5 py-4">
                  <button
                    @click="toggleOwing(student.studentId)"
                    class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                    :class="isOwing(student) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'"
                  >
                    {{ isOwing(student) ? 'Owing Fees' : 'Fees Cleared' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="reports.length" class="print-area space-y-8">
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
            <div><span>Total</span><strong>{{ report.result?.total ?? 'N/A' }}</strong></div>
            <div><span>Average</span><strong>{{ report.result?.average ?? 'N/A' }}%</strong></div>
            <div>
              <span>{{ isPositionBasedClass(report) ? 'Position' : 'Overall Grade' }}</span>
              <strong>{{ isPositionBasedClass(report) ? getPositionSuffix(report.result?.position) : getOverallGrade(report) }}</strong>
            </div>
            <div><span>Release</span><strong>{{ report.released ? 'Released' : 'Draft' }}</strong></div>
          </div>

          <table class="result-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>1st CA</th>
                <th>2nd CA</th>
                <th>Exam</th>
                <th>Total</th>
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
              <strong>{{ report.formTeacher?.displayName || 'Class Teacher' }}</strong>
            </div>
            <div>
              <span>Principal's Remark</span>
              <p>{{ report.principalRemark }}</p>
              <div v-if="report.school?.principalSignatureUrl" class="signature-image">
                <img :src="report.school.principalSignatureUrl" alt="Principal signature" />
              </div>
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
  font-size: 14px;
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
  font-size: 9px;
  padding: 10px;
  text-transform: uppercase;
}

.result-table td,
.withheld-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.result-table td:first-child,
.result-table th:first-child,
.withheld-table td:nth-child(2),
.withheld-table th:nth-child(2) {
  text-align: left;
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

.signature-image img {
  max-width: 180px;
  max-height: 42px;
  object-fit: contain;
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
  margin: 10mm;
}

@media print {
  :global(body) {
    background: white !important;
  }

  .no-print {
    display: none !important;
  }

  .bulk-report-page {
    max-width: none;
    padding: 0;
  }

  .print-area {
    display: block;
  }

  .print-card,
  .withheld-page {
    page-break-after: always;
    break-after: page;
    box-shadow: none;
  }

  .print-card,
  .print-card *,
  .withheld-page,
  .withheld-page * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-head {
    padding: 20px 24px;
  }

  .report-head h2 {
    font-size: 24px;
  }
}
</style>
