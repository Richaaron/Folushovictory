<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  Download
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const studentId = route.params.studentId as string
const session = ref(String(route.query.session || '').trim())
const term = ref(String(route.query.term || '').trim())

const data = ref<any>(null)
const loading = ref(true)
const error = ref('')

const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!session.value || !term.value) {
      const schoolResp = await api.get('/api/config/school')
      if (!session.value && schoolResp.data?.currentSession) {
        session.value = String(schoolResp.data.currentSession || '').trim()
      }
      if (!term.value && schoolResp.data?.currentTerm) {
        term.value = String(schoolResp.data.currentTerm || '').trim()
      }
    }
    if (!session.value || !term.value) {
      throw new Error('Missing session or term for report card')
    }
    const resp = await api.get(`/api/results/student/${studentId}/report`, {
      params: { session: session.value, term: term.value }
    })
    data.value = resp.data
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Failed to load report card.'
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

const handleDownload = () => {
  const originalTitle = document.title
  document.title = `${data.value.student.lastName}-${data.value.student.firstName}-Report-${data.value.session}-${data.value.term}`
  window.print()
  document.title = originalTitle
}

const getGradeColor = (grade: string) => {
  if (!grade) return 'grade-neutral'
  if (grade === 'F') return 'grade-danger'
  if (['A', 'A+', 'A-'].includes(grade)) return 'grade-excellent'
  if (['B', 'B+', 'B-'].includes(grade)) return 'grade-strong'
  if (['C', 'C+', 'C-'].includes(grade)) return 'grade-fair'
  return 'grade-neutral'
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

const schoolInitials = computed(() => {
  const name = data.value?.school?.name || 'School'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part: string) => part[0]?.toUpperCase())
    .join('')
})

