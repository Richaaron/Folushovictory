<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Plus, 
  BookOpen, 
  Settings2, 
  Users, 
  ChevronRight,
  School,
  Loader2
} from 'lucide-vue-next'
import api from '../../services/api'

const classes = ref<any[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const newClass = ref({ name: '', level: 'JSS', track: '' })
const showStudentsModal = ref(false)
const studentsInClass = ref<any[]>([])
const currentClass = ref<any>(null)
const studentsLoading = ref(false)
const studentsError = ref('')

const fetchStudentsForClass = async (classId: string) => {
  studentsLoading.value = true
  studentsError.value = ''
  try {
    const { data } = await api.get(`/api/admin/classes/${classId}/students`)
    studentsInClass.value = data.students || []
  } catch (err: any) {
    console.error('Error fetching class students:', err)
    try {
      const { data } = await api.get('/api/admin/students', {
        params: { classId }
      })
      studentsInClass.value = data.students || []
    } catch (fallbackErr: any) {
      console.error('Error fetching class students with fallback:', fallbackErr)
      studentsError.value = fallbackErr.response?.data?.error || err.response?.data?.error || 'Failed to load students for this class.'
      studentsInClass.value = []
    }
  } finally {
    studentsLoading.value = false
  }
}

const openStudents = async (cls: any) => {
  currentClass.value = cls
  showStudentsModal.value = true
  await fetchStudentsForClass(cls.id)
}

const fetchClasses = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = data.classes || []
  } catch (err) {
    console.error('Error fetching classes:', err)
  } finally {
    loading.value = false
  }
}

const handleAddClass = async () => {
  if (!newClass.value.name) return
  try {
    await api.post('/api/admin/classes', newClass.value)
    showAddModal.value = false
    newClass.value = { name: '', level: 'JSS', track: '' }
    await fetchClasses()
  } catch (err) {
    console.error('Error adding class:', err)
  }
}

onMounted(fetchClasses)
</script>

