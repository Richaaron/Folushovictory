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
    const [assignResp, formResp] = await Promise.all([
      api.get('/api/teacher/assignments'),
      api.get('/api/teacher/form-classes')
    ])
    assignments.value = assignResp.data.assignments || []
    formClasses.value = formResp.data.classes || []
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
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-6">
        <div class="h-20 w-20 rounded-3xl purple-gradient p-1 shadow-2xl shadow-purple-200 dark:shadow-purple-900/30">
          <div class="h-full w-full rounded-[1.25rem] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
            <Award class="w-10 h-10 text-royal-purple" />
          </div>
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, <span class="text-royal-purple">{{ authStore.user?.displayName || 'Academic Staff' }}</span></h1>
            <div class="flex gap-2">
              <span v-if="formClasses.length > 0" class="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-200 dark:border-amber-800">Form Teacher</span>
              <span v-if="assignments.length > 0" class="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-purple-200 dark:border-purple-800">Subject Teacher</span>
            </div>
          </div>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {{ roleDescription }}
          </p>
        </div>
      </div>
      <div class="flex gap-4">
        <div class="academic-card rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[120px]">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignments</span>
          <span class="text-2xl font-black text-royal-purple">{{ assignments.length }}</span>
        </div>
        <div class="academic-card rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[120px]">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</span>
          <span class="text-2xl font-black text-slate-800 dark:text-slate-200">63</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Teaching Section -->
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <BookOpen class="w-5 h-5 text-royal-purple" /> Subject Assignments
            </h3>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Term</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              v-for="item in assignments" 
              :key="item.id"
              class="academic-card rounded-3xl p-8 border border-slate-100 dark:border-slate-800 group hover:border-royal-purple transition-all"
            >
              <div class="flex justify-between items-start mb-6">
                <div class="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-royal-purple flex items-center justify-center">
                  <ClipboardCheck class="w-6 h-6" />
                </div>
              </div>
              
              <h4 class="text-2xl font-black text-slate-900 dark:text-white">{{ item.subjectName }}</h4>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{{ item.className }}</p>
              
              <button 
                @click="router.push({ 
                  name: 'teacher-scores', 
                  params: { id: item.id },
                  query: { 
                    classId: item.classId, 
                    subjectId: item.subjectId,
                    className: item.className,
                    subjectName: item.subjectName
                  }
                })"
                class="mt-8 w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:bg-royal-purple group-hover:text-white transition-all flex items-center justify-center gap-2"
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
        <div class="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
          <div class="relative z-10">
            <h3 class="text-xl font-black tracking-tight mb-2">Performance Analytics</h3>
            <p class="text-sm text-slate-400 max-w-sm mb-8">Visualize class progress and identify students who may need extra attention.</p>
            <div class="flex gap-4">
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Score</span>
                <span class="text-2xl font-black text-emerald-400">74.2%</span>
              </div>
              <div class="w-px h-10 bg-slate-800 mx-4"></div>
              <div class="flex flex-col">
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
        <div class="academic-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
          <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
            <Award class="w-5 h-5 text-royal-gold" /> Form Classes
          </h3>
          <div class="space-y-4">
            <div v-for="cls in formClasses" :key="cls.id" class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 group hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm border border-transparent hover:border-royal-gold/30">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-black text-slate-900 dark:text-white">{{ cls.name }}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ cls.studentIds?.length || 0 }} Students</p>
                </div>
                <button class="p-2 rounded-xl text-slate-300 group-hover:text-royal-gold transition-colors">
                  <ArrowRight class="w-5 h-5" />
                </button>
              </div>
            </div>
            <div v-if="formClasses.length === 0" class="py-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              No form classes assigned.
            </div>
          </div>
        </div>

        <div class="academic-card rounded-[2.5rem] p-8 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
            <Clock class="w-5 h-5 text-slate-400" /> Upcoming Deadlines
          </h3>
          <div class="space-y-4">
            <div class="flex gap-4">
              <div class="h-10 w-10 shrink-0 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex flex-col items-center justify-center font-black">
                <span class="text-[8px] uppercase">May</span>
                <span class="text-sm">15</span>
              </div>
              <div>
                <p class="text-xs font-black text-slate-800 dark:text-slate-200">Submit CA 2 Scores</p>
                <p class="text-[10px] text-slate-400">JSS 3A Mathematics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
