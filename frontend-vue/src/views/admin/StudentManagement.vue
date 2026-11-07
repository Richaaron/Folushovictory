<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, 
  UserPlus, 
  Filter, 
  GraduationCap,
  Calendar,
  Loader2,
  Trash2,
  Edit2,
  FileText,
  KeyRound,
  LayoutGrid,
  List
} from 'lucide-vue-next'
import api from '../../services/api'
import StudentSubjectPicker from '../../components/StudentSubjectPicker.vue'

const router = useRouter()
const students = ref<any[]>([])
const classes = ref<any[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const selectedClassId = ref('')
const searchQuery = ref('')
const showEditModal = ref(false)
const editingStudent = ref<any>(null)
const editModalRoot = ref<HTMLElement | null>(null)
const mobileViewMode = ref<'cards' | 'table'>('cards')
const stats = ref({
  total: 0,
  newlyEnrolled: 0,
  awaiting: 0
})

const fetchStats = async () => {
  try {
    const { data } = await api.get('/api/admin/dashboard')
    stats.value = {
      total: data.counts.students || 0,
      newlyEnrolled: data.counts.newThisTerm || 0,
      awaiting: data.counts.awaitingResults || 0
    }
  } catch (err) {
    console.error('Error fetching stats:', err)
  }
}

const fetchClasses = async () => {
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = data.classes || []
    if (classes.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classes.value[0].id
    }
  } catch (err) {
    console.error('Error fetching classes:', err)
  }
}

const fetchStudents = async () => {
  if (!selectedClassId.value) return
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/students', {
      params: { classId: selectedClassId.value }
    })
    students.value = data.students || []
  } catch (err) {
    console.error('Error fetching students:', err)
  } finally {
    loading.value = false
  }
}

const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return students.value
  return students.value.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    return fullName.includes(query) ||
           String(student.studentId || student.id || '').toLowerCase().includes(query) ||
           String(student.parentName || '').toLowerCase().includes(query)
  })
})

const allSubjects = ref<any[]>([])

watch(showEditModal, async (open) => {
  if (open) {
    await nextTick()
    editModalRoot.value?.scrollTo({ top: 0, behavior: 'auto' })
  }
})

const fetchSubjects = async () => {
  try {
    const { data } = await api.get('/api/admin/subjects')
    allSubjects.value = data.subjects || []
  } catch (err) {
    console.error('Error fetching subjects:', err)
  }
}

const getClassLevel = (classId: string) => {
  const cls = classes.value.find((c: any) => c.id === classId)
  if (!cls) return ''
  const name = String(cls.name || '').toUpperCase()
  if (name.includes('SSS')) return 'SSS'
  if (name.includes('JSS')) return 'JSS'
  if (name.includes('PRY') || name.includes('PRIMARY') || name.includes('NUR')) return 'Primary'
  return ''
}

const newStudent = ref({
  firstName: '',
  lastName: '',
  gender: 'Male',
  parentName: '',
  parentEmail: '',
  classId: '',
  stream: '',
  subjectIds: [] as string[]
})