const schoolWebsite = computed(() => data.value?.school?.website?.replace(/^https?:\/\//, '') || '')
const formTeacherName = computed(() => data.value?.formTeacher?.displayName || `${data.value?.class?.name || 'Class'} Form Teacher`)
const subjectRows = computed(() => data.value?.result?.perSubject || [])
const positionBasedClass = computed(() => {
  const classLabel = `${data.value?.class?.level || ''} ${data.value?.class?.name || ''}`.toUpperCase()
  if (classLabel.includes('SSS') || classLabel.includes('PRE-NURSERY') || classLabel.includes('PRE NURSERY') || classLabel.includes('PRE_NURSERY')) {
    return false
  }
  return classLabel.includes('NURSERY') || classLabel.includes('PRIMARY') || classLabel.includes('PRY') || classLabel.includes('JSS')
})
const overallGrade = computed(() => {
  if (data.value?.result?.overallGrade) return data.value.result.overallGrade
  const average = Number(data.value?.result?.average || 0)
  if (average >= 80) return 'A'
  if (average >= 70) return 'B'
  if (average >= 60) return 'C'
  if (average >= 50) return 'D'
  if (average >= 40) return 'E'
  if (average > 0) return 'F'
  return 'N/A'
})

onMounted(fetchData)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-8 p-4 fade-in report-screen">
    <div class="no-print sticky top-0 z-50 flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-950/90 p-4 shadow-xl shadow-black/20">
      <button @click="$router.back()" class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-royal-purple">
        <ArrowLeft class="h-5 w-5" /> Back
      </button>
      <div class="flex gap-3">
        <button @click="handleDownload" class="flex items-center gap-2 rounded-xl bg-slate-900/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 border border-slate-700/60">
          <Download class="h-4 w-4" /> Download PDF
        </button>
        <button @click="handlePrint" class="flex items-center gap-2 rounded-xl bg-purple-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-purple-900">
          <Printer class="h-4 w-4" /> Print
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex h-96 items-center justify-center">
      <Loader2 class="h-16 w-16 animate-spin text-purple-800" />
    </div>

    <div v-else-if="error" class="rounded-3xl border border-red-700/50 bg-red-900/20 p-20 text-center shadow-xl shadow-red-900/10">
      <AlertCircle class="mx-auto mb-6 h-20 w-20 text-red-400 opacity-20" />
      <h2 class="mb-4 text-3xl font-black text-white">Access Restricted</h2>
      <p class="mx-auto mb-8 max-w-md text-slate-300">{{ error }}</p>
    </div>

    <div v-else-if="data && !data.released" class="rounded-3xl border border-slate-700/60 bg-slate-950/90 p-20 text-center shadow-xl shadow-slate-900/10">
      <Lock class="mx-auto mb-6 h-20 w-20 text-royal-purple opacity-20" />
      <h2 class="mb-4 text-3xl font-black text-white">Result Not Released</h2>
      <p class="mx-auto mb-8 max-w-md text-slate-300">This academic report has been compiled but is currently locked by the school administration.</p>
    </div>

    <article v-else-if="data" class="report-card">
      <header class="report-header">
        <div class="brand-panel">
          <div class="logo-mark">
            <img v-if="data.school?.logoUrl" :src="data.school.logoUrl" :alt="data.school.name || 'School logo'" />
            <span v-else>{{ schoolInitials }}</span>
          </div>
          <div class="brand-copy">
            <p class="document-kicker">Official Student Report Card</p>
            <h1>{{ data.school?.name || 'School Name' }}</h1>
            <p class="motto">{{ data.school?.motto || 'Excellence in Education' }}</p>
          </div>
        </div>

        <div class="term-panel">
          <span>Academic Session</span>
          <strong>{{ data.session }}</strong>
          <small>{{ data.term }} Term</small>
        </div>
      </header>

      <section class="school-contact" aria-label="School contact information">
        <p v-if="data.school?.address">{{ data.school.address }}</p>
        <p v-if="data.school?.phone">{{ data.school.phone }}</p>
        <p v-if="data.school?.email">{{ data.school.email }}</p>
        <p v-if="schoolWebsite">{{ schoolWebsite }}</p>
      </section>

      <section class="student-band">
        <div>
          <span>Student Name</span>
          <strong>{{ data.student.lastName }} {{ data.student.firstName }}</strong>
        </div>
        <div>
          <span>Student ID</span>
          <strong>{{ data.student.studentId }}</strong>
        </div>
        <div>
          <span>Class</span>
          <strong>{{ data.class.name }}</strong>
        </div>
        <div>
          <span>Gender</span>
          <strong>{{ data.student.gender || 'N/A' }}</strong>
        </div>
      </section>

      <section class="performance-summary">
        <div>
          <span>Total Marks</span>
          <strong>{{ data.result?.total ?? 'N/A' }}</strong>
        </div>
        <div>
          <span>Average</span>
          <strong>{{ data.result?.average ?? 'N/A' }}%</strong>
        </div>
        <div>
          <span>{{ positionBasedClass ? 'Position' : 'Overall Grade' }}</span>
          <strong>{{ positionBasedClass ? getPositionSuffix(data.result?.position) : overallGrade }}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{{ data.released ? 'Released' : 'Draft' }}</strong>
        </div>
      </section>

      <section class="result-section">
        <div class="section-title">
          <span>Academic Performance</span>
          <strong>{{ data.term }} Term</strong>
        </div>

        <div class="table-frame">
          <table>
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
              <tr v-for="sub in subjectRows" :key="sub.subjectId">
                <td>{{ sub.subjectName }}</td>
                <td>{{ sub.ca1 ?? '-' }}</td>
                <td>{{ sub.ca2 ?? '-' }}</td>
                <td>{{ sub.exam ?? '-' }}</td>
                <td class="total-cell">{{ sub.total ?? '-' }}</td>
                <td><span class="grade-pill" :class="getGradeColor(sub.grade)">{{ sub.grade || '-' }}</span></td>
                <td>{{ sub.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="data.cumulative" class="cumulative-section">
        <div class="section-title">
          <span>Cumulative Record</span>
          <strong>Session Progress</strong>
        </div>
        <div class="cumulative-grid">
          <div v-for="item in data.cumulative.previousTerms" :key="item.term">
            <span>{{ item.term }} Term</span>
            <strong>{{ item.average }}%</strong>
            <small>Total: {{ item.total }}</small>
          </div>
          <div v-if="data.cumulative.sessionAverage">
            <span>Session Average</span>
            <strong>{{ data.cumulative.sessionAverage }}%</strong>
            <small>Total: {{ data.cumulative.sessionTotal }}</small>
          </div>
        </div>
      </section>

      <section class="remarks-section">
        <div class="remark-box teacher-box">
          <span>Class Teacher's Remark</span>
          <p>{{ data.teacherRemark || 'Remark will be added by the class teacher.' }}</p>
          <div class="teacher-signature">{{ formTeacherName }}</div>
          <div class="signature-line"></div>
          <strong>{{ formTeacherName }}</strong>
          <small>Class Teacher's Signature & Date</small>
        </div>

        <div class="remark-box principal-box">
          <span>Principal's Remark</span>
          <p>{{ data.principalRemark || 'Highly commendable academic performance.' }}</p>
          <div v-if="data.school?.principalSignatureUrl" class="signature-image">
            <img :src="data.school.principalSignatureUrl" alt="Principal signature" />
          </div>
          <div v-else class="signature-line"></div>
          <strong>{{ data.school?.principalName || 'Principal' }}</strong>
          <small>Principal's Signature & Stamp</small>
        </div>
      </section>


    </article>
  </div>
</template>

<style scoped>
.report-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d9d1e8;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  color: #172033;
  font-family: "Segoe UI", Arial, sans-serif;
}

.report-header {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 28px;
  padding: 34px 38px;
  color: white;
  background:
    linear-gradient(135deg, rgba(38, 16, 68, 0.98), rgba(88, 28, 135, 0.96), rgba(14, 10, 24, 0.98)),
    repeating-linear-gradient(45deg, rgba(245, 197, 66, 0.16) 0 1px, transparent 1px 18px);
}

.brand-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.logo-mark {
  display: flex;
  width: 86px;
  height: 86px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.7);
  background: white;
  color: #581c87;
  font-size: 22px;
  font-weight: 900;
  font-family: Georgia, "Times New Roman", serif;
}

.logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
}

.brand-copy {
  min-width: 0;
}

.document-kicker,
.section-title span,
.student-band span,
.performance-summary span,
.remark-box span,
.report-footer span,
.term-panel span {
  display: block;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
}

.document-kicker {
  color: #f5c542;
  margin-bottom: 8px;
}

.brand-copy h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  font-family: Georgia, "Times New Roman", serif;
}

