<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { 
  Search, 
  UserPlus, 
  Filter, 
  Download, 
  GraduationCap,
  Calendar,
  Loader2,
  Trash2,
  Edit2,
  FileText,
  BookOpen
} from 'lucide-vue-next'
import api from '../../services/api'
import StudentScoreModal from '../../components/admin/StudentScoreModal.vue'

const students = ref<any[]>([])
const classes = ref<any[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const selectedClassId = ref('')
const searchQuery = ref('')
const showEditModal = ref(false)
const editingStudent = ref<any>(null)
const showScoreModal = ref(false)
const selectedStudent = ref<any>(null)
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

const selectedClassName = computed(() => {
  return classes.value.find(c => c.id === selectedClassId.value)?.name || 'selected class'
})

const allSubjects = ref<any[]>([])

const fetchSubjects = async () => {
  try {
    const { data } = await api.get('/api/admin/subjects')
    allSubjects.value = data.subjects || []
  } catch (err) {
    console.error('Error fetching subjects:', err)
  }
}

const optionalSubjects = computed(() => {
  return allSubjects.value.filter((s: any) => 
    s.level === 'SSS' && 
    !['Mathematics', 'English Language', 'Marketing', 'Citizenship and Heritage studies', 'Economics', 'Biology', 'Chemistry', 'Physics', 'Government', 'Literature in English', 'Financial Accounting', 'Commerce'].includes(s.name)
  )
})

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
  if (!newStudent.value.parentName) {
    alert("❌ Parent/Guardian Name is required to enroll a student.")
    return
  }
  try {
    await api.post('/api/admin/students', newStudent.value)
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
  } catch (err: any) {
    console.error('Error adding student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Enrollment Failed: ${errorMsg}`)
  }
}

const handleDelete = async (id: string) => {
  if (!confirm(`Are you sure you want to delete this student record? This action cannot be undone.`)) return
  try {
    await api.delete(`/api/admin/students/${id}`)
    await fetchStudents()
    await fetchStats()
  } catch (err) {
    console.error('Error deleting student:', err)
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
  if (!editingStudent.value?.parentName) {
    alert('❌ Parent/Guardian Name is required.')
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

const openScoreModal = (student: any) => {
  selectedStudent.value = student
  showScoreModal.value = true
}

const handleScoreSaved = () => {
  showScoreModal.value = false
  selectedStudent.value = null
}

watch(selectedClassId, fetchStudents)

onMounted(async () => {
  await fetchClasses()
  await fetchStudents()
  await fetchStats()
  await fetchSubjects()
})
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="glass-card rounded-[2rem] border border-slate-700/60 bg-slate-950/95 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
      <div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">Student <span class="text-royal-purple">Enrollment</span></h1>
        <p class="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Manage Registry and Student Records</p>
      </div>
      <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <button class="flex-shrink-0 h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-slate-900/65 border border-slate-700/60 text-slate-200 hover:text-royal-purple transition-all flex">
          <Download class="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
        <button 
          @click="showAddModal = true"
          class="flex-grow sm:flex-grow-0 flex items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-lg sm:rounded-2xl nebula-gradient px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-nebula-500/30 transition hover:scale-105 active:scale-95 min-h-[44px] sm:min-h-[48px]"
        >
          <UserPlus class="w-4 sm:w-4 h-4 sm:h-4 flex-shrink-0" /> <span class="hidden sm:inline">Register Student</span><span class="sm:hidden">Add</span>
        </button>
      </div>
    </div>

    <!-- Registry Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center gap-3 sm:gap-6 border border-slate-700/60 bg-slate-950/90">
        <div class="h-10 sm:h-14 w-10 sm:w-14 rounded-lg sm:rounded-2xl bg-slate-900/60 border border-slate-700/60 text-emerald-300 flex items-center justify-center flex-shrink-0">
          <GraduationCap class="w-5 sm:w-7 h-5 sm:h-7" />
        </div>
        <div class="min-w-0">
          <p class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Enrollment</p>
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{{ stats.total.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center gap-3 sm:gap-6 border border-slate-700/60 bg-slate-950/90">
        <div class="h-10 sm:h-14 w-10 sm:w-14 rounded-lg sm:rounded-2xl bg-slate-900/60 border border-slate-700/60 text-amber-300 flex items-center justify-center flex-shrink-0">
          <Calendar class="w-5 sm:w-7 h-5 sm:h-7" />
        </div>
        <div class="min-w-0">
          <p class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">New This Term</p>
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{{ stats.newlyEnrolled.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center gap-3 sm:gap-6 sm:col-span-2 lg:col-span-1 border border-slate-700/60 bg-slate-950/90">
        <div class="h-10 sm:h-14 w-10 sm:w-14 rounded-lg sm:rounded-2xl bg-slate-900/60 border border-slate-700/60 text-blue-300 flex items-center justify-center flex-shrink-0">
          <FileText class="w-5 sm:w-7 h-5 sm:h-7" />
        </div>
        <div class="min-w-0">
          <p class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Awaiting Results</p>
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{{ stats.awaiting.toLocaleString() }}</h3>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col lg:flex-row gap-2 sm:gap-4 bg-slate-950/90 border border-slate-700/60">
      <div class="relative flex-grow">
        <Search class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Search by name or ID..." class="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
      </div>
      <div class="flex gap-2 sm:gap-3 flex-wrap">
        <select v-model="selectedClassId" class="pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-[9px] sm:text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-royal-purple outline-none flex-1 sm:flex-initial">
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <button @click="fetchStudents" class="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-slate-900/65 border border-slate-700/60 rounded-lg sm:rounded-2xl text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-slate-950 transition-all min-h-[44px]">
          <Filter class="w-4 h-4" /> <span class="hidden sm:inline">Filter</span>
        </button>
      </div>
    </div>

    <!-- Student Table -->
    <div class="glass-card rounded-[2.5rem] border border-royal-gold/15 overflow-hidden min-h-[420px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center bg-slate-950/95 p-10">
        <Loader2 class="w-14 h-14 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto bg-slate-950/90">
        <table class="w-full text-left text-[10px] sm:text-xs md:text-sm border-separate border-spacing-0">
          <thead>
            <tr class="bg-slate-900/65 text-slate-300">
              <th class="px-3 sm:px-6 py-4 sm:py-5 uppercase tracking-[0.25em]">ID</th>
              <th class="px-3 sm:px-6 py-4 sm:py-5 uppercase tracking-[0.25em]">Name</th>
              <th class="px-3 sm:px-6 py-4 sm:py-5 uppercase tracking-[0.25em] hidden sm:table-cell">Gender</th>
              <th class="px-3 sm:px-6 py-4 sm:py-5 uppercase tracking-[0.25em] hidden md:table-cell">Guardian</th>
              <th class="px-3 sm:px-6 py-4 sm:py-5 uppercase tracking-[0.25em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="student in filteredStudents" :key="student.studentId || student.id" class="group hover:bg-slate-900/60 transition-colors">
              <td class="px-3 sm:px-6 py-4 sm:py-5 align-top">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-[#2f2a4d] text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-royal-purple border border-royal-purple/20">{{ student.studentId }}</span>
              </td>
              <td class="px-3 sm:px-6 py-4 sm:py-5 align-top">
                <div class="flex items-center gap-3">
                  <div class="h-10 sm:h-12 w-10 sm:w-12 rounded-2xl bg-slate-900/70 border border-slate-700/70 flex items-center justify-center text-royal-gold font-black text-sm sm:text-lg">
                    {{ student.firstName?.charAt(0) || 'S' }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-black text-white truncate">{{ student.firstName }} {{ student.lastName }}</p>
                    <p class="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-[0.25em] mt-1">{{ classes.find(c => c.id === student.classId)?.name || 'Unassigned' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 sm:px-6 py-4 sm:py-5 align-top hidden sm:table-cell">
                <span class="text-[9px] sm:text-xs font-black uppercase tracking-[0.25em] text-slate-400">{{ student.gender }}</span>
              </td>
              <td class="px-3 sm:px-6 py-4 sm:py-5 align-top hidden md:table-cell">
                <p class="font-black text-slate-200 truncate">{{ student.parentName }}</p>
                <p class="text-[9px] text-slate-500 uppercase tracking-[0.2em] mt-1">Verified Parent</p>
              </td>
              <td class="px-3 sm:px-6 py-4 sm:py-5 align-top text-right">
                <div class="inline-flex items-center justify-end gap-2">
                  <button @click="openScoreModal(student)" class="p-2 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-amber-900/80 hover:text-amber-200 transition-colors">
                    <BookOpen class="w-4 h-4" />
                  </button>
                  <button @click="openEditModal(student)" class="p-2 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-slate-950 hover:text-royal-purple transition-colors">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button @click="handleDelete(student.studentId)" class="p-2 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-red-900/80 hover:text-red-300 transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredStudents.length === 0" class="p-6 sm:p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
          <p>{{ searchQuery ? `No students match "${searchQuery}"` : 'No students enrolled in this class.' }}</p>
        </div>
      </div>

      <div v-if="!loading" class="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900/70 border-t border-slate-800 text-center text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-slate-500">
        Showing {{ filteredStudents.length }} of {{ students.length }} students in {{ selectedClassName }}
      </div>
    </div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="glass-card rounded-2xl sm:rounded-[2.5rem] w-full sm:max-w-xl p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-white/30 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg sm:text-2xl font-black text-white tracking-tight mb-6 sm:mb-8">Register New <span class="text-royal-purple">Student</span></h2>
          
          <div class="space-y-4 sm:space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select v-model="newStudent.gender" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign to Class</label>
                <select v-model="newStudent.classId" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="newStudent.classId && classes.find(c => c.id === newStudent.classId)?.name?.includes('SSS')" class="space-y-2">
              <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stream</label>
              <select v-model="newStudent.stream" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <!-- Optional Subjects Checkboxes for New Student -->
            <div v-if="newStudent.classId && classes.find(c => c.id === newStudent.classId)?.name?.includes('SSS') && optionalSubjects.length" class="space-y-2">
              <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Optional Subjects (Extra)</label>
              <div class="grid grid-cols-2 gap-2 bg-slate-900/30 p-4 rounded-xl sm:rounded-2xl border border-slate-700/60">
                <label v-for="sub in optionalSubjects" :key="sub.id" class="flex items-center gap-2 cursor-pointer p-1">
                  <input type="checkbox" :value="sub.id" v-model="newStudent.subjectIds" class="rounded text-royal-purple focus:ring-royal-purple h-4 w-4 bg-slate-900/60 border border-slate-700/60" />
                  <span class="text-xs font-semibold text-slate-200">{{ sub.name }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent/Guardian Name</label>
                <input v-model="newStudent.parentName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="e.g. Chief Adeleke" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
                <input v-model="newStudent.parentEmail" type="email" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="guardian@example.com" />
              </div>
            </div>

            <div class="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button @click="showAddModal = false" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl bg-slate-900/70 border border-slate-700/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-200 hover:bg-slate-950 transition-colors min-h-[44px]">Cancel</button>
              <button @click="handleAddStudent" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl purple-gradient text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 min-h-[44px]">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Student Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="glass-card rounded-2xl sm:rounded-[2.5rem] w-full sm:max-w-xl p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-white/30 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg sm:text-2xl font-black text-white tracking-tight mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <Edit2 class="w-5 sm:w-6 h-5 sm:h-6 text-royal-purple" /> Edit Student Info
          </h2>
          
          <div class="space-y-4 sm:space-y-6" v-if="editingStudent">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input v-model="editingStudent.firstName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input v-model="editingStudent.lastName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select v-model="editingStudent.gender" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                <select v-model="editingStudent.classId" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="editingStudent.classId && classes.find(c => c.id === editingStudent.classId)?.name?.includes('SSS')" class="space-y-2">
              <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stream</label>
              <select v-model="editingStudent.stream" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none min-h-[44px]">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <!-- Optional Subjects Checkboxes for Editing Student -->
            <div v-if="editingStudent.classId && classes.find(c => c.id === editingStudent.classId)?.name?.includes('SSS') && optionalSubjects.length" class="space-y-2">
              <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Optional Subjects (Extra)</label>
              <div class="grid grid-cols-2 gap-2 bg-slate-900/30 p-4 rounded-xl sm:rounded-2xl border border-slate-700/60">
                <label v-for="sub in optionalSubjects" :key="sub.id" class="flex items-center gap-2 cursor-pointer p-1">
                  <input type="checkbox" :value="sub.id" v-model="editingStudent.subjectIds" class="rounded text-royal-purple focus:ring-royal-purple h-4 w-4 bg-slate-900/60 border border-slate-700/60" />
                  <span class="text-xs font-semibold text-slate-200">{{ sub.name }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Name</label>
                <input v-model="editingStudent.parentName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Email</label>
                <input v-model="editingStudent.parentEmail" type="email" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
            </div>

            <div class="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button @click="showEditModal = false" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl bg-slate-900/70 border border-slate-700/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-200 hover:bg-slate-950 transition-colors min-h-[44px]">Cancel</button>
              <button @click="handleUpdateStudent" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl purple-gradient text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 min-h-[44px]">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Student Score Modal -->
    <StudentScoreModal 
      v-if="selectedStudent"
      :is-open="showScoreModal"
      :student="selectedStudent"
      :class-id="selectedStudent.classId || selectedClassId"
      @close="showScoreModal = false"
      @saved="handleScoreSaved"
    />
  </div>
</template>
