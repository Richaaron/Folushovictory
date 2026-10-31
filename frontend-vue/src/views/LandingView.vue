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
    borderLeft: 'border-l-4 border-l-[#1E3A8A]',
    badgeClass: 'bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]',
    iconClass: 'bg-[#EFF6FF] text-[#1E3A8A]',
  },
  {
    id: 'teacher',
    title: 'Teacher Portal',
    badge: 'Faculty',
    description: 'Continuous assessment score entry, attendance, and form teacher remarks',
    icon: BookOpen,
    borderLeft: 'border-l-4 border-l-[#059669]',
    badgeClass: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    iconClass: 'bg-[#ECFDF5] text-[#059669]',
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    badge: 'Family',
    description: 'Monitor your ward’s terminal report sheets, grades, and academic growth',
    icon: Users,
    borderLeft: 'border-l-4 border-l-[#D97706]',
    badgeClass: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
    iconClass: 'bg-[#FFFBEB] text-[#D97706]',
  },
  {
    id: 'student',
    title: 'Student Portal',
    badge: 'Learner',
    description: 'Access registered class subjects, online tests, and report card results',
    icon: GraduationCap,
    borderLeft: 'border-l-4 border-l-[#2563EB]',
    badgeClass: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
    iconClass: 'bg-[#EFF6FF] text-[#2563EB]',
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
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col text-[#1E293B] antialiased">
    
    <!-- ═══════ HEADER ═══════ -->
    <header class="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        
        <!-- School Brand Identity -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white p-1 border border-[#E2E8F0] shadow-sm flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          <div class="min-w-0">
            <span class="text-xs sm:text-base font-extrabold tracking-wide text-[#0F172A] block leading-tight truncate">
              FOLUSHO VICTORY SCHOOLS
            </span>
            <span class="text-[11px] sm:text-xs text-[#475569] font-medium block truncate">
              Academic Information & Results Portal
            </span>
          </div>
        </div>

        <!-- Quick Admin Link -->
        <div class="flex items-center gap-2 shrink-0">
          <button 
            @click="navigateToLogin('admin')"
            class="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] transition-all shadow-sm active:scale-95"
          >
            Admin Sign In
          </button>
        </div>
      </div>
    </header>

    <!-- ═══════ MAIN CONTENT ═══════ -->
    <main class="flex-grow">
      
      <!-- HERO SECTION -->
      <section class="py-8 sm:py-14 lg:py-18">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-center">
            
            <!-- LEFT: Hero Copy & Stats -->
            <div class="lg:col-span-6 space-y-5 sm:space-y-6">
              
              <div class="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-3.5 py-1.5 shadow-sm">
                <span class="h-2 w-2 rounded-full bg-[#059669]"></span>
                <span class="text-xs font-bold text-[#0F172A]">
                  2025/2026 Academic Session • Active
                </span>
              </div>

              <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
                Inspiring Academic Excellence & Holistic Growth.
              </h1>

              <p class="text-sm sm:text-base text-[#334155] leading-relaxed">
                Welcome to Folusho Victory Schools' unified educational portal. Designed for Pre-Nursery, Nursery, Primary, and Secondary students, parents, and educators.
              </p>

              <!-- Stat Counters -->
              <div class="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm text-center">
                  <div class="text-xl sm:text-2xl font-black text-[#1E3A8A]">350+</div>
                  <div class="text-[11px] sm:text-xs text-[#475569] font-bold mt-0.5">Students</div>
                </div>
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm text-center">
                  <div class="text-xl sm:text-2xl font-black text-[#059669]">14+</div>
                  <div class="text-[11px] sm:text-xs text-[#475569] font-bold mt-0.5">Classes</div>
                </div>
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E2E8F0] shadow-sm text-center">
                  <div class="text-xl sm:text-2xl font-black text-[#D97706]">100%</div>
                  <div class="text-[11px] sm:text-xs text-[#475569] font-bold mt-0.5">Verified</div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Portal Selector Cards -->
            <div class="lg:col-span-6 space-y-3 sm:space-y-3.5">
              <div class="mb-1">
                <h2 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#475569]">
                  Select Your Portal to Continue
                </h2>
              </div>

              <!-- Portals list -->
              <div 
                v-for="portal in portals" 
                :key="portal.id"
                @click="navigateToLogin(portal.id)"
                class="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-sm cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md flex items-center justify-between gap-3 group active:bg-[#F8FAFC]"
                :class="portal.borderLeft"
              >
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0" :class="portal.iconClass">
                    <component :is="portal.icon" class="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <h3 class="text-sm sm:text-base font-extrabold text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors truncate">
                        {{ portal.title }}
                      </h3>
                      <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0" :class="portal.badgeClass">
                        {{ portal.badge }}
                      </span>
                    </div>
                    <p class="text-xs text-[#475569] line-clamp-2">
                      {{ portal.description }}
                    </p>
                  </div>
                </div>

                <div class="h-9 w-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#475569] group-hover:bg-[#1E3A8A] group-hover:text-white transition-all shrink-0">
                  <ArrowRight class="h-4 w-4" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <!-- ═══════ SCHOOL HIGHLIGHTS ═══════ -->
      <section class="py-10 sm:py-14 bg-white border-y border-[#E2E8F0]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 class="text-xl sm:text-3xl font-black text-[#0F172A]">
              Designed for Complete Transparency & Trust
            </h2>
            <p class="mt-2 text-xs sm:text-sm text-[#475569]">
              Every assessment score, broadsheet calculation, and terminal grade is processed with institutional accuracy.
            </p>
          </div>

          <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              v-for="(feature, idx) in features" 
              :key="idx"
              class="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
            >
              <div class="h-10 w-10 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#1E3A8A]">
                <component :is="feature.icon" class="h-5 w-5" />
              </div>
              <h3 class="text-sm sm:text-base font-bold text-[#0F172A]">
                {{ feature.title }}
              </h3>
              <p class="text-xs text-[#475569] leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="bg-[#F8FAFC] border-t border-[#E2E8F0] py-6 sm:py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" class="h-6 w-6 object-contain" />
          <span class="font-extrabold text-[#0F172A]">Folusho Victory Schools</span>
          <span>• Session 2025/2026</span>
        </div>
        <div class="flex items-center gap-3 font-semibold text-[#64748B]">
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
