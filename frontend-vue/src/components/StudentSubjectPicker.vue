<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Check } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string[]
  subjects: any[]
  classLevel?: string // 'Primary' | 'JSS' | 'SSS' | '' (all)
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const search = ref('')

const normalizeLevel = (value: string) => {
  const n = String(value || '').trim().toUpperCase()
  if (['PRY', 'NUR', 'PRIMARY'].includes(n) || n.startsWith('PRE')) return 'Primary'
  if (n.startsWith('JSS') || n.includes('JUNIOR')) return 'JSS'
  if (n.startsWith('SSS') || n.includes('SENIOR')) return 'SSS'
  return n
}

const detectedLevel = computed(() => {
  if (!props.classLevel) return ''
  return normalizeLevel(props.classLevel)
})

const filteredSubjects = computed(() => {
  let list = props.subjects
  // Filter by class level if provided
  if (detectedLevel.value) {
    list = list.filter(s => normalizeLevel(s.level) === detectedLevel.value)
  }
  // Filter by search query
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s => String(s.name || '').toLowerCase().includes(q))
  }
  return list
})

const toggle = (subjectId: string) => {
  const current = [...props.modelValue]
  const idx = current.indexOf(subjectId)
  if (idx === -1) {
    current.push(subjectId)
  } else {
    current.splice(idx, 1)
  }
  emit('update:modelValue', current)
}

const isSelected = (subjectId: string) => props.modelValue.includes(subjectId)

const levelColor = (level: string) => {
  const normalized = normalizeLevel(level)
  if (normalized === 'Primary') return 'text-emerald-400 border-emerald-900 bg-emerald-950/30'
  if (normalized === 'JSS') return 'text-blue-400 border-blue-900 bg-blue-950/30'
  if (normalized === 'SSS') return 'text-purple-400 border-purple-900 bg-purple-950/30'
  return 'text-slate-400 border-slate-700 bg-slate-800/50'
}
const selectAll = () => {
  const ids = new Set([...props.modelValue, ...filteredSubjects.value.map(s => s.id)])
  emit('update:modelValue', Array.from(ids))
}

const deselectAll = () => {
  const filteredIds = new Set(filteredSubjects.value.map(s => s.id))
  const remaining = props.modelValue.filter(id => !filteredIds.has(id))
  emit('update:modelValue', remaining)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Search bar & Batch actions -->
    <div class="flex flex-col sm:flex-row gap-2">
      <div class="relative flex-grow">
        <Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          v-model="search"
          type="text"
          placeholder="Search subjects..."
          class="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-royal-purple/50 transition-colors"
        />
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          @click="selectAll"
          class="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex-1 sm:flex-none"
        >
          Select All
        </button>
        <button
          type="button"
          @click="deselectAll"
          class="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex-1 sm:flex-none"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Count badge -->
    <div class="flex items-center justify-between px-1">
      <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {{ filteredSubjects.length }} subject{{ filteredSubjects.length !== 1 ? 's' : '' }} available
      </span>
      <span class="text-[9px] font-black uppercase tracking-widest text-royal-purple">
        {{ modelValue.length }} selected
      </span>
    </div>

    <!-- Subject grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 rounded-xl bg-slate-900/30 border border-slate-700/30 p-3">
      <div v-if="filteredSubjects.length === 0" class="col-span-2 py-8 text-center text-slate-500 text-sm font-bold">
        No subjects found.
      </div>
      <button
        v-for="subject in filteredSubjects"
        :key="subject.id"
        type="button"
        @click="toggle(subject.id)"
        :class="[
          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150',
          isSelected(subject.id)
            ? 'bg-royal-purple/15 border-royal-purple/40 text-white'
            : 'bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800/40'
        ]"
      >
        <!-- Checkbox indicator -->
        <div :class="[
          'h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all',
          isSelected(subject.id)
            ? 'bg-royal-purple border-royal-purple'
            : 'border-slate-600 bg-transparent'
        ]">
          <Check v-if="isSelected(subject.id)" class="w-3 h-3 text-white" />
        </div>
        <!-- Subject info -->
        <div class="min-w-0">
          <p class="text-xs font-black truncate">{{ subject.name }}</p>
          <div class="flex gap-1 mt-0.5">
            <span :class="['text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border', levelColor(subject.level)]">
              {{ subject.level }}
            </span>
            <span v-if="subject.track && subject.track !== 'General'" class="text-[8px] font-black uppercase tracking-widest text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">
              {{ subject.track }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
