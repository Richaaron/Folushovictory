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
    
    // 2. Assign Specific Subjects (Subject Teacher / Dual Role)
    let targetClassIds: string[] = []
    if (newTeacher.value.roleType === 'Subject Teacher') {
      targetClassIds = newTeacher.value.selectedClassIds
    } else if (newTeacher.value.roleType === 'Dual Role') {
      const uniqueIds = new Set(newTeacher.value.selectedClassIds)
      if (newTeacher.value.formClassId) uniqueIds.add(newTeacher.value.formClassId)
      targetClassIds = Array.from(uniqueIds)
    } else if (newTeacher.value.roleType === 'Form Teacher') {
      targetClassIds = newTeacher.value.formClassId ? [newTeacher.value.formClassId] : []
    }

    if (newTeacher.value.assignedSubjectIds.length > 0 && targetClassIds.length > 0) {
      await api.post('/api/admin/assignments', {
        teacherUsername: teacher.username,
        classIds: targetClassIds,
        subjectIds: newTeacher.value.assignedSubjectIds
      })
    }

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
    
    // Show status message
    let message = `Staff Account Created Successfully!\n\nUsername: ${teacher.username}\nPassword: ${teacher.password}\n\nPlease copy the password now. It will not be shown again.`
    
    if (teacher.warning) {
      message += `\n\n⚠️ WARNING: ${teacher.warning}\nEmail Address: ${teacher.email}`
    } else if (teacher.emailSent) {
      message += `\n\n✅ Welcome email sent to: ${teacher.email}`
    }
    
    alert(message)
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

const filteredSubjects = computed(() => {
  if (newTeacher.value.department === 'Primary/Nursery') {
    return subjects.value.filter(s => s.level === 'Primary')
  }
  
  const level = newTeacher.value.secondaryLevel
  if (level === 'Both') return subjects.value.filter(s => s.level === 'JSS' || s.level === 'SSS')
  return subjects.value.filter(s => s.level === level)
})

onMounted(fetchTeachers)
</script>

