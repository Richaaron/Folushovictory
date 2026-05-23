<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { 
  Search, 
  Trash2, 
  Edit2, 
  UserPlus,
  Loader2,
  X,
  Mail
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

const isPrimaryClass = (classId: string) => {
  const cls = classes.value.find((c: any) => c.id === classId)
  if (!cls) return false
  const level = String(cls.level || '').toUpperCase()
  return level.includes('PRY') || level.includes('PRIMARY') || level.includes('NUR') || level.includes('PRE')
}

const getTeacherDepartment = (teacher: any) => {
  const primarySubjectIds = new Set(subjects.value.filter((s: any) => s.level === 'Primary').map((s: any) => s.id))
  const hasPrimarySubject = teacher.assignedSubjectIds?.some((id: string) => primarySubjectIds.has(id))
  const hasPrimaryFormClass = Boolean(teacher.formClassId && isPrimaryClass(teacher.formClassId))
  const hasPrimarySelectedClass = teacher.selectedClassIds?.some((id: string) => isPrimaryClass(id))
  return (hasPrimarySubject || hasPrimaryFormClass || hasPrimarySelectedClass) ? 'Primary/Nursery' : 'Secondary'
}

const getTeacherSecondaryLevel = (teacher: any) => {
  if (!teacher.assignedSubjectIds?.length) return 'Both'
  const hasJss = subjects.value.some((s: any) => teacher.assignedSubjectIds.includes(s.id) && s.level === 'JSS')
  const hasSss = subjects.value.some((s: any) => teacher.assignedSubjectIds.includes(s.id) && s.level === 'SSS')
  if (hasJss && !hasSss) return 'JSS'
  if (!hasJss && hasSss) return 'SSS'
  return 'Both'
}

const getTeacherRoleType = (teacher: any) => {
  if (teacher.formClassId && teacher.selectedClassIds?.length > 0) return 'Dual Role'
  if (teacher.formClassId) return 'Form Teacher'
  return 'Subject Teacher'
}

const enrichTeacher = (teacher: any) => ({
  ...teacher,
  department: getTeacherDepartment(teacher),
  secondaryLevel: getTeacherSecondaryLevel(teacher),
  roleType: getTeacherRoleType(teacher)
})

const fetchTeachers = async () => {
  loading.value = true
  try {
    const [tResp, cResp, sResp] = await Promise.all([
      api.get('/api/admin/teachers'),
      api.get('/api/admin/classes'),
      api.get('/api/admin/subjects')
    ])
    classes.value = cResp.data.classes || []
    subjects.value = sResp.data.subjects || []
    teachers.value = (tResp.data.teachers || []).map(enrichTeacher)
  } catch (err) {
    console.error('Error fetching teachers data:', err)
  } finally {
    loading.value = false
  }
}

// Auto-assign subjects for Primary/Nursery classes
watch(() => newTeacher.value.formClassId, (newId) => {
  if (!newId || newTeacher.value.department !== 'Primary/Nursery') return
  
  // ONLY assign Primary subjects to Primary teachers
  newTeacher.value.assignedSubjectIds = subjects.value
    .filter(s => s.level === 'Primary')
    .map(s => s.id)
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

// Edit Modal Watchers
watch(() => editingTeacher.value?.department, (newDept) => {
  if (!editingTeacher.value || !newDept) return
  editingTeacher.value.formClassId = ''
  editingTeacher.value.selectedClassIds = []
  editingTeacher.value.assignedSubjectIds = []
  if (newDept === 'Primary/Nursery') {
    editingTeacher.value.roleType = 'Dual Role'
  } else {
    editingTeacher.value.roleType = 'Subject Teacher'
    editingTeacher.value.secondaryLevel = 'Both'
  }
})

watch(() => editingTeacher.value?.secondaryLevel, () => {
  if (!editingTeacher.value) return
  editingTeacher.value.assignedSubjectIds = []
})

watch(() => editingTeacher.value?.formClassId, (newId) => {
  if (!editingTeacher.value || !newId || editingTeacher.value.department !== 'Primary/Nursery') return
  // ONLY assign Primary subjects to Primary teachers
  editingTeacher.value.assignedSubjectIds = subjects.value
    .filter(s => s.level === 'Primary')
    .map(s => s.id)
})

const isValidEmailAddress = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const handleAddTeacher = async () => {
  if (!newTeacher.value.displayName) return
  const trimmedEmail = newTeacher.value.email ? newTeacher.value.email.trim() : ''
  if (trimmedEmail && !isValidEmailAddress(trimmedEmail)) {
    alert('Please enter a valid email address before enrolling a teacher.')
    return
  }

  creating.value = true
  try {
    const { data: teacher } = await api.post('/api/admin/teachers', {
      displayName: newTeacher.value.displayName,
      email: trimmedEmail || null,
      formClassId: newTeacher.value.formClassId || null
    })
    
    const followUpRequests = []
    if ((newTeacher.value.roleType === 'Form Teacher' || newTeacher.value.roleType === 'Dual Role') && newTeacher.value.formClassId) {
      followUpRequests.push(api.put(`/api/admin/classes/${newTeacher.value.formClassId}/subjects`, {
        formTeacherUsername: teacher.username
      }))
    }

    // Subject assignments
    if (newTeacher.value.assignedSubjectIds.length > 0) {
      // For Primary/Nursery Dual Role, restrict to formClassId if selected
      const classIds = (newTeacher.value.department === 'Primary/Nursery' && newTeacher.value.formClassId)
        ? [newTeacher.value.formClassId]
        : []

      followUpRequests.push(api.post('/api/admin/assignments', {
        teacherUsername: teacher.username,
        subjectIds: newTeacher.value.assignedSubjectIds,
        classIds
      }))
    }

    if (followUpRequests.length > 0) {
      await Promise.all(followUpRequests)
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

    let message = `Staff Account Created Successfully!\n\nUsername: ${teacher.username}\nPassword: ${teacher.password}\n\nPlease copy the password now. It will not be shown again.`
    
    if (teacher.warning) {
      message += `\n\n${teacher.warning}`
      if (teacher.email) message += `\nEmail Address: ${teacher.email}`
    } else if (teacher.emailQueued) {
      message += `\n\n📬 Welcome email is queued for delivery and should arrive shortly.`
    } else if (teacher.emailSent) {
      message += `\n\n✅ Welcome email sent to: ${teacher.email}`
    }

    if (teacher.emailError) {
      message += `\n\nError details: ${teacher.emailError}`
    }
    
    alert(message)
  } catch (err: any) {
    console.error('Error adding teacher:', err)
    const errorMsg = err.response?.data?.error || 'Unable to create faculty profile right now. Please try again.'
    alert(`❌ Enrollment Failed: ${errorMsg}`)
  } finally {
    creating.value = false
  }
}

const handleResendCredentials = async (teacher: any) => {
  if (!confirm(`Are you sure you want to reset and resend credentials for ${teacher.displayName}? This will generate a new password.`)) return
  
  creating.value = true // Show loading state
  try {
    const { data } = await api.post(`/api/admin/teachers/${teacher.username}/resend-credentials`)
    alert(`✅ New Credentials Generated!\n\nUsername: ${teacher.username}\nPassword: ${data.password}\n\n${data.message}\n\nPlease copy the new password now.`)
  } catch (err: any) {
    console.error('Error resending credentials:', err)
    const errorMsg = err.response?.data?.error || 'Failed to resend credentials.'
    const password = err.response?.data?.password
    if (password) {
      alert(`⚠️ ${errorMsg}\n\nHowever, a new password was generated: ${password}\nPlease provide it to the teacher manually.`)
    } else {
      alert(`❌ ${errorMsg}`)
    }
  } finally {
    creating.value = false
  }
}

const handleDelete = async (username: string) => {
  if (!confirm(`Are you sure you want to delete staff account: ${username}? This action cannot be undone.`)) return
  
  loading.value = true
  try {
    const { data } = await api.delete(`/api/admin/teachers/${username}`)
    await fetchTeachers()
    alert(data.message || `✅ Staff account ${username} deleted successfully.`)
  } catch (err: any) {
    console.error('Error deleting teacher:', err)
    const errorMsg = err.response?.data?.error || 'Failed to delete teacher account. Please check your connection and try again.'
    alert(`❌ Deletion Failed: ${errorMsg}`)
  } finally {
    loading.value = false
  }
}

const openEditModal = (teacher: any) => {
  editingTeacher.value = { 
    ...teacher, 
    department: getTeacherDepartment(teacher), 
    roleType: getTeacherRoleType(teacher),
    secondaryLevel: getTeacherSecondaryLevel(teacher),
    formClassId: teacher.formClassId || '',
    selectedClassIds: [...(teacher.selectedClassIds || [])],
    assignedSubjectIds: [...(teacher.assignedSubjectIds || [])]
  }
  showEditModal.value = true
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

const filteredEditClasses = computed(() => {
  if (!editingTeacher.value) return []
  if (editingTeacher.value.department === 'Primary/Nursery') {
    return classes.value.filter(c => {
      const lvl = String(c.level).toUpperCase()
      return lvl.includes('PRY') || lvl.includes('NUR') || lvl.includes('PRE')
    })
  }
  const level = editingTeacher.value.secondaryLevel
  if (level === 'Both') return classes.value.filter(c => {
    const lvl = String(c.level).toUpperCase()
    return lvl.includes('JSS') || lvl.includes('SSS') || lvl.includes('SS')
  })
  return classes.value.filter(c => String(c.level).toUpperCase().includes(level))
})

const filteredEditSubjects = computed(() => {
  if (!editingTeacher.value) return []
  if (editingTeacher.value.department === 'Primary/Nursery') {
    return subjects.value.filter(s => s.level === 'Primary')
  }
  
  const level = editingTeacher.value.secondaryLevel
  if (level === 'Both') return subjects.value.filter(s => s.level === 'JSS' || s.level === 'SSS')
  return subjects.value.filter(s => s.level === level)
})

const getSecondarySubjectNames = (teacher: any) => {
  if (!teacher?.assignedSubjectIds?.length) return []
  return subjects.value
    .filter(s => teacher.assignedSubjectIds.includes(s.id) && (s.level === 'JSS' || s.level === 'SSS'))
    .map(s => s.name)
}

const handleUpdateTeacher = async () => {
  if (!editingTeacher.value?.displayName) return
  creating.value = true // Reuse creating spinner
  try {
    // Atomic Update (Metadata + Form Class + Assignments)
    // For Primary/Nursery Dual Role, restrict to formClassId if selected
    const classIds = (editingTeacher.value.department === 'Primary/Nursery' && editingTeacher.value.formClassId)
      ? [editingTeacher.value.formClassId]
      : (editingTeacher.value.roleType === 'Form Teacher' ? [editingTeacher.value.formClassId] : [])

    console.log('Update payload:', {
      displayName: editingTeacher.value.displayName,
      email: editingTeacher.value.email,
      formClassId: editingTeacher.value.formClassId || '',
      classIds,
      subjectIds: editingTeacher.value.assignedSubjectIds || []
    })

    await api.put(`/api/admin/teachers/${editingTeacher.value.username}`, {
      displayName: editingTeacher.value.displayName,
      email: editingTeacher.value.email,
      formClassId: editingTeacher.value.formClassId || '',
      classIds,
      subjectIds: editingTeacher.value.assignedSubjectIds || []
    })
    
    showEditModal.value = false
    await fetchTeachers()
    alert('✅ Faculty profile updated successfully!')
  } catch (err: any) {
    console.error('Error updating teacher:', err)
    const errorMsg = err.response?.data?.error || 'Failed to update teacher profile. Please try again.'
    alert(`❌ Update Failed: ${errorMsg}`)
  } finally {
    creating.value = false
  }
}

onMounted(fetchTeachers)
</script>

<template>
  <div class="space-y-4 sm:space-y-8 lg:space-y-10 fade-in py-3 sm:py-6">
    <!-- Header -->
    <section class="admin-hero-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 sm:gap-3 mb-4">
          <div class="h-1 w-16 bg-nebula-500 rounded-full"></div>
          <span class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-nebula-500">Personnel Core</span>
        </div>
        <h1 class="hero-title">Staff <span>Faculty</span></h1>
        <p class="hero-subtitle">Institutional Onboarding & Resource Allocation</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-lg sm:rounded-[1.5rem] nebula-gradient px-4 sm:px-8 py-3 sm:py-4 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-nebula-500/30 transition hover:scale-105 active:scale-95 group min-h-[44px] min-w-[44px] sm:min-w-[auto]"
      >
        <UserPlus class="w-4 sm:w-5 h-4 sm:h-5 group-hover:rotate-12 transition-transform flex-shrink-0" /> 
        <span class="hidden sm:inline">Enroll New Faculty</span><span class="sm:hidden">Add</span>
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="glass-card rounded-[2.5rem] bg-slate-950/90 border border-slate-700/60 p-4 sm:p-6 flex flex-col gap-4">
      <div class="relative flex-grow">
        <Search class="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-nebula-500 flex-shrink-0" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search faculty..."
          class="w-full pl-10 sm:pl-16 pr-4 sm:pr-8 py-3 sm:py-5 bg-slate-900/60 border-none rounded-lg sm:rounded-[1.5rem] text-xs sm:text-sm font-bold text-white focus:bg-slate-950 focus:ring-4 focus:ring-nebula-500/10 outline-none transition-all placeholder-slate-400 min-h-[44px]"
        />
      </div>
    </div>

    <!-- Teachers Directory -->
    <section class="glass-card rounded-[2rem] border border-slate-700/60 bg-slate-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div class="px-4 py-5 sm:px-6 sm:py-7 border-b border-slate-800/70 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Faculty Directory</p>
          <h2 class="mt-2 text-xl sm:text-2xl font-black text-white">Active teachers overview</h2>
          <p class="mt-2 text-sm text-slate-500 max-w-2xl">Manage teacher profiles, resend credentials, and keep staffing aligned.</p>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-[1.75rem] bg-slate-900/70 border border-slate-700/70 p-4 text-center">
            <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Total</p>
            <p class="mt-2 text-2xl font-black text-white">{{ teachers.length }}</p>
          </div>
          <div class="rounded-[1.75rem] bg-slate-900/70 border border-slate-700/70 p-4 text-center">
            <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Visible</p>
            <p class="mt-2 text-2xl font-black text-white">{{ filteredTeachers.length }}</p>
          </div>
        </div>
      </div>

      <div v-if="loading" class="min-h-[320px] flex items-center justify-center p-12">
        <Loader2 class="w-14 h-14 text-nebula-500 animate-spin" />
      </div>

      <div v-else class="p-4 sm:p-6">
        <div v-if="filteredTeachers.length === 0" class="p-8 sm:p-12 text-center rounded-[2rem] bg-slate-900/70 border border-slate-700/70">
          <div class="mx-auto mb-6 h-16 sm:h-20 w-16 sm:w-20 rounded-3xl border border-slate-700/70 bg-slate-950/80 flex items-center justify-center text-slate-400">
            <Search class="w-6 sm:w-8 h-6 sm:h-8" aria-hidden="true" />
          </div>
          <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">No faculty matches found</p>
          <p class="mt-3 text-sm text-slate-500">Adjust your filter or enroll a new staff member to populate the directory.</p>
        </div>

        <div v-else class="grid gap-4">
          <article v-for="teacher in filteredTeachers" :key="teacher.username" class="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5 sm:p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-4 min-w-0">
                <div class="h-14 w-14 rounded-3xl bg-nebula-500/15 flex items-center justify-center text-2xl font-black text-nebula-500">
                  {{ teacher.displayName.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-base sm:text-lg font-black text-white">{{ teacher.displayName }}</p>
                  <div class="mt-2 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.25em] text-slate-400">
                    <span class="truncate">@{{ teacher.username }}</span>
                    <span class="truncate">{{ teacher.email || 'No Email' }}</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <button v-if="teacher.email" @click="handleResendCredentials(teacher)" class="p-2 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-slate-950 hover:text-emerald-300 hover:border-emerald-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <Mail class="w-4 h-4" />
                </button>
                <button @click="openEditModal(teacher)" class="p-2 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-slate-950 hover:text-nebula-300 hover:border-nebula-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button @click="handleDelete(teacher.username)" class="p-2 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-200 hover:bg-slate-950 hover:text-rose-400 hover:border-rose-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-[1.5rem] border border-slate-800/70 bg-slate-950/80 p-4">
                <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Department</p>
                <p class="mt-2 text-sm font-black text-white">{{ teacher.department || 'Secondary' }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-800/70 bg-slate-950/80 p-4">
                <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Role</p>
                <p class="mt-2 text-sm font-black text-white">{{ teacher.formClassId ? 'Form Teacher' : 'Subject Teacher' }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-slate-800/70 bg-slate-950/80 p-4">
                <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Primary Class</p>
                <p class="mt-2 text-sm font-black text-white">{{ teacher.formClassId ? classes.find(c => c.id === teacher.formClassId)?.name || 'Assigned' : 'Not Assigned' }}</p>
              </div>
              <div v-if="teacher.department !== 'Primary/Nursery'" class="rounded-[1.5rem] border border-slate-800/70 bg-slate-950/80 p-4 col-span-full">
                <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500">Secondary Subjects</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span v-for="subject in getSecondarySubjectNames(teacher)" :key="subject" class="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-300">
                    {{ subject }}
                  </span>
                  <span v-if="getSecondarySubjectNames(teacher).length === 0" class="text-sm font-black text-slate-400">No secondary subjects assigned</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

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
            <button @click="showAddModal = false" class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all" aria-label="Close Modal">
              <X class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          <div class="space-y-6 md:space-y-8">
            <div v-if="creating" class="rounded-[1.5rem] bg-slate-900/60 border border-slate-700/60 p-4 text-slate-200 text-sm font-bold tracking-tight">
              <div class="flex items-center gap-3">
                <Loader2 class="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Creating faculty profile and sending credentials. This may take a few seconds.</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div class="space-y-2">
                <label for="new-display-name" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Legal Full Name</label>
                <input id="new-display-name" v-model="newTeacher.displayName" type="text" class="w-full px-8 py-4 md:py-5 bg-slate-900/60 border border-slate-700/70 rounded-[1.5rem] text-sm font-bold text-white focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all" placeholder="e.g. Samuel Okafor" />
              </div>
              
              <div class="space-y-2">
                <label for="new-email" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Official Email</label>
                <input id="new-email" v-model="newTeacher.email" type="email" class="w-full px-8 py-4 md:py-5 bg-slate-900/60 border border-slate-700/70 rounded-[1.5rem] text-sm font-bold text-white focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all" placeholder="s.okafor@fvs.edu" />
              </div>
            </div>

            <!-- Department Selection -->
            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Operational Department</label>
              <div class="grid grid-cols-2 gap-4 p-2 bg-slate-900/50 rounded-[2rem] border border-slate-700/80">
                <button 
                  @click="newTeacher.department = 'Primary/Nursery'"
                  :class="newTeacher.department === 'Primary/Nursery' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-300 hover:bg-slate-800/70'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Primary/Nursery</button>
                <button 
                  @click="newTeacher.department = 'Secondary'"
                  :class="newTeacher.department === 'Secondary' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-300 hover:bg-slate-800/70'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Secondary</button>
              </div>
            </div>

            <!-- Class Assignment - Always shown for Primary/Nursery, conditional for Secondary -->
            <div v-if="newTeacher.department === 'Primary/Nursery' || (newTeacher.department === 'Secondary' && (newTeacher.roleType === 'Form Teacher' || newTeacher.roleType === 'Dual Role'))" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Primary Class Governance</label>
              <select v-model="newTeacher.formClassId" class="w-full px-8 py-5 bg-slate-900/60 text-white border border-slate-700/70 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all cursor-pointer">
                <option value="">Select Governing Class...</option>
                <option v-for="cls in filteredClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
              </select>
            </div>

            <!-- Role Selection (for Secondary) -->
            <div v-if="newTeacher.department === 'Secondary'" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Academic Specialization</label>
              <div class="grid grid-cols-3 gap-3">
                <button 
                  v-for="role in ['Form Teacher', 'Subject Teacher', 'Dual Role']" 
                  :key="role"
                  @click="newTeacher.roleType = role"
                  :class="newTeacher.roleType === role ? 'bg-nebula-500 text-white shadow-lg' : 'bg-slate-900/60 text-slate-200 border border-slate-700/60 hover:bg-slate-800/80'"
                  class="py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                >{{ role }}</button>
              </div>
            </div>

            <!-- Multi-Class Selection removed - teachers automatically assigned to all classes at subject level -->

            <!-- Automated Subject Assignment -->
            <div v-if="newTeacher.roleType === 'Subject Teacher' || newTeacher.roleType === 'Dual Role'" class="space-y-4 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Curriculum Specializations</label>
              <div v-if="newTeacher.department === 'Primary/Nursery'" class="p-8 bg-nebula-500/[0.03] rounded-[2.5rem] border border-nebula-500/20 relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 h-32 w-32 bg-nebula-500 blur-[60px] opacity-10"></div>
                <p class="text-[11px] font-black text-nebula-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                  <div class="h-1.5 w-1.5 rounded-full bg-nebula-500 animate-pulse"></div>
                  Master Instructor Curriculum
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   <div v-for="sub in filteredSubjects" :key="sub.id" class="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                     <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span class="text-[10px] font-extrabold text-slate-200 uppercase tracking-tight">{{ sub.name }}</span>
                   </div>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-6 bg-slate-900/30 rounded-[2.5rem] border border-slate-700/60 scrollbar-premium">
                <label v-for="sub in filteredSubjects" :key="sub.id" class="relative flex flex-col p-4 rounded-2xl cursor-pointer group transition-all" :class="[newTeacher.assignedSubjectIds.includes(sub.id) ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-900/60 text-slate-200 hover:bg-emerald-900/20 border border-slate-700/60']">
                  <input type="checkbox" :value="sub.id" v-model="newTeacher.assignedSubjectIds" class="hidden" />
                  <span class="text-[10px] font-black uppercase tracking-widest leading-tight">{{ sub.name }}</span>
                  <span class="text-[8px] font-bold opacity-60 mt-1 uppercase">{{ sub.level }}</span>
                  <div v-if="newTeacher.assignedSubjectIds.includes(sub.id)" class="absolute top-2 right-2 h-2 w-2 bg-emerald-200 rounded-full"></div>
                </label>
              </div>
            </div>

            <div class="pt-10 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-5 rounded-[1.5rem] bg-slate-900/70 border border-slate-700/60 text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-950 transition-colors">Abort</button>
              <button @click="handleAddTeacher" :disabled="creating || !newTeacher.displayName || (!!newTeacher.email && !isValidEmailAddress(newTeacher.email))" class="flex-[2.5] py-5 rounded-[1.5rem] nebula-gradient text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-nebula-500/30 disabled:opacity-50 group">
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
        <div class="glass-card rounded-[2.5rem] md:rounded-[3rem] w-full max-w-2xl p-6 md:p-12 shadow-2xl relative z-10 border border-white/40 dark:border-slate-700/50 max-h-[95vh] overflow-y-auto scrollbar-premium">
          <div class="flex items-center justify-between mb-8 md:mb-10">
            <div class="flex items-center gap-5">
              <div class="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-nebula-500/10 flex items-center justify-center text-nebula-500 border border-nebula-500/20">
                <Edit2 class="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
              </div>
              <div>
                <h2 id="edit-teacher-title" class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Modify Info</h2>
                <p class="text-[10px] font-black text-nebula-500 uppercase tracking-[0.2em] mt-2">Update Faculty Metadata</p>
              </div>
            </div>
            <button @click="showEditModal = false" class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-200 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all" aria-label="Close Modal">
              <X class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          <div class="space-y-6 md:space-y-8" v-if="editingTeacher">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div class="space-y-2 group">
                <label for="edit-username" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-nebula-500 transition-colors">Faculty Identifier</label>
                <div class="relative">
                  <input id="edit-username" :value="editingTeacher.username" disabled type="text" class="w-full px-8 py-4 md:py-5 bg-slate-900/60 border border-slate-700/60 rounded-[1.5rem] text-sm font-black text-slate-300 outline-none cursor-not-allowed italic" />
                  <Lock class="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" aria-hidden="true" />
                </div>
              </div>

              <div class="space-y-2">
                <label for="edit-display-name" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Updated Display Name</label>
                <input id="edit-display-name" v-model="editingTeacher.displayName" type="text" class="w-full px-8 py-4 md:py-5 bg-slate-900/60 border border-slate-700/60 rounded-[1.5rem] text-sm font-bold text-white focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all" />
              </div>
            </div>
            
            <div class="space-y-2">
              <label for="edit-email" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Updated Official Email</label>
              <input id="edit-email" v-model="editingTeacher.email" type="email" class="w-full px-8 py-4 md:py-5 bg-slate-900/60 border border-slate-700/60 rounded-[1.5rem] text-sm font-bold text-white focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all" />
            </div>

            <!-- Department Selection -->
            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Operational Department</label>
              <div class="grid grid-cols-2 gap-4 p-2 bg-slate-900/50 rounded-[2rem] border border-slate-700/60">
                <button 
                  @click="editingTeacher.department = 'Primary/Nursery'"
                  :class="editingTeacher.department === 'Primary/Nursery' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-200 hover:bg-slate-800/80'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Primary/Nursery</button>
                <button 
                  @click="editingTeacher.department = 'Secondary'"
                  :class="editingTeacher.department === 'Secondary' ? 'nebula-gradient text-white shadow-xl shadow-nebula-500/20' : 'text-slate-200 hover:bg-slate-800/80'"
                  class="py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >Secondary</button>
              </div>
            </div>

            <!-- Role Selection (for Secondary) -->
            <div v-if="editingTeacher.department === 'Secondary'" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Academic Specialization</label>
              <div class="grid grid-cols-3 gap-3">
                <button 
                  v-for="role in ['Form Teacher', 'Subject Teacher', 'Dual Role']" 
                  :key="role"
                  @click="editingTeacher.roleType = role"
                  :class="editingTeacher.roleType === role ? 'bg-nebula-500 text-white shadow-lg' : 'bg-slate-900/60 text-slate-200 border border-slate-700/60 hover:bg-slate-800/80'"
                  class="py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                >{{ role }}</button>
              </div>
            </div>

            <!-- Class Assignment - Always shown for Primary/Nursery, conditional for Secondary -->
            <div v-if="editingTeacher.department === 'Primary/Nursery' || (editingTeacher.department === 'Secondary' && (editingTeacher.roleType === 'Form Teacher' || editingTeacher.roleType === 'Dual Role'))" class="space-y-3 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Primary Class Governance</label>
              <select v-model="editingTeacher.formClassId" class="w-full px-8 py-5 bg-slate-900/60 text-white border border-slate-700/60 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] focus:bg-slate-950 focus:border-nebula-500/30 outline-none transition-all cursor-pointer">
                <option value="">Select Governing Class...</option>
                <option v-for="cls in filteredEditClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
              </select>
            </div>

            <!-- Multi-Class Selection removed - teachers automatically assigned to all classes at subject level -->

            <!-- Automated Subject Assignment -->
            <div v-if="editingTeacher.roleType === 'Subject Teacher' || editingTeacher.roleType === 'Dual Role'" class="space-y-4 animate-slide-up">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Curriculum Specializations</label>
              <div v-if="editingTeacher.department === 'Primary/Nursery'" class="p-8 bg-nebula-500/[0.03] rounded-[2.5rem] border border-nebula-500/20 relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 h-32 w-32 bg-nebula-500 blur-[60px] opacity-10"></div>
                <p class="text-[11px] font-black text-nebula-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                  <div class="h-1.5 w-1.5 rounded-full bg-nebula-500 animate-pulse"></div>
                  Master Instructor Curriculum
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   <div v-for="sub in filteredEditSubjects" :key="sub.id" class="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                     <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span class="text-[10px] font-extrabold text-slate-200 uppercase tracking-tight">{{ sub.name }}</span>
                   </div>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-6 bg-slate-900/30 rounded-[2.5rem] border border-slate-700/60 scrollbar-premium">
                <label v-for="sub in filteredEditSubjects" :key="sub.id" class="relative flex flex-col p-4 rounded-2xl cursor-pointer group transition-all" :class="[editingTeacher.assignedSubjectIds.includes(sub.id) ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-900/60 text-slate-200 hover:bg-emerald-900/20 border border-slate-700/60']">
                  <input type="checkbox" :value="sub.id" v-model="editingTeacher.assignedSubjectIds" class="hidden" />
                  <span class="text-[10px] font-black uppercase tracking-widest leading-tight">{{ sub.name }}</span>
                  <span class="text-[8px] font-bold opacity-60 mt-1 uppercase">{{ sub.level }}</span>
                  <div v-if="editingTeacher.assignedSubjectIds.includes(sub.id)" class="absolute top-2 right-2 h-2 w-2 bg-emerald-200 rounded-full"></div>
                </label>
              </div>
            </div>

            <div class="pt-6 md:pt-8 flex gap-4">
              <button @click="showEditModal = false" class="flex-grow py-4 md:py-5 rounded-[1.5rem] bg-slate-900/60 border border-slate-700/60 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-slate-800 transition-colors">Abort</button>
              <button @click="handleUpdateTeacher" :disabled="creating" class="flex-[2.5] py-4 md:py-5 rounded-[1.5rem] nebula-gradient text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-nebula-500/30">
                {{ creating ? 'Synchronizing...' : 'Apply Updates' }}
              </button>
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
