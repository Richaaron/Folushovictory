<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { 
  Search, 
  UserPlus, 
  Filter, 
  Download, 
  GraduationCap,
  Calendar,
  Loader2,
  Trash2,
  Edit2
} from 'lucide-vue-next'
import api from '../../services/api'

const students = ref<any[]>([])
const classes = ref<any[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const selectedClassId = ref('')
const searchQuery = ref('')
const showEditModal = ref(false)
const editingStudent = ref<any>(null)
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

const newStudent = ref({
  firstName: '',
  lastName: '',
  gender: 'Male',
  parentName: '',
  parentEmail: '',
  classId: ''
})

const handleAddStudent = async () => {
  try {
    await api.post('/api/admin/students', newStudent.value)
    showAddModal.value = false
    await fetchStudents()
    await fetchStats()
  } catch (err) {
    console.error('Error adding student:', err)
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
  editingStudent.value = { ...student }
  showEditModal.value = true
}

const handleUpdateStudent = async () => {
  if (!editingStudent.value?.firstName || !editingStudent.value?.lastName) return
  try {
    await api.put(`/api/admin/students/${editingStudent.value.studentId}`, editingStudent.value)
    showEditModal.value = false
    await fetchStudents()
  } catch (err) {
    console.error('Error updating student:', err)
  }
}

watch(selectedClassId, fetchStudents)

onMounted(async () => {
  await fetchClasses()
  await fetchStudents()
  await fetchStats()
})
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Student <span class="text-royal-purple">Enrollment</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage Registry and Student Records</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-royal-purple transition-all">
          <Download class="w-5 h-5" />
        </button>
        <button 
          @click="showAddModal = true"
          class="flex items-center gap-3 rounded-2xl purple-gradient px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95"
        >
          <UserPlus class="w-4 h-4" /> Register Student
        </button>
      </div>
    </div>

    <!-- Registry Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="academic-card rounded-3xl p-6 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
          <GraduationCap class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Enrollment</p>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ stats.total.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="academic-card rounded-3xl p-6 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
          <Calendar class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">New This Term</p>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ stats.newlyEnrolled.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="academic-card rounded-3xl p-6 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
          <FileText class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Results</p>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ stats.awaiting.toLocaleString() }}</h3>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="academic-card rounded-3xl p-4 flex flex-col md:flex-row gap-4">
      <div class="relative flex-grow">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Search by name or Admission ID..." class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
      </div>
      <div class="flex gap-2">
        <select v-model="selectedClassId" class="pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-royal-purple outline-none">
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <button class="flex items-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
          <Filter class="w-4 h-4" /> Filter
        </button>
      </div>
    </div>

    <!-- Student Table -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center">
        <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Admission ID</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Guardian Info</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Registry</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="student in students" :key="student.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-8 py-6">
                <span class="text-xs font-black text-royal-purple bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  {{ student.studentId }}
                </span>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <GraduationCap class="w-5 h-5" />
                  </div>
                  <p class="text-sm font-black text-slate-900 dark:text-white">{{ student.firstName }} {{ student.lastName }}</p>
                </div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-bold text-slate-500 uppercase">{{ student.gender }}</span>
              </td>
              <td class="px-8 py-6">
                <p class="text-xs font-black text-slate-700 dark:text-slate-300">{{ student.parentName }}</p>
                <p class="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Verified Parent</p>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openEditModal(student)"
                    class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-royal-purple transition-colors"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDelete(student.studentId)"
                    class="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="students.length === 0" class="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
          No students enrolled in this class.
        </div>
      </div>
      <div v-if="!loading" class="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-center">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">End of Registry List</p>
      </div>
    </div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Register New <span class="text-royal-purple">Student</span></h2>
          
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select v-model="newStudent.gender" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign to Class</label>
                <select v-model="newStudent.classId" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent/Guardian Name</label>
                <input v-model="newStudent.parentName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="e.g. Chief Adeleke" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
                <input v-model="newStudent.parentEmail" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="guardian@example.com" />
              </div>
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleAddStudent" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Student Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
            <Edit2 class="w-6 h-6 text-royal-purple" /> Edit Student Info
          </h2>
          
          <div class="space-y-6" v-if="editingStudent">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input v-model="editingStudent.firstName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input v-model="editingStudent.lastName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select v-model="editingStudent.gender" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                <select v-model="editingStudent.classId" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Name</label>
                <input v-model="editingStudent.parentName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Email</label>
                <input v-model="editingStudent.parentEmail" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showEditModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleUpdateStudent" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
