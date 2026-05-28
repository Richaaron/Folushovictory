<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Plus,
  Settings2,
  Users,
  School,
  Loader2,
  Search,
  Sparkles
} from 'lucide-vue-next'
import api from '../../services/api'

const classes = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showAddModal = ref(false)
const newClass = ref({ name: '', level: 'JSS', track: '' })
const showStudentsModal = ref(false)
const studentsInClass = ref<any[]>([])
const currentClass = ref<any>(null)
const studentsLoading = ref(false)
const studentsError = ref('')
const showConfigModal = ref(false)
const editingClass = ref<any>(null)

const filteredClasses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return classes.value
  return classes.value.filter(cls => {
    const name = cls.name?.toLowerCase() || ''
    const teacher = cls.formTeacherUsername?.toLowerCase() || ''
    const metadata = `${cls.level} ${cls.track}`.toLowerCase()
    return name.includes(query) || teacher.includes(query) || metadata.includes(query)
  })
})

const totalClasses = computed(() => classes.value.length)
const totalStudents = computed(() => {
  return classes.value.reduce((sum, cls) => {
    const count = cls.studentCount ?? cls.studentIds?.length ?? 0
    return sum + count
  }, 0)
})
const totalSubjects = computed(() => {
  return classes.value.reduce((sum, cls) => sum + (cls.subjectIds?.length || 0), 0)
})
const unassignedClasses = computed(() => classes.value.filter(cls => !cls.formTeacherUsername).length)

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
  <div class="space-y-6 sm:space-y-8 fade-in relative">
    <span class="floating-math" aria-hidden="true">Δ</span>
    <section class="parchment-card p-6 lg:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl">
          <h1 class="academic-heading text-2xl sm:text-3xl text-[#FAFAF7]">Academic Classes</h1>
          <div class="gold-accent"></div>
          <p class="text-sm text-[#F5F0E8]/50">A refined dashboard for managing classrooms, tracking enrollment, and checking teacher coverage.</p>
        </div>

        <button
          @click="showAddModal = true"
          class="chalkboard-btn chalkboard-btn-gold"
        >
          <Plus class="w-4 h-4" />
          <span>New Class</span>
        </button>
      </div>

      <div class="grid gap-4 mt-8 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-[#C9A84C]/12 bg-[#1B2A4A]/60 p-5">
          <div class="text-[9px] uppercase tracking-[0.3em] font-black text-[#C9A84C]/50">Classes</div>
          <p class="mt-4 academic-heading text-3xl text-[#FAFAF7]">{{ totalClasses }}</p>
          <p class="mt-1 text-xs text-[#F5F0E8]/40">Active class groups</p>
        </div>
        <div class="rounded-xl border border-[#C9A84C]/12 bg-[#1B2A4A]/60 p-5">
          <div class="text-[9px] uppercase tracking-[0.3em] font-black text-[#C9A84C]/50">Students</div>
          <p class="mt-4 academic-heading text-3xl text-[#FAFAF7]">{{ totalStudents }}</p>
          <p class="mt-1 text-xs text-[#F5F0E8]/40">Total enrolled</p>
        </div>
        <div class="rounded-xl border border-[#C9A84C]/12 bg-[#1B2A4A]/60 p-5">
          <div class="text-[9px] uppercase tracking-[0.3em] font-black text-[#C9A84C]/50">Subjects</div>
          <p class="mt-4 academic-heading text-3xl text-[#FAFAF7]">{{ totalSubjects }}</p>
          <p class="mt-1 text-xs text-[#F5F0E8]/40">Assigned subjects</p>
        </div>
        <div class="rounded-xl border border-[#C9A84C]/12 bg-[#1B2A4A]/60 p-5">
          <div class="text-[9px] uppercase tracking-[0.3em] font-black text-[#C9A84C]/50">Needs attention</div>
          <p class="mt-4 academic-heading text-3xl text-[#FAFAF7]">{{ unassignedClasses }}</p>
          <p class="mt-1 text-xs text-[#F5F0E8]/40">Classes without teachers</p>
        </div>
      </div>

      <div class="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]/40" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search classes, teachers, levels..."
            class="academic-input pl-12"
          />
        </label>
        <div class="rounded-xl border border-[#C9A84C]/12 bg-[#1B2A4A]/60 p-4 text-xs text-[#F5F0E8]/60 flex items-center gap-3">
          <Sparkles class="h-4 w-4 text-[#C9A84C]" />
          <span>{{ filteredClasses.length }} class{{ filteredClasses.length === 1 ? '' : 'es' }} visible</span>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-3 xl:auto-rows-fr">
      <div v-if="loading" class="col-span-full flex min-h-[320px] items-center justify-center parchment-card">
        <Loader2 class="w-14 h-14 text-[#C9A84C]/50 animate-spin" />
      </div>

      <template v-else>
        <div v-if="filteredClasses.length === 0" class="col-span-full parchment-card p-10 text-center text-[#F5F0E8]/50 text-sm">
          No classes matched your search.
        </div>

        <div
          v-for="cls in filteredClasses"
          :key="cls.id"
          class="group relative overflow-hidden parchment-card p-6 transition-all hover:-translate-y-1 hover:border-[#C9A84C]/40"
        >
          <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent opacity-30"></div>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] uppercase tracking-[0.35em] text-[#F5F0E8]/40 font-bold">{{ cls.level }} {{ cls.track || '' }}</p>
              <h2 class="academic-heading text-xl text-[#FAFAF7] mt-1">{{ cls.name }}</h2>
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <span class="rounded-md bg-[#1B2A4A]/80 px-3 py-1 text-[#F5F0E8]/60 border border-[#C9A84C]/10">{{ cls.subjectIds?.length || 0 }} Subjects</span>
                <span class="rounded-md bg-[#1B2A4A]/80 px-3 py-1 text-[#F5F0E8]/60 border border-[#C9A84C]/10">{{ (cls.studentCount !== undefined) ? cls.studentCount : (cls.studentIds?.length || 0) }} Students</span>
              </div>
            </div>
            <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C]">
              <School class="h-5 w-5" />
            </div>
          </div>

          <div class="mt-5 rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-4">
            <p class="text-[9px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Form Teacher</p>
            <p class="mt-1 text-sm font-bold text-[#FAFAF7]">{{ cls.formTeacherUsername ? `@${cls.formTeacherUsername}` : 'Not Assigned' }}</p>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              @click="openConfig(cls)"
              class="chalkboard-btn text-[10px] justify-center"
            >
              <Settings2 class="w-3 h-3" />
              Configure
            </button>
            <button
              @click.prevent="openStudents(cls)"
              class="chalkboard-btn chalkboard-btn-gold text-[10px] justify-center"
            >
              <Users class="w-3 h-3" />
              View Students
            </button>
          </div>
        </div>
      </template>
    </section>

    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-[#1B2A4A]/80 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="parchment-card relative z-10 w-full max-w-lg p-6 sm:p-8 shadow-2xl">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Create class</p>
              <h2 class="academic-heading text-2xl text-[#FAFAF7] mt-1">New classroom</h2>
            </div>
            <button @click="showAddModal = false" class="p-2 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/12 text-[#F5F0E8]/50 hover:text-[#C9A84C] transition-all">Close</button>
          </div>

          <div class="mt-8 space-y-5">
            <div>
              <label class="text-xs font-bold text-[#C9A84C]/70 block mb-2 uppercase tracking-wider">Class name</label>
              <input v-model="newClass.name" placeholder="e.g. JSS 1A" class="academic-input" />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-xs font-bold text-[#C9A84C]/70 block mb-2 uppercase tracking-wider">Level</label>
                <select v-model="newClass.level" class="academic-select">
                  <option>NUR</option>
                  <option>PRY</option>
                  <option>PRIMARY</option>
                  <option>JSS</option>
                  <option>SSS</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-bold text-[#C9A84C]/70 block mb-2 uppercase tracking-wider">Track</label>
                <input v-model="newClass.track" placeholder="e.g. Science" class="academic-input" />
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-3 sm:flex-row">
              <button @click="showAddModal = false" class="chalkboard-btn flex-1">Cancel</button>
              <button @click="handleAddClass" class="chalkboard-btn chalkboard-btn-gold flex-[2]">Create class</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showStudentsModal" class="fixed inset-0 z-[110] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-[#1B2A4A]/80 backdrop-blur-sm" @click="showStudentsModal = false"></div>
        <div class="parchment-card relative z-10 w-full max-w-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[10px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Class roster</p>
              <h2 class="academic-heading text-2xl text-[#FAFAF7] mt-1">{{ currentClass?.name }}</h2>
            </div>
            <button @click="showStudentsModal = false" class="chalkboard-btn text-[10px]">Close</button>
          </div>

          <div class="mt-6">
            <div v-if="studentsLoading" class="flex min-h-[220px] items-center justify-center">
              <Loader2 class="w-10 h-10 text-[#C9A84C]/50 animate-spin" />
            </div>
            <div v-else-if="studentsError" class="rounded-xl border border-[#8B3A52]/30 bg-[#8B3A52]/10 p-6 text-sm text-[#B45A74]">{{ studentsError }}</div>
            <div v-else-if="studentsInClass.length === 0" class="rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-6 text-center text-[#F5F0E8]/50">No students are currently assigned to this class.</div>
            <ul v-else class="mt-4 grid gap-3">
              <li v-for="s in studentsInClass" :key="s.studentId" class="rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-4 grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <p class="font-bold text-[#FAFAF7]">{{ s.lastName }} {{ s.firstName }}</p>
                  <p class="text-xs text-[#F5F0E8]/50 mt-0.5">{{ s.studentId }}</p>
                </div>
                <p class="self-center text-xs text-[#F5F0E8]/50">{{ s.parentName || 'No parent listed' }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showConfigModal" class="fixed inset-0 z-[110] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-[#1B2A4A]/80 backdrop-blur-sm" @click="showConfigModal = false"></div>
        <div class="parchment-card relative z-10 w-full max-w-lg p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[10px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Class details</p>
              <h2 class="academic-heading text-2xl text-[#FAFAF7] mt-1">{{ editingClass?.name }}</h2>
            </div>
            <button @click="showConfigModal = false" class="chalkboard-btn text-[10px]">Close</button>
          </div>

          <div class="mt-8 space-y-5">
            <div class="rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-5">
              <p class="text-[9px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Class information</p>
              <div class="mt-4 space-y-3 text-sm text-[#F5F0E8]/60">
                <div class="flex items-center justify-between gap-3">
                  <span>Name</span>
                  <strong class="text-[#FAFAF7]">{{ editingClass?.name }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span>Level</span>
                  <strong class="text-[#FAFAF7]">{{ editingClass?.level }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span>Track</span>
                  <strong class="text-[#FAFAF7]">{{ editingClass?.track || '—' }}</strong>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-5">
              <p class="text-[9px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Form teacher</p>
              <p class="mt-3 text-sm font-bold text-[#FAFAF7]">{{ editingClass?.formTeacherUsername ? `@${editingClass.formTeacherUsername}` : 'Not Assigned' }}</p>
            </div>

            <div class="rounded-xl border border-[#C9A84C]/10 bg-[#1B2A4A]/60 p-5">
              <p class="text-[9px] uppercase tracking-[0.35em] text-[#C9A84C]/50 font-bold">Subject count</p>
              <p class="mt-3 text-sm font-bold text-[#FAFAF7]">{{ editingClass?.subjectIds?.length || 0 }} subjects</p>
            </div>

            <button @click="showConfigModal = false" class="chalkboard-btn w-full justify-center">Done</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
