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
  if (normalized === 'Primary') return 'text-emerald-800 border-emerald-300 bg-emerald-50'
  if (normalized === 'JSS') return 'text-sky-800 border-sky-300 bg-sky-50'
  if (normalized === 'SSS') return 'text-purple-800 border-purple-300 bg-purple-50'
  return 'text-slate-700 border-slate-300 bg-slate-100'
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
        <Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-700" />
        <input
          v-model="search"
          type="text"
          placeholder="Search subjects..."
          class="w-full pl-9 pr-4 py-2.5 bg-sky-50 text-slate-900 border-2 border-sky-200 rounded-xl text-sm font-medium placeholder-slate-400 outline-none focus:border-sky-600 focus:bg-white transition-colors"
        />
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          @click="selectAll"
          class="px-3 py-2 bg-white hover:bg-sky-50 border-2 border-sky-200 text-sky-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex-1 sm:flex-none shadow-2xs active:scale-95"
        >
          Select All
        </button>
        <button
          type="button"
          @click="deselectAll"
          class="px-3 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex-1 sm:flex-none shadow-2xs active:scale-95"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Count badge -->
    <div class="flex items-center justify-between px-1">
      <span class="text-[10px] font-black uppercase tracking-wider text-slate-600">
        {{ filteredSubjects.length }} subject{{ filteredSubjects.length !== 1 ? 's' : '' }} available
      </span>
      <span class="text-[10px] font-black uppercase tracking-wider text-sky-800">
        {{ modelValue.length }} selected
      </span>
    </div>

    <!-- Subject grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-modal-scrollbar pr-1.5 rounded-2xl bg-sky-50/40 border-2 border-sky-100 p-2.5">
      <div v-if="filteredSubjects.length === 0" class="col-span-2 py-8 text-center text-slate-500 text-xs font-bold">
        No subjects found.
      </div>
      <button
        v-for="subject in filteredSubjects"
        :key="subject.id"
        type="button"
        @click="toggle(subject.id)"
        :class="[
          'flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all duration-150',
          isSelected(subject.id)
            ? 'bg-sky-100/90 border-sky-500 text-sky-950 font-black shadow-2xs'
            : 'bg-white border-slate-200 text-slate-800 hover:border-sky-300'
        ]"
      >
        <!-- Checkbox indicator -->
        <div :class="[
          'h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all',
          isSelected(subject.id)
            ? 'bg-sky-700 border-sky-700 text-white'
            : 'border-slate-300 bg-white'
        ]">
          <Check v-if="isSelected(subject.id)" class="w-3.5 h-3.5 text-white stroke-[3]" />
        </div>
        <!-- Subject info -->
        <div class="min-w-0">
          <p class="text-xs font-black truncate leading-tight">{{ subject.name }}</p>
          <div class="flex gap-1 mt-0.5">
            <span :class="['text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border', levelColor(subject.level)]">
              {{ subject.level }}
            </span>
            <span v-if="subject.track && subject.track !== 'General'" class="text-[8px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
              {{ subject.track }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
