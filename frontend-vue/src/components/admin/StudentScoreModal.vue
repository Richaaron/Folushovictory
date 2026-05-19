<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import api from '../../services/api'

interface Props {
  student: any
  classId: string
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const subjects = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const session = ref('2023/2024')
const term = ref('First')

const scores = ref<Map<string, any>>(new Map())

const computeTotal = (subjectId: string) => {
  const score = scores.value.get(subjectId)
  if (!score) return 0
  const c1 = Number(score.ca1 || 0)
  const c2 = Number(score.ca2 || 0)
  const e = Number(score.exam || 0)
  return c1 + c2 + e
}

const computeGrade = (total: number) => {
  if (total >= 70) return 'A'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'F'
}

const fetchData = async () => {
  if (!props.isOpen || !props.student) return
  
  loading.value = true
  error.value = ''
  scores.value.clear()
  
  try {
    // Fetch class details
    const [classResp, schoolResp] = await Promise.all([
      api.get(`/api/admin/classes/${props.classId}`),
      api.get('/api/config/school')
    ])
    
    const cls = classResp.data.class
    
    // Fetch all subjects
    const allSubjectsResp = await api.get('/api/admin/subjects')
    const allSubjects = allSubjectsResp.data.subjects || []
    
    // Filter subjects based on class level
    let filteredSubjects: any[] = []
    
    if (cls.level === 'SSS') {
      // For SSS: combine track-specific subjects with manually assigned subjects
      const trackSubjectNames = {
        'Science': ['Chemistry', 'Physics'],
        'Art': ['Government', 'Literature in English'],
        'Commercial': ['Accounting', 'Commercial']
      }
      
      // Get automatically added track subjects
      const trackSubjects = allSubjects.filter((s: any) => 
        s.level === 'SSS' && 
        trackSubjectNames[cls.track as keyof typeof trackSubjectNames]?.includes(s.name)
      )
      
      // Get manually assigned subjects
      const manualSubjectIds = cls.subjectIds || []
      const manualSubjects = allSubjects.filter((s: any) => 
        manualSubjectIds.includes(s.id)
      )
      
      // Combine both, avoiding duplicates
      const subjectMap = new Map()
      trackSubjects.forEach((s: any) => subjectMap.set(s.id, s))
      manualSubjects.forEach((s: any) => subjectMap.set(s.id, s))
      
      filteredSubjects = Array.from(subjectMap.values())
    } else {
      // For Primary and JSS: show all subjects matching the level
      filteredSubjects = allSubjects.filter((s: any) => s.level === cls.level)
    }
    
    subjects.value = filteredSubjects.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
    
    // Set current session/term
    if (schoolResp.data?.currentSession) session.value = schoolResp.data.currentSession
    if (schoolResp.data?.currentTerm) term.value = schoolResp.data.currentTerm
    
    // Fetch existing scores for this student
    const scoresResp = await api.get(`/api/admin/students/${props.student.studentId}/scores`, {
      params: { session: session.value, term: term.value }
    })
    
    const existingScores = scoresResp.data.scores || []
    existingScores.forEach((score: any) => {
      scores.value.set(score.subjectId, {
        ca1: score.ca1 || 0,
        ca2: score.ca2 || 0,
        exam: score.exam || 0
      })
    })
    
    // Initialize scores for subjects without existing scores
    subjects.value.forEach((subject: any) => {
      if (!scores.value.has(subject.id)) {
        scores.value.set(subject.id, { ca1: 0, ca2: 0, exam: 0 })
      }
    })
  } catch (err) {
    error.value = 'Failed to load data. Please try again.'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  
  try {
    const scoresData = Array.from(scores.value.entries()).map(([subjectId, score]) => ({
      subjectId,
      ca1: Number(score.ca1 || 0),
      ca2: Number(score.ca2 || 0),
      exam: Number(score.exam || 0)
    }))
    
    await api.post(`/api/admin/students/${props.student.studentId}/scores`, {
      session: session.value,
      term: term.value,
      classId: props.classId,
      scores: scoresData
    })
    
    success.value = true
    setTimeout(() => {
      emit('saved')
      emit('close')
    }, 1500)
  } catch (err) {
    error.value = 'Failed to save scores. Please try again.'
    console.error('Error:', err)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (!saving.value) {
    emit('close')
  }
}

onMounted(fetchData)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {{ student.firstName }} {{ student.lastName }}
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{{ student.studentId }}</p>
        </div>
        <button 
          @click="handleClose"
          :disabled="saving"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <X class="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 space-y-6">
        <!-- Session/Term Selection -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label class="block text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Session</label>
            <select v-model="session" class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none">
              <option>2023/2024</option>
              <option>2024/2025</option>
              <option>2025/2026</option>
              <option>2026/2027</option>
            </select>
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Term</label>
            <select v-model="term" class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none">
              <option>First</option>
              <option>Second</option>
              <option>Third</option>
            </select>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="flex gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="flex gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <CheckCircle2 class="w-5 h-5 text-green-500 flex-shrink-0" />
          <p class="text-sm text-green-700 dark:text-green-300">Scores saved successfully!</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="w-8 h-8 text-royal-purple animate-spin" />
        </div>

        <!-- Subjects Table -->
        <div v-else class="space-y-4">
          <div class="overflow-x-auto">
            <table class="w-full text-xs sm:text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800/50">
                  <th class="px-3 sm:px-4 py-3 text-left text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                  <th class="px-2 py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">CA1</th>
                  <th class="px-2 py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">CA2</th>
                  <th class="px-2 py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Exam</th>
                  <th class="px-2 py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                  <th class="px-2 py-3 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td class="px-3 sm:px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <span class="text-xs sm:text-sm">{{ subject.name }}</span>
                  </td>
                  <td class="px-2 py-3">
                    <input 
                      v-model.number="scores.get(subject.id).ca1"
                      type="number" 
                      min="0" 
                      max="20"
                      class="w-12 sm:w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-center focus:ring-2 focus:ring-royal-purple outline-none"
                    />
                  </td>
                  <td class="px-2 py-3">
                    <input 
                      v-model.number="scores.get(subject.id).ca2"
                      type="number" 
                      min="0" 
                      max="20"
                      class="w-12 sm:w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-center focus:ring-2 focus:ring-royal-purple outline-none"
                    />
                  </td>
                  <td class="px-2 py-3">
                    <input 
                      v-model.number="scores.get(subject.id).exam"
                      type="number" 
                      min="0" 
                      max="60"
                      class="w-12 sm:w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-center focus:ring-2 focus:ring-royal-purple outline-none"
                    />
                  </td>
                  <td class="px-2 py-3 text-center font-black text-slate-900 dark:text-white">
                    {{ computeTotal(subject.id) }}
                  </td>
                  <td class="px-2 py-3 text-center">
                    <span 
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black text-white"
                      :class="computeGrade(computeTotal(subject.id)) === 'A' ? 'bg-emerald-500' : 
                              computeGrade(computeTotal(subject.id)) === 'B' ? 'bg-blue-500' :
                              computeGrade(computeTotal(subject.id)) === 'C' ? 'bg-amber-500' :
                              computeGrade(computeTotal(subject.id)) === 'D' ? 'bg-orange-500' :
                              'bg-red-500'"
                    >
                      {{ computeGrade(computeTotal(subject.id)) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-end gap-3 sm:gap-4">
        <button 
          @click="handleClose"
          :disabled="saving"
          class="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          @click="handleSave"
          :disabled="saving || loading"
          class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl purple-gradient text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 min-h-[44px]"
        >
          <Save class="w-4 h-4" />
          {{ saving ? 'Saving...' : 'Save Scores' }}
        </button>
      </div>
    </div>
  </div>
</template>
