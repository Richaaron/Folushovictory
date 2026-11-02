<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Users,
  MessageSquare,
  FileText,
  Send,
  Printer,
  BarChart3,
  UserPlus,
  Edit2,
  Trash2,
  BookOpen,
  Sliders,
  X
} from 'lucide-vue-next'
import api from '../../services/api'
import SubjectManagementModal from '../../components/SubjectManagementModal.vue'
import ClassSubjectEnrollmentModal from '../../components/ClassSubjectEnrollmentModal.vue'
import StudentSubjectPicker from '../../components/StudentSubjectPicker.vue'
import { generateSessionOptions, getCurrentSession } from '../../utils/sessions'

const route = useRoute()
const router = useRouter()

const classId = route.params.classId as string
const className = route.query.className as string

const students = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const releaseMessage = ref('')
const releaseError = ref('')

const session = ref(String(route.query.session || ''))
const term = ref(String(route.query.term || ''))
const sessionOptions = ref(generateSessionOptions().reverse())
const academicSettingsLoaded = ref(false)
const activeSchoolSession = ref('')
const isCurrentSession = computed(() => session.value === activeSchoolSession.value)

const canAddStudents = ref(false)
const currentClass = ref<any>(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showSubjectModal = ref(false)
const showEnrollmentMatrixModal = ref(false)
const editingStudent = ref<any>(null)
const editedStudent = ref({
  firstName: '',
  lastName: '',
  gender: 'Male',
  parentName: '',
  parentEmail: '',
  stream: '',
  subjectIds: [] as string[]
})

const allSubjects = ref<any[]>([])

const fetchSubjects = async () => {
  try {
    const { data } = await api.get('/api/teacher/subjects')
    allSubjects.value = data.subjects || []
  } catch (err) {
    console.error('Error fetching subjects:', err)
  }
}

const classLevel = computed(() => {
  const name = String(currentClass.value?.name || '').toUpperCase()
  if (name.includes('SSS')) return 'SSS'
  if (name.includes('JSS')) return 'JSS'
  if (name.includes('PRY') || name.includes('PRIMARY') || name.includes('NUR')) return 'Primary'
  return ''
})

const isSSS = computed(() => {
  return currentClass.value?.name?.includes('SSS')
})

const newStudent = ref({
  firstName: '',
  lastName: '',
  gender: 'Male',
  parentName: '',
  parentEmail: '',
  stream: '',
  subjectIds: [] as string[]
})

const openAddStudentModal = () => {
  const levelSubjectIds = allSubjects.value
    .filter((s: any) => !classLevel.value || String(s.level || '').toUpperCase().includes(classLevel.value))
    .map((s: any) => s.id)
  newStudent.value = {
    firstName: '',
    lastName: '',
    gender: 'Male',
    parentName: '',
    parentEmail: '',
    stream: '',
    subjectIds: levelSubjectIds
  }
  showAddModal.value = true
}

const fetchStudents = async () => {
  loading.value = true
  try {
    const studentsResp = await api.get(`/api/teacher/classes/${classId}/students`, {
      params: { session: session.value, term: term.value }
    })
    students.value = studentsResp.data.students.map((s: any) => ({
      ...s,
      remark: s.remark || ''
    }))
    canAddStudents.value = !!studentsResp.data.canAddStudents
    currentClass.value = studentsResp.data.class
  } catch (err) {
    error.value = 'Failed to load class students'
  } finally {
    loading.value = false
  }
}

const initializeAcademicPeriod = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/config/school')
    const currentSession = String(data?.currentSession || '').trim()
    const currentTerm = String(data?.currentTerm || '').trim()
    activeSchoolSession.value = currentSession || getCurrentSession()
    session.value = String(route.query.session || activeSchoolSession.value)
    term.value = String(route.query.term || currentTerm || 'First')
    if (session.value && !sessionOptions.value.includes(session.value)) {
      sessionOptions.value = [session.value, ...sessionOptions.value]
    }
    await nextTick()
    academicSettingsLoaded.value = true
    await fetchStudents()
  } catch (err) {
    console.error('Error loading current academic period:', err)
    error.value = 'Failed to load the current school session and term'
    loading.value = false
  }
}

