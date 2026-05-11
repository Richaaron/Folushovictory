<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Printer, 
  Download, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const studentId = route.params.studentId as string
const session = route.query.session as string
const term = route.query.term as string

const data = ref<any>(null)
const loading = ref(true)
const error = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const resp = await api.get(`/api/results/student/${studentId}/report`, {
      params: { session, term }
    })
    data.value = resp.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load report card.'
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

onMounted(fetchData)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-8 fade-in">
    <!-- Action Bar -->
    <div class="flex items-center justify-between no-print">
      <button @click="$router.back()" class="flex items-center gap-2 text-slate-400 hover:text-royal-purple transition-colors font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft class="w-4 h-4" /> Back to Dashboard
      </button>
      <div class="flex gap-4">
        <button @click="handlePrint" class="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
          <Printer class="w-4 h-4" /> Print Report
        </button>
      </div>
    </div>

    <div v-if="loading" class="h-96 flex items-center justify-center">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>

    <div v-else-if="error" class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-slate-100 dark:border-slate-800 shadow-xl">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-6 opacity-20" />
      <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-4">Access Restricted</h2>
      <p class="text-slate-500 mb-8 max-w-sm mx-auto">{{ error }}</p>
    </div>

    <div v-else-if="data && !data.released" class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-slate-100 dark:border-slate-800 shadow-xl">
      <Lock class="w-16 h-16 text-royal-purple mx-auto mb-6 opacity-20" />
      <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-4">Result Not Released</h2>
      <p class="text-slate-500 mb-8 max-w-sm mx-auto">This academic report has been compiled but is currently locked by the school administration.</p>
    </div>

    <!-- Report Card Content -->
    <div v-else-if="data" class="report-card-container bg-white dark:bg-slate-900 p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-[3rem] relative overflow-hidden">
      <!-- Watermark Logo -->
      <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <img :src="data.school?.logoUrl || '/logo.png'" class="w-[60%] grayscale" />
      </div>

      <div class="relative z-10 space-y-12">
        <!-- School Header -->
        <div class="flex flex-col md:flex-row items-center gap-8 text-center md:text-left border-b-4 border-royal-purple pb-12">
          <img :src="data.school?.logoUrl || '/logo.png'" class="h-32 w-32 object-contain" />
          <div class="flex-grow">
            <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{{ data.school?.name || 'Folusho Victory Schools' }}</h1>
            <p class="text-royal-purple font-black uppercase tracking-[0.3em] text-sm mt-1">{{ data.school?.motto || 'Excellence and Integrity' }}</p>
            <p class="text-slate-500 font-bold text-xs mt-3 uppercase tracking-widest">{{ data.school?.address || 'Nigeria' }}</p>
          </div>
          <div class="text-center bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 min-w-[200px]">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Session</p>
            <p class="text-lg font-black text-slate-900 dark:text-white">{{ data.session }}</p>
            <p class="text-[10px] font-black text-royal-purple uppercase tracking-widest mt-2">{{ data.term }} Term Report</p>
          </div>
        </div>

        <!-- Student Profile -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
            <p class="text-sm font-black text-slate-900 dark:text-white uppercase">{{ data.student.lastName }} {{ data.student.firstName }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student ID</p>
            <p class="text-sm font-black text-royal-purple tracking-widest">{{ data.student.studentId }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Class / Level</p>
            <p class="text-sm font-black text-slate-900 dark:text-white uppercase">{{ data.class.name }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
            <p class="text-sm font-black text-slate-900 dark:text-white uppercase">{{ data.student.gender }}</p>
          </div>
        </div>

        <!-- Scores Table -->
        <div class="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-royal-purple text-white">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Subject</th>
                <th class="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">1st CA</th>
                <th class="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">2nd CA</th>
                <th class="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">Exam</th>
                <th class="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">Total</th>
                <th class="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center">Grade</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Remarks</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="sub in data.result?.perSubject" :key="sub.subjectId" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 text-sm font-black text-slate-900 dark:text-white uppercase">{{ sub.subjectName }}</td>
                <td class="px-4 py-4 text-center text-sm font-bold text-slate-500">{{ sub.ca1 }}</td>
                <td class="px-4 py-4 text-center text-sm font-bold text-slate-500">{{ sub.ca2 }}</td>
                <td class="px-4 py-4 text-center text-sm font-bold text-slate-500">{{ sub.exam }}</td>
                <td class="px-4 py-4 text-center text-sm font-black text-slate-900 dark:text-white">{{ sub.total }}</td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-black" :class="sub.grade === 'F' ? 'text-red-500' : 'text-emerald-500'">{{ sub.grade }}</span>
                </td>
                <td class="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase italic">{{ sub.remark }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 dark:bg-slate-800/50">
                <td class="px-6 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Termly Summary</td>
                <td colspan="3"></td>
                <td class="px-4 py-6 text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase mb-1">Final Total</p>
                  <p class="text-sm font-black text-slate-900 dark:text-white">{{ data.result?.total }}</p>
                </td>
                <td class="px-4 py-6 text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase mb-1">Average</p>
                  <p class="text-sm font-black text-royal-purple">{{ data.result?.average }}%</p>
                </td>
                <td class="px-6 py-6 text-center">
                  <p class="text-[8px] font-black text-slate-400 uppercase mb-1">Class Position</p>
                  <p class="text-sm font-black text-royal-gold">{{ data.result?.position }}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Remarks & Signatures -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Teacher Section -->
          <div class="space-y-6">
            <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <p class="text-[10px] font-black text-royal-purple uppercase tracking-widest mb-4">Class Teacher's Remark</p>
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200 italic">"{{ data.teacherRemark || 'No remark entered.' }}"</p>
            </div>
            <div class="flex flex-col items-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <div class="h-16 flex items-center justify-center">
                <!-- Signature Placeholder -->
              </div>
              <p class="text-sm font-black text-slate-900 dark:text-white uppercase">{{ data.formTeacher?.displayName || 'Class Teacher' }}</p>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Class Teacher Signature</p>
            </div>
          </div>

          <!-- Principal Section -->
          <div class="space-y-6">
            <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <p class="text-[10px] font-black text-royal-gold uppercase tracking-widest mb-4">Principal's Remark</p>
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200 italic">"{{ data.principalRemark || 'Highly commendable performance.' }}"</p>
            </div>
            <div class="flex flex-col items-center border-t border-slate-100 dark:border-slate-800 pt-6">
              <div class="h-16 flex items-center justify-center">
                <!-- Principal Signature Column -->
                <div class="w-32 h-1 bg-slate-200 dark:bg-slate-700 mb-2 mt-auto"></div>
              </div>
              <p class="text-sm font-black text-slate-900 dark:text-white uppercase">{{ data.school?.principalName || 'Principal' }}</p>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Principal Signature & Stamp</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Resumption Date</p>
            <p class="text-sm font-black text-slate-900 dark:text-white">{{ data.resumptionDate || 'TBD' }}</p>
          </div>
          <div class="flex gap-4">
             <div class="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Certified Record</div>
             <div class="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{{ new Date().toLocaleDateString() }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print { display: none !important; }
  .report-card-container { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; }
  body { background: white !important; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
}
</style>
