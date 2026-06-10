<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  Download,
  Award,
  TrendingUp,
  Star,
  Calendar
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const studentId = route.params.studentId as string
const session = ref(String(route.query.session || '').trim())
const term = ref(String(route.query.term || '').trim())

const data = ref<any>(null)
const loading = ref(true)
const error = ref('')
const previewMode = computed(() => String(route.query.preview || '').toLowerCase() === 'true')

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
  <div class="mx-auto max-w-7xl space-y-6 p-4 fade-in report-screen">
    <!-- Action Bar -->
    <div class="no-print sticky top-0 z-50 flex items-center justify-between rounded-2xl border border-gray-700/50 bg-gray-900/90 p-4 shadow-xl backdrop-blur-xl">
      <button @click="$router.back()" class="flex items-center gap-2 text-sm font-medium text-gray-300 transition-all hover:text-purple-400">
        <ArrowLeft class="h-5 w-5" /> Back
      </button>
      <div class="flex gap-3">
        <button @click="handleDownload" class="neon-btn neon-btn-outline px-6 py-2 text-sm">
          <Download class="h-4 w-4" /> Download PDF
        </button>
        <button @click="handlePrint" class="neon-btn px-6 py-2 text-sm">
          <Printer class="h-4 w-4" /> Print
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex h-96 items-center justify-center">
      <Loader2 class="h-16 w-16 animate-spin text-purple-500" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-card p-20 text-center">
      <AlertCircle class="mx-auto mb-6 h-20 w-20 text-red-400 opacity-30" />
      <h2 class="neon-heading mb-4 text-3xl text-white">Access Restricted</h2>
      <p class="mx-auto max-w-md text-gray-400">{{ error }}</p>
    </div>

    <!-- Locked State -->
    <div v-else-if="data && !data.released && !previewMode" class="glass-card p-20 text-center">
      <Lock class="mx-auto mb-6 h-20 w-20 text-purple-400 opacity-30" />
      <h2 class="neon-heading mb-4 text-3xl text-white">Result Not Released</h2>
      <p class="mx-auto max-w-md text-gray-400">This academic report has been compiled but is currently locked by the school administration.</p>
    </div>

    <!-- Report Card -->
    <article v-else-if="data" class="report-card">
      <!-- Background Watermark Logo -->
      <div class="watermark-logo">
        <img :src="data.school?.logoUrl || '/logo.png'" :alt="data.school?.name || 'School logo'" />
      </div>

      <!-- Top Neon Line -->
      <div class="report-top-line"></div>

      <!-- Header -->
      <header class="report-header">
        <div class="brand-panel">
          <div class="logo-mark">
            <img :src="data.school?.logoUrl || '/logo.png'" :alt="data.school?.name || 'School logo'" />
          </div>
          <div class="brand-copy">
            <p class="document-kicker">
              <Star class="inline h-3 w-3" /> Official Academic Report
            </p>
            <h1>{{ data.school?.name || 'School Name' }}</h1>
            <p class="motto">{{ data.school?.motto || 'Excellence in Education' }}</p>
          </div>
        </div>

        <div class="term-panel">
          <Calendar class="mb-2 h-6 w-6" />
          <span>Academic Session</span>
          <strong>{{ data.session }}</strong>
          <small>{{ data.term }} Term</small>
        </div>
      </header>

      <!-- School Contact -->
      <section class="school-contact" aria-label="School contact information">
        <div v-if="data.school?.address" class="contact-item">
          <span class="contact-label">Address</span>
          <p>{{ data.school.address }}</p>
        </div>
        <div v-if="data.school?.phone" class="contact-item">
          <span class="contact-label">Phone</span>
          <p>{{ data.school.phone }}</p>
        </div>
        <div v-if="data.school?.email" class="contact-item">
          <span class="contact-label">Email</span>
          <p>{{ data.school.email }}</p>
        </div>
        <div v-if="schoolWebsite" class="contact-item">
          <span class="contact-label">Website</span>
          <p>{{ schoolWebsite }}</p>
        </div>
      </section>

      <!-- Preview Banner -->
      <div v-if="previewMode" class="preview-banner">
        <strong>Preview Mode:</strong> This report is not released yet, but you are viewing it as a teacher preview.
      </div>

      <!-- Student Info -->
      <section class="student-band">
        <div class="info-card">
          <span>Student Name</span>
          <strong>{{ data.student.lastName }} {{ data.student.firstName }}</strong>
        </div>
        <div class="info-card">
          <span>Student ID</span>
          <strong>{{ data.student.studentId }}</strong>
        </div>
        <div class="info-card">
          <span>Class</span>
          <strong>{{ data.class.name }}</strong>
        </div>
        <div class="info-card">
          <span>Gender</span>
          <strong>{{ data.student.gender || 'N/A' }}</strong>
        </div>
      </section>

      <!-- Performance Summary -->
      <section class="performance-summary">
        <div class="stat-card stat-purple">
          <Award class="stat-icon" />
          <span>Total Marks</span>
          <strong>{{ data.result?.total ?? 'N/A' }}</strong>
        </div>
        <div class="stat-card stat-blue">
          <TrendingUp class="stat-icon" />
          <span>Average</span>
          <strong>{{ data.result?.average ?? 'N/A' }}%</strong>
        </div>
        <div class="stat-card stat-cyan">
          <Star class="stat-icon" />
          <span>{{ positionBasedClass ? 'Position' : 'Grade' }}</span>
          <strong>{{ positionBasedClass ? getPositionSuffix(data.result?.position) : overallGrade }}</strong>
        </div>
        <div class="stat-card stat-pink">
          <span>Status</span>
          <strong>{{ data.released ? 'Released' : 'Draft' }}</strong>
        </div>
      </section>

      <!-- Academic Performance Table -->
      <section class="result-section">
        <div class="section-title">
          <span>Academic Performance</span>
          <strong>{{ data.term }} Term Results</strong>
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
      <section v-if="data.cumulative" class="cumulative-section">
        <div class="section-title">
          <span>Cumulative Record</span>
          <strong>Session Progress</strong>
        </div>
        <div class="cumulative-grid">
          <div v-for="item in data.cumulative.previousTerms" :key="item.term" class="cumulative-card">
            <span>{{ item.term }} Term</span>
            <strong>{{ item.average }}%</strong>
            <small>Total: {{ item.total }}</small>
          </div>
          <div v-if="data.cumulative.sessionAverage" class="cumulative-card cumulative-highlight">
            <span>Session Average</span>
            <strong>{{ data.cumulative.sessionAverage }}%</strong>
            <small>Total: {{ data.cumulative.sessionTotal }}</small>
          </div>
        </div>
      </section>

      <!-- Remarks Section -->
      <section class="remarks-section">
        <div class="remark-box teacher-box">
          <span>Class Teacher's Remark</span>
          <p>{{ data.teacherRemark || 'Remark will be added by the class teacher.' }}</p>
          <div class="signature-area">
            <div v-if="data.formTeacher?.signatureUrl" class="signature-image">
              <img :src="data.formTeacher.signatureUrl" alt="Teacher signature" />
            </div>
            <div v-else class="signature-line"></div>
            <div class="teacher-name">{{ formTeacherName }}</div>
            <small>Class Teacher's Signature & Date</small>
          </div>
        </div>

        <div class="remark-box principal-box">
          <span>Principal's Remark</span>
          <p>{{ data.principalRemark || 'Highly commendable academic performance.' }}</p>
          <div class="signature-area">
            <div v-if="data.school?.principalSignatureUrl" class="signature-image">
              <img :src="data.school.principalSignatureUrl" alt="Principal signature" />
            </div>
            <div v-else class="signature-line"></div>
            <strong>{{ data.school?.principalName || 'Principal' }}</strong>
            <small>Principal's Signature & Stamp</small>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="report-footer">
        <div class="footer-brand">
          <strong>{{ data.school?.name || 'School Name' }}</strong>
          <span>Academic Excellence</span>
        </div>
        <div class="footer-copy">
          <p>Generated on {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
        </div>
      </footer>

      <!-- Bottom Neon Line -->
      <div class="report-bottom-line"></div>
    </article>
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

/* Preview Banner */
.preview-banner {
  margin: 16px 38px 0;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #fbbf24;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
}

/* Student Band */
.student-band {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

tbody tr {
  transition: background 0.2s ease;
}

tbody tr:hover {
  background: rgba(168, 85, 247, 0.05);
}

tbody tr:nth-child(even) {
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

/* Responsive */
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

  .footer-copy p {
    text-align: left;
  }
}

/* Print Styles */
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

  .no-print {
    display: none !important;
  }

  .report-screen {
    max-width: none !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .report-card {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    page-break-inside: avoid !important;
    page-break-after: auto !important;
    break-inside: avoid !important;
    transform: none !important;
    transform-origin: initial !important;
  }

  .watermark-logo {
    opacity: 0.03 !important;
  }

  .report-header {
    grid-template-columns: 1fr 160px !important;
    padding: 8px 8px !important;
    gap: 12px !important;
  }

  .brand-copy h1 {
    font-size: 22px !important;
  }

  .logo-mark {
    width: 80px !important;
    height: 80px !important;
  }

  .term-panel {
    padding: 6px 8px !important;
  }

  .term-panel strong {
    font-size: 20px !important;
  }

  /* 1) Increase Table Font Size + tighten vertical padding */
  .table-frame table th,
  .table-frame table td {
    font-size: 14px !important;
    padding: 2px 4px !important;
    line-height: 1 !important;
    vertical-align: middle !important;
  }

  /* Force reduced row height where possible */
  .table-frame table tbody tr {
    height: auto !important;
    max-height: 20px !important;
  }

  /* Ensure first column remains left-aligned but keeps tight padding */
  .table-frame table th:first-child,
  .table-frame table td:first-child {
    text-align: left !important;
    width: 26% !important;
    padding-left: 6px !important;
  }

  /* 2) Remarks font size */
  .remark-box p {
    font-size: 12px !important;
    margin: 4px 0 6px !important;
    min-height: 28px !important;
    line-height: 1.25 !important;
  }

  /* 3) Shrink signature areas */
  .remark-box {
    min-height: 60px !important;
    padding: 8px !important;
  }

  .signature-area {
    margin-top: 6px !important;
  }

  .signature-line,
  .signature-image {
    height: 44px !important;
    margin-top: 2px !important;
    border-bottom: 2px solid #cbd5e1 !important;
  }

  .signature-image img {
    max-width: 180px !important;
    max-height: 40px !important;
    object-fit: contain !important;
  }

  .teacher-name {
    font-size: 12px !important;
    margin-top: 2px !important;
  }

  /* Tighten spacing in footer */
  .report-footer {
    padding: 12px 18px !important;
    gap: 12px !important;
  }

  /* Reduce table header height where possible */
  .table-frame thead th {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }

  /* Avoid page breaks inside critical sections */
  .report-header,
  .table-frame,
  .remarks-section,
  .report-footer {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .table-frame {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
</style>