.motto {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.86);
  font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
}

.term-panel {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.14);
  text-align: center;
}

.term-panel strong {
  margin: 8px 0;
  font-size: 34px;
  font-weight: 900;
}

.term-panel small {
  font-size: 18px;
  font-weight: 800;
}

.school-contact {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: #d9d1e8;
  border-bottom: 4px solid #f5c542;
}

.school-contact p {
  min-height: 46px;
  margin: 0;
  padding: 11px 16px;
  background: #fbf8ff;
  font-size: 11px;
  font-weight: 800;
  color: #334155;
}

.student-band,
.performance-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 24px 38px 0;
}

.student-band div,
.performance-summary div,
.cumulative-grid div {
  border: 1px solid #ded3ee;
  background: #fbfcfe;
  padding: 14px 16px;
}

.student-band strong,
.performance-summary strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
  text-transform: uppercase;
}

.performance-summary {
  padding-top: 14px;
}

.performance-summary div {
  border-top: 4px solid #581c87;
}

.performance-summary div:nth-child(2) {
  border-top-color: #f5c542;
}

.performance-summary div:nth-child(3) {
  border-top-color: #111827;
}

.performance-summary div:nth-child(4) {
  border-top-color: #7e22ce;
}

.performance-summary strong {
  font-size: 22px;
}

.result-section,
.cumulative-section,
.remarks-section {
  padding: 26px 38px 0;
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #475569;
}

.section-title strong {
  color: #581c87;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  font-family: Georgia, "Times New Roman", serif;
}

.table-frame {
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 12px 10px;
  background: #241036;
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
}

