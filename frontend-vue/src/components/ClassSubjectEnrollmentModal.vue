<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  Check, 
  Loader2, 
  Search, 
  Sliders, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-vue-next'
import api from '../services/api'

interface Student {
  studentId: string
  firstName: string
  lastName: string
  gender?: string
  stream?: string
  parentEmail?: string
  subjectIds?: string[]
}

interface Subject {
  id: string
  name: string
  level?: string
  track?: string
}

const props = defineProps<{
  show: boolean
  classId: string
  className: string
  classLevel: string
  students: Student[]
  subjects: Subject[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const selectedSubjectId = ref('')
const searchQuery = ref('')
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Set of student IDs currently selected for the active subject
const enrolledStudentIds = ref<Set<string>>(new Set())

// Filter subjects matching class level (SSS, JSS, Primary)
const eligibleSubjects = computed(() => {
  const norm = (props.classLevel || '').toUpperCase().trim()
  if (!norm) return props.subjects

  return props.subjects.filter(s => {
    const sLevel = String(s.level || '').toUpperCase().trim()
    if (norm.includes('SSS')) return sLevel.includes('SSS') || sLevel.includes('SENIOR')
    if (norm.includes('JSS')) return sLevel.includes('JSS') || sLevel.includes('JUNIOR')
    if (norm.includes('PRY') || norm.includes('PRIMARY') || norm.includes('NUR')) {
      return sLevel.includes('PRY') || sLevel.includes('PRIMARY') || sLevel.includes('NUR')
    }
    return true
  }).sort((a, b) => a.name.localeCompare(b.name))
})

const selectedSubject = computed(() => {
  return props.subjects.find(s => s.id === selectedSubjectId.value) || null
})

const isSSS = computed(() => {
  return (props.classLevel || '').toUpperCase().includes('SSS') || 
         (props.className || '').toUpperCase().includes('SSS')
})

// Initialize enrollment set from students prop for selected subject
const syncEnrollmentFromStudents = () => {
  if (!selectedSubjectId.value) return
  const set = new Set<string>()
  props.students.forEach(st => {
    const list = Array.isArray(st.subjectIds) ? st.subjectIds : []
    if (list.includes(selectedSubjectId.value)) {
      set.add(st.studentId)
    }
  })
  enrolledStudentIds.value = set
}

// When modal opens or subject changes
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    if (!selectedSubjectId.value && eligibleSubjects.value.length > 0) {
      // Default to Livestock Studies or first subject
      const livestock = eligibleSubjects.value.find(s => s.name.toLowerCase().includes('livestock'))
      selectedSubjectId.value = livestock ? livestock.id : eligibleSubjects.value[0].id
    }
    syncEnrollmentFromStudents()
    errorMessage.value = ''
    successMessage.value = ''
  }
})

watch(selectedSubjectId, () => {
  syncEnrollmentFromStudents()
  errorMessage.value = ''
  successMessage.value = ''
})

// Filtered student list by search query
const filteredStudents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return props.students
  return props.students.filter(st => {
    const fullName = `${st.lastName} ${st.firstName}`.toLowerCase()
    const id = String(st.studentId || '').toLowerCase()
    const stream = String(st.stream || '').toLowerCase()
    return fullName.includes(q) || id.includes(q) || stream.includes(q)
  })
})

// Calculate number of pending changes
const pendingChangesCount = computed(() => {
  if (!selectedSubjectId.value) return 0
  let changes = 0
  props.students.forEach(st => {
    const current = Array.isArray(st.subjectIds) && st.subjectIds.includes(selectedSubjectId.value)
    const pending = enrolledStudentIds.value.has(st.studentId)
    if (current !== pending) changes++
  })
  return changes
})

// Toggle individual student
const toggleStudent = (studentId: string) => {
  const next = new Set(enrolledStudentIds.value)
  if (next.has(studentId)) {
    next.delete(studentId)
  } else {
    next.add(studentId)
  }
  enrolledStudentIds.value = next
}

// Quick batch selections
const selectAll = () => {
  const next = new Set(enrolledStudentIds.value)
  props.students.forEach(st => next.add(st.studentId))
  enrolledStudentIds.value = next
}

const clearAll = () => {
  enrolledStudentIds.value = new Set()
}

const selectByStream = (streamName: string) => {
  const next = new Set(enrolledStudentIds.value)
  props.students.forEach(st => {
    if (String(st.stream || '').toUpperCase() === streamName.toUpperCase()) {
      next.add(st.studentId)
    }
  })
  enrolledStudentIds.value = next
}

