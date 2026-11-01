<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  CheckCircle2, 
  BarChart3,
  CalendarCheck
} from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}

const portals = [
  {
    id: 'admin',
    title: 'Admin Portal',
    badge: 'Management',
    description: 'School governance, broadsheets, staff allocations, and student records',
    icon: ShieldCheck,
    borderLeft: 'border-l-4 border-l-[#0369A1]',
    badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300 font-black',
    iconClass: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'teacher',
    title: 'Teacher Portal',
    badge: 'Faculty',
    description: 'Continuous assessment score entry, attendance, and form teacher remarks',
    icon: BookOpen,
    borderLeft: 'border-l-4 border-l-[#059669]',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black',
    iconClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    badge: 'Family',
    description: 'Monitor your ward’s terminal report sheets, grades, and academic growth',
    icon: Users,
    borderLeft: 'border-l-4 border-l-[#D97706]',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
    iconClass: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'student',
    title: 'Student Portal',
    badge: 'Learner',
    description: 'Access registered class subjects, online tests, and report card results',
    icon: GraduationCap,
    borderLeft: 'border-l-4 border-l-[#0284C7]',
    badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300 font-black',
    iconClass: 'bg-sky-100 text-sky-700',
  }
]

const features = [
  {
    icon: Award,
    title: 'Terminal Result Reports',
    description: 'Comprehensive report cards with continuous assessment breakdown and position rankings.',
    badge: 'Assessment'
  },
  {
    icon: BarChart3,
    title: 'Master Broadsheets',
    description: 'Instant class-wide broadsheets with cumulative averages and statistical distributions.',
    badge: 'Analytics'
  },
  {
    icon: CalendarCheck,
    title: 'Holistic Domains',
    description: 'Track affective domains, psychomotor traits, attendance, and form teacher remarks.',
    badge: 'Pastoral'
  },
  {
    icon: CheckCircle2,
    title: 'Secure Student Login',
    description: 'Instant result access using unique student admission numbers and secure 8-digit PINs.',
    badge: 'Security'
  }
]
</script>

