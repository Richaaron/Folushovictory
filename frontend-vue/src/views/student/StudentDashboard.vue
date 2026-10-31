<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BookOpen, ClipboardList, Clock3, GraduationCap, KeyRound, Loader2, Send, Trophy, CheckCircle2 } from 'lucide-vue-next'
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
    <Loader2 class="h-10 w-10 animate-spin text-[#1A4D8F]" />
  </div>

  <div v-else-if="dashboard" class="space-y-6 text-[#1C1917]">
    
    <!-- Welcome Header -->
    <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A4D8F] bg-[#1A4D8F]/10 px-2.5 py-1 rounded-full">
            <GraduationCap class="h-4 w-4" />
            <span>Folusho Victory Student Portal</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
            Hello, {{ dashboard.student.firstName }} {{ dashboard.student.lastName }}
          </h1>

          <div class="flex flex-wrap items-center gap-2 text-xs text-[#4B5563] pt-0.5">
            <span class="font-bold bg-[#F7F4EE] px-2 py-0.5 rounded border border-[#E5E0D8] text-[#1A4D8F]">
              ID: {{ dashboard.student.studentId }}
            </span>
            <span>•</span>
            <span class="font-semibold text-[#1C1917]">Class: {{ dashboard.student.className }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-[#F7F4EE] border border-[#E5E0D8] rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Subjects</p>
            <p class="text-xl font-black text-[#1A4D8F] mt-0.5">{{ dashboard.subjects.length }}</p>
          </div>
          <div class="bg-[#F7F4EE] border border-[#E5E0D8] rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Tasks</p>
            <p class="text-xl font-black text-[#2D6A4F] mt-0.5">{{ activities.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
      {{ error }}
    </div>

    <!-- My Subjects Section -->
    <section class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
        <div class="flex items-center gap-2.5">
          <div class="h-8 w-8 rounded-lg bg-[#1A4D8F]/10 text-[#1A4D8F] flex items-center justify-center">
            <BookOpen class="h-4 w-4" />
          </div>
          <h2 class="text-base font-bold text-[#1C1917]">Registered Subjects</h2>
        </div>
        <span class="text-xs font-semibold text-[#6B7280]">{{ dashboard.subjects.length }} active subjects</span>
      </div>

      <div v-if="dashboard.subjects.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article 
          v-for="subject in dashboard.subjects" 
          :key="subject.id" 
          class="rounded-xl border border-[#E5E0D8] bg-[#F7F4EE] p-4 flex items-center justify-between hover:bg-white hover:border-[#1A4D8F]/30 transition-all"
        >
          <div>
            <h3 class="text-sm font-bold text-[#1C1917]">{{ subject.name }}</h3>
            <p class="text-[11px] text-[#6B7280] mt-0.5">{{ subject.level }} Curriculum</p>
          </div>
          <CheckCircle2 class="h-4 w-4 text-[#2D6A4F]" />
        </article>
      </div>
      <p v-else class="text-xs text-[#9CA3AF] py-6 text-center">
        No subjects have been configured for your class level yet.
      </p>
    </section>

    <!-- Assignments & Tests Section -->
    <section class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
        <div class="flex items-center gap-2.5">
          <div class="h-8 w-8 rounded-lg bg-[#E8A838]/15 text-[#C98818] flex items-center justify-center">
            <ClipboardList class="h-4 w-4" />
          </div>
          <h2 class="text-base font-bold text-[#1C1917]">Class Assignments & Tests</h2>
        </div>
        <span class="text-xs font-semibold text-[#6B7280]">{{ activities.length }} items</span>
      </div>

      <p v-if="!activities.length" class="text-xs text-[#9CA3AF] py-8 text-center bg-[#F7F4EE] rounded-xl border border-dashed border-[#E5E0D8]">
        No assignments or online tests are currently pending for your class.
      </p>

      <div v-else class="space-y-4">
        <article 
          v-for="activity in activities" 
          :key="activity.id" 
          class="rounded-xl border border-[#E5E0D8] bg-[#F7F4EE] p-5 space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#1A4D8F]">
                  {{ activity.type }}
                </span>
                <span class="text-xs font-semibold text-[#4B5563]">{{ activity.subjectName }}</span>
              </div>
              <h3 class="text-base font-extrabold text-[#1C1917]">{{ activity.title }}</h3>
              <p v-if="activity.description" class="text-xs text-[#4B5563] mt-1 whitespace-pre-wrap">{{ activity.description }}</p>
              <p class="text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-2">
                <Clock3 class="h-3.5 w-3.5" />
                <span>{{ formatDueAt(activity.dueAt) }}</span>
                <span>•</span>
                <span class="font-bold text-[#1C1917]">{{ activity.maxScore }} marks</span>
              </p>
            </div>

            <div v-if="activity.submission" class="bg-white border border-[#E5E0D8] rounded-xl p-3 text-xs shrink-0 min-w-[140px]">
              <span class="text-[10px] font-bold uppercase text-[#2D6A4F] block">
                {{ activity.submission.status === 'GRADED' ? 'Marked' : 'Submitted' }}
              </span>
              <p v-if="activity.submission.score !== null" class="text-sm font-extrabold text-[#1A4D8F] flex items-center gap-1 mt-0.5">
                <Trophy class="h-3.5 w-3.5 text-[#E8A838]" />
                {{ activity.submission.score }} / {{ activity.maxScore }}
              </p>
              <p v-if="activity.submission.feedback" class="text-[11px] text-[#4B5563] mt-1">{{ activity.submission.feedback }}</p>
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
                class="w-full bg-white border border-[#D8D2C4] rounded-xl p-3 text-xs text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1A4D8F]" 
                placeholder="Type your response here..."
              />
              <button 
                :disabled="submitting === activity.id" 
                class="px-4 py-2 rounded-xl bg-[#1A4D8F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#12386A] transition-colors"
              >
                <Loader2 v-if="submitting === activity.id" class="h-3.5 w-3.5 animate-spin" />
                <Send v-else class="h-3.5 w-3.5" />
                <span>Submit Response</span>
              </button>
            </form>

            <form v-else class="space-y-4 pt-2" @submit.prevent="submitTest(activity)">
              <fieldset v-for="(question, index) in activity.questions" :key="question.id" class="bg-white rounded-xl border border-[#E5E0D8] p-3.5">
                <legend class="text-xs font-bold text-[#1C1917] px-1">{{ Number(index) + 1 }}. {{ question.prompt }}</legend>
                <div class="mt-2 space-y-1.5 text-xs">
                  <label v-for="option in question.options" :key="option" class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F7F4EE] cursor-pointer">
                    <input v-model="testAnswers[activity.id][question.id]" type="radio" :name="`${activity.id}-${question.id}`" :value="option" required class="text-[#1A4D8F]" />
                    <span>{{ option }}</span>
                  </label>
                </div>
              </fieldset>
              <button 
                :disabled="submitting === activity.id" 
                class="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#1F4D38] transition-colors"
              >
                <Loader2 v-if="submitting === activity.id" class="h-3.5 w-3.5 animate-spin" />
                <Send v-else class="h-3.5 w-3.5" />
                <span>Submit Answers</span>
              </button>
            </form>
          </template>
        </article>
      </div>
    </section>

    <!-- Change PIN Section -->
    <section class="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm space-y-4">
      <div class="flex items-center gap-2.5 pb-2 border-b border-[#E5E0D8]">
        <KeyRound class="h-4 w-4 text-[#E8A838]" />
        <h2 class="text-sm font-bold text-[#1C1917]">Manage Your 8-Digit Student PIN</h2>
      </div>
      <p class="text-xs text-[#6B7280]">
        Keep your PIN confidential. If you misplace your PIN, request assistance from your form teacher or school administrator.
      </p>

      <form class="grid gap-3 sm:grid-cols-3 max-w-xl" @submit.prevent="changePin">
        <input 
          v-model="currentPin" 
          type="password" 
          inputmode="numeric" 
          pattern="[0-9]{8}" 
          maxlength="8" 
          required 
          class="bg-white border border-[#D8D2C4] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#1A4D8F]" 
          placeholder="Current 8-digit PIN" 
        />
        <input 
          v-model="newPin" 
          type="password" 
          inputmode="numeric" 
          pattern="[0-9]{8}" 
          maxlength="8" 
          required 
          class="bg-white border border-[#D8D2C4] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#1A4D8F]" 
          placeholder="New 8-digit PIN" 
        />
        <button 
          :disabled="changingPin" 
          class="px-4 py-2 rounded-xl bg-[#1A4D8F] text-white text-xs font-bold hover:bg-[#12386A] transition-colors disabled:opacity-50"
        >
          {{ changingPin ? 'Updating...' : 'Update PIN' }}
        </button>
      </form>

      <p v-if="pinMessage" class="text-xs text-[#2D6A4F] font-bold">{{ pinMessage }}</p>
      <p v-if="pinError" class="text-xs text-red-600 font-bold">{{ pinError }}</p>
    </section>

  </div>

  <div v-else class="rounded-xl border border-red-200 bg-red-50 p-5 text-xs text-red-700">
    {{ error || 'Unable to load student profile.' }}
  </div>
</template>
