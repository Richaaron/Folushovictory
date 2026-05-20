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
const showConfigModal = ref(false)
const editingClass = ref<any>(null)

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

const openConfig = (cls: any) => {
  editingClass.value = { ...cls }
  showConfigModal.value = true
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
    <div class="border-b border-slate-700/40 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-white">Academic <span class="text-royal-purple">Classes</span></h1>
        <p class="text-xs text-slate-400 mt-1">Manage classrooms and form teachers</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-2 rounded-lg purple-gradient px-6 py-3 text-xs font-black text-white transition hover:opacity-90 w-fit"
      >
        <Plus class="w-4 h-4" /> <span class="hidden sm:inline">New Class</span><span class="sm:hidden">Add</span>
      </button>
    </div>

    <!-- Classes Grid -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="cls in classes" 
        :key="cls.id"
        class="border border-slate-700/40 rounded-lg bg-slate-900/50 p-5 space-y-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-black text-white">{{ cls.name }}</h3>
            <p class="text-sm text-slate-400 mt-1">{{ cls.level }} {{ cls.track ? `• ${cls.track}` : '' }}</p>
          </div>
          <div class="purple-gradient rounded-lg p-2 flex-shrink-0">
            <School class="w-5 h-5 text-white" />
          </div>
        </div>

        <div class="text-sm text-slate-300">
          <span class="text-slate-400">Form Teacher: </span>
          <span class="text-royal-purple font-semibold">{{ cls.formTeacherUsername ? `@${cls.formTeacherUsername}` : 'Not Assigned' }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4 border-t border-slate-700/40 pt-4">
          <div>
            <p class="text-xs text-slate-400 mb-1">Students</p>
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4 text-royal-purple" />
              <span class="text-lg font-black text-white">{{ (cls.studentCount !== undefined) ? cls.studentCount : (cls.studentIds?.length || 0) }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Subjects</p>
            <div class="flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-amber-500" />
              <span class="text-lg font-black text-white">{{ cls.subjectIds?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="openConfig(cls)" class="flex-grow py-2 rounded-lg bg-slate-800 border border-slate-700/40 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center justify-center gap-1">
            <Settings2 class="w-4 h-4" /> <span class="hidden sm:inline">Config</span>
          </button>
          <button @click.prevent="openStudents(cls)" class="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/40 text-slate-200 hover:bg-slate-700 transition flex items-center justify-center">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add Class Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60" @click="showAddModal = false"></div>
        <div class="rounded-lg w-full sm:max-w-md p-8 relative z-10 border border-slate-700/40 bg-slate-950 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-black text-white mb-6">Create New <span class="text-royal-purple">Class</span></h2>
          
          <div class="space-y-4">
            <div>
              <label class="text-xs font-semibold text-slate-400 mb-2 block">Class Name</label>
              <input v-model="newClass.name" type="text" class="w-full px-4 py-2 bg-slate-900 border border-slate-700/40 rounded-lg text-white focus:border-royal-purple outline-none" placeholder="e.g. JSS 1A" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-400 mb-2 block">Level</label>
                <select v-model="newClass.level" class="w-full px-4 py-2 bg-slate-900 text-white border border-slate-700/40 rounded-lg text-xs focus:border-royal-purple outline-none">
                  <option>JSS</option>
                  <option>SSS</option>
                  <option>PRIMARY</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-400 mb-2 block">Track</label>
                <input v-model="newClass.track" type="text" class="w-full px-4 py-2 bg-slate-900 border border-slate-700/40 rounded-lg text-white focus:border-royal-purple outline-none" placeholder="e.g. Science" />
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="showAddModal = false" class="flex-grow py-2 rounded-lg bg-slate-800 border border-slate-700/40 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition">Cancel</button>
              <button @click="handleAddClass" class="flex-grow py-2 rounded-lg purple-gradient text-sm font-semibold text-white hover:opacity-90 transition">Create</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Students Modal -->
    <transition name="fade">
      <div v-if="showStudentsModal" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60" @click="showStudentsModal = false"></div>
        <div class="rounded-lg w-full sm:max-w-2xl p-8 relative z-10 border border-slate-700/40 bg-slate-950 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black text-white">Students — <span class="text-royal-purple">{{ currentClass?.name }}</span></h3>
            <button @click="showStudentsModal = false" class="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700/40 text-slate-200 hover:bg-slate-700 transition text-sm">Close</button>
          </div>
          <div v-if="studentsLoading" class="py-8 flex justify-center">
            <Loader2 class="w-8 h-8 text-royal-purple animate-spin" />
          </div>
          <div v-else-if="studentsError" class="py-8 text-center text-red-400 text-sm">{{ studentsError }}</div>
          <div v-else-if="studentsInClass.length === 0" class="py-8 text-center text-slate-400 text-sm">No students in this class</div>
          <ul v-else class="space-y-2">
            <li v-for="s in studentsInClass" :key="s.studentId" class="p-3 rounded-lg bg-slate-900/50 border border-slate-700/40 flex items-center justify-between">
              <div>
                <div class="font-semibold text-white">{{ s.lastName }} {{ s.firstName }}</div>
                <div class="text-xs text-slate-400">{{ s.studentId }}</div>
              </div>
              <div class="text-xs text-slate-400">{{ s.parentName || '' }}</div>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <!-- Config Modal -->
    <transition name="fade">
      <div v-if="showConfigModal" class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60" @click="showConfigModal = false"></div>
        <div class="rounded-lg w-full sm:max-w-md p-8 relative z-10 border border-slate-700/40 bg-slate-950 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-black text-white">Configure <span class="text-royal-purple">{{ editingClass?.name }}</span></h2>
            <button @click="showConfigModal = false" class="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700/40 text-slate-200 hover:bg-slate-700 transition text-xs">Close</button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="text-xs font-semibold text-slate-400 block mb-2">Class Information</label>
              <div class="p-4 bg-slate-900/50 border border-slate-700/40 rounded-lg space-y-3">
                <div>
                  <p class="text-xs text-slate-400">Name</p>
                  <p class="text-sm font-semibold text-white">{{ editingClass?.name }}</p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-xs text-slate-400">Level</p>
                    <p class="text-sm font-semibold text-white">{{ editingClass?.level }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400">Track</p>
                    <p class="text-sm font-semibold text-white">{{ editingClass?.track || '—' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-400 block mb-2">Form Teacher</label>
              <div class="p-3 bg-slate-900/50 border border-slate-700/40 rounded-lg">
                <p class="text-sm font-semibold text-white">{{ editingClass?.formTeacherUsername ? `@${editingClass.formTeacherUsername}` : 'Not Assigned' }}</p>
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-400 block mb-2">Subjects</label>
              <div class="p-3 bg-slate-900/50 border border-slate-700/40 rounded-lg">
                <p class="text-sm font-semibold text-white">{{ editingClass?.subjectIds?.length || 0 }} Subjects</p>
              </div>
            </div>

            <button @click="showConfigModal = false" class="w-full py-2 rounded-lg purple-gradient text-sm font-semibold text-white hover:opacity-90 transition mt-4">Close</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