<template>
  <div class="min-h-screen bg-transparent flex flex-col text-[#0F172A] antialiased">
    
    <!-- ═══════ HEADER ═══════ -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-b-[#BAE6FD] shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        
        <!-- School Brand Identity -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white p-1 border-2 border-amber-300 shadow-sm flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          <div class="min-w-0">
            <span class="text-xs sm:text-base font-black tracking-wide text-[#0C4A6E] block leading-tight truncate">
              FOLUSHO VICTORY SCHOOLS
            </span>
            <span class="text-[11px] sm:text-xs text-amber-800 font-extrabold block truncate">
              Academic Information & Results Portal
            </span>
          </div>
        </div>

        <!-- Quick Admin Link -->
        <div class="flex items-center gap-2 shrink-0">
          <button 
            @click="navigateToLogin('admin')"
            class="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 transition-all shadow-md active:scale-95"
          >
            Admin Sign In
          </button>
        </div>
      </div>
    </header>

    <!-- ═══════ MAIN CONTENT ═══════ -->
    <main class="flex-grow">
      
      <!-- HERO SECTION -->
      <section class="py-10 sm:py-16 lg:py-20">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid gap-10 lg:gap-14 lg:grid-cols-12 lg:items-center">
            
            <!-- LEFT: Hero Copy & Stats -->
            <div class="lg:col-span-6 space-y-5 sm:space-y-6">
              
              <div class="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-white/95 px-4 py-1.5 shadow-sm">
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-black text-amber-900">
                  2025/2026 Academic Session • Active
                </span>
              </div>

              <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0C4A6E] tracking-tight leading-tight">
                Inspiring Academic <span class="text-amber-600">Excellence</span> & Holistic Growth.
              </h1>

              <p class="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                Welcome to Folusho Victory Schools' unified educational portal. Designed for Pre-Nursery, Nursery, Primary, and Secondary students, parents, and educators.
              </p>

              <!-- Stat Counters -->
              <div class="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div class="bg-white/95 p-4 rounded-2xl border-2 border-[#BAE6FD] shadow-md text-center">
                  <div class="text-2xl sm:text-3xl font-black text-sky-700">350+</div>
                  <div class="text-xs text-slate-800 font-extrabold mt-0.5">Students</div>
                </div>
                <div class="bg-white/95 p-4 rounded-2xl border-2 border-[#BAE6FD] shadow-md text-center">
                  <div class="text-2xl sm:text-3xl font-black text-emerald-700">14+</div>
                  <div class="text-xs text-slate-800 font-extrabold mt-0.5">Classes</div>
                </div>
                <div class="bg-white/95 p-4 rounded-2xl border-2 border-amber-300 shadow-md text-center">
                  <div class="text-2xl sm:text-3xl font-black text-amber-600">100%</div>
                  <div class="text-xs text-slate-800 font-extrabold mt-0.5">Verified</div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Portal Selector Cards -->
            <div class="lg:col-span-6 space-y-3 sm:space-y-4">
              <div class="mb-1">
                <h2 class="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0C4A6E]">
                  Select Your Portal to Continue
                </h2>
              </div>

              <!-- Portals list -->
              <div 
                v-for="portal in portals" 
                :key="portal.id"
                @click="navigateToLogin(portal.id)"
                class="bg-white/95 p-5 rounded-2xl border-2 border-[#BAE6FD] hover:border-amber-400 shadow-md cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-between gap-3 group active:bg-sky-50"
                :class="portal.borderLeft"
              >
                <div class="flex items-center gap-4 min-w-0">
                  <div class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm" :class="portal.iconClass">
                    <component :is="portal.icon" class="h-6 w-6" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-base sm:text-lg font-black text-[#0F172A] group-hover:text-sky-700 transition-colors truncate">
                        {{ portal.title }}
                      </h3>
                      <span class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md shrink-0 shadow-sm" :class="portal.badgeClass">
                        {{ portal.badge }}
                      </span>
                    </div>
                    <p class="text-xs sm:text-sm font-bold text-slate-700 line-clamp-2">
                      {{ portal.description }}
                    </p>
                  </div>
                </div>

                <div class="h-10 w-10 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-800 group-hover:bg-sky-600 group-hover:text-white transition-all shrink-0 shadow-sm">
                  <ArrowRight class="h-5 w-5" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <!-- ═══════ SCHOOL HIGHLIGHTS ═══════ -->
      <section class="py-12 sm:py-16 bg-white/90 backdrop-blur-md border-y-2 border-[#BAE6FD]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 class="text-2xl sm:text-4xl font-black text-[#0C4A6E]">
              Designed for Complete Transparency & Trust
            </h2>
            <p class="mt-2.5 text-sm sm:text-base font-bold text-slate-700">
              Every assessment score, broadsheet calculation, and terminal grade is processed with institutional accuracy.
            </p>
          </div>

          <div class="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              v-for="(feature, idx) in features" 
              :key="idx"
              class="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#BAE6FD] hover:border-amber-400 shadow-md space-y-3 transition-all"
            >
              <div class="h-11 w-11 rounded-xl bg-sky-100 border border-sky-300 shadow-sm flex items-center justify-center text-sky-700">
                <component :is="feature.icon" class="h-6 w-6" />
              </div>
              <h3 class="text-base font-black text-[#0F172A]">
                {{ feature.title }}
              </h3>
              <p class="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="bg-white/90 backdrop-blur-md border-t-2 border-[#BAE6FD] py-6 sm:py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-700">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" class="h-7 w-7 object-contain" />
          <span class="font-black text-[#0C4A6E]">Folusho Victory Schools</span>
          <span>• Session 2025/2026</span>
        </div>
        <div class="flex items-center gap-3 font-extrabold text-amber-800">
          <span>Integrity</span>
          <span>•</span>
          <span>Discipline</span>
          <span>•</span>
          <span>Excellence</span>
        </div>
      </div>
    </footer>

  </div>
</template>
