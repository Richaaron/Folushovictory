<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  BookOpen, 
  ClipboardCheck, 
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Loader2
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const authStore = useAuthStore()
const router = useRouter()

const assignments = ref<any[]>([])
const formClasses = ref<any[]>([])
const loading = ref(true)

const roleDescription = computed(() => {
  const isForm = formClasses.value.length > 0
  const isSubject = assignments.value.length > 0
  if (isForm && isSubject) return 'Dual Role Academic Staff • Comprehensive Oversight'
  if (isForm) return 'Form Teacher • Class Management & Pastoral Care'
  if (isSubject) return 'Subject Teacher • Academic Excellence Specialist'
  return 'Academic Staff Portal'
})

const fetchData = async () => {
  loading.value = true
  try {
    const [assignResp, formResp, schoolResp] = await Promise.all([
      api.get('/api/teacher/assignments'),
      api.get('/api/teacher/form-classes'),
      api.get('/api/config/school')
    ])
    
    // Enrich assignments with level-specific flags
    const enrichedAssignments = (assignResp.data.assignments || []).map((a: any) => ({
      ...a,
      isPrimary: (a.level || '').toLowerCase().includes('primary') || (a.className || '').toLowerCase().includes('primary')
    }))

    // Deduplicate assignments by classId and subjectId
    const uniqueAssignments = new Map()
    for (const a of enrichedAssignments) {
      const key = `${a.classId}-${a.subjectId}`
      if (!uniqueAssignments.has(key)) {
        uniqueAssignments.set(key, a)
      }
    }
    assignments.value = Array.from(uniqueAssignments.values())
    formClasses.value = formResp.data.classes || []
    
    if (schoolResp.data) {
      // Optional: Use schoolResp.data.currentSession and schoolResp.data.currentTerm
      // for UI display if needed.
    }
  } catch (err) {
    console.error('Error fetching teacher data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Welcome Header -->
    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div class="glass-card p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-royal-gold/15 relative overflow-hidden">
        <div class="absolute -right-16 top-4 h-32 w-32 rounded-full bg-royal-purple/15 blur-3xl" aria-hidden="true"></div>
        <div class="absolute -left-16 bottom-10 h-32 w-32 rounded-full bg-royal-gold/10 blur-3xl" aria-hidden="true"></div>
        <div class="flex items-center gap-4 mb-6">
          <div class="h-2.5 w-16 rounded-full bg-royal-purple/60"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.35em] text-royal-gold">Teacher Hub</span>
        </div>
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="flex items-center gap-5">
            <div class="relative h-20 w-20 rounded-[2rem] bg-slate-900/90 border border-royal-gold/15 shadow-lg shadow-royal-purple/10 flex items-center justify-center">
              <Award class="w-10 h-10 text-royal-gold" />
            </div>
            <div>
              <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">Welcome, <span class="text-royal-purple">{{ authStore.user?.displayName || 'Academic Staff' }}</span></h1>
              <p class="mt-3 max-w-xl text-sm text-slate-400">{{ roleDescription }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <span v-if="formClasses.length > 0" class="inline-flex items-center gap-2 rounded-2xl bg-slate-900/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-royal-purple border border-slate-700/60">Form Teacher</span>
            <span v-if="assignments.length > 0" class="inline-flex items-center gap-2 rounded-2xl bg-slate-900/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-royal-gold border border-slate-700/60">Subject Teacher</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="glass-card p-6 border-royal-purple/15 bg-slate-950/90">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Assignments</p>
          <p class="mt-3 text-3xl font-black text-white">{{ assignments.length }}</p>
          <p class="mt-2 text-sm text-slate-400">Subjects you are currently teaching</p>
        </div>
        <div class="glass-card p-6 border-royal-gold/15 bg-slate-950/90">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Total Focus</p>
          <p class="mt-3 text-3xl font-black text-white">{{ formClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0) }}</p>
          <p class="mt-2 text-sm text-slate-400">Learners currently under your pastoral care</p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Teaching Section -->
      <div class="lg:col-span-2 space-y-8">
        <div class="glass-card p-8 bg-slate-950/90 border-royal-purple/15">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-3xl bg-slate-900/70 text-royal-purple flex items-center justify-center border border-slate-700/60">
                <BookOpen class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-black text-white tracking-tight">Subject Assignments</h3>
                <p class="text-[10px] uppercase tracking-[0.3em] text-slate-500">Active Term assignments ready for score entry</p>
              </div>
            </div>
            <span class="rounded-full bg-slate-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-royal-gold border border-royal-gold/15">Active Term</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              v-for="item in assignments" 
              :key="item.id"
              class="glass-card rounded-[2rem] p-8 border-royal-purple/10 group hover:border-royal-gold/30 transition-all"
            >
              <div class="flex justify-between items-start mb-6">
                <div class="h-12 w-12 rounded-2xl bg-slate-900/70 text-royal-purple flex items-center justify-center border border-slate-700/60">
                  <ClipboardCheck class="w-6 h-6" />
                </div>
              </div>
              
              <h4 class="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{{ item.subjectName }}</h4>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {{ item.className }} 
                <span v-if="item.isPrimary" class="ml-2 px-2 py-0.5 bg-slate-900/60 text-blue-300 rounded-md text-[8px]">Primary</span>
              </p>
              
              <button 
                @click="router.push({ 
                  name: 'teacher-scores', 
                  params: { id: item.id },
                  query: { 
                    classId: item.classId, 
                    subjectId: item.subjectId,
                    className: item.className,
                    subjectName: item.subjectName,
                    isPrimary: item.isPrimary ? 'true' : 'false'
                  }
                })"
                class="mt-8 w-full py-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-[10px] font-black uppercase tracking-widest text-white hover:bg-royal-purple hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Enter Results <ArrowRight class="w-4 h-4" />
              </button>
            </div>
            <div v-if="assignments.length === 0" class="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs academic-card border-dashed">
              No subjects assigned for this term.
            </div>
          </div>
        </div>

        <!-- Analytics Placeholder -->
        <div class="glass-card p-10 bg-slate-950/90 border-royal-gold/15 relative overflow-hidden">
          <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-royal-purple/10 blur-3xl" aria-hidden="true"></div>
          <div class="absolute left-0 bottom-0 h-36 w-36 rounded-full bg-royal-gold/10 blur-3xl" aria-hidden="true"></div>
          <div class="relative z-10">
            <h3 class="text-xl font-black tracking-tight mb-2 text-white">Performance Analytics</h3>
            <p class="text-sm text-slate-400 max-w-sm mb-8">Visualize class progress and identify students who may need extra attention.</p>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col rounded-3xl bg-slate-900/80 p-4">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Score</span>
                <span class="text-2xl font-black text-emerald-400">74.2%</span>
              </div>
              <div class="flex flex-col rounded-3xl bg-slate-900/80 p-4">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pass Rate</span>
                <span class="text-2xl font-black text-blue-400">92%</span>
              </div>
            </div>
          </div>
          <TrendingUp class="absolute -right-8 -bottom-8 w-64 h-64 text-white/5" />
        </div>
      </div>

      <!-- Sidebar Actions -->
      <div class="space-y-6">
        <div class="glass-card p-8 border-royal-gold/15 bg-slate-950/90">
          <h3 class="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-2">
            <Award class="w-5 h-5 text-royal-gold" /> Form Classes
          </h3>
          <div class="space-y-4">
            <div 
              v-for="cls in formClasses" 
              :key="cls.id" 
              @click="router.push({ name: 'teacher-form-class', params: { classId: cls.id }, query: { className: cls.name } })"
              class="glass-card p-5 rounded-[2rem] border border-royal-gold/15 bg-slate-950/90 group hover:border-royal-gold/30 hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-black text-white truncate">{{ cls.name }}</p>
                  <p class="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ cls.studentIds?.length || 0 }} Students</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-slate-300 group-hover:text-royal-gold transition-colors">
                  <ArrowRight class="w-5 h-5" />
                </div>
              </div>
            </div>
            <div v-if="formClasses.length === 0" class="glass-card rounded-[2rem] p-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-700/50">
              No form classes assigned.
            </div>
          </div>
        </div>

        <div class="glass-card p-8 border-royal-purple/15 bg-slate-950/90">
          <h3 class="text-lg font-black text-white tracking-tight mb-6 flex items-center gap-2">
            <Clock class="w-5 h-5 text-royal-gold" /> Upcoming Deadlines
          </h3>
          <div class="space-y-4">
            <div class="glass-card p-5 rounded-[2rem] border border-royal-purple/10 bg-slate-950/90 flex items-center gap-4 hover:border-royal-gold/20 transition-all">
              <div class="h-14 w-14 shrink-0 rounded-3xl bg-red-900/30 text-red-300 flex flex-col items-center justify-center font-black text-[10px] uppercase tracking-[0.18em]">
                <span>May</span>
                <span class="text-sm">15</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-white truncate">Submit CA 2 Scores</p>
                <p class="text-[10px] text-slate-400">JSS 3A Mathematics</p>
              </div>
              <span class="ml-auto rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Due Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
