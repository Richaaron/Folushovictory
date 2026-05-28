<script setup lang="ts">
withDefaults(defineProps<{
  symbolCount?: number
  opacity?: number
}>(), {
  symbolCount: 6,
  opacity: 0.06
})

const symbols = ['∑', '∫', 'π', '√', '∞', '∂', 'θ', 'Δ', 'α', 'β', 'γ', 'ε', 'φ', 'λ', 'σ', 'ω']
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
    <span
      v-for="i in symbolCount"
      :key="i"
      class="absolute math-watermark"
      :style="{
        top: `${10 + (i * 13) % 80}%`,
        left: `${5 + (i * 17) % 90}%`,
        fontSize: `${1.5 + (i % 3) * 0.6}rem`,
        opacity: opacity,
        animationDelay: `${i * 2.5}s`,
        animationDuration: `${18 + (i % 5) * 4}s`
      }"
    >{{ symbols[(i - 1) % symbols.length] }}</span>
  </div>
</template>

<style scoped>
.math-watermark {
  font-family: 'Times New Roman', 'Latin Modern Math', serif;
  font-style: italic;
  color: #C9A84C;
  animation: academic-float 20s ease-in-out infinite alternate;
}

@keyframes academic-float {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.04;
  }
  25% {
    transform: translateY(-18px) rotate(5deg) scale(1.05);
    opacity: 0.08;
  }
  50% {
    transform: translateY(4px) rotate(-3deg) scale(0.97);
    opacity: 0.05;
  }
  75% {
    transform: translateY(-10px) rotate(2deg) scale(1.02);
    opacity: 0.07;
  }
  100% {
    transform: translateY(-5px) rotate(-1deg) scale(1);
    opacity: 0.04;
  }
}
</style>
