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
  Sparkles,
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
    description: 'Institution governance, broadsheets, staff, and student records',
    icon: ShieldCheck,
    accentBorder: 'border-l-4 border-l-[#1A4D8F]',
    iconBg: 'bg-[#1A4D8F]/10 text-[#1A4D8F]',
    hoverBg: 'hover:border-[#1A4D8F]/40'
  },
  {
    id: 'teacher',
    title: 'Teacher Portal',
    badge: 'Faculty',
    description: 'Score entry, attendance, form class remarks, and activities',
    icon: BookOpen,
    accentBorder: 'border-l-4 border-l-[#2D6A4F]',
    iconBg: 'bg-[#2D6A4F]/10 text-[#2D6A4F]',
    hoverBg: 'hover:border-[#2D6A4F]/40'
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    badge: 'Family',
    description: 'Track academic performance, report cards, and school notices',
    icon: Users,
    accentBorder: 'border-l-4 border-l-[#E8A838]',
    iconBg: 'bg-[#E8A838]/15 text-[#C98818]',
    hoverBg: 'hover:border-[#E8A838]/40'
  },
  {
    id: 'student',
    title: 'Student Portal',
    badge: 'Learners',
    description: 'View term report sheets, learning tasks, and academic standing',
    icon: GraduationCap,
    accentBorder: 'border-l-4 border-l-[#2B6CB0]',
    iconBg: 'bg-[#2B6CB0]/10 text-[#2B6CB0]',
    hoverBg: 'hover:border-[#2B6CB0]/40'
  }
]

const features = [
  {
    icon: Award,
    title: 'Academic Excellence',
    description: 'Curriculum-aligned grading, broadsheets, and automatic position ranking.',
    badge: 'Assessment'
  },
  {
    icon: BarChart3,
    title: 'Real-time Broadsheets',
    description: 'Full class result sheets with term averages and instant PDF reports.',
    badge: 'Analytics'
  },
  {
    icon: CalendarCheck,
    title: 'Holistic Student Records',
    description: 'Track psychomotor traits, affective domains, attendance, and remarks.',
    badge: 'Records'
  },
  {
    icon: CheckCircle2,
    title: 'Direct Parent Access',
    description: 'Parents verify grades and term reports seamlessly with secure PIN access.',
    badge: 'Community'
  }
]
</script>

<template>
  <div class="landing-root min-h-screen bg-[#F7F4EE] flex flex-col text-[#1C1917]">
    <!-- ═══════ HEADER ═══════ -->
    <header class="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E0D8]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white p-1 border border-[#E5E0D8] shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          <div>
            <span class="text-xs sm:text-sm font-extrabold tracking-wider text-[#1A4D8F] uppercase block leading-tight">
              FOLUSHO VICTORY SCHOOLS
            </span>
            <span class="text-[10px] sm:text-xs text-[#6B7280] font-medium block">
              Academic Information & Results Portal
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="navigateToLogin('admin')"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1A4D8F] bg-[#1A4D8F]/10 hover:bg-[#1A4D8F]/15 transition-colors"
          >
            Admin Sign In
          </button>
        </div>
      </div>
    </header>

    <!-- ═══════ HERO SECTION ═══════ -->
    <main class="flex-grow">
      <section class="py-10 sm:py-16 lg:py-20">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            <!-- LEFT: Hero Branding -->
            <div class="lg:col-span-6 space-y-6">
              <div class="inline-flex items-center gap-2 rounded-full border border-[#E8A838]/40 bg-[#E8A838]/10 px-3.5 py-1.5">
                <Sparkles class="h-3.5 w-3.5 text-[#C98818]" />
                <span class="text-xs font-semibold text-[#8C5D07]">
                  Folusho Victory Academy • Term Results & Portals
                </span>
              </div>

              <h1 class="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-[#1C1917] leading-[1.15]">
                Empowering Students, 
                <span class="text-[#1A4D8F]">Inspiring Excellence</span> & Supporting Growth.
              </h1>

              <p class="text-base sm:text-lg text-[#4B5563] leading-relaxed">
                Welcome to Folusho Victory Schools' unified academic portal. Access term performance, verify reports, manage curriculum activities, and collaborate effortlessly.
              </p>

              <!-- Stat Badges -->
              <div class="pt-3 grid grid-cols-3 gap-4 border-t border-[#E5E0D8]">
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
                  <div class="text-xl sm:text-2xl font-black text-[#1A4D8F]">350+</div>
                  <div class="text-[11px] sm:text-xs text-[#6B7280] font-medium">Students Enrolled</div>
                </div>
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
                  <div class="text-xl sm:text-2xl font-black text-[#2D6A4F]">9+</div>
                  <div class="text-[11px] sm:text-xs text-[#6B7280] font-medium">Class Levels</div>
                </div>
                <div class="bg-white p-3 sm:p-4 rounded-xl border border-[#E5E0D8] shadow-sm">
                  <div class="text-xl sm:text-2xl font-black text-[#E8A838]">100%</div>
                  <div class="text-[11px] sm:text-xs text-[#6B7280] font-medium">Verified Records</div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Portal Cards -->
            <div class="lg:col-span-6 space-y-3.5">
              <div class="mb-2">
                <h2 class="text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                  Select Your Portal
                </h2>
              </div>

              <div 
                v-for="portal in portals" 
                :key="portal.id"
                @click="navigateToLogin(portal.id)"
                class="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E0D8] shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex items-center justify-between gap-4 group"
                :class="[portal.accentBorder, portal.hoverBg]"
              >
                <div class="flex items-center gap-4">
                  <div class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" :class="portal.iconBg">
                    <component :is="portal.icon" class="h-6 w-6" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 mb-0.5">
                      <h3 class="text-base sm:text-lg font-bold text-[#1C1917] group-hover:text-[#1A4D8F] transition-colors">
                        {{ portal.title }}
                      </h3>
                      <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#F3EFE7] text-[#6B7280]">
                        {{ portal.badge }}
                      </span>
                    </div>
                    <p class="text-xs sm:text-sm text-[#4B5563]">
                      {{ portal.description }}
                    </p>
                  </div>
                </div>

                <div class="h-9 w-9 rounded-full bg-[#F7F4EE] flex items-center justify-center text-[#6B7280] group-hover:bg-[#1A4D8F] group-hover:text-white transition-all shrink-0">
                  <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ HIGHLIGHTS SECTION ═══════ -->
      <section class="py-12 bg-white border-y border-[#E5E0D8]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-10">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
              Designed for Nigerian Schools & Academic Excellence
            </h2>
            <p class="mt-2 text-sm sm:text-base text-[#6B7280]">
              Built with precision for Pre-Nursery through Secondary classes, providing reliable assessment and student transparency.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div 
              v-for="(feature, idx) in features" 
              :key="idx"
              class="p-5 rounded-2xl bg-[#F7F4EE] border border-[#E5E0D8] space-y-3"
            >
              <div class="h-10 w-10 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-center text-[#1A4D8F]">
                <component :is="feature.icon" class="h-5 w-5" />
              </div>
              <h3 class="text-base font-bold text-[#1C1917]">
                {{ feature.title }}
              </h3>
              <p class="text-xs text-[#4B5563] leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="bg-[#F7F4EE] border-t border-[#E5E0D8] py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" class="h-6 w-6 object-contain" />
          <span class="font-bold text-[#1C1917]">Folusho Victory Schools</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div class="flex items-center gap-4 font-medium">
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