const handleAddStudent = async () => {
  if (!newStudent.value.firstName || !newStudent.value.lastName) {
    alert('❌ Please enter both first name and last name.')
    return
  }
  try {
    await api.post('/api/teacher/students', {
      ...newStudent.value,
      classId: classId
    })
    showAddModal.value = false
    newStudent.value = {
      firstName: '',
      lastName: '',
      gender: 'Male',
      parentName: '',
      parentEmail: '',
      stream: '',
      subjectIds: []
    }
    await fetchStudents()
  } catch (err: any) {
    console.error('Error adding student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Enrollment Failed: ${errorMsg}`)
  }
}

const openEditModal = (student: any) => {
  editingStudent.value = student
  editedStudent.value = {
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    gender: student.gender || 'Male',
    parentName: student.parentName || '',
    parentEmail: student.parentEmail || '',
    stream: student.stream || '',
    subjectIds: Array.isArray(student.subjectIds) ? [...student.subjectIds] : []
  }
  showEditModal.value = true
}

const handleUpdateStudent = async () => {
  if (!editingStudent.value) return
  if (!editedStudent.value.firstName || !editedStudent.value.lastName) {
    alert('❌ Please enter both first name and last name.')
    return
  }

  try {
    await api.put(`/api/teacher/students/${editingStudent.value.studentId}`, {
      ...editedStudent.value,
      classId,
      subjectIds: editedStudent.value.subjectIds
    })
    showEditModal.value = false
    editingStudent.value = null
    await fetchStudents()
  } catch (err: any) {
    console.error('Error updating student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Update Failed: ${errorMsg}`)
  }
}

const handleDeleteStudent = async (studentId: string) => {
  if (!confirm(`Are you sure you want to delete this student record? This action cannot be undone.`)) return
  try {
    await api.delete(`/api/teacher/students/${studentId}`)
    await fetchStudents()
  } catch (err: any) {
    console.error('Error deleting student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Deletion Failed: ${errorMsg}`)
  }
}

const handleSaveRemark = async (studentId: string, remark: string) => {
  try {
    await api.post('/api/teacher/remarks', {
      session: session.value,
      term: term.value,
      studentId,
      teacherRemark: remark
    })
    return true
  } catch (err) {
    console.error('Error saving remark:', err)
    return false
  }
}

const saveAllRemarks = async () => {
  saving.value = true
  error.value = ''
  success.value = false
  try {
    const promises = students.value.map(s => handleSaveRemark(s.studentId, s.remark))
    const results = await Promise.all(promises)
    if (results.every(r => r)) {
      success.value = true
      setTimeout(() => { success.value = false }, 3000)
    } else {
      error.value = 'Some remarks failed to save'
    }
  } catch (err) {
    error.value = 'Failed to save remarks'
  } finally {
    saving.value = false
  }
}

const releaseResult = async (studentId: string, released: boolean) => {
  releaseMessage.value = ''
  releaseError.value = ''
  try {
    await api.post('/api/teacher/results/release', {
      session: session.value,
      term: term.value,
      studentId,
      released
    })
    const student = students.value.find(s => s.studentId === studentId)
    if (student) student.released = released
    releaseMessage.value = released ? 'Result successfully released.' : 'Result successfully revoked.'
    window.setTimeout(() => { releaseMessage.value = '' }, 3000)
  } catch (err: any) {
    console.error('Error releasing result:', err)
    releaseError.value = err.response?.data?.error || err.message || 'Failed to update release status.'
  }
}

watch([session, term], () => {
  if (academicSettingsLoaded.value) fetchStudents()
})

const setPresetRemark = (student: any, text: string) => {
  student.remark = text
}

onMounted(async () => {
  await Promise.all([initializeAcademicPeriod(), fetchSubjects()])
})
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div v-if="releaseMessage || releaseError" class="space-y-3">
      <div v-if="releaseMessage" class="rounded-3xl border border-emerald-400/40 bg-emerald-950/10 p-4 text-emerald-100">
        {{ releaseMessage }}
      </div>
      <div v-if="releaseError" class="rounded-3xl border border-red-400/40 bg-red-950/10 p-4 text-red-100">
        {{ releaseError }}
      </div>
    </div>
    <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div class="flex items-center gap-4 min-w-0">
        <button @click="router.back()" class="h-11 w-11 rounded-xl bg-sky-50 border border-sky-200 shadow-sm flex items-center justify-center text-[#0C4A6E] hover:bg-sky-100 transition-all shrink-0">
          <ArrowLeft class="w-5 h-5 text-sky-800" />
        </button>
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-black text-[#0C4A6E] tracking-tight truncate">Class Management & Results</h1>
          <p class="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5 truncate">{{ className }} • Form Teacher Oversight</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
        <!-- Session + Term Selectors -->
        <select v-model="session" class="w-full sm:w-auto px-3.5 py-2.5 bg-white text-slate-900 border-2 border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider outline-none shadow-xs">
          <option v-for="s in sessionOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="term" class="w-full sm:w-auto px-3.5 py-2.5 bg-white text-slate-900 border-2 border-slate-300 rounded-xl text-xs font-black uppercase tracking-wider outline-none shadow-xs">
          <option>First</option>
          <option>Second</option>
          <option>Third</option>
        </select>

        <button
          @click="router.push({ name: 'bulk-reports', params: { classId }, query: { session, term } })"
          class="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-white border-2 border-[#BAE6FD] hover:bg-sky-50 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0C4A6E] shadow-sm transition"
        >
          <Printer class="w-4 h-4 text-sky-800" />
          <span>Bulk Reports</span>
        </button>

        <button
          @click="router.push({ name: 'teacher-broadsheet', params: { classId }, query: { className, session, term } })"
          class="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-white border-2 border-[#BAE6FD] hover:bg-sky-50 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0C4A6E] shadow-sm transition"
        >
          <BarChart3 class="w-4 h-4 text-sky-800" />
          <span>Broadsheet</span>
        </button>

        <button 
          v-if="canAddStudents && isCurrentSession"
          @click="openAddStudentModal"
          class="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition active:scale-95"
        >
          <UserPlus class="w-4 h-4 text-white" />
          <span>Add Student</span>
        </button>

        <button 
          @click="showEnrollmentMatrixModal = true"
          class="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-sky-50 border-2 border-sky-300 hover:bg-sky-100 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0C4A6E] shadow-sm transition active:scale-95"
          title="Manage which students are enrolled in which subjects"
        >
          <Sliders class="w-4 h-4 text-sky-800" />
          <span>Subject Enrollment</span>
        </button>

        <button 
          @click="showSubjectModal = true"
          class="w-full sm:w-auto justify-center flex items-center gap-2 rounded-xl bg-white border-2 border-[#BAE6FD] hover:bg-sky-50 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0C4A6E] shadow-sm transition"
        >
          <BookOpen class="w-4 h-4 text-sky-800" />
          <span>Subjects</span>
        </button>

        <button 
          @click="saveAllRemarks"
          :disabled="saving"
          class="hidden sm:flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition disabled:opacity-50"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin text-white" />
          <Save v-else class="w-4 h-4 text-white" /> 
          <span>{{ saving ? 'Saving...' : 'Save Remarks' }}</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center shrink-0">
          <Users class="w-6 h-6 text-sky-800" />
        </div>
        <div>
          <p class="text-[11px] font-black text-slate-600 uppercase tracking-wider">Total Students</p>
          <p class="text-2xl font-black text-[#0C4A6E]">{{ students.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
          <MessageSquare class="w-6 h-6 text-amber-800" />
        </div>
        <div>
          <p class="text-[11px] font-black text-amber-800 uppercase tracking-wider">Remarks Pending</p>
          <p class="text-2xl font-black text-amber-900">{{ students.filter(s => !s.remark).length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border-2 border-emerald-300 p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center shrink-0">
          <FileText class="w-6 h-6 text-emerald-800" />
        </div>
        <div>
          <p class="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Results Released</p>
          <p class="text-2xl font-black text-emerald-900">{{ students.filter(s => s.released).length }}</p>
        </div>
      </div>
    </div>

    <!-- Student List -->
    <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] shadow-sm overflow-hidden">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-sky-800 animate-spin" />
      </div>

      <div v-else>
        <!-- MOBILE VIEW: Interactive Remark & Processing Cards -->
        <div class="sm:hidden p-3.5 space-y-4">
          <div 
            v-for="st in students" 
            :key="st.studentId"
            class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-4 shadow-sm space-y-3.5"
          >
            <!-- Header: Avatar, Name, ID & Release Status -->
            <div class="flex items-center justify-between pb-3 border-b border-sky-100">
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-11 w-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {{ st.lastName[0] }}{{ st.firstName[0] }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-black text-slate-900 truncate leading-tight">{{ st.lastName }} {{ st.firstName }}</p>
                  <p class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E] mt-0.5">{{ st.studentId }}</p>
                </div>
              </div>

              <!-- Status Badge -->
              <span 
                :class="st.released ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shrink-0"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="st.released ? 'bg-emerald-600' : 'bg-amber-600'"></span>
                {{ st.released ? 'Published' : 'Draft' }}
              </span>
            </div>

            <!-- Remark Input & Quick Preset Buttons -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Form Teacher's Remark</label>
                <span v-if="st.remark" class="text-[10px] font-bold text-emerald-700">Remark Set ✓</span>
              </div>

              <!-- Touch-friendly Textarea (16px font to prevent zoom) -->
              <textarea 
                v-model="st.remark"
                rows="2"
                class="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-600 outline-none resize-none leading-relaxed" 
                placeholder="Type remark or tap a preset below..."
              ></textarea>

              <!-- Quick Presets for Mobile Teachers (Massive Time Saver!) -->
              <div class="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  @click="setPresetRemark(st, 'An outstanding academic performance. Keep up the high standard.')"
                  class="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0C4A6E] text-[10px] font-extrabold transition active:scale-95"
                >
                  🌟 Outstanding
                </button>
                <button
                  type="button"
                  @click="setPresetRemark(st, 'A commendable performance with impressive discipline.')"
                  class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold transition active:scale-95"
                >
                  👍 Commendable
                </button>
                <button
                  type="button"
                  @click="setPresetRemark(st, 'Good effort shown, but capable of higher achievement.')"
                  class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-extrabold transition active:scale-95"
                >
                  💪 Can Do Better
                </button>
              </div>
            </div>

            <!-- Action Buttons Row (44px min touch height) -->
            <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-sky-100">
              <!-- Preview Report Button -->
              <button 
                @click="router.push({ name: 'student-report', params: { studentId: st.studentId }, query: { session: session, term: term, preview: 'true' } })"
                class="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-[#0C4A6E] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <FileText class="w-4 h-4 text-sky-800" />
                <span>Report</span>
              </button>

              <!-- Release / Revoke Button -->
              <button 
                v-if="!st.released"
                @click="releaseResult(st.studentId, true)"
                class="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Send class="w-3.5 h-3.5 text-white" />
                <span>Publish</span>
              </button>
              <button 
                v-else
                @click="releaseResult(st.studentId, false)"
                class="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <AlertCircle class="w-3.5 h-3.5 text-red-700" />
                <span>Revoke</span>
              </button>

              <!-- Edit Student -->
              <button 
                v-if="isCurrentSession"
                @click="openEditModal(st)"
                class="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center transition active:scale-95"
                title="Edit Student"
              >
                <Edit2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- DESKTOP TABLE VIEW -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-sky-50 border-b-2 border-sky-200">
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Student Info</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Form Teacher's Remark</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E] text-center">Status</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E] text-center">Action</th>
              </tr>
            </thead>
            <tbody v-if="students.length > 0" class="divide-y divide-sky-100 bg-white">
              <tr v-for="st in students" :key="st.studentId" class="hover:bg-sky-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                      {{ st.lastName[0] }}{{ st.firstName[0] }}
                    </div>
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ st.lastName }} {{ st.firstName }}</p>
                      <p class="text-xs font-bold text-[#0C4A6E] uppercase tracking-wider">{{ st.studentId }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 min-w-[320px]">
                  <textarea 
                    v-model="st.remark"
                    rows="2"
                    class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-600 outline-none resize-none leading-relaxed" 
                    placeholder="Enter pastoral remark..."
                  ></textarea>
                </td>
                <td class="px-6 py-4 text-center">
                  <span 
                    :class="st.released ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border"
                  >
                    <span class="h-2 w-2 rounded-full" :class="st.released ? 'bg-emerald-600' : 'bg-amber-600'"></span>
                    {{ st.released ? 'Published' : 'Draft' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      v-if="isCurrentSession"
                      @click="openEditModal(st)"
                      class="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0C4A6E] hover:bg-sky-100 transition-all flex items-center justify-center shadow-xs"
                      title="Edit Student"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button 
                      @click="router.push({ name: 'student-report', params: { studentId: st.studentId }, query: { session: session, term: term, preview: 'true' } })"
                      class="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-all flex items-center justify-center shadow-xs"
                      title="Preview Report Card"
                    >
                      <FileText class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="isCurrentSession"
                      @click="handleDeleteStudent(st.studentId)"
                      class="h-9 w-9 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all flex items-center justify-center shadow-xs"
                      title="Delete Student"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="!st.released"
                      @click="releaseResult(st.studentId, true)"
                      class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95"
                    >
                      <Send class="w-3.5 h-3.5" /> <span>Release</span>
                    </button>
                    <button 
                      v-else
                      @click="releaseResult(st.studentId, false)"
                      class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-all"
                    >
                      <AlertCircle class="w-3.5 h-3.5" /> <span>Revoke</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="4" class="px-8 py-16 text-center text-slate-600 font-bold">
                  No students found in this class.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Save Remarks Bar (Docked right above bottom nav dock) -->
    <div class="sm:hidden fixed bottom-16 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t-2 border-[#BAE6FD] z-40 shadow-lg">
      <button 
        @click="saveAllRemarks"
        :disabled="saving"
        class="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 disabled:opacity-50"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin text-white" />
        <Save v-else class="w-4 h-4 text-white" /> 
        <span>{{ saving ? 'Saving Remarks...' : 'Save All Remarks' }}</span>
      </button>
    </div>

    <!-- Mobile Spacer -->
    <div class="sm:hidden h-28"></div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white rounded-3xl border-2 border-sky-300 w-full sm:max-w-xl p-6 sm:p-8 shadow-2xl relative z-10 fade-in my-auto max-h-[88vh] overflow-y-auto custom-modal-scrollbar">
          <div class="flex items-center justify-between pb-4 mb-5 border-b-2 border-sky-100">
            <h2 class="text-lg sm:text-xl font-black text-[#0C4A6E] tracking-tight">Register New Student</h2>
            <button @click="showAddModal = false" class="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0C4A6E] flex items-center justify-center hover:bg-sky-100 transition">
              <X class="w-4 h-4" />
            </button>
          </div>
          
          <div class="space-y-4 sm:space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" placeholder="e.g. John" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" placeholder="e.g. Doe" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Gender</label>
                <select v-model="newStudent.gender" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-sky-600 focus:bg-white min-h-[44px]">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div v-if="isSSS" class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Stream</label>
                <select v-model="newStudent.stream" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-sky-600 focus:bg-white min-h-[44px]">
                  <option value="">Select Stream</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Subjects Assigned</label>
              <StudentSubjectPicker
                v-model="newStudent.subjectIds"
                :subjects="allSubjects"
                :classLevel="classLevel"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
              <input v-model="newStudent.parentEmail" type="email" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" placeholder="guardian@example.com" />
            </div>

            <div class="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <button @click="showAddModal = false" class="flex-grow py-3 rounded-xl bg-white border-2 border-slate-300 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition min-h-[44px]">Cancel</button>
              <button @click="handleAddStudent" class="flex-grow py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-xs font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 min-h-[44px]">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Student Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="bg-white rounded-3xl border-2 border-sky-300 w-full sm:max-w-xl p-6 sm:p-8 shadow-2xl relative z-10 fade-in my-auto max-h-[88vh] overflow-y-auto custom-modal-scrollbar">
          <div class="flex items-center justify-between pb-4 mb-5 border-b-2 border-sky-100">
            <h2 class="text-lg sm:text-xl font-black text-[#0C4A6E] tracking-tight">Edit Student Record</h2>
            <button @click="showEditModal = false; editingStudent = null" class="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0C4A6E] flex items-center justify-center hover:bg-sky-100 transition">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-4 sm:space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">First Name</label>
                <input v-model="editedStudent.firstName" type="text" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Last Name</label>
                <input v-model="editedStudent.lastName" type="text" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Gender</label>
                <select v-model="editedStudent.gender" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-sky-600 focus:bg-white min-h-[44px]">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div v-if="isSSS" class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Stream</label>
                <select v-model="editedStudent.stream" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-sky-600 focus:bg-white min-h-[44px]">
                  <option value="">Select Stream</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <!-- Subject Picker -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Subjects Assigned</label>
              <StudentSubjectPicker
                v-model="editedStudent.subjectIds"
                :subjects="allSubjects"
                :classLevel="classLevel"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
              <input v-model="editedStudent.parentEmail" type="email" class="w-full px-4 py-3 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-semibold outline-none focus:border-sky-600 focus:bg-white min-h-[44px]" placeholder="guardian@example.com" />
            </div>

            <div class="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <button @click="showEditModal = false; editingStudent = null" class="flex-grow py-3 rounded-xl bg-white border-2 border-slate-300 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition min-h-[44px]">Cancel</button>
              <button @click="handleUpdateStudent" class="flex-grow py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-xs font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 min-h-[44px]">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Class Subject Enrollment Matrix Modal -->
    <ClassSubjectEnrollmentModal
      :show="showEnrollmentMatrixModal"
      :class-id="classId"
      :class-name="className"
      :class-level="classLevel"
      :students="students"
      :subjects="allSubjects"
      @close="showEnrollmentMatrixModal = false"
      @updated="fetchStudents"
    />

    <!-- Subject Management Modal -->
    <SubjectManagementModal 
      :show="showSubjectModal" 
      apiEndpoint="/api/teacher/subjects" 
      @close="showSubjectModal = false" 
    />
  </div>
</template>