<template>
  <div class="space-y-4 sm:space-y-8 lg:space-y-10 fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 px-1 sm:px-2">
      <div>
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic <span class="text-royal-purple">Classes</span></h1>
        <p class="text-[9px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Configure Classrooms and Form Teachers</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-lg sm:rounded-2xl purple-gradient px-4 sm:px-6 py-3 sm:py-4 text-[8px] sm:text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95 min-h-[44px]"
      >
        <Plus class="w-4 h-4" /> <span class="hidden sm:inline">Create New Class</span><span class="sm:hidden">Add</span>
      </button>
    </div>

    <!-- Classes Grid -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <div 
        v-for="cls in classes" 
        :key="cls.id"
        class="glass-card rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 border border-royal-gold/15 bg-slate-950/95 relative overflow-hidden group min-h-[280px] sm:min-h-[320px]"
      >
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-royal-purple/5 rounded-full group-hover:scale-110 transition-transform"></div>
        
        <div class="relative z-10">
          <div class="flex items-start justify-between mb-4 sm:mb-6">
            <div class="h-10 sm:h-14 w-10 sm:w-14 rounded-lg sm:rounded-2xl purple-gradient flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30 flex-shrink-0">
              <School class="w-5 sm:w-7 h-5 sm:h-7" />
            </div>
            <div class="px-2 sm:px-3 py-1 bg-slate-900/60 rounded-lg text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-slate-200 border border-slate-700/40">
              {{ cls.level }} {{ cls.track ? `• ${cls.track}` : '' }}
            </div>
          </div>

          <h3 class="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ cls.name }}</h3>
          <p class="text-[7px] sm:text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Form Teacher: <span class="text-royal-purple">{{ cls.formTeacherUsername ? `@${cls.formTeacherUsername}` : 'Not Assigned' }}</span>
          </p>

          <div class="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 dark:border-slate-800">
            <div class="flex flex-col">
              <span class="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Students</span>
              <div class="flex items-center gap-2 mt-1">
                <Users class="w-3 sm:w-4 h-3 sm:h-4 text-royal-purple" />
                <span class="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">{{ (cls.studentCount !== undefined) ? cls.studentCount : (cls.studentIds?.length || 0) }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subjects</span>
              <div class="flex items-center gap-2 mt-1">
                <BookOpen class="w-3 sm:w-4 h-3 sm:h-4 text-amber-500" />
                <span class="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">{{ cls.subjectIds?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 sm:mt-8 flex gap-2 sm:gap-3">
            <button class="flex-grow py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-royal-purple hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-2 min-h-[36px] sm:min-h-[44px]">
              <Settings2 class="w-3 sm:w-4 h-3 sm:h-4" /> <span class="hidden sm:inline">Config</span>
            </button>
            <button @click.prevent="openStudents(cls)" class="px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-royal-purple transition-all min-h-[36px] min-w-[36px] sm:min-h-[44px] flex items-center justify-center">
              <ChevronRight class="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Add Card -->
      <button 
        @click="showAddModal = true"
        class="rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center gap-3 sm:gap-4 group hover:border-royal-purple transition-all min-h-[280px] sm:min-h-[320px]"
      >
        <div class="h-12 sm:h-16 w-12 sm:w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:bg-purple-50 group-hover:text-royal-purple transition-all">
          <Plus class="w-6 sm:w-8 h-6 sm:h-8" />
        </div>
        <div class="text-center">
          <p class="text-xs sm:text-sm font-black text-slate-400 group-hover:text-royal-purple uppercase tracking-widest">New Classroom</p>
          <p class="text-[9px] sm:text-xs font-medium text-slate-300 mt-1">Define levels and tracks</p>
        </div>
      </button>
    </div>

    <!-- Add Class Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="glass-card rounded-[2.5rem] w-full sm:max-w-lg p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-royal-gold/15 max-h-[90vh] overflow-y-auto bg-slate-950/95">
          <h2 class="text-lg sm:text-2xl font-black text-white tracking-tight mb-6 sm:mb-8">Create New <span class="text-royal-purple">Classroom</span></h2>
          
          <div class="space-y-4 sm:space-y-6">
            <div class="space-y-2">
              <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class Name</label>
              <input v-model="newClass.name" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="e.g. JSS 1A" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Level</label>
                <select v-model="newClass.level" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-lg sm:rounded-2xl text-xs font-black uppercase tracking-widest outline-none min-h-[44px]">
                  <option>JSS</option>
                  <option>SSS</option>
                  <option>PRIMARY</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Track (Optional)</label>
                <input v-model="newClass.track" type="text" class="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-lg sm:rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none min-h-[44px]" placeholder="e.g. Science" />
              </div>
            </div>

            <div class="pt-4 sm:pt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button @click="showAddModal = false" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors min-h-[44px]">Cancel</button>
              <button @click="handleAddClass" class="flex-grow py-3 sm:py-4 rounded-lg sm:rounded-2xl purple-gradient text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 min-h-[44px]">Create Class</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Students Modal -->
    <transition name="fade">
      <div v-if="showStudentsModal" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showStudentsModal = false"></div>
        <div class="glass-card rounded-[2.5rem] w-full sm:max-w-2xl p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-royal-gold/15 max-h-[80vh] overflow-y-auto bg-slate-950/95">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg sm:text-xl font-black text-white">Students — <span class="text-royal-purple">{{ currentClass?.name }}</span></h3>
            <button @click="showStudentsModal = false" class="text-slate-500 hover:text-slate-900">Close</button>
          </div>
          <div v-if="studentsLoading" class="py-10 flex justify-center">
            <Loader2 class="w-8 h-8 text-royal-purple animate-spin" />
          </div>
          <div v-else-if="studentsError" class="py-10 text-center text-red-500 font-bold">{{ studentsError }}</div>
          <div v-else-if="studentsInClass.length === 0" class="py-10 text-center text-slate-500">No students found for this class.</div>
          <ul v-else class="space-y-3">
            <li v-for="s in studentsInClass" :key="s.studentId" class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <div class="text-sm font-black text-slate-900 dark:text-white">{{ s.lastName }} {{ s.firstName }}</div>
                <div class="text-xs text-slate-400">{{ s.studentId }}</div>
              </div>
              <div class="text-xs text-slate-400">{{ s.parentName || '' }}</div>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>
