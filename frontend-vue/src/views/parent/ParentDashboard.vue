<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  GraduationCap, 
  BookOpen, 
  Download, 
  TrendingUp, 
  FileText, 
  Loader2, 
  Calendar, 
  Sparkles 
} from 'lucide-vue-next'
import api from '../../services/api'

const student = ref<any>(null)
const recentScores = ref<any[]>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const { data: studentData } = await api.get('/api/parent/student')
    student.value = studentData
  } catch (err) {
    console.error('Error fetching parent dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-[350px]">
    <Loader2 class="w-10 h-10 text-[#E8A838] animate-spin" />
  </div>

  <div v-else-if="student" class="space-y-6 text-[#1C1917]">
    
    <!-- Student Profile Banner -->
    <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm">
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#E8A838]/15 border border-[#E8A838]/30 flex items-center justify-center shrink-0">
          <span class="text-3xl sm:text-4xl font-black text-[#C98818]">
            {{ student.firstName?.charAt(0) || 'S' }}
          </span>
        </div>

        <div class="text-center md:text-left flex-grow space-y-1">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A4D8F] bg-[#1A4D8F]/10 px-2.5 py-0.5 rounded-full mb-1">
            <GraduationCap class="h-3.5 w-3.5" />
            <span>Ward Academic Records</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
            {{ student.firstName }} {{ student.lastName }}
          </h1>

          <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-[#4B5563] pt-0.5">
            <span class="font-bold bg-[#F7F4EE] px-2 py-0.5 rounded border border-[#E5E0D8] text-[#1A4D8F]">
              ID: {{ student.studentId }}
            </span>
            <span>•</span>
            <span class="font-semibold text-[#1C1917]">Class: {{ student.className || student.classId }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto justify-center">
          <button 
            @click="$router.push({ 
              name: 'student-report', 
              params: { studentId: student.studentId },
              query: { session: '2026/2027', term: '2nd' }
            })"
            class="px-5 py-3 rounded-xl bg-[#1A4D8F] hover:bg-[#12386A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Download class="w-4 h-4" />
            <span>View Report Sheet</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Report Card Center -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Report Card Quick View -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-[#1A4D8F]/10 text-[#1A4D8F] flex items-center justify-center">
                <FileText class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-base font-bold text-[#1C1917]">Official Term Report Sheet</h2>
                <p class="text-[11px] text-[#6B7280]">Verified continuous assessments & examination results</p>
              </div>
            </div>

            <span class="text-xs font-bold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-0.5 rounded-full">
              Published
            </span>
          </div>

          <div class="bg-[#F7F4EE] rounded-2xl p-6 text-center border border-[#E5E0D8] space-y-4">
            <div class="h-14 w-14 rounded-full bg-white border border-[#E5E0D8] mx-auto flex items-center justify-center text-[#2D6A4F] shadow-sm">
              <TrendingUp class="w-7 h-7" />
            </div>

            <div>
              <h3 class="text-base font-bold text-[#1C1917]">
                Academic Report Ready
              </h3>
              <p class="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
                Your ward's terminal performance report, affective ratings, and form teacher's pastoral remarks are available.
              </p>
            </div>

            <button 
              @click="$router.push({ 
                name: 'student-report', 
                params: { studentId: student.studentId },
                query: { session: '2026/2027', term: '2nd' }
              })"
              class="px-6 py-2.5 rounded-xl bg-[#1A4D8F] hover:bg-[#12386A] text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <FileText class="w-4 h-4" />
              <span>Open Full Student Result</span>
            </button>
          </div>
        </div>

        <!-- Continuous Assessment Details (if available) -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-lg bg-[#E8A838]/15 text-[#C98818] flex items-center justify-center">
                <BookOpen class="w-4 h-4" />
              </div>
              <h2 class="text-base font-bold text-[#1C1917]">Current Term Subject Progress</h2>
            </div>
          </div>

          <div v-if="recentScores.length" class="space-y-2">
            <div 
              v-for="score in recentScores" 
              :key="score.subject" 
              class="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E5E0D8]"
            >
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#1A4D8F]">
                  <BookOpen class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-xs font-bold text-[#1C1917]">{{ score.subject }}</p>
                  <p class="text-[10px] text-[#6B7280]">Terminal Grade</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs font-bold text-[#1C1917]">
                <span>Total: {{ score.total }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-[#6B7280] py-6 text-center bg-[#F7F4EE] rounded-xl border border-dashed border-[#E5E0D8]">
            Continuous assessment marks and exam totals are updated in real-time as faculty enters them.
          </div>
        </div>

      </div>

      <!-- Right Column: Notices & Info -->
      <div class="lg:col-span-4 space-y-5">
        
        <!-- School Notices -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
            <Calendar class="w-4 h-4 text-[#1A4D8F]" />
            <h3 class="text-sm font-bold text-[#1C1917]">School Notices & Dates</h3>
          </div>

          <div class="space-y-3">
            <div class="p-3 rounded-xl bg-[#F7F4EE] border-l-4 border-l-[#1A4D8F] border border-[#E5E0D8]">
              <p class="text-xs font-bold text-[#1C1917]">Term Examination Concluded</p>
              <p class="text-[11px] text-[#6B7280] mt-0.5">All results are being verified by school administration.</p>
            </div>
            <div class="p-3 rounded-xl bg-[#F7F4EE] border-l-4 border-l-[#E8A838] border border-[#E5E0D8]">
              <p class="text-xs font-bold text-[#1C1917]">Resumption for Next Term</p>
              <p class="text-[11px] text-[#6B7280] mt-0.5">Please review the school calendar for resumption dates.</p>
            </div>
          </div>
        </div>

        <!-- Academic Support -->
        <div class="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
            <Sparkles class="w-4 h-4 text-[#E8A838]" />
            <h3 class="text-sm font-bold text-[#1C1917]">Parent Inquiry</h3>
          </div>
          <p class="text-xs text-[#4B5563] leading-relaxed">
            For questions regarding result verification, fee settlement, or pastoral remarks, contact the school administrative office.
          </p>
        </div>

      </div>
    </div>

  </div>

  <div v-else class="rounded-xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
    Unable to load student information for this parent account.
  </div>
</template>
