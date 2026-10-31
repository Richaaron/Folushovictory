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
  <div class="space-y-6 text-[#1C1917]">
    
    <!-- Welcome Header Card -->
    <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="h-14 w-14 rounded-2xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 flex items-center justify-center shrink-0 text-[#2D6A4F]">
            <Award class="w-7 h-7" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-full">
                Faculty Hub
              </span>
              <span v-if="currentSession" class="text-[11px] font-semibold text-[#6B7280]">
                {{ currentSession }} • {{ currentTerm }} Term
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
              Welcome, {{ authStore.user?.displayName || 'Educator' }}
            </h1>
            <p class="text-xs sm:text-sm text-[#4B5563] mt-0.5">
              {{ roleDescription }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <span v-if="formClasses.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1A4D8F]/10 text-[#1A4D8F] border border-[#1A4D8F]/20">
            Form Teacher ({{ formClasses.length }})
          </span>
          <span v-if="assignments.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
            {{ assignments.length }} Subjects Assigned
          </span>
          <router-link
            to="/teacher/settings"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F7F4EE] hover:bg-[#EFE9DE] border border-[#E5E0D8] text-[#1C1917] transition-colors"
          >
            <Lock class="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Security</span>
          </router-link>
        </div>
      </div>

      <!-- Quick Metrics Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#E5E0D8]">
        <div class="bg-[#F7F4EE] rounded-xl p-4 border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Active Subject Allocations</p>
            <p class="text-2xl font-black text-[#1A4D8F] mt-1">{{ assignments.length }}</p>
            <p class="text-[11px] text-[#4B5563] mt-0.5">Subjects ready for continuous assessment</p>
          </div>
          <div class="h-10 w-10 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center text-[#1A4D8F]">
            <BookOpen class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-[#F7F4EE] rounded-xl p-4 border border-[#E5E0D8] flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Pastoral Care Students</p>
            <p class="text-2xl font-black text-[#2D6A4F] mt-1">
              {{ formClasses.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0) }}
            </p>
            <p class="text-[11px] text-[#4B5563] mt-0.5">Learners enrolled in your form classes</p>
          </div>
          <div class="h-10 w-10 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center text-[#2D6A4F]">
            <Users class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[300px]">
      <Loader2 class="w-10 h-10 text-[#1A4D8F] animate-spin" />
    </div>

    <!-- Main Content Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Subject Allocations -->
      <div class="lg:col-span-8 space-y-6">
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E5E0D8]">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-[#1A4D8F]/10 text-[#1A4D8F] flex items-center justify-center">
                <ClipboardCheck class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-[#1C1917]">Score Entry Allocations</h2>
                <p class="text-[11px] text-[#6B7280]">Select a subject to enter or modify student marks</p>
              </div>
            </div>

            <span class="text-xs font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-1 rounded-full">
              {{ assignments.length }} Available
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="item in assignments" 
              :key="item.id"
              class="bg-[#F7F4EE] rounded-2xl p-5 border border-[#E5E0D8] hover:border-[#1A4D8F]/40 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-bold text-[#1A4D8F] uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#E5E0D8]">
                    {{ item.className }}
                  </span>
                  <span v-if="item.isNursery" class="text-[9px] font-bold bg-[#E8A838]/20 text-[#8C5D07] px-1.5 py-0.5 rounded">
                    Nursery
                  </span>
                  <span v-else-if="item.isPrimary" class="text-[9px] font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                </div>
                <h3 class="text-base font-extrabold text-[#1C1917] group-hover:text-[#1A4D8F] transition-colors leading-snug">
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
                class="mt-4 w-full py-2.5 px-3 rounded-xl bg-white border border-[#E5E0D8] group-hover:bg-[#1A4D8F] group-hover:text-white group-hover:border-transparent text-xs font-bold text-[#1C1917] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Enter Marks</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="assignments.length === 0" class="col-span-full py-12 text-center text-[#9CA3AF] bg-[#F7F4EE] rounded-2xl border border-dashed border-[#E5E0D8]">
              <BookOpen class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm font-bold">No subject assignments found.</p>
              <p class="text-xs mt-1">Contact the administrator to allocate subjects to your account.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Form Classes & Activities -->
      <div class="lg:col-span-4 space-y-5">
        
        <!-- Form Classes Card -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-[#E8A838]/15 text-[#C98818] flex items-center justify-center">
                <Award class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-bold text-[#1C1917]">My Form Classes</h3>
            </div>
            <span class="text-xs font-semibold text-[#6B7280]">{{ formClasses.length }}</span>
          </div>

          <div class="space-y-2.5">
            <div 
              v-for="cls in formClasses" 
              :key="cls.id"
              @click="router.push({ name: 'teacher-form-class', params: { classId: cls.id }, query: { className: cls.name } })"
              class="p-3.5 rounded-xl bg-[#F7F4EE] hover:bg-white hover:shadow-sm border border-[#E5E0D8] hover:border-[#1A4D8F]/30 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <p class="text-xs font-bold text-[#1C1917] group-hover:text-[#1A4D8F] transition-colors">
                  {{ cls.name }}
                </p>
                <p class="text-[11px] text-[#6B7280]">
                  {{ cls.studentIds?.length || 0 }} Students Enrolled
                </p>
              </div>
              <div class="h-7 w-7 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#6B7280] group-hover:bg-[#1A4D8F] group-hover:text-white transition-all">
                <ArrowRight class="w-3.5 h-3.5" />
              </div>
            </div>

            <div v-if="formClasses.length === 0" class="py-6 text-center text-xs text-[#9CA3AF]">
              You are currently not assigned as a form teacher for any class.
            </div>
          </div>
        </div>

        <!-- Academic Guidelines & Deadlines -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]">
            <Clock class="w-4 h-4 text-[#1A4D8F]" />
            <h3 class="text-sm font-bold text-[#1C1917]">Continuous Assessment Guide</h3>
          </div>
          <div class="space-y-2 text-xs text-[#4B5563] leading-relaxed">
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#1A4D8F] mt-1.5 shrink-0"></span>
              <span><strong>CA 1 & 2:</strong> 10 marks each or configured breakdown.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#2D6A4F] mt-1.5 shrink-0"></span>
              <span><strong>Examinations:</strong> 60 marks total.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-[#E8A838] mt-1.5 shrink-0"></span>
              <span>Form teachers must complete attendance and traits before publishing.</span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
