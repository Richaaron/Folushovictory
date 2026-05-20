<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  UserPlus
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const classId = route.params.classId as string
const className = route.query.className as string

const students = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)

const session = ref('2023/2024')
const term = ref('First')

const canAddStudents = ref(false)
const currentClass = ref<any>(null)
const showAddModal = ref(false)

const isSSS = computed(() => {
  return currentClass.value?.name?.includes('SSS')
})

const newStudent = ref({
  firstName: '',
  lastName: '',
  gender: 'Male',
  parentName: '',
  parentEmail: '',
  stream: ''
})

const fetchStudents = async () => {
  loading.value = true
  try {
    const [studentsResp, schoolResp] = await Promise.all([
      api.get(`/api/teacher/classes/${classId}/students`),
      api.get('/api/config/school')
    ])
    students.value = studentsResp.data.students.map((s: any) => ({
      ...s,
      remark: ''
    }))
    canAddStudents.value = !!studentsResp.data.canAddStudents
    currentClass.value = studentsResp.data.class
    if (schoolResp.data?.currentSession) session.value = schoolResp.data.currentSession
    if (schoolResp.data?.currentTerm) term.value = schoolResp.data.currentTerm
  } catch (err) {
    error.value = 'Failed to load class students'
  } finally {
    loading.value = false
  }
}

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
      stream: ''
    }
    await fetchStudents()
  } catch (err: any) {
    console.error('Error adding student:', err)
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
    alert(`❌ Enrollment Failed: ${errorMsg}`)
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
  try {
    await api.post('/api/teacher/results/release', {
      session: session.value,
      term: term.value,
      studentId,
      released
    })
    const student = students.value.find(s => s.studentId === studentId)
    if (student) student.released = released
  } catch (err) {
    console.error('Error releasing result:', err)
  }
}

onMounted(fetchStudents)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="h-12 w-12 rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow-sm flex items-center justify-center text-slate-200 hover:text-royal-purple transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Class Management</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{{ className }} • Form Teacher Oversight</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <select v-model="term" class="px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-xs font-black uppercase tracking-widest outline-none shadow-sm">
          <option>First</option>
          <option>Second</option>
          <option>Third</option>
        </select>
        <button
          @click="router.push({ name: 'bulk-reports', params: { classId }, query: { session, term } })"
          class="flex items-center gap-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:text-royal-purple"
        >
          <Printer class="w-4 h-4" />
          Bulk Results
        </button>
        <button
          @click="router.push({ name: 'teacher-broadsheet', params: { classId }, query: { className, session, term } })"
          class="flex items-center gap-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:text-royal-purple"
        >
          <BarChart3 class="w-4 h-4" />
          Broadsheet
        </button>
        <button 
          v-if="canAddStudents"
          @click="showAddModal = true"
          class="flex items-center gap-3 rounded-2xl purple-gradient px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95"
        >
          <UserPlus class="w-4 h-4" />
          Add Student
        </button>
        <button 
          @click="saveAllRemarks"
          :disabled="saving"
          class="flex items-center gap-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:text-royal-purple disabled:opacity-50"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" /> 
          {{ saving ? 'Saving...' : 'Save Remarks' }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-blue-400 flex items-center justify-center">
          <Users class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.length }}</p>
        </div>
      </div>
        <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-amber-400 flex items-center justify-center">
          <MessageSquare class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks Pending</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.filter(s => !s.remark).length }}</p>
        </div>
      </div>
        <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-emerald-400 flex items-center justify-center">
          <FileText class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results Released</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.filter(s => s.released).length }}</p>
        </div>
      </div>
    </div>

    <!-- Student List -->
    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/60">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Info</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Form Teacher's Remark</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody v-if="students.length > 0" class="divide-y divide-slate-700/40">
            <tr v-for="st in students" :key="st.studentId" class="hover:bg-slate-900/20 transition-colors">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-xs font-black text-slate-200">
                    {{ st.lastName[0] }}{{ st.firstName[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">{{ st.lastName }} {{ st.firstName }}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ st.studentId }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6 min-w-[300px]">
                <textarea 
                  v-model="st.remark"
                  rows="2"
                  class="w-full px-4 py-3 bg-slate-900/60 border-none rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-royal-purple outline-none resize-none" 
                  placeholder="Enter pastoral remark..."
                ></textarea>
              </td>
              <td class="px-8 py-6 text-center">
                <div 
                  :class="st.released ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/30' : 'bg-slate-900/60 text-slate-200 border border-slate-700/60'"
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                >
                  <div class="h-1.5 w-1.5 rounded-full" :class="st.released ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></div>
                  {{ st.released ? 'Live' : 'Draft' }}
                </div>
              </td>
              <td class="px-8 py-6 text-center">
                <div class="flex items-center justify-center gap-3">
                  <button 
                    @click="router.push({ name: 'student-report', params: { studentId: st.studentId }, query: { session: session, term: term } })"
                    class="h-10 w-10 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 hover:text-royal-purple transition-all flex items-center justify-center"
                    title="Preview Report Card"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                  <div class="w-px h-6 bg-slate-700/40"></div>
                  <button 
                    v-if="!st.released"
                    @click="releaseResult(st.studentId, true)"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-purple text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send class="w-3 h-3" /> Release
                  </button>
                  <button 
                    v-else
                    @click="releaseResult(st.studentId, false)"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    <AlertCircle class="w-3 h-3" /> Revoke
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="px-8 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-slate-400">
                  <Users class="w-12 h-12 mb-4 opacity-20" />
                  <p class="text-sm font-black uppercase tracking-widest">No students found in this class</p>
                  <p class="text-xs mt-1">Assignments may need to be updated by the admin</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  </div>

    <!-- Add Student Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="glass-card rounded-2xl sm:rounded-[2.5rem] w-full sm:max-w-xl p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-white/10 dark:border-slate-800/50 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6 sm:mb-8">Register New <span class="text-royal-purple">Student</span></h2>
          
          <div class="space-y-4 sm:space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                <input v-model="newStudent.firstName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                <input v-model="newStudent.lastName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                <select v-model="newStudent.gender" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest outline-none min-h-[44px]">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div v-if="isSSS" class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stream</label>
                <select v-model="newStudent.stream" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest outline-none min-h-[44px]">
                  <option value="">Select Stream</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent/Guardian Name</label>
                <input v-model="newStudent.parentName" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="e.g. Chief Adeleke" />
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Parent Email <span class="text-slate-500 lowercase">(Optional)</span></label>
                <input v-model="newStudent.parentEmail" type="email" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/60 text-white border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="guardian@example.com" />
              </div>
            </div>

            <div class="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button @click="showAddModal = false" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl bg-slate-900/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors min-h-[44px]">Cancel</button>
              <button @click="handleAddStudent" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl purple-gradient text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 min-h-[44px]">Enroll Student</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
