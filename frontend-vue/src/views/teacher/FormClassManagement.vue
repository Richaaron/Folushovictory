<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Users,
  MessageSquare,
  FileText,
  Send
} from 'lucide-vue-next'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const classId = route.params.classId as string
const className = route.query.className as string

const students = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)

const session = ref('2023/2024')
const term = ref('First')

const fetchStudents = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/api/teacher/classes/${classId}/students`)
    students.value = data.students.map((s: any) => ({
      ...s,
      remark: ''
    }))
  } catch (err) {
    error.value = 'Failed to load class students'
  } finally {
    loading.value = false
  }
}

const handleSaveRemark = async (studentId: string, remark: string) => {
  try {
    await api.post('/api/teacher/remarks', {
      session: session.value,
      term: term.value,
      studentId,
      teacherRemark: remark
    })
    return true
  } catch (err) {
    console.error('Error saving remark:', err)
    return false
  }
}

const saveAllRemarks = async () => {
  saving.value = true
  error.value = ''
  success.value = false
  try {
    const promises = students.value.map(s => handleSaveRemark(s.studentId, s.remark))
    const results = await Promise.all(promises)
    if (results.every(r => r)) {
      success.value = true
      setTimeout(() => { success.value = false }, 3000)
    } else {
      error.value = 'Some remarks failed to save'
    }
  } catch (err) {
    error.value = 'Failed to save remarks'
  } finally {
    saving.value = false
  }
}

const releaseResult = async (studentId: string, released: boolean) => {
  try {
    await api.post('/api/teacher/results/release', {
      session: session.value,
      term: term.value,
      studentId,
      released
    })
    const student = students.value.find(s => s.studentId === studentId)
    if (student) student.released = released
  } catch (err) {
    console.error('Error releasing result:', err)
  }
}

onMounted(fetchStudents)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-royal-purple transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Class Management</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{{ className }} • Form Teacher Oversight</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <select v-model="term" class="px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase tracking-widest outline-none shadow-sm">
          <option>First</option>
          <option>Second</option>
          <option>Third</option>
        </select>
        <button 
          @click="saveAllRemarks"
          :disabled="saving"
          class="flex items-center gap-3 rounded-2xl purple-gradient px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" /> 
          {{ saving ? 'Saving...' : 'Save All Remarks' }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
          <Users class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Students</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.length }}</p>
        </div>
      </div>
      <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
          <MessageSquare class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks Pending</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.filter(s => !s.remark).length }}</p>
        </div>
      </div>
      <div class="academic-card rounded-3xl p-8 flex items-center gap-6">
        <div class="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
          <FileText class="w-7 h-7" />
        </div>
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results Released</p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">{{ students.filter(s => s.released).length }}</p>
        </div>
      </div>
    </div>

    <!-- Student List -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-20 flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Info</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Form Teacher's Remark</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="st in students" :key="st.studentId" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                    {{ st.lastName[0] }}{{ st.firstName[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">{{ st.lastName }} {{ st.firstName }}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ st.studentId }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6 min-w-[300px]">
                <textarea 
                  v-model="st.remark"
                  rows="2"
                  class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none resize-none" 
                  placeholder="Enter pastoral remark..."
                ></textarea>
              </td>
              <td class="px-8 py-6 text-center">
                <span 
                  v-if="st.released" 
                  class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest"
                >
                  Released
                </span>
                <span 
                  v-else 
                  class="px-3 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest"
                >
                  Draft
                </span>
              </td>
              <td class="px-8 py-6 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="router.push({ name: 'student-report', params: { studentId: st.studentId } })"
                    class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-royal-purple transition-colors"
                    title="Preview Report Card"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="!st.released"
                    @click="releaseResult(st.studentId, true)"
                    class="p-2 rounded-xl bg-royal-purple/10 text-royal-purple hover:bg-royal-purple hover:text-white transition-all"
                    title="Release Result"
                  >
                    <Send class="w-4 h-4" />
                  </button>
                  <button 
                    v-else
                    @click="releaseResult(st.studentId, false)"
                    class="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Un-release Result"
                  >
                    <AlertCircle class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
