<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Trash2, 
  Edit2, 
  UserPlus,
  ArrowUpDown,
  Loader2
} from 'lucide-vue-next'
import api from '../../services/api'

const teachers = ref<any[]>([])
const loading = ref(true)
const creating = ref(false)
const searchQuery = ref('')
const showAddModal = ref(false)
const newTeacher = ref({ displayName: '', email: '' })

const fetchTeachers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/teachers')
    teachers.value = data.teachers || []
  } catch (err) {
    console.error('Error fetching teachers:', err)
  } finally {
    loading.value = false
  }
}

const handleAddTeacher = async () => {
  if (!newTeacher.value.displayName) return
  creating.value = true
  try {
    await api.post('/api/admin/teachers', newTeacher.value)
    showAddModal.value = false
    newTeacher.value = { displayName: '', email: '' }
    await fetchTeachers()
  } catch (err) {
    console.error('Error adding teacher:', err)
  } finally {
    creating.value = false
  }
}

const filteredTeachers = computed(() => {
  if (!searchQuery.value) return teachers.value
  const query = searchQuery.value.toLowerCase()
  return teachers.value.filter(t => 
    t.displayName.toLowerCase().includes(query) || 
    t.username.toLowerCase().includes(query)
  )
})

onMounted(fetchTeachers)
</script>

<template>
  <div class="space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff <span class="text-royal-purple">Faculty</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage Teachers and Academic Assignments</p>
      </div>
      <button 
        @click="showAddModal = true"
        class="flex items-center gap-3 rounded-2xl purple-gradient px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95"
      >
        <UserPlus class="w-4 h-4" /> Add New Staff
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="academic-card rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-grow">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by name, username or subject..."
          class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-royal-purple outline-none transition-all"
        />
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
        <select class="flex-grow md:flex-none pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-royal-purple outline-none cursor-pointer">
          <option>All Departments</option>
          <option>Science</option>
          <option>Arts</option>
          <option>Commercial</option>
        </select>
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
      <div v-if="loading" class="flex-grow flex items-center justify-center">
        <Loader2 class="w-10 h-10 text-royal-purple animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50">
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teacher Profile</th>
              <th class="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
            <tr v-for="teacher in filteredTeachers" :key="teacher.username" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-royal-purple font-black text-lg">
                    {{ teacher.displayName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">{{ teacher.displayName }}</p>
                    <p class="text-xs font-bold text-slate-400">@{{ teacher.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-royal-purple transition-colors">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button class="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredTeachers.length === 0" class="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
          No staff members found matching your search.
        </div>
      </div>
      <div v-if="!loading" class="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Showing {{ filteredTeachers.length }} staff members</p>
      </div>
    </div>

    <!-- Add Teacher Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAddModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 fade-in border border-slate-100 dark:border-slate-800">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
            <UserPlus class="w-6 h-6 text-royal-purple" /> Add New Staff
          </h2>
          
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Display Name</label>
              <input v-model="newTeacher.displayName" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="e.g. Samuel Okafor" />
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address (Optional)</label>
              <input v-model="newTeacher.email" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="s.okafor@fvs.edu" />
            </div>

            <div class="pt-6 flex gap-4">
              <button @click="showAddModal = false" class="flex-grow py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button @click="handleAddTeacher" class="flex-[2] py-4 rounded-2xl purple-gradient text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30">Create Account</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
