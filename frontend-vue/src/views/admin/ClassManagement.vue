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
  <div class="space-y-8 fade-in">
    <section class="admin-hero-card shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-3 max-w-2xl">
          <div class="h-1 w-16 bg-royal-purple rounded-full"></div>
          <h1 class="hero-title">Academic <span>Classes</span></h1>
          <p class="hero-subtitle">A modern dashboard for managing classrooms, tracking enrollment, and checking teacher coverage across your school.</p>
        </div>

        <button
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 rounded-[1.5rem] purple-gradient px-5 py-3 text-sm font-black text-white shadow-xl shadow-purple-500/10 transition hover:opacity-95"
        >
          <Plus class="w-4 h-4" />
          <span>New Class</span>
        </button>
      </div>

      <div class="grid gap-4 mt-8 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/80 p-5">
          <div class="flex items-center gap-3 text-slate-400 text-xs uppercase tracking-[0.3em] font-black">Classes</div>
          <p class="mt-4 text-4xl font-black text-white">{{ totalClasses }}</p>
          <p class="mt-1 text-sm text-slate-400">Active class groups</p>
        </div>
        <div class="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/80 p-5">
          <div class="flex items-center gap-3 text-slate-400 text-xs uppercase tracking-[0.3em] font-black">Students</div>
          <p class="mt-4 text-4xl font-black text-white">{{ totalStudents }}</p>
          <p class="mt-1 text-sm text-slate-400">Total enrolled</p>
        </div>
        <div class="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/80 p-5">
          <div class="flex items-center gap-3 text-slate-400 text-xs uppercase tracking-[0.3em] font-black">Subjects</div>
          <p class="mt-4 text-4xl font-black text-white">{{ totalSubjects }}</p>
          <p class="mt-1 text-sm text-slate-400">Assigned subjects</p>
        </div>
        <div class="rounded-[1.75rem] border border-slate-700/50 bg-slate-950/80 p-5">
          <div class="flex items-center gap-3 text-slate-400 text-xs uppercase tracking-[0.3em] font-black">Needs attention</div>
          <p class="mt-4 text-4xl font-black text-white">{{ unassignedClasses }}</p>
          <p class="mt-1 text-sm text-slate-400">Classes without teachers</p>
        </div>
      </div>

      <div class="mt-8 grid gap-4 lg:grid-cols-[1fr_auto] items-center">
        <label class="relative block">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search classes, teachers, levels..."
            class="w-full rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 py-3 pl-12 pr-4 text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:border-royal-purple focus:outline-none focus:ring-4 focus:ring-royal-purple/10"
          />
        </label>
        <div class="rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 p-4 text-sm text-slate-300 flex items-center gap-3">
          <Sparkles class="h-4 w-4 text-royal-purple" />
          <span>{{ filteredClasses.length }} class{{ filteredClasses.length === 1 ? '' : 'es' }} visible</span>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-3 xl:auto-rows-fr">
      <div v-if="loading" class="col-span-full flex min-h-[320px] items-center justify-center rounded-[2rem] border border-slate-700/60 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <Loader2 class="w-14 h-14 text-royal-purple animate-spin" />
      </div>

      <template v-else>
        <div v-if="filteredClasses.length === 0" class="col-span-full rounded-[2rem] border border-slate-700/60 bg-slate-950/90 p-10 text-center text-slate-400">
          No classes matched your search. Try another keyword or create a new class.
        </div>

        <div
          v-for="cls in filteredClasses"
          :key="cls.id"
          class="group relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-royal-purple/50 hover:bg-slate-900/95"
        >
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-royal-purple via-fuchsia-500 to-amber-500"></div>
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">{{ cls.level }} {{ cls.track || '' }}</p>
              <h2 class="mt-3 text-2xl font-black text-white">{{ cls.name }}</h2>
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <span class="rounded-full bg-slate-900/80 px-3 py-1 text-slate-300">{{ cls.subjectIds?.length || 0 }} Subjects</span>
                <span class="rounded-full bg-slate-900/80 px-3 py-1 text-slate-300">{{ (cls.studentCount !== undefined) ? cls.studentCount : (cls.studentIds?.length || 0) }} Students</span>
              </div>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900/80 border border-slate-700/60 text-royal-purple">
              <School class="h-6 w-6" />
            </div>
          </div>

          <div class="mt-6 rounded-[1.5rem] border border-slate-700/40 bg-slate-900/70 p-4">
            <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Form Teacher</p>
            <p class="mt-2 text-sm font-semibold text-white">{{ cls.formTeacherUsername ? `@${cls.formTeacherUsername}` : 'Not Assigned' }}</p>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              @click="openConfig(cls)"
              class="flex items-center justify-center gap-2 rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-royal-purple hover:text-royal-purple"
            >
              <Settings2 class="h-4 w-4" />
              Configure
            </button>
            <button
              @click.prevent="openStudents(cls)"
              class="flex items-center justify-center gap-2 rounded-[1.5rem] purple-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <Users class="h-4 w-4" />
              View Students
            </button>
          </div>
        </div>
      </template>
    </section>

    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="glass-card relative z-10 w-full max-w-lg rounded-[2.5rem] border border-slate-700/60 bg-slate-950/95 p-8 shadow-2xl shadow-black/40">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-400">Create class</p>
              <h2 class="mt-2 text-3xl font-black text-white">New classroom</h2>
            </div>
            <button @click="showAddModal = false" class="rounded-full border border-slate-700/60 bg-slate-900/80 p-3 text-slate-200 transition hover:bg-slate-800">Close</button>
          </div>

          <div class="mt-8 space-y-5">
            <div>
              <label class="text-xs font-semibold text-slate-400 block mb-2">Class name</label>
              <input
                v-model="newClass.name"
                placeholder="e.g. JSS 1A"
                class="w-full rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white outline-none transition focus:border-royal-purple focus:ring-4 focus:ring-royal-purple/10"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="text-xs font-semibold text-slate-400 block mb-2">Level</label>
                <select
                  v-model="newClass.level"
                  class="w-full rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white outline-none transition focus:border-royal-purple focus:ring-4 focus:ring-royal-purple/10"
                >
                  <option>JSS</option>
                  <option>SSS</option>
                  <option>PRIMARY</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-400 block mb-2">Track</label>
                <input
                  v-model="newClass.track"
                  placeholder="e.g. Science"
                  class="w-full rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-4 py-4 text-sm font-semibold text-white outline-none transition focus:border-royal-purple focus:ring-4 focus:ring-royal-purple/10"
                />
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-3 sm:flex-row">
              <button @click="showAddModal = false" class="flex-1 rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-5 py-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Cancel</button>
              <button @click="handleAddClass" class="flex-1 rounded-[1.75rem] purple-gradient px-5 py-4 text-sm font-semibold text-white transition hover:opacity-95">Create class</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showStudentsModal" class="fixed inset-0 z-[110] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="showStudentsModal = false"></div>
        <div class="glass-card relative z-10 w-full max-w-3xl rounded-[2.5rem] border border-slate-700/60 bg-slate-950/95 p-8 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-400">Class roster</p>
              <h2 class="mt-2 text-3xl font-black text-white">{{ currentClass?.name }}</h2>
            </div>
            <button @click="showStudentsModal = false" class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Close</button>
          </div>

          <div class="mt-6">
            <div v-if="studentsLoading" class="flex min-h-[220px] items-center justify-center">
              <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
            </div>
            <div v-else-if="studentsError" class="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">{{ studentsError }}</div>
            <div v-else-if="studentsInClass.length === 0" class="rounded-[1.75rem] border border-slate-700/50 bg-slate-900/80 p-6 text-center text-slate-400">No students are currently assigned to this class.</div>
            <ul v-else class="mt-4 grid gap-3">
              <li v-for="s in studentsInClass" :key="s.studentId" class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-4 grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <p class="font-semibold text-white">{{ s.lastName }} {{ s.firstName }}</p>
                  <p class="text-sm text-slate-400">{{ s.studentId }}</p>
                </div>
                <p class="self-center text-sm text-slate-400">{{ s.parentName || 'No parent listed' }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showConfigModal" class="fixed inset-0 z-[110] flex items-start justify-center px-4 pb-8 pt-20 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="showConfigModal = false"></div>
        <div class="glass-card relative z-10 w-full max-w-lg rounded-[2.5rem] border border-slate-700/60 bg-slate-950/95 p-8 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-400">Class details</p>
              <h2 class="mt-2 text-3xl font-black text-white">{{ editingClass?.name }}</h2>
            </div>
            <button @click="showConfigModal = false" class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Close</button>
          </div>

          <div class="mt-8 space-y-5">
            <div class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-5">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Class information</p>
              <div class="mt-4 space-y-3 text-sm text-slate-300">
                <div class="flex items-center justify-between gap-3">
                  <span>Name</span>
                  <strong class="text-white">{{ editingClass?.name }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span>Level</span>
                  <strong class="text-white">{{ editingClass?.level }}</strong>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span>Track</span>
                  <strong class="text-white">{{ editingClass?.track || '—' }}</strong>
                </div>
              </div>
            </div>

            <div class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-5">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Form teacher</p>
              <p class="mt-3 text-sm font-semibold text-white">{{ editingClass?.formTeacherUsername ? `@${editingClass.formTeacherUsername}` : 'Not Assigned' }}</p>
            </div>

            <div class="rounded-[1.75rem] border border-slate-700/60 bg-slate-900/80 p-5">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Subject count</p>
              <p class="mt-3 text-sm font-semibold text-white">{{ editingClass?.subjectIds?.length || 0 }} subjects</p>
            </div>

            <button @click="showConfigModal = false" class="w-full rounded-[1.75rem] purple-gradient px-5 py-4 text-sm font-semibold text-white transition hover:opacity-95">Done</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
