<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BookOpen, ClipboardList, Clock3, GraduationCap, KeyRound, Loader2, Send, Trophy, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import api from '../../services/api'

const dashboard = ref<any>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref('')
const assignmentResponses = ref<Record<string, string>>({})
const testAnswers = ref<Record<string, Record<string, string>>>({})
const currentPin = ref('')
const newPin = ref('')
const pinMessage = ref('')
const pinError = ref('')
const changingPin = ref(false)

const activities = computed(() => dashboard.value?.activities || [])

const fetchDashboard = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/api/student/dashboard')
    dashboard.value = data
    for (const activity of data.activities || []) {
      if (activity.type === 'TEST' && !testAnswers.value[activity.id]) {
        testAnswers.value[activity.id] = {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to load your learning portal.'
  } finally {
    loading.value = false
  }
}

const submitAssignment = async (activity: any) => {
  submitting.value = activity.id
  error.value = ''
  try {
    await api.post(`/api/student/activities/${encodeURIComponent(activity.id)}/submit`, {
      text: assignmentResponses.value[activity.id]
    })
    await fetchDashboard()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to submit this assignment.'
  } finally {
    submitting.value = ''
  }
}

const submitTest = async (activity: any) => {
  submitting.value = activity.id
  error.value = ''
  try {
    await api.post(`/api/student/tests/${encodeURIComponent(activity.id)}/submit`, {
      answers: testAnswers.value[activity.id] || {}
    })
    await fetchDashboard()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to submit this test.'
  } finally {
    submitting.value = ''
  }
}

const changePin = async () => {
  changingPin.value = true
  pinError.value = ''
  pinMessage.value = ''
  try {
    const { data } = await api.post('/api/student/change-pin', {
      currentPin: currentPin.value,
      newPin: newPin.value
    })
    pinMessage.value = data.message
    currentPin.value = ''
    newPin.value = ''
  } catch (err: any) {
    pinError.value = err.response?.data?.error || 'Unable to change your PIN.'
  } finally {
    changingPin.value = false
  }
}

const isPastDue = (activity: any) => activity.dueAt && new Date(activity.dueAt).getTime() < Date.now()
const formatDueAt = (dueAt: string | null) => dueAt ? new Date(dueAt).toLocaleString() : 'No deadline'

onMounted(fetchDashboard)
</script>

<template>
  <div v-if="loading" class="flex min-h-[350px] items-center justify-center">
    <Loader2 class="h-10 w-10 animate-spin text-sky-800" />
  </div>

  <div v-else-if="dashboard" class="space-y-6 text-slate-800 pb-12">
    
    <!-- Welcome Header Card -->
    <div class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-sm shadow-sky-900/5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-1.5 text-xs font-black text-sky-950 bg-sky-100 border border-sky-300 px-3 py-1 rounded-full">
            <GraduationCap class="h-4 w-4 text-sky-800" />
            <span>Folusho Victory Student Portal</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-[#0C4A6E] tracking-tight">
            Hello, {{ dashboard.student.firstName }} {{ dashboard.student.lastName }}
          </h1>

          <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
            <span class="font-extrabold bg-sky-50 text-[#0C4A6E] px-2.5 py-1 rounded-lg border border-sky-200">
              ID: {{ dashboard.student.studentId }}
            </span>
            <span class="text-slate-400">•</span>
            <span class="font-extrabold text-slate-800">Class: {{ dashboard.student.className }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1 sm:flex-initial bg-sky-50 border border-sky-200 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-600">Subjects</p>
            <p class="text-2xl font-black text-[#0C4A6E] mt-0.5">{{ dashboard.subjects.length }}</p>
          </div>
          <div class="flex-1 sm:flex-initial bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <p class="text-[11px] font-black uppercase tracking-wider text-amber-800">Tasks</p>
            <p class="text-2xl font-black text-amber-900 mt-0.5">{{ activities.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-900 flex items-center gap-3">
      <AlertCircle class="h-5 w-5 shrink-0 text-red-700" />
      <span>{{ error }}</span>
    </div>

    <!-- My Subjects Section -->
    <section class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-4 border-b border-sky-100">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-800 flex items-center justify-center">
            <BookOpen class="h-5 w-5 text-sky-800" />
          </div>
          <div>
            <h2 class="text-lg font-black text-[#0C4A6E]">Registered Subjects</h2>
            <p class="text-xs font-semibold text-slate-600">All registered curriculum subjects for your class</p>
          </div>
        </div>
        <span class="text-xs font-black text-[#0C4A6E] bg-sky-100 border border-sky-300 px-3 py-1 rounded-full">
          {{ dashboard.subjects.length }} Active
        </span>
      </div>

      <div v-if="dashboard.subjects.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article 
          v-for="subject in dashboard.subjects" 
          :key="subject.id" 
          class="rounded-xl border border-sky-200 bg-sky-50/50 p-4 flex items-center justify-between hover:bg-white hover:border-sky-400 hover:shadow-sm transition-all"
        >
          <div>
            <h3 class="text-sm font-black text-slate-900">{{ subject.name }}</h3>
            <p class="text-xs font-semibold text-slate-600 mt-0.5">{{ subject.level }} Curriculum</p>
          </div>
          <CheckCircle2 class="h-5 w-5 text-emerald-600 shrink-0" />
        </article>
      </div>
      <p v-else class="text-sm font-semibold text-slate-600 py-6 text-center">
        No subjects have been configured for your class level yet.
      </p>
    </section>

    <!-- Assignments & Tests Section -->
    <section class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-4 border-b border-sky-100">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center">
            <ClipboardList class="h-5 w-5 text-amber-800" />
          </div>
          <div>
            <h2 class="text-lg font-black text-[#0C4A6E]">Class Assignments & Tests</h2>
            <p class="text-xs font-semibold text-slate-600">Pending tasks, quizzes, and homework submissions</p>
          </div>
        </div>
        <span class="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
          {{ activities.length }} Available
        </span>
      </div>

      <p v-if="!activities.length" class="text-sm font-semibold text-slate-600 py-10 text-center bg-sky-50/40 rounded-xl border border-dashed border-sky-200">
        No assignments or online tests are currently pending for your class.
      </p>

      <div v-else class="space-y-4">
        <article 
          v-for="activity in activities" 
          :key="activity.id" 
          class="rounded-xl border border-sky-200 bg-sky-50/30 p-5 space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-sky-150 bg-sky-100 text-[#0C4A6E] border border-sky-300">
                  {{ activity.type }}
                </span>
                <span class="text-xs font-black text-slate-800">{{ activity.subjectName }}</span>
              </div>
              <h3 class="text-base font-black text-slate-900">{{ activity.title }}</h3>
              <p v-if="activity.description" class="text-xs sm:text-sm font-medium text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{{ activity.description }}</p>
              <p class="text-xs font-semibold text-slate-600 flex items-center gap-2 mt-2">
                <Clock3 class="h-4 w-4 text-slate-500" />
                <span>{{ formatDueAt(activity.dueAt) }}</span>
                <span>•</span>
                <span class="font-extrabold text-slate-900">{{ activity.maxScore }} marks</span>
              </p>
            </div>

            <div v-if="activity.submission" class="bg-white border border-sky-200 rounded-xl p-3 text-xs shrink-0 min-w-[150px]">
              <span class="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                {{ activity.submission.status === 'GRADED' ? 'Marked' : 'Submitted' }}
              </span>
              <p v-if="activity.submission.score !== null" class="text-base font-black text-[#0C4A6E] flex items-center gap-1.5 mt-1">
                <Trophy class="h-4 w-4 text-amber-600" />
                {{ activity.submission.score }} / {{ activity.maxScore }}
              </p>
              <p v-if="activity.submission.feedback" class="text-xs font-medium text-slate-700 mt-1.5 border-t border-slate-100 pt-1.5">{{ activity.submission.feedback }}</p>
            </div>
          </div>

          <!-- Active form if pending submission -->
          <template v-if="!activity.submission && !isPastDue(activity)">
            <form v-if="activity.type === 'ASSIGNMENT'" class="space-y-3 pt-2" @submit.prevent="submitAssignment(activity)">
              <textarea 
                v-model="assignmentResponses[activity.id]" 
                maxlength="10000" 
                rows="4" 
                required 
                class="w-full bg-white border border-slate-300 rounded-xl p-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600" 
                placeholder="Type your response here..."
              />
              <button 
                :disabled="submitting === activity.id" 
                class="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <Loader2 v-if="submitting === activity.id" class="h-4 w-4 animate-spin text-white" />
                <Send v-else class="h-4 w-4 text-white" />
                <span>Submit Response</span>
              </button>
            </form>

            <form v-else class="space-y-4 pt-2" @submit.prevent="submitTest(activity)">
              <fieldset v-for="(question, index) in activity.questions" :key="question.id" class="bg-white rounded-xl border border-sky-200 p-4">
                <legend class="text-xs sm:text-sm font-bold text-slate-900 px-1">{{ Number(index) + 1 }}. {{ question.prompt }}</legend>
                <div class="mt-2.5 space-y-2 text-xs sm:text-sm">
                  <label v-for="option in question.options" :key="option" class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-sky-50 cursor-pointer font-medium text-slate-800">
                    <input v-model="testAnswers[activity.id][question.id]" type="radio" :name="`${activity.id}-${question.id}`" :value="option" required class="text-sky-700 h-4 w-4" />
                    <span>{{ option }}</span>
                  </label>
                </div>
              </fieldset>
              <button 
                :disabled="submitting === activity.id" 
                class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <Loader2 v-if="submitting === activity.id" class="h-4 w-4 animate-spin text-white" />
                <Send v-else class="h-4 w-4 text-white" />
                <span>Submit Answers</span>
              </button>
            </form>
          </template>
        </article>
      </div>
    </section>

    <!-- Change PIN Section -->
    <section class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-5 sm:p-7 shadow-sm space-y-4">
      <div class="flex items-center gap-3 pb-3 border-b border-sky-100">
        <div class="h-9 w-9 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center">
          <KeyRound class="h-5 w-5 text-amber-800" />
        </div>
        <div>
          <h2 class="text-base font-black text-[#0C4A6E]">Manage Your 8-Digit Student PIN</h2>
          <p class="text-xs font-semibold text-slate-600">Keep your PIN confidential. If misplaced, ask your form teacher or school administrator.</p>
        </div>
      </div>

      <form class="grid gap-3 sm:grid-cols-3 max-w-xl" @submit.prevent="changePin">
        <input 
          v-model="currentPin" 
          type="password" 
          inputmode="numeric" 
          pattern="[0-9]{8}" 
          maxlength="8" 
          required 
          class="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-sky-600" 
          placeholder="Current 8-digit PIN" 
        />
        <input 
          v-model="newPin" 
          type="password" 
          inputmode="numeric" 
          pattern="[0-9]{8}" 
          maxlength="8" 
          required 
          class="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-sky-600" 
          placeholder="New 8-digit PIN" 
        />
        <button 
          :disabled="changingPin" 
          class="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold transition-colors disabled:opacity-50 shadow-sm"
        >
          {{ changingPin ? 'Updating...' : 'Update PIN' }}
        </button>
      </form>

      <p v-if="pinMessage" class="text-xs font-extrabold text-emerald-800">{{ pinMessage }}</p>
      <p v-if="pinError" class="text-xs font-extrabold text-red-700">{{ pinError }}</p>
    </section>

  </div>
</template>