// Save enrollment changes to backend
const handleSaveEnrollment = async () => {
  if (!selectedSubjectId.value) return
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatePromises: Promise<any>[] = []
    const subjectName = selectedSubject.value?.name || 'Subject'

    for (const st of props.students) {
      const currentList = Array.isArray(st.subjectIds) ? [...st.subjectIds] : []
      const isEnrolledNow = currentList.includes(selectedSubjectId.value)
      const shouldBeEnrolled = enrolledStudentIds.value.has(st.studentId)

      if (isEnrolledNow !== shouldBeEnrolled) {
        let newList: string[]
        if (shouldBeEnrolled) {
          newList = [...currentList, selectedSubjectId.value]
        } else {
          newList = currentList.filter(id => id !== selectedSubjectId.value)
        }

        // Apply to local object for immediate UI response
        st.subjectIds = newList

        updatePromises.push(
          api.put(`/api/teacher/students/${st.studentId}`, {
            classId: props.classId,
            firstName: st.firstName,
            lastName: st.lastName,
            gender: st.gender || 'Male',
            stream: st.stream || '',
            parentEmail: st.parentEmail || '',
            subjectIds: newList
          })
        )
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
      successMessage.value = `✓ Successfully saved! ${enrolledStudentIds.value.size} students are now registered for ${subjectName}.`
    } else {
      successMessage.value = `No changes were detected for ${subjectName}.`
    }

    emit('updated')
  } catch (err: any) {
    console.error('Failed to update enrollments:', err)
    errorMessage.value = err.response?.data?.error || err.message || 'Failed to save subject enrollment changes.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" @click="emit('close')"></div>

      <!-- Modal Card -->
      <div class="bg-white rounded-3xl border-2 border-sky-300 w-full max-w-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] my-auto overflow-hidden">
        
        <!-- Header -->
        <div class="p-5 sm:p-6 bg-gradient-to-r from-sky-900 to-sky-800 text-white flex items-center justify-between border-b-2 border-sky-700">
          <div class="flex items-center gap-3 min-w-0">
            <div class="h-11 w-11 rounded-2xl bg-amber-400 text-sky-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Sliders class="w-5 h-5 text-sky-950" />
            </div>
            <div class="min-w-0">
              <h2 class="text-lg sm:text-xl font-black text-white tracking-tight truncate">Subject Enrollment Matrix</h2>
              <p class="text-xs font-bold text-sky-200 uppercase tracking-wider truncate mt-0.5">
                {{ className }} • Elective & Core Allocation
              </p>
            </div>
          </div>

          <button 
            @click="emit('close')"
            class="h-10 w-10 rounded-xl bg-sky-800/80 hover:bg-sky-700 text-white flex items-center justify-center transition-all shrink-0 ml-2 border border-sky-600"
            title="Close"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-modal-scrollbar">
          
          <!-- Subject Selector -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-black uppercase tracking-wider text-[#0C4A6E]">
              1. Select Subject to Manage
            </label>
            <div class="relative">
              <select 
                v-model="selectedSubjectId"
                class="w-full px-4 py-3 bg-sky-50 text-slate-900 font-bold border-2 border-sky-200 rounded-2xl outline-none focus:border-sky-600 shadow-xs text-sm"
              >
                <option v-for="subj in eligibleSubjects" :key="subj.id" :value="subj.id">
                  {{ subj.name }} {{ subj.track ? `(${subj.track})` : '' }}
                </option>
              </select>
            </div>
          </div>

          <!-- Subject Status Pill & Quick Action Chips -->
          <div class="bg-sky-50/70 rounded-2xl border border-sky-200 p-3.5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-[#0C4A6E] uppercase tracking-wider">
                  Enrolled Students:
                </span>
                <span 
                  class="px-2.5 py-0.5 rounded-full text-xs font-black uppercase border"
                  :class="enrolledStudentIds.size > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-300'"
                >
                  {{ enrolledStudentIds.size }} of {{ students.length }}
                </span>
              </div>

              <!-- Pending changes badge -->
              <span v-if="pendingChangesCount > 0" class="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 animate-pulse">
                {{ pendingChangesCount }} pending {{ pendingChangesCount === 1 ? 'change' : 'changes' }}
              </span>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">Quick Select:</span>
              <button 
                type="button"
                @click="selectAll"
                class="px-2.5 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-900 text-[11px] font-black uppercase hover:bg-sky-100 transition active:scale-95 shadow-2xs"
              >
                Select All ({{ students.length }})
              </button>
              <button 
                type="button"
                @click="clearAll"
                class="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-[11px] font-black uppercase hover:bg-slate-100 transition active:scale-95 shadow-2xs"
              >
                Clear All
              </button>
              
              <template v-if="isSSS">
                <button 
                  type="button"
                  @click="selectByStream('Science')"
                  class="px-2.5 py-1.5 rounded-lg bg-sky-100 border border-sky-400 text-sky-950 text-[11px] font-black uppercase hover:bg-sky-200 transition active:scale-95 shadow-2xs"
                >
                  + Science Only
                </button>
                <button 
                  type="button"
                  @click="selectByStream('Art')"
                  class="px-2.5 py-1.5 rounded-lg bg-amber-100 border border-amber-400 text-amber-950 text-[11px] font-black uppercase hover:bg-amber-200 transition active:scale-95 shadow-2xs"
                >
                  + Art Only
                </button>
                <button 
                  type="button"
                  @click="selectByStream('Commercial')"
                  class="px-2.5 py-1.5 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-950 text-[11px] font-black uppercase hover:bg-emerald-200 transition active:scale-95 shadow-2xs"
                >
                  + Commercial Only
                </button>
              </template>
            </div>
          </div>

          <!-- Search Filter -->
          <div class="relative">
            <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Filter students by name, ID or stream..."
              class="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 text-sm font-medium border-2 border-slate-200 rounded-xl outline-none focus:border-sky-600 transition"
            />
          </div>

          <!-- Feedback messages -->
          <div v-if="successMessage" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{{ successMessage }}</span>
          </div>

          <div v-if="errorMessage" class="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-red-700 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Student Checklist -->
          <div class="space-y-1.5 border-2 border-sky-100 rounded-2xl p-2 max-h-72 overflow-y-auto custom-modal-scrollbar bg-slate-50/50">
            <div 
              v-for="st in filteredStudents" 
              :key="st.studentId"
              @click="toggleStudent(st.studentId)"
              class="flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none"
              :class="enrolledStudentIds.has(st.studentId)
                ? 'bg-sky-50/80 border-sky-400 shadow-2xs' 
                : 'bg-white border-slate-200 hover:border-sky-300'"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- Checkbox -->
                <div 
                  class="h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                  :class="enrolledStudentIds.has(st.studentId)
                    ? 'bg-sky-700 border-sky-700 text-white' 
                    : 'border-slate-300 bg-white'"
                >
                  <Check v-if="enrolledStudentIds.has(st.studentId)" class="w-4 h-4 stroke-[3]" />
                </div>

                <!-- Avatar -->
                <div class="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center justify-center shrink-0">
                  {{ st.lastName[0] }}{{ st.firstName[0] }}
                </div>

                <!-- Info -->
                <div class="min-w-0">
                  <p class="text-xs sm:text-sm font-black text-slate-900 truncate">
                    {{ st.lastName }} {{ st.firstName }}
                  </p>
                  <p class="text-[10px] font-black uppercase tracking-wider text-[#0C4A6E]">
                    {{ st.studentId }}
                  </p>
                </div>
              </div>

              <!-- Stream Tag & Status Pill -->
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <span 
                  v-if="st.stream"
                  class="text-[10px] font-black uppercase px-2 py-0.5 rounded border"
                  :class="st.stream.toUpperCase() === 'SCIENCE' 
                    ? 'bg-sky-100 text-sky-900 border-sky-300' 
                    : st.stream.toUpperCase() === 'ART' 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'"
                >
                  {{ st.stream }}
                </span>

                <span 
                  class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  :class="enrolledStudentIds.has(st.studentId)
                    ? 'bg-emerald-100 text-emerald-900' 
                    : 'bg-slate-100 text-slate-500'"
                >
                  {{ enrolledStudentIds.has(st.studentId) ? 'Taking' : 'Not Taking' }}
                </span>
              </div>
            </div>

            <div v-if="filteredStudents.length === 0" class="py-8 text-center text-slate-500 text-xs font-bold">
              No students match your filter.
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 bg-sky-50 border-t-2 border-sky-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button 
            type="button"
            @click="emit('close')"
            class="px-5 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition active:scale-95 text-center"
          >
            Close
          </button>

          <button 
            type="button"
            @click="handleSaveEnrollment"
            :disabled="saving"
            class="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin text-white" />
            <Sparkles v-else class="w-4 h-4 text-amber-300" />
            <span>{{ saving ? 'Saving Changes...' : `Save Enrollment (${pendingChangesCount} changes)` }}</span>
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>
