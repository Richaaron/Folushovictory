<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BookOpen, ClipboardList, Clock3, GraduationCap, KeyRound, Loader2, Send, Trophy } from 'lucide-vue-next'
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
  <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
    <Loader2 class="h-12 w-12 animate-spin text-emerald-400" />
  </div>
  <div v-else-if="dashboard" class="space-y-8">
    <div class="rounded-3xl border border-emerald-400/20 bg-slate-900/90 p-6 sm:p-10 shadow-2xl">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
            <GraduationCap class="h-5 w-5" /> Student Learning Portal
          </p>
          <h1 class="text-3xl font-black text-white sm:text-4xl">
            Welcome, {{ dashboard.student.firstName }} {{ dashboard.student.lastName }}
          </h1>
          <p class="mt-3 text-slate-300">
            Admission number: <strong>{{ dashboard.student.studentId }}</strong>
            <span class="mx-2">•</span>
            Class: <strong>{{ dashboard.student.className }}</strong>
          </p>
        </div>
        <div class="flex gap-3">
          <div class="rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-center">
            <p class="text-xs uppercase tracking-widest text-slate-400">Subjects</p>
            <p class="mt-1 text-2xl font-black text-white">{{ dashboard.subjects.length }}</p>
          </div>
          <div class="rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-center">
            <p class="text-xs uppercase tracking-widest text-slate-400">Activities</p>
            <p class="mt-1 text-2xl font-black text-white">{{ activities.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" role="alert" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
      {{ error }}
    </div>

    <section class="space-y-4">
      <div class="flex items-center gap-3">
        <BookOpen class="h-6 w-6 text-emerald-300" />
        <h2 class="text-2xl font-black text-white">My Subjects</h2>
      </div>
      <div v-if="dashboard.subjects.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="subject in dashboard.subjects" :key="subject.id" class="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 class="text-lg font-bold text-white">{{ subject.name }}</h3>
          <p class="mt-2 text-sm text-slate-400">{{ subject.level }}</p>
        </article>
      </div>
      <p v-else class="rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">
        No subjects are configured for your class yet. Please contact your teacher.
      </p>
    </section>

    <section class="space-y-4">
      <div class="flex items-center gap-3">
        <ClipboardList class="h-6 w-6 text-amber-300" />
        <h2 class="text-2xl font-black text-white">Assignments & Tests</h2>
      </div>
      <p v-if="!activities.length" class="rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">
        No assignments or tests have been published for your class yet.
      </p>

      <article v-for="activity in activities" :key="activity.id" class="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">{{ activity.type }}</span>
              <span class="text-sm text-slate-400">{{ activity.subjectName }}</span>
            </div>
            <h3 class="text-xl font-black text-white">{{ activity.title }}</h3>
            <p v-if="activity.description" class="mt-2 whitespace-pre-wrap text-slate-300">{{ activity.description }}</p>
            <p class="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Clock3 class="h-4 w-4" /> {{ formatDueAt(activity.dueAt) }} <span>•</span> {{ activity.maxScore }} marks
            </p>
          </div>
          <div v-if="activity.submission" class="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <p class="font-bold">{{ activity.submission.status === 'GRADED' ? 'Marked' : 'Submitted' }}</p>
            <p v-if="activity.submission.score !== null" class="mt-1 flex items-center gap-1 text-emerald-300">
              <Trophy class="h-4 w-4" /> {{ activity.submission.score }} / {{ activity.maxScore }}
            </p>
            <p v-if="activity.submission.feedback" class="mt-1">{{ activity.submission.feedback }}</p>
          </div>
        </div>

        <template v-if="!activity.submission && !isPastDue(activity)">
          <form v-if="activity.type === 'ASSIGNMENT'" class="space-y-3" @submit.prevent="submitAssignment(activity)">
            <label :for="`assignment-${activity.id}`" class="block text-sm font-semibold text-slate-200">Your answer</label>
            <textarea :id="`assignment-${activity.id}`" v-model="assignmentResponses[activity.id]" maxlength="10000" rows="5" required class="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none" placeholder="Write your answer here" />
            <button :disabled="submitting === activity.id" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
              <Loader2 v-if="submitting === activity.id" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" /> Submit Assignment
            </button>
          </form>

          <form v-else class="space-y-5" @submit.prevent="submitTest(activity)">
            <fieldset v-for="(question, index) in activity.questions" :key="question.id" class="rounded-xl border border-slate-700 p-4">
              <legend class="px-2 font-semibold text-white">{{ Number(index) + 1 }}. {{ question.prompt }}</legend>
              <label v-for="option in question.options" :key="option" class="mt-3 flex cursor-pointer items-center gap-3 text-slate-200">
                <input v-model="testAnswers[activity.id][question.id]" type="radio" :name="`${activity.id}-${question.id}`" :value="option" required />
                <span>{{ option }}</span>
              </label>
            </fieldset>
            <button :disabled="submitting === activity.id" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
              <Loader2 v-if="submitting === activity.id" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" /> Submit Test
            </button>
          </form>
        </template>
        <p v-else-if="!activity.submission" class="font-semibold text-amber-300">The deadline has passed.</p>
      </article>
    </section>

    <section class="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
      <h2 class="mb-4 flex items-center gap-2 text-xl font-black text-white"><KeyRound class="h-5 w-5 text-amber-300" /> Change Student PIN</h2>
      <p class="mb-4 text-sm text-slate-400">Your PIN is 8 digits. Keep it private and ask the school administrator if you forget it.</p>
      <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="changePin">
        <input v-model="currentPin" type="password" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" required autocomplete="current-password" class="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Current 8-digit PIN" />
        <input v-model="newPin" type="password" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" required autocomplete="new-password" class="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="New 8-digit PIN" />
        <button :disabled="changingPin" class="rounded-xl bg-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-600 disabled:opacity-50">
          {{ changingPin ? 'Updating…' : 'Change PIN' }}
        </button>
      </form>
      <p v-if="pinMessage" class="mt-3 text-sm text-emerald-300">{{ pinMessage }}</p>
      <p v-if="pinError" role="alert" class="mt-3 text-sm text-rose-300">{{ pinError }}</p>
    </section>
  </div>
  <div v-else role="alert" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200">{{ error }}</div>
</template>
