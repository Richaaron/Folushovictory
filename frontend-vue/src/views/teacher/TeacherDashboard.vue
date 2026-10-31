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
  <div class="space-y-6 text-[#1E293B]">
    
    <!-- Welcome Header Card -->
    <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div class="flex items-center gap-3.5 sm:gap-4">
          <div class="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 text-[#059669]">
            <Award class="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-[10px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                Faculty Portal
              </span>
              <span v-if="currentSession" class="text-xs font-bold text-[#475569]">
                {{ currentSession }} • {{ currentTerm }} Term
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A]">
              Welcome, {{ authStore.user?.displayName || 'Educator' }}
            </h1>
            <p class="text-xs sm:text-sm text-[#475569] mt-0.5">
              {{ roleDescription }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span v-if="formClasses.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]">
            Form Teacher ({{ formClasses.length }})
          </span>
          <span v-if="assignments.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            {{ assignments.length }} Subjects Assigned
          </span>
          <router-link
            to="/teacher/settings"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] transition-colors"
          >
            <Lock class="w-3.5 h-3.5 text-[#64748B]" />
            <span>Settings</span>
          </router-link>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-5 pt-4 border-t border-[#E2E8F0]">
        <div class="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Subject Allocations</p>
            <p class="text-2xl font-black text-[#1E3A8A] mt-0.5">{{ assignments.length }}</p>
            <p class="text-[11px] text-[#64748B] mt-0.5">Subjects ready for mark entry</p>
          </div>
          <div class="h-10 w-10 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#1E3A8A]">
            <BookOpen class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[#475569]">Pastoral Care Students</p>
            <p class="text-2xl font-black text-[#059669] mt-0.5">
              {{ formClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0) }}
            </p>
            <p class="text-[11px] text-[#64748B] mt-0.5">Learners enrolled in your form classes</p>
          </div>
          <div class="h-10 w-10 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#059669]">
            <Users class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[250px]">
      <Loader2 class="w-10 h-10 text-[#1E3A8A] animate-spin" />
    </div>

    <!-- Main Content Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      
      <!-- Left Column: Subject Allocations (8 cols on desktop) -->
      <div class="lg:col-span-8 space-y-5">
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm">
          <div class="flex items-center justify-between pb-3.5 mb-4 border-b border-[#E2E8F0]">
            <div class="flex items-center gap-2.5">
              <div class="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center">
                <ClipboardCheck class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-sm sm:text-base font-extrabold text-[#0F172A]">Score Entry Allocations</h2>
                <p class="text-[11px] text-[#475569]">Select a subject to enter Continuous Assessment or Exam scores</p>
              </div>
            </div>

            <span class="text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
              {{ assignments.length }} Ready
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div 
              v-for="item in assignments" 
              :key="item.id"
              class="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] hover:border-[#1E3A8A] hover:bg-white hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-black text-[#1E3A8A] uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                    {{ item.className }}
                  </span>
                  <span v-if="item.isNursery" class="text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-1.5 py-0.5 rounded">
                    Nursery
                  </span>
                  <span v-else-if="item.isPrimary" class="text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors leading-snug">
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
                class="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span class="text-white">Enter Scores</span>
                <ArrowRight class="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <div v-if="assignments.length === 0" class="col-span-full py-10 text-center text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1]">
              <BookOpen class="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
              <p class="text-sm font-bold text-[#0F172A]">No subject assignments found.</p>
              <p class="text-xs mt-1">Please contact school administration to allocate subjects to your staff account.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Form Classes & Guidelines (4 cols on desktop) -->
      <div class="lg:col-span-4 space-y-4">
        
        <!-- Form Classes Card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm space-y-3.5">
          <div class="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                <Award class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-bold text-[#0F172A]">Form Classes</h3>
            </div>
            <span class="text-xs font-bold text-[#475569]">{{ formClasses.length }}</span>
          </div>

          <div class="space-y-2">
            <div 
              v-for="cls in formClasses" 
              :key="cls.id"
              @click="router.push({ name: 'teacher-form-class', params: { classId: cls.id }, query: { className: cls.name } })"
              class="p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#1E3A8A] transition-all cursor-pointer flex items-center justify-between group active:scale-95"
            >
              <div>
                <p class="text-xs font-extrabold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                  {{ cls.name }}
                </p>
                <p class="text-[11px] font-medium text-[#475569]">
                  {{ cls.studentIds?.length || 0 }} Students Enrolled
                </p>
              </div>
              <div class="h-7 w-7 rounded-lg bg-white border border-[#CBD5E1] flex items-center justify-center text-[#475569] group-hover:bg-[#1E3A8A] group-hover:text-white transition-all">
                <ArrowRight class="w-3.5 h-3.5" />
              </div>
            </div>

            <div v-if="formClasses.length === 0" class="py-6 text-center text-xs text-[#64748B]">
              You are not currently assigned as a form teacher.
            </div>
          </div>
        </div>

        <!-- Continuous Assessment Guide -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Clock class="w-4 h-4 text-[#1E3A8A]" />
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Score Breakdown</h3>
          </div>
          <div class="space-y-2 text-xs text-[#334155] leading-relaxed">
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#1E3A8A] mt-1.5 shrink-0"></span>
              <span><strong>CA 1 & 2:</strong> 10 marks each (or custom class assessment).</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#059669] mt-1.5 shrink-0"></span>
              <span><strong>Terminal Examination:</strong> 60 marks total.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#D97706] mt-1.5 shrink-0"></span>
              <span>Form teachers submit affective traits & remarks before broadsheet lock.</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
