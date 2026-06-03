<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ShieldCheck, Star, Zap, GraduationCap, BookOpen, Trophy, Users } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}

const portals = [
  {
    id: 'admin',
    title: 'Admin Portal',
    description: 'Complete institutional control and oversight',
    icon: ShieldCheck,
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/50',
    delay: '0s'
  },
  {
    id: 'teacher',
    title: 'Teacher Portal',
    description: 'Manage scores, classes, and student performance',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/50',
    delay: '0.15s'
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    description: 'Track your child\'s academic progress',
    icon: Users,
    gradient: 'from-cyan-500 to-green-500',
    glow: 'shadow-cyan-500/50',
    delay: '0.3s'
  }
]

const features = [
  {
    icon: GraduationCap,
    title: 'Academic Excellence',
    description: 'Comprehensive result management system',
    color: 'purple'
  },
  {
    icon: Trophy,
    title: 'Performance Tracking',
    description: 'Real-time analytics and insights',
    color: 'blue'
  },
  {
    icon: Star,
    title: 'Secure Platform',
    description: 'Enterprise-grade security',
    color: 'cyan'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and reliability',
    color: 'pink'
  }
]
</script>

<template>
  <div class="landing-root relative min-h-screen overflow-hidden">
    <!-- ═══════ ANIMATED BACKGROUND ═══════ -->
    <div class="neon-bg-orb" style="width: 500px; height: 500px; background: var(--neon-purple); top: -150px; left: -150px;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 400px; height: 400px; background: var(--neon-blue); top: 30%; right: -100px; animation-delay: -7s;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 350px; height: 350px; background: var(--neon-cyan); bottom: 20%; left: 5%; animation-delay: -14s;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 300px; height: 300px; background: var(--neon-pink); bottom: -100px; right: 20%; animation-delay: -10s;" aria-hidden="true"></div>
    
    <div class="grid-pattern" aria-hidden="true"></div>

    <!-- ═══════ HEADER WITH LOGO ═══════ -->
    <header class="relative z-20 border-b border-white/5 bg-gradient-to-b from-gray-900/60 to-transparent backdrop-blur-sm">
      <div class="mx-auto max-w-7xl px-6 lg:px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 overflow-hidden">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">FOLUSHO VICTORY</span>
            <span class="text-xs text-gray-400">School Management Platform</span>
          </div>
        </div>
        <button 
          @click="navigateToLogin('admin')"
          class="neon-btn text-sm px-4 py-2"
        >
          Admin Access
        </button>
      </div>
    </header>

    <!-- ═══════ FLOATING PARTICLES ═══════ -->
    <div class="particle" style="left: 10%; animation-delay: 0s;" aria-hidden="true"></div>
    <div class="particle" style="left: 25%; animation-delay: -3s; background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue);" aria-hidden="true"></div>
    <div class="particle" style="left: 40%; animation-delay: -6s; background: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan);" aria-hidden="true"></div>
    <div class="particle" style="left: 55%; animation-delay: -9s;" aria-hidden="true"></div>
    <div class="particle" style="left: 70%; animation-delay: -12s; background: var(--neon-pink); box-shadow: 0 0 10px var(--neon-pink);" aria-hidden="true"></div>
    <div class="particle" style="left: 85%; animation-delay: -15s; background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue);" aria-hidden="true"></div>

    <!-- ═══════ HERO SECTION - FULL WIDTH ═══════ -->
    <section class="hero-section relative">
      <!-- subtle academic watermark image + translucent logo -->
      <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=60&auto=format&fit=crop"
          alt="Academic background"
          class="w-full h-full object-cover opacity-30 grayscale"
        />
        <img src="/logo.png" alt="logo" class="absolute right-12 bottom-6 h-40 opacity-10 transform rotate-6" />
      </div>
      <div class="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
        <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          <!-- LEFT: Hero Content -->
          <div class="space-y-8">
            <div class="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
              <Star class="h-4 w-4 text-purple-400" />
              <span class="text-sm font-medium text-purple-300">Next-Gen School Management</span>
            </div>

            <h1 class="neon-heading text-5xl sm:text-6xl lg:text-7xl">
              <span class="block text-white">Transform</span>
              <span class="block gradient-text">Academic Excellence</span>
            </h1>

            <p class="neon-body max-w-xl text-lg">
              A powerful, modern platform for managing student results, tracking performance, and empowering educators with real-time insights.
            </p>

            <div class="flex flex-wrap gap-4">
              <button 
                @click="navigateToLogin('admin')"
                class="neon-btn group"
              >
                Get Started
                <ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button class="neon-btn neon-btn-outline">
                Learn More
              </button>
            </div>

            <!-- Stats -->
            <div class="flex gap-8 pt-4">
              <div>
                <div class="neon-heading text-3xl gradient-text">500+</div>
                <div class="text-sm text-gray-400">Students</div>
              </div>
              <div>
                <div class="neon-heading text-3xl gradient-text">50+</div>
                <div class="text-sm text-gray-400">Teachers</div>
              </div>
              <div>
                <div class="neon-heading text-3xl gradient-text">99.9%</div>
                <div class="text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Portal Cards -->
          <div class="space-y-6">
            <div 
              v-for="portal in portals" 
              :key="portal.id"
              @click="navigateToLogin(portal.id)"
              class="glass-card cursor-pointer group"
              :style="{ animationDelay: portal.delay }"
            >
              <div class="flex items-start gap-4 p-6">
                <div 
                  class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110"
                  :class="[portal.gradient, portal.glow]"
                >
                  <component :is="portal.icon" class="h-7 w-7 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="neon-heading mb-2 text-xl text-white group-hover:text-purple-300 transition-colors">
                    {{ portal.title }}
                  </h3>
                  <p class="neon-body text-sm">
                    {{ portal.description }}
                  </p>
                </div>
                <ArrowRight class="h-5 w-5 text-gray-400 transition-all group-hover:translate-x-2 group-hover:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ DIVIDER ═══════ -->
    <div class="section-divider"></div>

    <!-- ═══════ FEATURES SECTION - FULL WIDTH ═══════ -->
    <section class="hero-section py-20">
      <div class="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mb-16 text-center">
          <h2 class="neon-heading mb-4 text-4xl sm:text-5xl text-white">
            Why Choose <span class="gradient-text">Our Platform</span>
          </h2>
          <p class="neon-body mx-auto max-w-2xl text-lg">
            Built with modern technology for reliability, speed, and an exceptional user experience
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="glass-card group"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="p-6 text-center">
              <div 
                class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
                :class="[
                  feature.color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/50' : '',
                  feature.color === 'blue' ? 'from-blue-500 to-cyan-500 shadow-blue-500/50' : '',
                  feature.color === 'cyan' ? 'from-cyan-500 to-green-500 shadow-cyan-500/50' : '',
                  feature.color === 'pink' ? 'from-pink-500 to-purple-500 shadow-pink-500/50' : ''
                ]"
              >
                <component :is="feature.icon" class="h-8 w-8 text-white" />
              </div>
              <h3 class="neon-heading mb-2 text-lg text-white">
                {{ feature.title }}
              </h3>
              <p class="neon-body text-sm">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ CTA SECTION ═══════ -->
    <section class="hero-section py-20">
      <div class="relative mx-auto max-w-4xl px-6 lg:px-8">
        <div class="glass-card glass-card-purple p-12 text-center">
          <h2 class="neon-heading mb-4 text-3xl sm:text-4xl text-white">
            Ready to <span class="gradient-text">Get Started</span>?
          </h2>
          <p class="neon-body mx-auto mb-8 max-w-xl text-lg">
            Join hundreds of educators and students already using our platform
          </p>
          <button 
            @click="navigateToLogin('admin')"
            class="neon-btn neon-btn-purple text-lg px-8 py-4"
          >
            Access Your Portal
            <ArrowRight class="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════ BOTTOM NEON LINE ═══════ -->
    <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-80" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.landing-root {
  background: var(--bg-primary);
  background-image: 
    linear-gradient(135deg, rgba(10, 14, 39, 0.92), rgba(17, 22, 56, 0.95)),
    url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>
