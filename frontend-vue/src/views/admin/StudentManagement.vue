<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
  Eye,
  Printer
} from 'lucide-vue-next'
import api from '../../services/api'
import StudentScoreModal from '../../components/admin/StudentScoreModal.vue'

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

const normalizeLevel = (value: string) => {
  const normalized = String(value || '').trim().toUpperCase()
  if (['PRY', 'NUR', 'PRIMARY'].includes(normalized) || normalized.startsWith('PRE')) return 'Primary'
  if (normalized.startsWith('JSS') || normalized.includes('JUNIOR SECONDARY') || normalized.startsWith('JR')) return 'JSS'
  if (normalized.startsWith('SSS') || normalized.includes('SENIOR SECONDARY') || normalized.startsWith('SR')) return 'SSS'
  return normalized
}

const optionalSubjects = computed(() => {
  return allSubjects.value.filter((s: any) => 
    normalizeLevel(s.level) === 'SSS' && 
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

const openResultPreview = (student: any) => {
  const studentId = student.studentId || student.id
  router.push({
    name: 'student-report',
    params: { studentId },
    query: { preview: 'true', session: '2023/2024', term: 'First' }
  })
}

const printStudentResult = (student: any) => {
  const studentId = student.studentId || student.id
  const newWindow = window.open(
    `/#/report/${studentId}?preview=true&session=2023/2024&term=First`,
    '_blank'
  )
  if (newWindow) {
    newWindow.addEventListener('load', () => {
      setTimeout(() => {
        newWindow.print()
      }, 500)
    })
  }
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
  <div class="space-y-6 sm:space-y-8 fade-in relative">
    <span class="floating-math" aria-hidden="true">θ</span>
    <!-- Header -->
    <section class="parchment-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <h1 class="academic-heading text-2xl sm:text-3xl text-[#FAFAF7]">Student Enrollment</h1>
        <div class="gold-accent"></div>
        <p class="text-sm text-[#F5F0E8]/50">Manage Registry and Student Records</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="p-3 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-all">
          <Download class="w-4 h-4" />
        </button>
        <button 
          @click="showAddModal = true"
          class="chalkboard-btn chalkboard-btn-gold"
        >
          <UserPlus class="w-4 h-4" /> <span>Register Student</span>
        </button>
      </div>
    </section>

    <!-- Registry Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="parchment-card p-4 sm:p-5 flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <GraduationCap class="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <p class="text-[8px] font-black text-[#C9A84C]/50 uppercase tracking-widest">Active Enrollment</p>
          <h3 class="academic-heading text-xl text-[#FAFAF7] mt-1">{{ stats.total.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="parchment-card p-4 sm:p-5 flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <Calendar class="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <p class="text-[8px] font-black text-[#C9A84C]/50 uppercase tracking-widest">New This Term</p>
          <h3 class="academic-heading text-xl text-[#FAFAF7] mt-1">{{ stats.newlyEnrolled.toLocaleString() }}</h3>
        </div>
      </div>
      <div class="parchment-card p-4 sm:p-5 flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <FileText class="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <p class="text-[8px] font-black text-[#C9A84C]/50 uppercase tracking-widest">Awaiting Results</p>
          <h3 class="academic-heading text-xl text-[#FAFAF7] mt-1">{{ stats.awaiting.toLocaleString() }}</h3>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="parchment-card p-3 sm:p-4 flex flex-col lg:flex-row gap-2 sm:gap-4">
      <div class="relative flex-grow">
        <Search class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A84C]/40" />
        <input v-model="searchQuery" type="text" placeholder="Search by name or ID..." class="academic-input pl-10 sm:pl-12" />
      </div>
      <div class="flex gap-2 sm:gap-3 flex-wrap">
        <select v-model="selectedClassId" class="academic-select flex-1 sm:flex-initial">
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <button @click="fetchStudents" class="chalkboard-btn text-[10px]">
          <Filter class="w-3 h-3" /> <span>Filter</span>
        </button>
      </div>
    </div>

    <!-- Student Table -->
    <div class="parchment-card overflow-hidden min-h-[420px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center p-10">
        <Loader2 class="w-14 h-14 text-[#C9A84C]/50 animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="academic-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th class="hidden sm:table-cell">Gender</th>
              <th class="hidden md:table-cell">Guardian</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.studentId || student.id" @click="openResultPreview(student)" class="group cursor-pointer transition-colors hover:bg-[#C9A84C]/3">
              <td class="align-top">
                <span class="inline-flex items-center px-3 py-1 rounded-md bg-[#1B2A4A]/80 text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A84C]/80 border border-[#C9A84C]/15">{{ student.studentId }}</span>
              </td>
              <td class="align-top">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-black text-sm">
                    {{ student.firstName?.charAt(0) || 'S' }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-black text-[#FAFAF7] truncate">{{ student.firstName }} {{ student.lastName }}</p>
                    <p class="text-[9px] text-[#F5F0E8]/40 uppercase tracking-[0.25em] mt-0.5">{{ classes.find(c => c.id === student.classId)?.name || 'Unassigned' }}</p>
                  </div>
                </div>
              </td>
              <td class="align-top hidden sm:table-cell">
                <span class="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5F0E8]/50">{{ student.gender }}</span>
              </td>
              <td class="align-top hidden md:table-cell">
                <p class="font-black text-[#F5F0E8]/70 truncate">{{ student.parentName }}</p>
                <p class="text-[8px] text-[#F5F0E8]/35 uppercase tracking-[0.2em] mt-0.5">Parent</p>
              </td>
              <td class="align-top text-right">
                <div class="inline-flex items-center justify-end gap-2">
                  <button @click.stop="openResultPreview(student)" title="View Result" class="p-2 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-all">
                    <Eye class="w-4 h-4" />
                  </button>
                  <button @click.stop="printStudentResult(student)" title="Print Result" class="p-2 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-all">
                    <Printer class="w-4 h-4" />
                  </button>
                  <button @click.stop="openEditModal(student)" class="p-2 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-all">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button @click.stop="handleDelete(student.studentId)" class="p-2 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#B45A74] hover:border-[#B45A74]/30 transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredStudents.length === 0" class="p-10 text-center">
          <p class="text-sm font-bold text-[#F5F0E8]/50">{{ searchQuery ? `No students match "${searchQuery}"` : 'No students enrolled in this class.' }}</p>
        </div>
      </div>

      <div v-if="!loading" class="px-4 py-3 border-t border-[#C9A84C]/10 text-center text-[9px] uppercase tracking-[0.3em] text-[#F5F0E8]/40 font-bold">
        Showing {{ filteredStudents.length }} of {{ students.length }} students
      </div>
    </div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-[#1B2A4A]/80 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="parchment-card p-6 sm:p-8 w-full sm:max-w-xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
          <h2 class="academic-heading text-xl text-[#FAFAF7] mb-6">Register New <span class="gold-text">Student</span></h2>
          
          <div class="space-y-4 sm:space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="academic-input" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="academic-input" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Gender</label>
                <select v-model="newStudent.gender" class="academic-select">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Assign to Class</label>
                <select v-model="newStudent.classId" class="academic-select">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="newStudent.classId && classes.find(c => c.id === newStudent.classId)?.name?.includes('SSS')" class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Stream</label>
              <select v-model="newStudent.stream" class="academic-select">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div v-if="newStudent.classId && classes.find(c => c.id === newStudent.classId)?.name?.includes('SSS') && optionalSubjects.length" class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Optional Subjects (Extra)</label>
              <div class="grid grid-cols-2 gap-2 bg-[#1B2A4A]/60 p-4 rounded-xl border border-[#C9A84C]/10">
                <label v-for="sub in optionalSubjects" :key="sub.id" class="flex items-center gap-2 cursor-pointer p-1">
                  <input type="checkbox" :value="sub.id" v-model="newStudent.subjectIds" class="rounded accent-[#C9A84C]" />
                  <span class="text-xs font-semibold text-[#F5F0E8]/70">{{ sub.name }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Parent/Guardian Name</label>
                <input v-model="newStudent.parentName" type="text" class="academic-input" placeholder="e.g. Chief Adeleke" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Parent Email <span class="text-[#F5F0E8]/30 lowercase">(Optional)</span></label>
                <input v-model="newStudent.parentEmail" type="email" class="academic-input" placeholder="guardian@example.com" />
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button @click="showAddModal = false" class="chalkboard-btn flex-1">Cancel</button>
              <button @click="handleAddStudent" class="chalkboard-btn chalkboard-btn-gold flex-[2]">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Student Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="absolute inset-0 bg-[#1B2A4A]/80 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div ref="editModalRoot" class="parchment-card p-6 sm:p-8 w-full sm:max-w-xl shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto mt-10 sm:mt-16">
          <h2 class="academic-heading text-xl text-[#FAFAF7] mb-6 flex items-center gap-3">
            <Edit2 class="w-5 h-5 text-[#C9A84C]" /> Edit Student Info
          </h2>
          
          <div class="space-y-4 sm:space-y-6" v-if="editingStudent">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">First Name</label>
                <input v-model="editingStudent.firstName" type="text" class="academic-input" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Last Name</label>
                <input v-model="editingStudent.lastName" type="text" class="academic-input" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Gender</label>
                <select v-model="editingStudent.gender" class="academic-select">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Class</label>
                <select v-model="editingStudent.classId" class="academic-select">
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="editingStudent.classId && classes.find(c => c.id === editingStudent.classId)?.name?.includes('SSS')" class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Stream</label>
              <select v-model="editingStudent.stream" class="academic-select">
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div v-if="editingStudent.classId && classes.find(c => c.id === editingStudent.classId)?.name?.includes('SSS') && optionalSubjects.length" class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Optional Subjects (Extra)</label>
              <div class="grid grid-cols-2 gap-2 bg-[#1B2A4A]/60 p-4 rounded-xl border border-[#C9A84C]/10">
                <label v-for="sub in optionalSubjects" :key="sub.id" class="flex items-center gap-2 cursor-pointer p-1">
                  <input type="checkbox" :value="sub.id" v-model="editingStudent.subjectIds" class="rounded accent-[#C9A84C]" />
                  <span class="text-xs font-semibold text-[#F5F0E8]/70">{{ sub.name }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Parent Name</label>
                <input v-model="editingStudent.parentName" type="text" class="academic-input" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black uppercase tracking-widest text-[#C9A84C]/60 ml-1">Parent Email</label>
                <input v-model="editingStudent.parentEmail" type="email" class="academic-input" />
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button @click="showEditModal = false" class="chalkboard-btn flex-1">Cancel</button>
              <button @click="handleUpdateStudent" class="chalkboard-btn chalkboard-btn-gold flex-[2]">Save Changes</button>
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
