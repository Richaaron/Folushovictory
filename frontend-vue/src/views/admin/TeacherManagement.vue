<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { 
  Search, 
  Trash2, 
  Edit2, 
  UserPlus,
  Loader2
} from 'lucide-vue-next'
import api from '../../services/api'

const teachers = ref<any[]>([])
const classes = ref<any[]>([])
const subjects = ref<any[]>([])
const loading = ref(true)
const creating = ref(false)
const searchQuery = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingTeacher = ref<any>(null)
const newTeacher = ref({ 
  displayName: '', 
  email: '',
  department: 'Primary/Nursery', // 'Primary/Nursery' or 'Secondary'
  roleType: 'Subject Teacher', // 'Form Teacher', 'Subject Teacher', or 'Dual Role'
  secondaryLevel: 'Both', // 'JSS', 'SSS', or 'Both'
  formClassId: '', // For Form/Dual roles
  selectedClassIds: [] as string[], // For Subject/Dual roles
  assignedSubjectIds: [] as string[]
})

const fetchTeachers = async () => {
  loading.value = true
  try {
    const [tResp, cResp, sResp] = await Promise.all([
      api.get('/api/admin/teachers'),
      api.get('/api/admin/classes'),
      api.get('/api/admin/subjects')
    ])
    teachers.value = tResp.data.teachers || []
    classes.value = cResp.data.classes || []
    subjects.value = sResp.data.subjects || []
  } catch (err) {
    console.error('Error fetching teachers data:', err)
  } finally {
    loading.value = false
  }
}

// Auto-assign subjects for Primary/Nursery classes
watch(() => newTeacher.value.formClassId, (newId) => {
  if (!newId || newTeacher.value.department !== 'Primary/Nursery') return
  
  const selectedClass = classes.value.find(c => c.id === newId)
  if (selectedClass) {
    newTeacher.value.assignedSubjectIds = subjects.value.map(s => s.id)
  }
})

// Reset fields on department change
watch(() => newTeacher.value.department, (newDept) => {
  newTeacher.value.formClassId = ''
  newTeacher.value.selectedClassIds = []
  newTeacher.value.assignedSubjectIds = []
  if (newDept === 'Primary/Nursery') {
    newTeacher.value.roleType = 'Dual Role'
  } else {
    newTeacher.value.roleType = 'Subject Teacher'
    newTeacher.value.secondaryLevel = 'Both'
  }
})

// Reset subjects on secondary level change
watch(() => newTeacher.value.secondaryLevel, () => {
  newTeacher.value.assignedSubjectIds = []
})

const handleAddTeacher = async () => {
  if (!newTeacher.value.displayName) return
  creating.value = true
  try {
    const { data: teacher } = await api.post('/api/admin/teachers', {
      displayName: newTeacher.value.displayName,
      email: newTeacher.value.email
    })
    
    // 1. Assign Form Class Role (if applicable)
    if ((newTeacher.value.roleType === 'Form Teacher' || newTeacher.value.roleType === 'Dual Role') && newTeacher.value.formClassId) {
      await api.put(`/api/admin/classes/${newTeacher.value.formClassId}/subjects`, {
        formTeacherUsername: teacher.username
      })
    }
    
    // Note: Subject assignments removed from this modal as per user request.
    // They can be managed after account creation.

    showAddModal.value = false
    newTeacher.value = { 
      displayName: '', 
      email: '', 
      department: 'Primary/Nursery',
      roleType: 'Subject Teacher',
      secondaryLevel: 'Both',
      formClassId: '', 
      selectedClassIds: [],
      assignedSubjectIds: [] 
    }
    await fetchTeachers()
    alert(`Staff Account Created Successfully!\n\nUsername: ${teacher.username}\nPassword: ${teacher.password}\n\nPlease copy the password now. It will not be shown again.`)
  } catch (err) {
    console.error('Error adding teacher:', err)
  } finally {
    creating.value = false
  }
}

const handleDelete = async (username: string) => {
  if (!confirm(`Are you sure you want to delete staff account: ${username}? This action cannot be undone.`)) return
  try {
    await api.delete(`/api/admin/teachers/${username}`)
    await fetchTeachers()
  } catch (err) {
    console.error('Error deleting teacher:', err)
  }
}

const openEditModal = (teacher: any) => {
  editingTeacher.value = { ...teacher }
  showEditModal.value = true
}

const handleUpdateTeacher = async () => {
  if (!editingTeacher.value?.displayName) return
  try {
    await api.put(`/api/admin/teachers/${editingTeacher.value.username}`, {
      displayName: editingTeacher.value.displayName,
      email: editingTeacher.value.email
    })
    showEditModal.value = false
    await fetchTeachers()
  } catch (err) {
    console.error('Error updating teacher:', err)
  }
}

const filteredTeachers = computed(() => {
  if (!searchQuery.value) return teachers.value
  const query = searchQuery.value.toLowerCase()
  return teachers.value.filter(t => 
    t.displayName.toLowerCase().includes(query) || 
    t.username.toLowerCase().includes(query)
  )
})

