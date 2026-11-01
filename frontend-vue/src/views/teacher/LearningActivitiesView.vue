<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClipboardList, Loader2, Plus, Send, CheckCircle2, AlertCircle } from 'lucide-vue-next'
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
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <header class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-6 sm:p-8 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center">
          <ClipboardList class="h-6 w-6 text-amber-800" />
        </div>
        <div>
          <h1 class="text-2xl font-black text-[#0C4A6E]">Assignments & Tests</h1>
          <p class="mt-1 text-xs sm:text-sm font-semibold text-slate-600">Publish activities to your allocated classes and review submitted student work.</p>
        </div>
      </div>
    </header>

    <!-- Error / Success Notices -->
    <div v-if="error" role="alert" class="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-900">
      <AlertCircle class="h-5 w-5 text-red-700 shrink-0" />
      <span>{{ error }}</span>
    </div>
    <div v-if="message" role="status" class="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
      <CheckCircle2 class="h-5 w-5 text-emerald-700 shrink-0" />
      <span>{{ message }}</span>
    </div>

    <!-- Create Activity Form -->
    <form class="space-y-6 rounded-2xl border-2 border-[#BAE6FD] bg-white p-6 sm:p-8 shadow-sm" @submit.prevent="createActivity">
      <div class="pb-3 border-b border-sky-100">
        <h2 class="text-lg font-black text-[#0C4A6E]">Create & Publish Learning Task</h2>
        <p class="text-xs font-semibold text-slate-600">Assign homework or launch an online assessment for your students</p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="space-y-2 block">
          <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Activity Type</span>
          <select v-model="type" class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition">
            <option value="ASSIGNMENT">Written Assignment</option>
            <option value="TEST">Multiple-Choice Test</option>
          </select>
        </label>
        <label class="space-y-2 block">
          <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Target Class & Subject</span>
          <select v-model="selectedKey" required class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition">
            <option v-for="assignment in selectableAssignments" :key="assignment.key" :value="assignment.key">
              {{ assignment.className }} • {{ assignment.subjectName }}
            </option>
          </select>
        </label>
      </div>

      <label class="block space-y-2">
        <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Title <span class="text-red-600">*</span></span>
        <input v-model="title" maxlength="150" required class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition" placeholder="e.g. Chapter 4 Fractions Practice" />
      </label>

      <label class="block space-y-2">
        <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Instructions & Questions</span>
        <textarea v-model="description" maxlength="10000" rows="3" class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition" placeholder="Explain the assignment expectations and instructions" />
      </label>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="space-y-2 block">
          <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Submission Deadline (Optional)</span>
          <input v-model="dueAt" type="datetime-local" class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition" />
        </label>
        <label class="space-y-2 block">
          <span class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Maximum Obtainable Score</span>
          <input v-model.number="maxScore" type="number" min="1" max="1000" required class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-black text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none transition" />
        </label>
      </div>

      <!-- Multiple-Choice Builder -->
      <div v-if="type === 'TEST'" class="space-y-4 border-t-2 border-sky-100 pt-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-black text-[#0C4A6E] text-base">Multiple-Choice Questions</h3>
          <button type="button" @click="addQuestion" class="inline-flex items-center gap-2 rounded-xl bg-sky-100 hover:bg-sky-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#0C4A6E] transition">
            <Plus class="h-4 w-4" /> Add Question
          </button>
        </div>

        <div v-for="(question, index) in questions" :key="index" class="space-y-3 rounded-xl border-2 border-sky-200 bg-sky-50/40 p-4 sm:p-5">
          <label class="block space-y-2">
            <span class="text-xs font-black text-[#0C4A6E]">Question {{ Number(index) + 1 }}</span>
            <input v-model="question.prompt" required maxlength="1000" class="w-full rounded-lg border-2 border-slate-300 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 focus:border-sky-600 outline-none transition" placeholder="Enter the question text" />
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label v-for="(_, optionIndex) in question.options" :key="optionIndex" class="space-y-1 block">
              <span class="text-xs font-extrabold text-slate-700">Option {{ Number(optionIndex) + 1 }}</span>
              <input v-model="question.options[optionIndex]" :placeholder="`Option ${Number(optionIndex) + 1}`" required class="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-600 outline-none transition" />
            </label>
          </div>

          <label class="block space-y-2">
            <span class="text-xs font-black text-[#0C4A6E]">Correct Answer</span>
            <select v-model="question.correctAnswer" required class="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-sky-600 outline-none transition">
              <option disabled value="">Select correct answer option</option>
              <option v-for="option in questionOptions(question)" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
        </div>

        <p v-if="!questions.length" class="text-xs sm:text-sm font-semibold text-slate-600 py-3 text-center bg-sky-50 rounded-xl border border-dashed border-sky-300">
          Click "+ Add Question" above to build your test question pool.
        </p>
      </div>

      <button :disabled="saving || (type === 'TEST' && !questions.length)" class="inline-flex items-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 px-6 py-3.5 font-black text-sm uppercase tracking-wider text-white shadow-md transition disabled:opacity-50">
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin text-white" />
        <Send v-else class="h-4 w-4 text-white" />
        <span>Publish for Students</span>
      </button>
    </form>

    <!-- Published Activities List -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-black text-[#0C4A6E]">Published Learning Activities</h2>
        <span class="text-xs font-black bg-sky-100 text-[#0C4A6E] px-3 py-1 rounded-full border border-sky-300">{{ activities.length }} Active</span>
      </div>

      <div v-if="loading" class="flex justify-center py-12"><Loader2 class="h-8 w-8 animate-spin text-sky-800" /></div>
      <p v-else-if="!activities.length" class="rounded-2xl border-2 border-[#BAE6FD] bg-white p-8 text-center text-sm font-semibold text-slate-600">
        You have not published any class activities or online tests yet.
      </p>

      <div v-else class="space-y-4">
        <article v-for="activity in activities" :key="activity.id" class="rounded-2xl border-2 border-[#BAE6FD] bg-white p-5 sm:p-7 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-sky-100">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  {{ activity.type }}
                </span>
                <span class="text-xs font-black text-[#0C4A6E]">{{ activity.className }} • {{ activity.subjectName }}</span>
              </div>
              <h3 class="text-lg font-black text-slate-900">{{ activity.title }}</h3>
            </div>
            <span class="text-xs font-extrabold bg-sky-50 text-[#0C4A6E] border border-sky-200 px-3 py-1 rounded-full shrink-0">
              {{ activity.submissions.length }} Submission(s)
            </span>
          </div>

          <!-- Assignment Submissions & Grading -->
          <div v-if="activity.type === 'ASSIGNMENT' && activity.submissions.length" class="space-y-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Student Submissions</h4>
            <div v-for="submission in activity.submissions" :key="submission.studentId" class="space-y-3 rounded-xl border border-sky-200 bg-sky-50/30 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-black text-slate-900">{{ submission.studentName }} <span class="text-xs font-semibold text-slate-500">({{ submission.studentId }})</span></p>
                <span class="text-xs font-black uppercase px-2.5 py-0.5 rounded-md" :class="submission.status === 'GRADED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'">
                  {{ submission.status }} <span v-if="submission.score !== null">• {{ submission.score }} / {{ activity.maxScore }}</span>
                </span>
              </div>

              <p class="whitespace-pre-wrap text-sm font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">{{ submission.response?.text }}</p>

              <form v-if="submission.status !== 'GRADED'" class="grid gap-3 sm:grid-cols-[120px_1fr_auto]" @submit.prevent="gradeSubmission(activity, submission)">
                <input v-model="gradeScores[`${activity.id}:${submission.studentId}`]" type="number" min="0" :max="activity.maxScore" required class="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base font-black text-slate-900 focus:border-sky-600 outline-none" placeholder="Score" />
                <input v-model="gradeFeedback[`${activity.id}:${submission.studentId}`]" maxlength="5000" class="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-600 outline-none" placeholder="Teacher feedback (optional)" />
                <button class="rounded-lg bg-sky-700 hover:bg-sky-800 text-white px-5 py-2 font-black text-xs uppercase tracking-wider shadow-sm transition">Save Mark</button>
              </form>
              <p v-else-if="submission.feedback" class="text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                <strong class="text-[#0C4A6E]">Teacher Remark:</strong> {{ submission.feedback }}
              </p>
            </div>
          </div>

          <!-- Test Submissions -->
          <div v-else-if="activity.type === 'TEST' && activity.submissions.length" class="space-y-2">
            <h4 class="text-xs font-black uppercase tracking-wider text-[#0C4A6E]">Test Results</h4>
            <div class="grid gap-2 sm:grid-cols-2">
              <div v-for="submission in activity.submissions" :key="submission.studentId" class="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/40 px-4 py-3">
                <span class="text-sm font-bold text-slate-900">{{ submission.studentName }}</span>
                <span class="text-sm font-black text-[#0C4A6E]">{{ submission.score }} / {{ activity.maxScore }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
