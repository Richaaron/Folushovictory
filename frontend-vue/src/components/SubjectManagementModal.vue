<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Trash2, Plus, Loader2 } from 'lucide-vue-next'
import api from '../services/api'

const props = defineProps<{
  show: boolean
  apiEndpoint: string
}>()

const emit = defineEmits(['close', 'update'])

const subjects = ref<any[]>([])
const loading = ref(false)
const adding = ref(false)
const error = ref('')

const newSubject = ref({
  name: '',
  level: 'JSS',
  track: ''
})

const fetchSubjects = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(props.apiEndpoint)
    subjects.value = data.subjects || []
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch subjects'
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchSubjects()
  }
})

const handleAddSubject = async () => {
  if (!newSubject.value.name) return
  adding.value = true
  error.value = ''
  try {
    await api.post(props.apiEndpoint, newSubject.value)
    newSubject.value.name = ''
    newSubject.value.track = ''
    await fetchSubjects()
    emit('update')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to add subject'
  } finally {
    adding.value = false
  }
}

const handleDeleteSubject = async (id: string) => {
  if (!confirm('Are you sure you want to delete this subject?')) return
  error.value = ''
  try {
    await api.delete(`${props.apiEndpoint}/${id}`)
    await fetchSubjects()
    emit('update')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete subject'
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="close"></div>
      
      <div class="glass-card rounded-2xl sm:rounded-[2.5rem] w-full max-w-3xl p-6 sm:p-10 shadow-2xl relative z-10 fade-in border border-white/10 max-h-[90vh] flex flex-col">
        
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-white tracking-tight">Manage <span class="text-royal-purple">Subjects</span></h2>
          <button @click="close" class="h-10 w-10 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="error" class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400">
          {{ error }}
        </div>

        <div class="flex flex-col md:flex-row gap-4 mb-8">
          <div class="flex-grow space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Name</label>
            <input v-model="newSubject.name" type="text" placeholder="e.g. Mathematics" class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" @keyup.enter="handleAddSubject" />
          </div>
          <div class="md:w-32 space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Level</label>
            <select v-model="newSubject.level" class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none">
              <option value="Primary">Primary</option>
              <option value="JSS">JSS</option>
              <option value="SSS">SSS</option>
            </select>
          </div>
          <div v-if="newSubject.level === 'SSS'" class="md:w-40 space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Track</label>
            <select v-model="newSubject.track" class="w-full px-4 py-3 bg-slate-900/60 text-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none">
              <option value="">General</option>
              <option value="Science">Science</option>
              <option value="Art">Art</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div class="flex items-end">
            <button @click="handleAddSubject" :disabled="adding || !newSubject.name" class="h-[44px] px-6 rounded-xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <Loader2 v-if="adding" class="w-4 h-4 animate-spin" />
              <Plus v-else class="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div class="flex-grow overflow-y-auto pr-2 rounded-xl bg-slate-900/30 border border-slate-700/30 p-4">
          <div v-if="loading" class="flex justify-center p-10">
            <Loader2 class="w-8 h-8 animate-spin text-royal-purple" />
          </div>
          <div v-else-if="subjects.length === 0" class="text-center p-10 text-slate-500 font-bold">
            No subjects found.
          </div>
          <div v-else class="space-y-2">
            <div v-for="subject in subjects" :key="subject.id" class="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-royal-purple/30 transition-colors">
              <div>
                <p class="text-sm font-black text-white">{{ subject.name }}</p>
                <div class="flex gap-2 mt-1">
                  <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border" :class="{
                    'text-emerald-400 border-emerald-900 bg-emerald-950/30': subject.level === 'Primary',
                    'text-blue-400 border-blue-900 bg-blue-950/30': subject.level === 'JSS',
                    'text-purple-400 border-purple-900 bg-purple-950/30': subject.level === 'SSS'
                  }">
                    {{ subject.level }}
                  </span>
                  <span v-if="subject.track && subject.track !== 'General'" class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50">
                    {{ subject.track }}
                  </span>
                </div>
              </div>
              <button @click="handleDeleteSubject(subject.id)" class="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </transition>
</template>
