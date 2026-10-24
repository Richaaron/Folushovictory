<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClipboardList, Loader2, Plus, Send } from 'lucide-vue-next'
import api from '../../services/api'

const assignments = ref<any[]>([])
const activities = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const type = ref<'ASSIGNMENT' | 'TEST'>('ASSIGNMENT')
const title = ref('')
const description = ref('')
const dueAt = ref('')
const maxScore = ref(100)
const selectedKey = ref('')
const questions = ref<any[]>([])
const gradeScores = ref<Record<string, string>>({})
const gradeFeedback = ref<Record<string, string>>({})

const selectableAssignments = computed(() => {
  const unique = new Map<string, any>()
  for (const assignment of assignments.value) {
    const key = `${assignment.classId}::${assignment.subjectId}`
    if (!unique.has(key)) unique.set(key, assignment)
  }
  return [...unique.entries()].map(([key, assignment]) => ({ key, ...assignment }))
})

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [assignmentResponse, activityResponse] = await Promise.all([
      api.get('/api/teacher/assignments'),
      api.get('/api/teacher/activities')
    ])
    assignments.value = assignmentResponse.data.assignments || []
    activities.value = activityResponse.data.activities || []
    if (!selectedKey.value && selectableAssignments.value.length) selectedKey.value = selectableAssignments.value[0].key
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to load learning activities.'
  } finally {
    loading.value = false
  }
}

const addQuestion = () => {
  questions.value.push({ prompt: '', options: ['', '', '', ''], correctAnswer: '' })
}

const questionOptions = (question: any) => question.options.filter((option: string) => option.trim())

const createActivity = async () => {
  error.value = ''
  message.value = ''
  const selected = selectableAssignments.value.find((assignment) => assignment.key === selectedKey.value)
  if (!selected) {
    error.value = 'Choose a subject and class first.'
    return
  }
  saving.value = true
  try {
    await api.post('/api/teacher/activities', {
      type: type.value,
      title: title.value,
      description: description.value,
      dueAt: dueAt.value ? new Date(dueAt.value).toISOString() : null,
      maxScore: Number(maxScore.value),
      classId: selected.classId,
      subjectId: selected.subjectId,
      questions: type.value === 'TEST'
        ? questions.value.map((question) => ({
            prompt: question.prompt,
            options: question.options,
            correctAnswer: question.correctAnswer
          }))
        : []
    })
    title.value = ''
    description.value = ''
    dueAt.value = ''
    questions.value = []
    message.value = `${type.value === 'TEST' ? 'Test' : 'Assignment'} published for ${selected.className} • ${selected.subjectName}.`
    await loadData()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to publish this activity.'
  } finally {
    saving.value = false
  }
}