const handleAddStudent = async () => {
  if (!newStudent.value.firstName || !newStudent.value.lastName) {
    alert('❌ Please enter both first name and last name.')
    return
  }
  try {
    const { data } = await api.post('/api/admin/students', newStudent.value)
    showAddModal.value = false
    newStudent.value = {
      firstName: '',
      lastName: '',
      gender: 'Male',
      parentName: '',
      parentEmail: '',
      classId: '',
      stream: '',
      subjectIds: []
    }
    await fetchStudents()
    await fetchStats()
    alert(
      `Student enrolled successfully.\n\nAdmission number: ${data.studentId}\nStudent PIN: ${data.studentPin}\n\nShare these details privately with the student.`
    )
  } catch (err: any) {
    console.error('Error adding student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Enrollment Failed: ${errorMsg}`)
  }
}

const resetStudentPin = async (student: any) => {
  const studentId = student.studentId || student.id
  if (!confirm(`Generate a new student PIN for ${student.firstName} ${student.lastName}? Their current PIN will stop working.`)) return
  try {
    const { data } = await api.post(`/api/admin/students/${encodeURIComponent(studentId)}/reset-pin`)
    alert(`New PIN for ${student.firstName} ${student.lastName}:\n\nAdmission number: ${data.studentId}\nStudent PIN: ${data.pin}\n\nShare these details privately with the student.`)
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || 'Unable to reset the student PIN.'
    alert(`❌ PIN Reset Failed: ${errorMsg}`)
  }
}

const generatingAllPins = ref(false)
const pinJob = ref<any>(null)
let pinJobTimer: number | null = null

const pinJobRunning = computed(() => pinJob.value?.state === 'running')

const stopPinJobPolling = () => {
  if (pinJobTimer !== null) {
    clearInterval(pinJobTimer)
    pinJobTimer = null
  }
}

const pollPinJob = async () => {
  try {
    const { data } = await api.get('/api/admin/students/reset-all-pins/status')
    pinJob.value = data
    if (data.state === 'completed' || data.state === 'failed') {
      stopPinJobPolling()
      if (data.state === 'completed') {
        const emailNote = data.emailSent
          ? `The list has been emailed to ${data.emailedTo}.`
          : '⚠️ The email could NOT be sent (check email configuration).'
        const failureNote = data.failureCount > 0 ? `\n\n${data.failureCount} student(s) could not be updated.` : ''
        alert(`✅ Generated PINs for ${data.count} student(s).\n\n${emailNote}${failureNote}`)
      } else {
        alert(`❌ PIN generation failed: ${data.error || 'Unknown error'}`)
      }
    }
  } catch (err) {
    // ignore transient polling errors
  }
}

const initPinJob = async () => {
  try {
    const { data } = await api.get('/api/admin/students/reset-all-pins/status')
    pinJob.value = data
    if (data.state === 'running') {
      stopPinJobPolling()
      pinJobTimer = window.setInterval(pollPinJob, 5000)
    }
  } catch (err) {
    // ignore
  }
}

const generateAllPins = async () => {
  if (!confirm('Generate NEW PINs for ALL students and email the full list to the school admin address?\n\nEvery student\'s current PIN will stop working.')) return
  generatingAllPins.value = true
  try {
    const { data } = await api.post('/api/admin/students/reset-all-pins')
    pinJob.value = { state: 'running', processed: 0, total: 0, ...data }
    stopPinJobPolling()
    pinJobTimer = window.setInterval(pollPinJob, 5000)
    await pollPinJob()
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message || 'Unable to generate PINs.'
    alert(`❌ Failed: ${errorMsg}`)
    if (err.response?.status === 409) await pollPinJob()
  } finally {
    generatingAllPins.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm(`Are you sure you want to delete this student record? This action cannot be undone.`)) return
  try {
    await api.delete(`/api/admin/students/${id}`)
    await fetchStudents()
    await fetchStats()
  } catch (err: any) {
    console.error('Error deleting student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Deletion Failed: ${errorMsg}`)
  }
}

const openEditModal = (student: any) => {
  editingStudent.value = { 
    ...student,
    subjectIds: Array.isArray(student.subjectIds) ? [...student.subjectIds] : []
  }
  showEditModal.value = true
}

const handleUpdateStudent = async () => {
  if (!editingStudent.value?.firstName || !editingStudent.value?.lastName) {
    alert('❌ First Name and Last Name are required.')
    return
  }
  try {
    const studentId = editingStudent.value.studentId || editingStudent.value.id
    await api.put(`/api/admin/students/${studentId}`, editingStudent.value)
    showEditModal.value = false
    await fetchStudents()
  } catch (err: any) {
    console.error('Error updating student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Update Failed: ${errorMsg}`)
  }
}

const openResultPreview = (student: any) => {
  const studentId = student.studentId || student.id
  router.push({
    name: 'student-report',
    params: { studentId },
    query: { preview: 'true', session: '2023/2024', term: 'First' }
  })
}


watch(selectedClassId, fetchStudents)

onMounted(async () => {
  await fetchClasses()
  await fetchStudents()
  await fetchStats()
  await fetchSubjects()
  await initPinJob()
})

onUnmounted(() => {
  stopPinJobPolling()
})
</script>

<template>
  <div class="space-y-6 sm:space-y-8 fade-in relative text-slate-800">
    <!-- Header -->
    <section class="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Enrollment</h1>
        <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">Manage Registry, Admissions, and Official Student Records</p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <button 
          @click="showAddModal = true"
          class="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <UserPlus class="w-4 h-4 text-white" /> <span>Register New Student</span>
        </button>
        <button
          @click="generateAllPins"
          :disabled="generatingAllPins || pinJobRunning"
          class="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <KeyRound class="w-4 h-4 text-white" /> <span>{{ (generatingAllPins || pinJobRunning) ? 'Generating...' : 'Generate & Email All PINs' }}</span>
        </button>
      </div>
    </section>

    <!-- Background PIN generation progress -->
    <div v-if="pinJobRunning" class="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
      <Loader2 class="w-5 h-5 text-amber-700 animate-spin shrink-0" />
      <p class="text-xs sm:text-sm font-bold">
        Generating new PINs in the background — {{ pinJob?.processed || 0 }}<span v-if="pinJob?.total"> / {{ pinJob.total }}</span> students processed.
        You will receive an email at {{ pinJob?.emailedTo }} when it finishes. You can keep working.
      </p>
    </div>

    <!-- Registry Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
          <GraduationCap class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-black text-slate-600 uppercase tracking-wider">Active Enrollment</p>
          <h3 class="text-2xl font-black text-slate-900 mt-0.5">{{ stats.total.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
          <Calendar class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-black text-slate-600 uppercase tracking-wider">New This Term</p>
          <h3 class="text-2xl font-black text-slate-900 mt-0.5">{{ stats.newlyEnrolled.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
          <FileText class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-black text-slate-600 uppercase tracking-wider">Awaiting Results</p>
          <h3 class="text-2xl font-black text-slate-900 mt-0.5">{{ stats.awaiting.toLocaleString() }}</h3>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-4 shadow-sm flex flex-col gap-3">
      <div class="flex flex-col lg:flex-row gap-3">
        <div class="relative flex-grow">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input v-model="searchQuery" type="text" placeholder="Search by name or Student ID..." class="w-full bg-white border-2 border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-sky-600" />
        </div>
        <div class="flex gap-2 sm:gap-3 flex-wrap">
          <select v-model="selectedClassId" class="bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-600 flex-1 sm:flex-initial">
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
          </select>
          <button @click="fetchStudents" class="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition">
            <Filter class="w-3.5 h-3.5 text-white" /> <span>Filter</span>
          </button>
        </div>
      </div>

      <!-- Mobile Display Mode Switcher (Cards vs Table) -->
      <div class="sm:hidden flex items-center justify-between pt-2 border-t border-sky-100">
        <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">View Mode:</span>
        <div class="inline-flex rounded-xl bg-sky-50 p-1 border border-sky-200">
          <button
            @click="mobileViewMode = 'cards'"
            type="button"
            class="px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5"
            :class="mobileViewMode === 'cards' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-700 hover:text-sky-900'"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            @click="mobileViewMode = 'table'"
            type="button"
            class="px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5"
            :class="mobileViewMode === 'table' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-700 hover:text-sky-900'"
          >
            <List class="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Student List / Table Container -->
    <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] shadow-sm overflow-hidden min-h-[420px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center p-12">
        <Loader2 class="w-10 h-10 text-sky-800 animate-spin" />
      </div>
      
      <div v-else>
        <!-- MOBILE CARDS VIEW (Clean, Touch-Friendly Cards) -->
        <div v-if="mobileViewMode === 'cards'" class="sm:hidden p-3.5 space-y-3">
          <div
            v-for="student in filteredStudents"
            :key="student.studentId || student.id"
            class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-4 shadow-sm space-y-3 transition-all active:scale-[0.99]"
          >
            <!-- Top row: Avatar, Name, Class & Gender -->
            <div class="flex items-center justify-between gap-3" @click="openResultPreview(student)">
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-11 w-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                  {{ student.firstName?.charAt(0) || 'S' }}
                </div>
                <div class="min-w-0">
                  <p class="font-black text-slate-900 text-base leading-tight truncate">
                    {{ student.firstName }} {{ student.lastName }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-block text-[11px] font-extrabold text-[#0C4A6E] bg-sky-50 px-2 py-0.5 rounded border border-sky-200 truncate max-w-[130px]">
                      {{ classes.find(c => c.id === student.classId)?.name || 'Unassigned' }}
                    </span>
                    <span v-if="student.gender" class="text-[10px] font-black uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {{ student.gender }}
                    </span>
                  </div>
                </div>
              </div>

              <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-100 text-xs font-black uppercase text-[#0C4A6E] border border-sky-300 shrink-0">
                {{ student.studentId }}
              </span>
            </div>

            <!-- Actions Row with 44px min touch targets -->
            <div class="flex items-center gap-2 pt-2 border-t border-sky-100">
              <button
                @click.stop="openResultPreview(student)"
                class="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <FileText class="w-4 h-4 text-white" />
                <span>Report Sheet</span>
              </button>

              <button
                @click.stop="resetStudentPin(student)"
                class="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center transition active:scale-95"
                title="Reset PIN"
              >
                <KeyRound class="w-4 h-4 text-amber-800" />
              </button>

              <button
                @click.stop="openEditModal(student)"
                class="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center transition active:scale-95"
                title="Edit Student"
              >
                <Edit2 class="w-4 h-4 text-slate-800" />
              </button>

              <button
                @click.stop="handleDelete(student.studentId)"
                class="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold text-xs flex items-center justify-center transition active:scale-95"
                title="Delete Student"
              >
                <Trash2 class="w-4 h-4 text-red-700" />
              </button>
            </div>
          </div>
        </div>

        <!-- TABLE VIEW (Desktop default or mobile explicit toggle) -->
        <div :class="mobileViewMode === 'cards' ? 'hidden sm:block' : 'block'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-sky-50 border-b-2 border-sky-200">
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Student ID</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Full Name</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E] hidden sm:table-cell">Gender</th>
                <th class="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#0C4A6E] text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sky-100 bg-white">
              <tr v-for="student in filteredStudents" :key="student.studentId || student.id" @click="openResultPreview(student)" class="cursor-pointer transition-colors hover:bg-sky-50/50">
                <td class="px-6 py-4 align-middle">
                  <span class="inline-flex items-center px-3 py-1 rounded-md bg-sky-50 text-xs font-black uppercase tracking-wider text-[#0C4A6E] border border-sky-200">{{ student.studentId }}</span>
                </td>
                <td class="px-6 py-4 align-middle">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center shrink-0 border border-amber-300">
                      {{ student.firstName?.charAt(0) || 'S' }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-black text-slate-900 truncate text-sm">{{ student.firstName }} {{ student.lastName }}</p>
                      <p class="text-xs font-bold text-slate-600 mt-0.5">{{ classes.find(c => c.id === student.classId)?.name || 'Unassigned' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 align-middle hidden sm:table-cell">
                  <span class="text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{{ student.gender }}</span>
                </td>
                <td class="px-6 py-4 align-middle text-right">
                  <div class="inline-flex items-center justify-end gap-2">
                    <button @click.stop="resetStudentPin(student)" class="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-all shadow-sm" title="Reset student PIN" :aria-label="`Reset PIN for ${student.firstName} ${student.lastName}`">
                      <KeyRound class="w-4 h-4 text-amber-800" />
                    </button>
                    <button @click.stop="openEditModal(student)" class="p-2 rounded-xl bg-sky-50 border border-sky-200 text-[#0C4A6E] hover:bg-sky-100 transition-all shadow-sm">
                      <Edit2 class="w-4 h-4 text-sky-800" />
                    </button>
                    <button @click.stop="handleDelete(student.studentId)" class="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all shadow-sm">
                      <Trash2 class="w-4 h-4 text-red-700" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredStudents.length === 0" class="p-10 text-center">
          <p class="text-sm font-bold text-slate-600">{{ searchQuery ? `No students match "${searchQuery}"` : 'No students enrolled in this class.' }}</p>
        </div>
      </div>

      <div v-if="!loading" class="px-6 py-3 border-t border-slate-200 text-center text-xs uppercase tracking-wider text-slate-600 font-extrabold bg-slate-50">
        Showing {{ filteredStudents.length }} of {{ students.length }} students
      </div>
    </div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 w-full sm:max-w-xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-black text-slate-900 mb-6">Register New Student</h2>
          
          <div class="space-y-4 sm:space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Gender</label>
                <select v-model="newStudent.gender" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Assign to Class</label>
                <select v-model="newStudent.classId" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="newStudent.classId && classes.find(c => c.id === newStudent.classId)?.name?.includes('SSS')" class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Stream</label>
              <select v-model="newStudent.stream" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div v-if="newStudent.classId" class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Subjects Assigned</label>
              <StudentSubjectPicker
                v-model="newStudent.subjectIds"
                :subjects="allSubjects"
                :classLevel="getClassLevel(newStudent.classId)"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
              <input v-model="newStudent.parentEmail" type="email" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" placeholder="guardian@example.com" />
            </div>

            <div class="pt-4 flex gap-3">
              <button @click="showAddModal = false" class="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-extrabold flex-1 hover:bg-slate-200 transition">Cancel</button>
              <button @click="handleAddStudent" class="px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-extrabold flex-[2] transition shadow-sm">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Student Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div ref="editModalRoot" class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 w-full sm:max-w-xl shadow-2xl relative z-10 my-auto max-h-[85vh] overflow-y-auto custom-modal-scrollbar">
          <h2 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Edit2 class="w-5 h-5 text-blue-800" /> Edit Student Info
          </h2>
          
          <div class="space-y-4 sm:space-y-5" v-if="editingStudent">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">First Name</label>
                <input v-model="editingStudent.firstName" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Last Name</label>
                <input v-model="editingStudent.lastName" type="text" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Gender</label>
                <select v-model="editingStudent.gender" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Class</label>
                <select v-model="editingStudent.classId" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="editingStudent.classId && classes.find(c => c.id === editingStudent.classId)?.name?.includes('SSS')" class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Stream</label>
              <select v-model="editingStudent.stream" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Subjects Assigned</label>
              <StudentSubjectPicker
                v-model="editingStudent.subjectIds"
                :subjects="allSubjects"
                :classLevel="getClassLevel(editingStudent.classId)"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700 ml-1">Parent Email</label>
              <input v-model="editingStudent.parentEmail" type="email" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-700" />
            </div>

            <div class="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 pb-6 sm:px-8 sm:pb-8 border-t border-slate-200 flex gap-3 z-30">
              <button @click="showEditModal = false" class="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-extrabold flex-1 hover:bg-slate-200 transition">Cancel</button>
              <button @click="handleUpdateStudent" class="px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-extrabold flex-[2] transition shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