<template>
  <div class="space-y-10 fade-in py-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="h-1 w-12 bg-nebula-500 rounded-full"></div>
          <span class="text-[10px] font-black uppercase tracking-[0.3em] text-nebula-500">Personnel Core</span>
        </div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Staff <span class="text-transparent bg-clip-text nebula-gradient">Faculty</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mt-1">Institutional Onboarding & Resource Allocation</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-3 rounded-[1.5rem] nebula-gradient px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-nebula-500/30 transition hover:scale-105 active:scale-95 group"
      >
        <UserPlus class="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
        Enroll New Faculty
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-4 items-center border-white/40 dark:border-slate-800/50">
      <div class="relative flex-grow">
        <Search class="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-nebula-500" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Filter faculty by name, username or ID..."
          class="w-full pl-16 pr-8 py-5 bg-slate-100/50 dark:bg-slate-800/30 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-nebula-500/10 outline-none transition-all placeholder-slate-400"
        />
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="academic-card overflow-hidden min-h-[500px] flex flex-col border-white/40 dark:border-slate-800/50">
      <div v-if="loading" class="flex-grow flex items-center justify-center">
        <div class="relative">
          <div class="absolute inset-0 bg-nebula-500 blur-2xl opacity-20 animate-pulse" aria-hidden="true"></div>
          <Loader2 class="w-12 h-12 text-nebula-500 animate-spin relative z-10" />
        </div>
      </div>
      <div v-else class="responsive-table-container">
        <table class="w-full text-left min-w-[600px]">
          <thead>
            <tr class="bg-slate-100/50 dark:bg-slate-800/30">
              <th class="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Faculty Member</th>
              <th class="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operations</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="teacher in filteredTeachers" :key="teacher.username" class="group hover:bg-nebula-500/[0.03] transition-colors">
              <td class="px-10 py-8">
                <div class="flex items-center gap-6">
                  <div class="relative group/avatar">
                    <div class="absolute inset-0 bg-nebula-500 blur-lg opacity-0 group-hover/avatar:opacity-30 transition-opacity" aria-hidden="true"></div>
                    <div class="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-nebula-500 font-black text-xl shadow-xl transition-transform group-hover/avatar:scale-110">
                      {{ teacher.displayName.charAt(0) }}
                    </div>
                  </div>
                  <div>
                    <p class="text-base font-black text-slate-900 dark:text-white tracking-tight">{{ teacher.displayName }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[10px] font-black text-nebula-500 bg-nebula-500/5 px-2 py-0.5 rounded-md">@{{ teacher.username }}</span>
                      <div class="h-1 w-1 bg-slate-300 rounded-full" aria-hidden="true"></div>
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ teacher.email || 'No Email' }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-10 py-8 text-right">
                <div class="flex items-center justify-end gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openEditModal(teacher)"
                    class="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-nebula-500 hover:border-nebula-500/30 hover:shadow-lg transition-all"
                    :aria-label="`Edit details for ${teacher.displayName}`"
                  >
                    <Edit2 class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button 
                    @click="handleDelete(teacher.username)"
                    class="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 hover:shadow-lg transition-all"
                    :aria-label="`Delete account for ${teacher.displayName}`"
                  >
                    <Trash2 class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredTeachers.length === 0" class="p-24 text-center">
          <div class="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
            <Search class="w-8 h-8" aria-hidden="true" />
          </div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zero faculty matches found</p>
          <p class="text-[10px] text-slate-500 mt-2">Adjust your filter or enroll a new faculty member</p>
        </div>
      </div>
    </div>

    <!-- Add Teacher Modal -->
    <transition 
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-teacher-title">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xl transition-opacity" @click="showAddModal = false"></div>
        <div class="glass-card rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl p-6 md:p-12 shadow-2xl relative z-10 border border-white/40 dark:border-slate-700/50 max-h-[95vh] overflow-y-auto scrollbar-premium">
          <div class="flex items-center justify-between mb-8 md:mb-10">
            <div class="flex items-center gap-5">
              <div class="h-12 w-12 md:h-14 md:w-14 rounded-2xl nebula-gradient flex items-center justify-center text-white shadow-2xl shadow-nebula-500/30">
                <UserPlus class="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
              </div>
              <div>
                <h2 id="add-teacher-title" class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Enroll Faculty</h2>
                <p class="text-[10px] font-black text-nebula-500 uppercase tracking-[0.2em] mt-2">Staff Access Generation</p>
              </div>
            </div>
            <button @click="showAddModal = false" class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all" aria-label="Close Modal">
              <X class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          <div class="space-y-6 md:space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div class="space-y-2">
                <label for="new-display-name" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Legal Full Name</label>
                <input id="new-display-name" v-model="newTeacher.displayName" type="text" class="w-full px-8 py-4 md:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 outline-none transition-all" placeholder="e.g. Samuel Okafor" />
              </div>
              
              <div class="space-y-2">
                <label for="new-email" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Official Email</label>
                <input id="new-email" v-model="newTeacher.email" type="email" class="w-full px-8 py-4 md:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 outline-none transition-all" placeholder="s.okafor@fvs.edu" />
              </div>
            </div>

            <!-- Department Selection -->
            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Operational Department</label>
              <div class="grid grid-cols-2 gap-4 p-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                <button 
                  @click="newTeacher.department = 'Primary/Nursery'"
                  :class="newTeacher.department === 'Primary/Nursery' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Primary/Nursery</button>
                <button 
                  @click="newTeacher.department = 'Secondary'"
                  :class="newTeacher.department === 'Secondary' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Secondary</button>
              </div>
            </div>

            <!-- Role Selection (for Secondary) -->
            <div v-if="newTeacher.department === 'Secondary'" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Academic Specialization</label>
              <div class="grid grid-cols-3 gap-3">
                <button 
                  v-for="role in ['Form Teacher', 'Subject Teacher', 'Dual Role']" 
                  :key="role"
                  @click="newTeacher.roleType = role"
                  :class="newTeacher.roleType === role ? 'bg-nebula-500 text-white shadow-lg' : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 border border-transparent hover:border-nebula-500/20'"
                  class="py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                >{{ role }}</button>
              </div>
            </div>

            <!-- Class Assignment -->
            <div v-if="newTeacher.roleType === 'Form Teacher' || newTeacher.roleType === 'Dual Role'" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Primary Class Governance</label>
              <select v-model="newTeacher.formClassId" class="w-full px-8 py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 outline-none transition-all cursor-pointer">
                <option value="">Select Governing Class...</option>
                <option v-for="cls in filteredClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
              </select>
            </div>

            <!-- Multi-Class Selection (for Subject/Dual Teacher) -->
            <div v-if="newTeacher.department === 'Secondary' && (newTeacher.roleType === 'Subject Teacher' || newTeacher.roleType === 'Dual Role')" class="space-y-4 animate-slide-up">
              <div class="flex items-center justify-between px-4">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Instructional Classes</label>
                <div class="flex gap-2">
                  <button v-for="lvl in ['JSS', 'SSS', 'Both']" :key="lvl" @click="newTeacher.secondaryLevel = lvl" :class="[newTeacher.secondaryLevel === lvl ? 'bg-nebula-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400']" class="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">{{ lvl }}</button>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-6 bg-slate-100/30 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200 dark:border-slate-700 scrollbar-premium">
                <label v-for="cls in filteredClasses" :key="cls.id" class="relative flex flex-col p-4 rounded-2xl cursor-pointer group transition-all" :class="[newTeacher.selectedClassIds.includes(cls.id) ? 'bg-nebula-500 text-white shadow-xl shadow-nebula-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-nebula-50 dark:hover:bg-nebula-900/30 border border-slate-100 dark:border-slate-800']">
                  <input type="checkbox" :value="cls.id" v-model="newTeacher.selectedClassIds" class="hidden" />
                  <span class="text-[10px] font-black uppercase tracking-widest">{{ cls.name }}</span>
                  <span class="text-[8px] font-bold opacity-60 mt-1">{{ cls.level }}</span>
                  <div v-if="newTeacher.selectedClassIds.includes(cls.id)" class="absolute top-2 right-2 h-2 w-2 bg-white rounded-full"></div>
                </label>
              </div>
            </div>

            <!-- Automated Subject Assignment -->
            <div v-if="(newTeacher.formClassId || newTeacher.selectedClassIds.length > 0) && newTeacher.roleType !== 'Form Teacher'" class="space-y-4 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Curriculum Specializations</label>
              <div v-if="newTeacher.department === 'Primary/Nursery'" class="p-8 bg-nebula-500/[0.03] rounded-[2.5rem] border border-nebula-500/20 relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 h-32 w-32 bg-nebula-500 blur-[60px] opacity-10"></div>
                <p class="text-[11px] font-black text-nebula-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                  <div class="h-1.5 w-1.5 rounded-full bg-nebula-500 animate-pulse"></div>
                  Master Instructor Curriculum
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   <div v-for="sub in filteredSubjects" :key="sub.id" class="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                     <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span class="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{{ sub.name }}</span>
                   </div>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-6 bg-slate-100/30 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 scrollbar-premium">
                <label v-for="sub in filteredSubjects" :key="sub.id" class="relative flex flex-col p-4 rounded-2xl cursor-pointer group transition-all" :class="[newTeacher.assignedSubjectIds.includes(sub.id) ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-slate-100 dark:border-slate-800']">
                  <input type="checkbox" :value="sub.id" v-model="newTeacher.assignedSubjectIds" class="hidden" />
                  <span class="text-[10px] font-black uppercase tracking-widest leading-tight">{{ sub.name }}</span>
                  <span class="text-[8px] font-bold opacity-60 mt-1 uppercase">{{ sub.level }}</span>
                  <div v-if="newTeacher.assignedSubjectIds.includes(sub.id)" class="absolute top-2 right-2 h-2 w-2 bg-white rounded-full"></div>
                </label>
              </div>
            </div>

            <div class="pt-10 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-5 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Abort</button>
              <button @click="handleAddTeacher" :disabled="creating" class="flex-[2.5] py-5 rounded-[1.5rem] nebula-gradient text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-nebula-500/30 disabled:opacity-50 group">
                <span v-if="!creating" class="flex items-center justify-center gap-3">
                  Commit Enrollment <UserPlus class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <span v-else class="flex items-center justify-center gap-3">
                  <Loader2 class="w-4 h-4 animate-spin" /> Synchronizing...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit Teacher Modal -->
    <transition 
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-teacher-title">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xl transition-opacity" @click="showEditModal = false"></div>
        <div class="glass-card rounded-[2.5rem] md:rounded-[3rem] w-full max-w-lg p-8 md:p-12 shadow-2xl relative z-10 border border-white/40 dark:border-slate-700/50">
          <div class="flex items-center gap-5 mb-8 md:mb-10">
            <div class="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-nebula-500/10 flex items-center justify-center text-nebula-500 border border-nebula-500/20">
              <Edit2 class="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
            </div>
            <div>
              <h2 id="edit-teacher-title" class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Modify Info</h2>
              <p class="text-[10px] font-black text-nebula-500 uppercase tracking-[0.2em] mt-2">Update Faculty Metadata</p>
            </div>
          </div>
          
          <div class="space-y-6 md:space-y-8" v-if="editingTeacher">
            <div class="space-y-2 group">
              <label for="edit-username" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-nebula-500 transition-colors">Faculty Identifier</label>
              <div class="relative">
                <input id="edit-username" :value="editingTeacher.username" disabled type="text" class="w-full px-8 py-4 md:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-sm font-black text-slate-400 outline-none cursor-not-allowed italic" />
                <Lock class="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" aria-hidden="true" />
              </div>
            </div>

            <div class="space-y-2">
              <label for="edit-display-name" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Updated Display Name</label>
              <input id="edit-display-name" v-model="editingTeacher.displayName" type="text" class="w-full px-8 py-4 md:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 outline-none transition-all" />
            </div>
            
            <div class="space-y-2">
              <label for="edit-email" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Updated Official Email</label>
              <input id="edit-email" v-model="editingTeacher.email" type="email" class="w-full px-8 py-4 md:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 outline-none transition-all" />
            </div>

            <div class="pt-6 md:pt-8 flex gap-4">
              <button @click="showEditModal = false" class="flex-grow py-4 md:py-5 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:bg-slate-200 transition-colors">Discard</button>
              <button @click="handleUpdateTeacher" class="flex-[2.5] py-4 md:py-5 rounded-[1.5rem] nebula-gradient text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-nebula-500/30">Apply Updates</button>
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