const gradeSubmission = async (activity: any, submission: any) => {
  error.value = ''
  try {
    const key = `${activity.id}:${submission.studentId}`
    await api.post(`/api/teacher/activities/${encodeURIComponent(activity.id)}/submissions/${encodeURIComponent(submission.studentId)}/grade`, {
      score: Number(gradeScores.value[key]),
      feedback: gradeFeedback.value[key] || ''
    })
    message.value = `Marked ${submission.studentName}'s assignment.`
    await loadData()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to save this mark.'
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-8">
    <header class="rounded-3xl border border-royal-gold/15 bg-slate-950/90 p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <ClipboardList class="h-7 w-7 text-royal-gold" />
        <div>
          <h1 class="text-2xl font-black text-white">Assignments & Tests</h1>
          <p class="mt-1 text-sm text-slate-400">Publish activities to a class you teach and review student work.</p>
        </div>
      </div>
    </header>

    <div v-if="error" role="alert" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">{{ error }}</div>
    <div v-if="message" role="status" class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{{ message }}</div>

    <form class="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7" @submit.prevent="createActivity">
      <h2 class="text-xl font-black text-white">Publish a new activity</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2 text-sm font-semibold text-slate-200">
          Activity type
          <select v-model="type" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
            <option value="ASSIGNMENT">Written assignment</option>
            <option value="TEST">Multiple-choice test</option>
          </select>
        </label>
        <label class="space-y-2 text-sm font-semibold text-slate-200">
          Class • Subject
          <select v-model="selectedKey" required class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
            <option v-for="assignment in selectableAssignments" :key="assignment.key" :value="assignment.key">
              {{ assignment.className }} • {{ assignment.subjectName }}
            </option>
          </select>
        </label>
      </div>
      <label class="block space-y-2 text-sm font-semibold text-slate-200">
        Title
        <input v-model="title" maxlength="150" required class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="e.g. Fractions practice" />
      </label>
      <label class="block space-y-2 text-sm font-semibold text-slate-200">
        Instructions
        <textarea v-model="description" maxlength="10000" rows="3" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Tell students what to do" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2 text-sm font-semibold text-slate-200">
          Deadline (optional)
          <input v-model="dueAt" type="datetime-local" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
        </label>
        <label class="space-y-2 text-sm font-semibold text-slate-200">
          Maximum score
          <input v-model.number="maxScore" type="number" min="1" max="1000" required class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
        </label>
      </div>

      <div v-if="type === 'TEST'" class="space-y-4 border-t border-slate-700 pt-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-bold text-white">Multiple-choice questions</h3>
          <button type="button" @click="addQuestion" class="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
            <Plus class="h-4 w-4" /> Add question
          </button>
        </div>
        <div v-for="(question, index) in questions" :key="index" class="space-y-3 rounded-xl border border-slate-700 p-4">
          <label class="block space-y-2 text-sm text-slate-200">
            Question {{ Number(index) + 1 }}
            <input v-model="question.prompt" required maxlength="1000" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="Enter the question" />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label v-for="(option, optionIndex) in question.options" :key="optionIndex" class="space-y-1 text-xs text-slate-400">
              Option {{ Number(optionIndex) + 1 }}
              <input v-model="question.options[optionIndex]" :placeholder="option || `Option ${Number(optionIndex) + 1}`" required class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            </label>
          </div>
          <label class="block space-y-2 text-sm text-slate-200">
            Correct option
            <select v-model="question.correctAnswer" required class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
              <option disabled value="">Choose the correct answer</option>
              <option v-for="option in questionOptions(question)" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
        </div>
        <p v-if="!questions.length" class="text-sm text-slate-400">Add at least one question before publishing the test.</p>
      </div>

      <button :disabled="saving || (type === 'TEST' && !questions.length)" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        <Send v-else class="h-4 w-4" /> Publish for students
      </button>
    </form>

    <section class="space-y-4">
      <h2 class="text-xl font-black text-white">Published activities</h2>
      <div v-if="loading" class="flex justify-center py-8"><Loader2 class="h-8 w-8 animate-spin text-royal-gold" /></div>
      <p v-else-if="!activities.length" class="rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-slate-300">You have not published any activities yet.</p>
      <article v-for="activity in activities" :key="activity.id" class="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-emerald-300">{{ activity.type }} • {{ activity.className }} • {{ activity.subjectName }}</p>
          <h3 class="mt-1 text-lg font-black text-white">{{ activity.title }}</h3>
          <p class="text-sm text-slate-400">{{ activity.submissions.length }} submission(s)</p>
        </div>
        <div v-if="activity.type === 'ASSIGNMENT' && activity.submissions.length" class="space-y-3">
          <div v-for="submission in activity.submissions" :key="submission.studentId" class="space-y-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-bold text-white">{{ submission.studentName }} <span class="text-xs text-slate-400">({{ submission.studentId }})</span></p>
              <p class="text-xs text-emerald-300">{{ submission.status }}<span v-if="submission.score !== null"> • {{ submission.score }}/{{ activity.maxScore }}</span></p>
            </div>
            <p class="whitespace-pre-wrap text-sm text-slate-300">{{ submission.response?.text }}</p>
            <form v-if="submission.status !== 'GRADED'" class="grid gap-3 sm:grid-cols-[120px_1fr_auto]" @submit.prevent="gradeSubmission(activity, submission)">
              <input v-model="gradeScores[`${activity.id}:${submission.studentId}`]" type="number" min="0" :max="activity.maxScore" required class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" placeholder="Score" />
              <input v-model="gradeFeedback[`${activity.id}:${submission.studentId}`]" maxlength="5000" class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" placeholder="Feedback (optional)" />
              <button class="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500">Save mark</button>
            </form>
            <p v-else-if="submission.feedback" class="text-sm text-slate-400">Feedback: {{ submission.feedback }}</p>
          </div>
        </div>
        <div v-else-if="activity.type === 'TEST' && activity.submissions.length" class="space-y-2">
          <p v-for="submission in activity.submissions" :key="submission.studentId" class="rounded-lg bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            {{ submission.studentName }} — {{ submission.score }} / {{ activity.maxScore }}
          </p>
        </div>
      </article>
    </section>
  </div>
</template>