td {
  padding: 11px 10px;
  border-top: 1px solid #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

tbody tr:nth-child(even) {
  background: #f8fafc;
}

.total-cell {
  color: #0f172a;
  font-weight: 900;
}

.grade-pill {
  display: inline-flex;
  min-width: 34px;
  justify-content: center;
  border: 1px solid currentColor;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 900;
}

.grade-excellent {
  color: #3b0764;
  background: #f3e8ff;
}

.grade-strong {
  color: #854d0e;
  background: #fef3c7;
}

.grade-fair {
  color: #b45309;
  background: #fef3c7;
}

.grade-danger {
  color: #b91c1c;
  background: #fee2e2;
}

.grade-neutral {
  color: #475569;
  background: #f1f5f9;
}

.cumulative-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.cumulative-grid span,
.cumulative-grid small {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.cumulative-grid strong {
  display: block;
  margin: 4px 0;
  color: #581c87;
  font-size: 20px;
  font-weight: 900;
}

.remarks-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  padding-bottom: 28px;
}

.remark-box {
  display: flex;
  min-height: 230px;
  flex-direction: column;
  border: 1px solid #cbd5e1;
  padding: 18px;
}

.teacher-box {
  background: #faf5ff;
  border-top: 5px solid #581c87;
}

.principal-box {
  background: #fffbeb;
  border-top: 5px solid #f5c542;
}

.remark-box p {
  min-height: 56px;
  margin: 10px 0 14px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  font-style: italic;
  line-height: 1.5;
}

.signature-line,
.signature-image {
  height: 94px;
  margin-top: auto;
  border-bottom: 2px solid #475569;
}

.signature-image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-image img {
  max-width: 280px;
  max-height: 86px;
  object-fit: contain;
}

.teacher-signature {
  font-family: "Brush Script MT", "Segoe Script", cursive;
  font-size: 34px;
  color: #241036;
  text-align: center;
  padding-top: 10px;
  line-height: 1;
  margin-bottom: -8px;
}

.remark-box strong {
  margin-top: 8px;
  color: #0f172a;
  font-size: 13px;
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

.report-footer {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 22px;
  align-items: center;
  padding: 18px 38px;
  background: #09090b;
  color: white;
}

.report-footer strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 900;
}

.report-footer p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}

@media (max-width: 860px) {
  .report-header,
  .remarks-section,
  .report-footer {
    grid-template-columns: 1fr;
  }

  .school-contact,
  .student-band,
  .performance-summary,
  .cumulative-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-footer p {
    text-align: left;
  }
}

@page {
  size: A4;
  margin: 10mm;
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
    width: 210mm;
    height: 297mm;
  }

  @page {
    size: A4;
    margin: 0 !important;
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .report-screen {
    max-width: none;
    padding: 0;
  }

  .report-card {
    width: 100%;
    border: 0;
    box-shadow: none;
  }

  .report-card,
  .report-card * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-header {
    grid-template-columns: 1fr 220px;
    padding: 20px 24px;
    background: white !important;
    color: #1e1b4b !important;
    border-bottom: 5px solid #581c87;
  }

  .brand-copy h1 {
    font-size: 25px;
    color: #1e1b4b !important;
  }

  .document-kicker {
    color: #581c87 !important;
  }

  .motto {
    color: #475569 !important;
  }

  .logo-mark {
    width: 68px;
    height: 68px;
    border-color: #581c87 !important;
  }

  .term-panel {
    background: #f8fafc !important;
    border-color: #581c87 !important;
    color: #1e1b4b !important;
  }

  .term-panel strong {
    font-size: 24px;
    color: #1e1b4b !important;
  }

  .term-panel small,
  .term-panel span {
    color: #475569 !important;
  }

  .school-contact {
    border-bottom-color: #581c87 !important;
  }

  .school-contact p {
    background: #f8fafc !important;
  }

  .report-footer {
    grid-template-columns: 150px 1fr;
    padding: 14px 24px;
    background: #f8fafc !important;
    color: #1e1b4b !important;
    border-top: 3px solid #581c87;
  }

  .report-footer p,
  .report-footer strong {
    color: #1e1b4b !important;
  }

  th {
    padding: 8px 6px;
    font-size: 8px;
    background: #e2e8f0 !important;
    color: #1e1b4b !important;
  }

  td {
    padding: 7px 6px;
    font-size: 10px;
  }

  tr,
  .remark-box,
  .performance-summary div,
  .student-band div {
    break-inside: avoid;
  }

  .school-contact,
  .student-band,
  .performance-summary,
  .cumulative-grid,
  .remarks-section {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .student-band,
  .performance-summary,
  .result-section,
  .cumulative-section,
  .remarks-section {
    padding-left: 24px;
    padding-right: 24px;
  }

  .student-band,
  .performance-summary {
    gap: 8px;
  }

  .result-section,
  .cumulative-section,
  .remarks-section {
    padding-top: 16px;
  }

  .remarks-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-bottom: 18px;
  }

  .remark-box {
    min-height: 190px;
    padding: 14px;
  }
}
</style>
