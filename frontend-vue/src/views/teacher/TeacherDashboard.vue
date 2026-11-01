<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  BookOpen, 
  ClipboardCheck, 
  ArrowRight, 
  Clock, 
  Award, 
  Loader2, 
  Lock,
  Users
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const authStore = useAuthStore()
const router = useRouter()

const assignments = ref<any[]>([])
const formClasses = ref<any[]>([])
const loading = ref(true)
const currentSession = ref('')
const currentTerm = ref('First')

const roleDescription = computed(() => {
  const isForm = formClasses.value.length > 0
  const isSubject = assignments.value.length > 0
  if (isForm && isSubject) return 'Form & Subject Teacher • Full Academic & Pastoral Oversight'
  if (isForm) return 'Form Teacher • Class Management, Pastoral Care & Remarks'
  if (isSubject) return 'Subject Teacher • Continuous Assessment & Examination Specialist'
  return 'Faculty Portal'
})

const fetchData = async () => {
  loading.value = true
  try {
    const [assignResp, formResp, schoolResp] = await Promise.all([
      api.get('/api/teacher/assignments'),
      api.get('/api/teacher/form-classes'),
      api.get('/api/config/school')
    ])
    
    const enrichedAssignments = (assignResp.data.assignments || []).map((a: any) => ({
      ...a,
      isPrimary: (a.level || '').toLowerCase().includes('primary') || (a.className || '').toLowerCase().includes('primary'),
      isNursery: (a.level || '').toLowerCase().includes('nur') || (a.className || '').toLowerCase().includes('nur')
    }))

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
      currentSession.value = schoolResp.data.currentSession || ''
      currentTerm.value = schoolResp.data.currentTerm || 'First'
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
  <div class="space-y-6 text-[#0F172A]">
    
    <!-- Welcome Header Card -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-md">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div class="flex items-center gap-3.5 sm:gap-4">
          <div class="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0 text-amber-700 shadow-sm">
            <Award class="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-xs">
                Faculty Portal
              </span>
              <span v-if="currentSession" class="text-xs font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {{ currentSession }} • {{ currentTerm }} Term
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-[#0C4A6E]">
              Welcome, {{ authStore.user?.displayName || 'Educator' }}
            </h1>
            <p class="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
              {{ roleDescription }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span v-if="formClasses.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 shadow-xs">
            Form Teacher ({{ formClasses.length }})
          </span>
          <span v-if="assignments.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
            {{ assignments.length }} Subjects Assigned
          </span>
          <router-link
            to="/teacher/settings"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-sky-50 border-2 border-slate-300 text-slate-800 transition-colors shadow-xs"
          >
            <Lock class="w-3.5 h-3.5 text-slate-600" />
            <span>Settings</span>
          </router-link>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-5 pt-5 border-t border-[#BAE6FD]">
        <div class="bg-sky-50/70 rounded-xl p-4 border border-[#BAE6FD] flex items-center justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-slate-700">Subject Allocations</p>
            <p class="text-2xl sm:text-3xl font-black text-sky-700 mt-0.5">{{ assignments.length }}</p>
            <p class="text-xs font-bold text-slate-600 mt-0.5">Subjects ready for mark entry</p>
          </div>
          <div class="h-11 w-11 rounded-xl bg-white border border-[#BAE6FD] shadow-sm flex items-center justify-center text-sky-700">
            <BookOpen class="w-6 h-6" />
          </div>
        </div>

        <div class="bg-amber-50/70 rounded-xl p-4 border border-amber-200 flex items-center justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-slate-700">Pastoral Care Students</p>
            <p class="text-2xl sm:text-3xl font-black text-amber-700 mt-0.5">
              {{ formClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0) }}
            </p>
            <p class="text-xs font-bold text-slate-600 mt-0.5">Learners enrolled in your form classes</p>
          </div>
          <div class="h-11 w-11 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-center text-amber-600">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[250px]">
      <Loader2 class="w-10 h-10 text-sky-700 animate-spin" />
    </div>

    <!-- Main Content Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      
      <!-- Left Column: Subject Allocations (8 cols on desktop) -->
      <div class="lg:col-span-8 space-y-5">
        <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#BAE6FD]">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shadow-xs">
                <ClipboardCheck class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-sm sm:text-base font-black text-[#0C4A6E]">Score Entry Allocations</h2>
                <p class="text-xs font-bold text-slate-600">Select a subject to enter Continuous Assessment or Exam scores</p>
              </div>
            </div>

            <span class="text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
              {{ assignments.length }} Ready
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div 
              v-for="item in assignments" 
              :key="item.id"
              class="bg-sky-50/60 rounded-2xl p-4 sm:p-5 border-2 border-[#BAE6FD] hover:border-amber-400 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-black text-sky-900 uppercase tracking-wider bg-white px-2.5 py-1 rounded-md border border-[#BAE6FD] shadow-xs">
                    {{ item.className }}
                  </span>
                  <span v-if="item.isNursery" class="text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded shadow-xs">
                    Nursery
                  </span>
                  <span v-else-if="item.isPrimary" class="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded shadow-xs">
                    Primary
                  </span>
                </div>
                <h3 class="text-sm sm:text-base font-black text-[#0F172A] group-hover:text-sky-700 transition-colors leading-snug">
                  {{ item.subjectName }}
                </h3>
              </div>

              <button 
                @click="router.push({ 
                  name: 'teacher-scores', 
                  params: { id: item.id },
                  query: { 
                    classId: item.classId, 
                    subjectId: item.subjectId,
                    className: item.className,
                    subjectName: item.subjectName,
                    isPrimary: item.isPrimary ? 'true' : 'false',
                    session: currentSession,
                    term: currentTerm
                  }
                })"
                class="mt-4 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span class="text-white">Enter Scores</span>
                <ArrowRight class="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <div v-if="assignments.length === 0" class="col-span-full py-12 text-center text-slate-600 bg-sky-50/60 rounded-2xl border-2 border-dashed border-[#BAE6FD]">
              <BookOpen class="w-10 h-10 mx-auto mb-2 text-sky-400" />
              <p class="text-sm font-black text-[#0F172A]">No subject assignments found.</p>
              <p class="text-xs font-bold mt-1 text-slate-600">Please contact school administration to allocate subjects to your staff account.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Form Classes & Guidelines (4 cols on desktop) -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Form Classes Card -->
        <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#BAE6FD]">
            <div class="flex items-center gap-2">
              <div class="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shadow-xs">
                <Award class="w-5 h-5" />
              </div>
              <h3 class="text-sm font-black text-[#0C4A6E]">Form Classes</h3>
            </div>
            <span class="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">{{ formClasses.length }}</span>
          </div>

          <div class="space-y-2">
            <div 
              v-for="cls in formClasses" 
              :key="cls.id"
              @click="router.push({ name: 'teacher-form-class', params: { classId: cls.id }, query: { className: cls.name } })"
              class="p-3.5 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-[#BAE6FD] hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group active:scale-95 shadow-xs"
            >
              <div>
                <p class="text-xs font-black text-[#0F172A] group-hover:text-sky-700 transition-colors">
                  {{ cls.name }}
                </p>
                <p class="text-[11px] font-bold text-slate-600">
                  {{ cls.studentIds?.length || 0 }} Students Enrolled
                </p>
              </div>
              <div class="h-8 w-8 rounded-lg bg-white border border-[#BAE6FD] flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                <ArrowRight class="w-4 h-4" />
              </div>
            </div>

            <div v-if="formClasses.length === 0" class="py-6 text-center text-xs font-bold text-slate-600">
              You are not currently assigned as a form teacher.
            </div>
          </div>
        </div>

        <!-- Continuous Assessment Guide -->
        <div class="bg-white/95 rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-6 shadow-md space-y-3.5">
          <div class="flex items-center gap-2 pb-2.5 border-b border-[#BAE6FD]">
            <Clock class="w-4 h-4 text-sky-700" />
            <h3 class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Score Breakdown</h3>
          </div>
          <div class="space-y-2.5 text-xs font-bold text-slate-800 leading-relaxed">
            <div class="flex items-start gap-2">
              <span class="h-2 w-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
              <span><strong>CA 1 & 2:</strong> 10 marks each (or custom class assessment).</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
              <span><strong>Terminal Examination:</strong> 60 marks total.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
              <span>Form teachers submit affective traits & remarks before broadsheet lock.</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
