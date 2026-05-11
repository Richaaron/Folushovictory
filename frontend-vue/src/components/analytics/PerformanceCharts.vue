<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
)

const props = defineProps<{
  students: any[]
  subjects: any[]
}>()

// 1. Bar Chart: Average Scores per Subject
const barData = computed(() => {
  const labels = props.subjects.map(s => s.name)
  const data = props.subjects.map(sub => {
    const scores = props.students.map(st => st.scores?.[sub.id]?.total || 0).filter(s => s > 0)
    if (scores.length === 0) return 0
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
  })

  return {
    labels,
    datasets: [{
      label: 'Subject Average Score',
      backgroundColor: '#5D3FD3',
      borderRadius: 8,
      data
    }]
  }
})

// 2. Pie Chart: Grade Distribution (Overall)
const pieData = computed(() => {
  const grades = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
  props.students.forEach(st => {
    if (st.average >= 70) grades['A']++
    else if (st.average >= 60) grades['B']++
    else if (st.average >= 50) grades['C']++
    else if (st.average >= 45) grades['D']++
    else if (st.average > 0) grades['F']++
  })

  return {
    labels: ['A (Distinction)', 'B (Very Good)', 'C (Credit)', 'D (Pass)', 'F (Fail)'],
    datasets: [{
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ef4444'],
      data: Object.values(grades)
    }]
  }
})

// 3. Histogram-like Bar Chart: Score Distribution Ranges
const histogramData = computed(() => {
  const ranges = { '0-39': 0, '40-49': 0, '50-59': 0, '60-69': 0, '70-79': 0, '80-100': 0 }
  props.students.forEach(st => {
    if (st.average >= 80) ranges['80-100']++
    else if (st.average >= 70) ranges['70-79']++
    else if (st.average >= 60) ranges['60-69']++
    else if (st.average >= 50) ranges['50-59']++
    else if (st.average >= 40) ranges['40-49']++
    else if (st.average > 0) ranges['0-39']++
  })

  return {
    labels: Object.keys(ranges),
    datasets: [{
      label: 'Students in Range',
      backgroundColor: '#D4AF37',
      borderRadius: 4,
      data: Object.values(ranges)
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        font: { family: 'Inter', weight: 'bold' as const, size: 10 },
        color: '#64748b'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' }
    },
    x: {
      grid: { display: false }
    }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Bar Chart: Subject Performance -->
    <div class="academic-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
      <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Subject Averages</h3>
      <div class="h-64">
        <Bar :data="barData" :options="chartOptions" />
      </div>
    </div>

    <!-- Pie Chart: Overall Grade Distribution -->
    <div class="academic-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
      <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Grade Distribution</h3>
      <div class="h-64">
        <Pie :data="pieData" :options="{ ...chartOptions, scales: {} }" />
      </div>
    </div>

    <!-- Histogram: Performance Density -->
    <div class="col-span-full academic-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
      <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Performance Density (Average Score Ranges)</h3>
      <div class="h-64">
        <Bar :data="histogramData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
