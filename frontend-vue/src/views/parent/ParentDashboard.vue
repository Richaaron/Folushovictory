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
  Info 
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
    <Loader2 class="w-10 h-10 text-blue-800 animate-spin" />
  </div>

  <div v-else-if="student" class="space-y-6 text-slate-800">
    
    <!-- Student Profile Banner -->
    <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
          <span class="text-3xl sm:text-4xl font-black text-amber-800">
            {{ student.firstName?.charAt(0) || 'S' }}
          </span>
        </div>

        <div class="text-center md:text-left flex-grow space-y-2">
          <div class="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
            <GraduationCap class="h-4 w-4 text-blue-800" />
            <span>Ward Academic Records</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {{ student.firstName }} {{ student.lastName }}
          </h1>

          <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-slate-700">
            <span class="font-bold bg-slate-100 text-blue-900 px-2.5 py-1 rounded-lg border border-slate-300">
              ID: {{ student.studentId }}
            </span>
            <span class="text-slate-400">•</span>
            <span class="font-bold text-slate-800">Class: {{ student.className || student.classId }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto justify-center">
          <button 
            @click="$router.push({ 
              name: 'student-report', 
              params: { studentId: student.studentId },
              query: { session: '2026/2027', term: '2nd' }
            })"
            class="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Download class="w-4 h-4 text-white" />
            <span>View Full Report Card</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Report Card Center -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Report Card Quick View -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <FileText class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900">Official Term Report Sheet</h2>
                <p class="text-xs font-semibold text-slate-600">Verified continuous assessments & examination results</p>
              </div>
            </div>

            <span class="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Published
            </span>
          </div>

          <div class="bg-slate-50 rounded-2xl p-6 sm:p-8 text-center border border-slate-200 space-y-4">
            <div class="h-16 w-16 rounded-full bg-white border border-emerald-200 mx-auto flex items-center justify-center text-emerald-700 shadow-sm">
              <TrendingUp class="w-8 h-8" />
            </div>

            <div>
              <h3 class="text-lg font-black text-slate-900">
                Academic Report Ready
              </h3>
              <p class="text-xs sm:text-sm font-medium text-slate-700 max-w-md mx-auto mt-1 leading-relaxed">
                Your ward's terminal performance report, continuous assessment scores, affective ratings, and form teacher's pastoral remarks are available.
              </p>
            </div>

            <button 
              @click="$router.push({ 
                name: 'student-report', 
                params: { studentId: student.studentId },
                query: { session: '2026/2027', term: '2nd' }
              })"
              class="px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <FileText class="w-4 h-4 text-white" />
              <span>Open Student Report Sheet</span>
            </button>
          </div>
        </div>

        <!-- Continuous Assessment Details (if available) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <BookOpen class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900">Current Term Subject Progress</h2>
                <p class="text-xs font-semibold text-slate-600">Course evaluation & examination scoring</p>
              </div>
            </div>
          </div>

          <div v-if="recentScores.length" class="space-y-2">
            <div 
              v-for="score in recentScores" 
              :key="score.subject" 
              class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-800">
                  <BookOpen class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900">{{ score.subject }}</p>
                  <p class="text-xs font-semibold text-slate-600">Terminal Assessment</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-sm font-black text-slate-900">
                <span class="px-2.5 py-1 bg-white rounded-lg border border-slate-200">Total: {{ score.total }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs sm:text-sm font-medium text-slate-600 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            Continuous assessment marks and exam totals are updated in real-time as faculty enters them.
          </div>
        </div>

      </div>

      <!-- Right Column: Notices & Info -->
      <div class="lg:col-span-4 space-y-5">
        
        <!-- School Notices -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div class="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Calendar class="w-4 h-4" />
            </div>
            <h3 class="text-base font-black text-slate-900">School Notices & Dates</h3>
          </div>

          <div class="space-y-3">
            <div class="p-3.5 rounded-xl bg-blue-50 border-l-4 border-l-blue-800 border border-blue-200">
              <p class="text-xs font-black text-blue-950 uppercase tracking-wide">Term Examination Concluded</p>
              <p class="text-xs font-medium text-slate-700 mt-1 leading-relaxed">All terminal results are being verified by school administration for official publication.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-amber-50 border-l-4 border-l-amber-600 border border-amber-200">
              <p class="text-xs font-black text-amber-950 uppercase tracking-wide">Resumption for Next Term</p>
              <p class="text-xs font-medium text-slate-700 mt-1 leading-relaxed">Please review the official school calendar and handbook for upcoming resumption guidelines.</p>
            </div>
          </div>
        </div>

        <!-- Academic Support -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div class="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Info class="w-4 h-4" />
            </div>
            <h3 class="text-base font-black text-slate-900">Parent Inquiries</h3>
          </div>
          <p class="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            For questions regarding result verification, fee settlement, or pastoral remarks, please contact the school administrative office or your ward's form teacher.
          </p>
        </div>

      </div>
    </div>

  </div>

  <div v-else class="rounded-xl border border-red-300 bg-red-50 p-6 text-sm font-bold text-red-800">
    Unable to load student information for this parent account.
  </div>
</template>