const filteredClasses = computed(() => {
  if (newTeacher.value.department === 'Primary/Nursery') {
    return classes.value.filter(c => {
      const lvl = String(c.level).toUpperCase()
      return lvl.includes('PRY') || lvl.includes('NUR') || lvl.includes('PRE')
    })
  }
  const level = newTeacher.value.secondaryLevel
  if (level === 'Both') return classes.value.filter(c => {
    const lvl = String(c.level).toUpperCase()
    return lvl.includes('JSS') || lvl.includes('SSS') || lvl.includes('SS')
  })
  return classes.value.filter(c => String(c.level).toUpperCase().includes(level))
})

onMounted(fetchTeachers)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff <span class="text-royal-purple">Faculty</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage Teachers and Academic Assignments</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-3 rounded-2xl purple-gradient px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95"
      >
        <UserPlus class="w-4 h-4" /> Add New Staff
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="academic-card rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-grow">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by name, username..."
          class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-royal-purple outline-none transition-all"
        />
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teacher Profile</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="teacher in filteredTeachers" :key="teacher.username" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-royal-purple font-black text-lg">
                    {{ teacher.displayName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">{{ teacher.displayName }}</p>
                    <p class="text-xs font-bold text-slate-400">@{{ teacher.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openEditModal(teacher)"
                    class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-royal-purple transition-colors"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDelete(teacher.username)"
                    class="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredTeachers.length === 0" class="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
          No staff members found matching your search.
        </div>
      </div>
    </div>

    <!-- Add Teacher Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
            <UserPlus class="w-6 h-6 text-royal-purple" /> Add New Staff
          </h2>
          
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Display Name</label>
              <input v-model="newTeacher.displayName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="e.g. Samuel Okafor" />
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address (Optional)</label>
              <input v-model="newTeacher.email" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="s.okafor@fvs.edu" />
            </div>

            <!-- Department Selection -->
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
              <div class="grid grid-cols-2 gap-4">
                <button 
                  @click="newTeacher.department = 'Primary/Nursery'"
                  :class="newTeacher.department === 'Primary/Nursery' ? 'purple-gradient text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'"
                  class="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >Primary/Nursery</button>
                <button 
                  @click="newTeacher.department = 'Secondary'"
                  :class="newTeacher.department === 'Secondary' ? 'purple-gradient text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'"
                  class="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >Secondary</button>
              </div>
            </div>

            <!-- Role Selection (for Secondary) -->
            <div v-if="newTeacher.department === 'Secondary'" class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Role</label>
              <div class="grid grid-cols-3 gap-2">
                <button 
                  v-for="role in ['Form Teacher', 'Subject Teacher', 'Dual Role']" 
                  :key="role"
                  @click="newTeacher.roleType = role"
                  :class="newTeacher.roleType === role ? 'bg-royal-purple text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'"
                  class="py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >{{ role }}</button>
              </div>
            </div>

            <!-- Class Assignment -->
            <div v-if="newTeacher.roleType === 'Form Teacher' || newTeacher.roleType === 'Dual Role'" class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Class (Form Role)</label>
              <select v-model="newTeacher.formClassId" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-royal-purple outline-none">
                <option value="">Select a class...</option>
                <option v-for="cls in filteredClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
              </select>
            </div>

            <!-- Level Selection (for Subject/Dual Teacher) -->
            <div v-if="newTeacher.department === 'Secondary' && (newTeacher.roleType === 'Subject Teacher' || newTeacher.roleType === 'Dual Role')" class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teaching Levels (Subjects)</label>
              <div class="grid grid-cols-3 gap-2">
                <button 
                  v-for="lvl in ['JSS', 'SSS', 'Both']" 
                  :key="lvl"
                  @click="newTeacher.secondaryLevel = lvl"
                  :class="newTeacher.secondaryLevel === lvl ? 'bg-amber-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'"
                  class="py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >{{ lvl }}</button>
              </div>
            </div>

            <!-- Multi-Class Selection (for Subject/Dual Teacher) -->
            <div v-if="newTeacher.department === 'Secondary' && (newTeacher.roleType === 'Subject Teacher' || newTeacher.roleType === 'Dual Role')" class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Teaching Classes</label>
              <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label v-for="cls in filteredClasses" :key="cls.id" class="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" :value="cls.id" v-model="newTeacher.selectedClassIds" class="w-4 h-4 rounded border-slate-300 text-royal-purple focus:ring-royal-purple" />
                  <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-royal-purple transition-colors">{{ cls.name }}</span>
                </label>
              </div>
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleAddTeacher" :disabled="creating" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 disabled:opacity-50">
                {{ creating ? 'Creating...' : 'Create Staff Account' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Teacher Modal -->
    <transition name="fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showEditModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
            <Edit2 class="w-6 h-6 text-royal-purple" /> Edit Staff Info
          </h2>
          
          <div class="space-y-6" v-if="editingTeacher">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff Username</label>
              <input :value="editingTeacher.username" disabled type="text" class="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-500 outline-none cursor-not-allowed" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Display Name</label>
              <input v-model="editingTeacher.displayName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <input v-model="editingTeacher.email" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showEditModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleUpdateTeacher" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Custom scrollbar for subject list */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.dark ::-webkit-scrollbar-thumb { background: #334155; }
</style>
