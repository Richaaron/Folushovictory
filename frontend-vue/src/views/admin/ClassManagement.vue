<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Plus, 
  BookOpen, 
  Settings2, 
  Users, 
  ChevronRight,
  School,
  Loader2
} from 'lucide-vue-next'
import api from '../../services/api'

const classes = ref<any[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const newClass = ref({ name: '', level: 'JSS', track: '' })

const fetchClasses = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/classes')
    classes.value = data.classes || []
  } catch (err) {
    console.error('Error fetching classes:', err)
  } finally {
    loading.value = false
  }
}

const handleAddClass = async () => {
  if (!newClass.value.name) return
  try {
    await api.post('/api/admin/classes', newClass.value)
    showAddModal.value = false
    newClass.value = { name: '', level: 'JSS', track: '' }
    await fetchClasses()
  } catch (err) {
    console.error('Error adding class:', err)
  }
}

onMounted(fetchClasses)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic <span class="text-royal-purple">Classes</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Configure Classrooms and Form Teachers</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-3 rounded-2xl purple-gradient px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95"
      >
        <Plus class="w-4 h-4" /> Create New Class
      </button>
    </div>

    <!-- Classes Grid -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div 
        v-for="cls in classes" 
        :key="cls.id"
        class="academic-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group"
      >
        <div class="absolute -right-4 -top-4 w-32 h-32 bg-royal-purple/5 rounded-full group-hover:scale-110 transition-transform"></div>
        
        <div class="relative z-10">
          <div class="flex items-start justify-between mb-6">
            <div class="h-14 w-14 rounded-2xl purple-gradient flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
              <School class="w-7 h-7" />
            </div>
            <div class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
              {{ cls.level }} {{ cls.track ? `• ${cls.track}` : '' }}
            </div>
          </div>

          <h3 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ cls.name }}</h3>
          <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Form Teacher: <span class="text-royal-purple">{{ cls.formTeacherUsername ? `@${cls.formTeacherUsername}` : 'Not Assigned' }}</span>
          </p>

          <div class="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Students</span>
              <div class="flex items-center gap-2 mt-1">
                <Users class="w-4 h-4 text-royal-purple" />
                <span class="text-lg font-black text-slate-800 dark:text-slate-200">{{ cls.studentIds?.length || 0 }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subjects</span>
              <div class="flex items-center gap-2 mt-1">
                <BookOpen class="w-4 h-4 text-amber-500" />
                <span class="text-lg font-black text-slate-800 dark:text-slate-200">{{ cls.subjectIds?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="mt-8 flex gap-3">
            <button class="flex-grow py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-royal-purple hover:text-white transition-all flex items-center justify-center gap-2">
              <Settings2 class="w-4 h-4" /> Config
            </button>
            <button class="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-royal-purple transition-all">
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Add Card -->
      <button 
        @click="showAddModal = true"
        class="rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-4 group hover:border-royal-purple transition-all min-h-[300px]"
      >
        <div class="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:bg-purple-50 group-hover:text-royal-purple transition-all">
          <Plus class="w-8 h-8" />
        </div>
        <div class="text-center">
          <p class="text-sm font-black text-slate-400 group-hover:text-royal-purple uppercase tracking-widest">New Classroom</p>
          <p class="text-xs font-medium text-slate-300 mt-1">Define levels and tracks</p>
        </div>
      </button>
    </div>

    <!-- Add Class Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Create New <span class="text-royal-purple">Classroom</span></h2>
          
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class Name</label>
              <input v-model="newClass.name" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="e.g. JSS 1A" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Level</label>
                <select v-model="newClass.level" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                  <option>JSS</option>
                  <option>SSS</option>
                  <option>PRIMARY</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Track (Optional)</label>
                <input v-model="newClass.track" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="e.g. Science" />
              </div>
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleAddClass" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30">Create Class</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
