<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ShieldCheck, Star, Zap } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}
</script>

<template>
  <div class="landing-root relative min-h-screen overflow-hidden text-white">

    <!-- ═══════ AMBIENT BACKDROP ORBS ═══════ -->
    <div class="orb orb-purple" aria-hidden="true"></div>
    <div class="orb orb-gold" aria-hidden="true"></div>
    <div class="orb orb-violet-mid" aria-hidden="true"></div>

    <!-- ═══════ ANIMATED GRID OVERLAY ═══════ -->
    <div class="grid-overlay" aria-hidden="true"></div>

    <!-- ═══════ ACADEMIC BACKGROUND LAYER ═══════ -->
    <div class="academic-bg" aria-hidden="true">

      <!-- Ruled notebook lines -->
      <div class="ruled-lines"></div>

      <!-- Floating Math & Academic Symbols -->
      <span class="acad-symbol" style="top:8%;left:4%;font-size:2.2rem;animation-delay:0s;animation-duration:18s;">∑</span>
      <span class="acad-symbol" style="top:14%;left:88%;font-size:1.6rem;animation-delay:2s;animation-duration:22s;">π</span>
      <span class="acad-symbol" style="top:30%;left:92%;font-size:2rem;animation-delay:4s;animation-duration:20s;">√</span>
      <span class="acad-symbol" style="top:55%;left:6%;font-size:1.8rem;animation-delay:1s;animation-duration:24s;">∞</span>
      <span class="acad-symbol" style="top:72%;left:90%;font-size:1.5rem;animation-delay:3s;animation-duration:19s;">Δ</span>
      <span class="acad-symbol" style="top:85%;left:12%;font-size:2rem;animation-delay:5s;animation-duration:21s;">∫</span>
      <span class="acad-symbol" style="top:20%;left:48%;font-size:1.4rem;animation-delay:6s;animation-duration:26s;">θ</span>
      <span class="acad-symbol" style="top:65%;left:50%;font-size:1.6rem;animation-delay:0.5s;animation-duration:23s;">λ</span>
      <span class="acad-symbol" style="top:42%;left:2%;font-size:1.3rem;animation-delay:7s;animation-duration:17s;">α</span>
      <span class="acad-symbol" style="top:90%;left:75%;font-size:1.7rem;animation-delay:2.5s;animation-duration:25s;">β</span>

      <!-- Floating formula strings -->
      <span class="acad-formula" style="top:6%;left:20%;animation-delay:1s;animation-duration:20s;">E = mc²</span>
      <span class="acad-formula" style="top:35%;left:78%;animation-delay:3s;animation-duration:24s;">F = ma</span>
      <span class="acad-formula" style="top:78%;left:22%;animation-delay:0s;animation-duration:22s;">a² + b² = c²</span>
      <span class="acad-formula" style="top:50%;left:85%;animation-delay:5s;animation-duration:18s;">V = IR</span>
      <span class="acad-formula" style="top:92%;left:45%;animation-delay:2s;animation-duration:26s;">PV = nRT</span>
      <span class="acad-formula" style="top:18%;left:62%;animation-delay:4s;animation-duration:21s;">y = mx + c</span>

      <!-- Floating academic icons (SVG paths as decorative shapes) -->
      <!-- Graduation Cap icon -->
      <svg class="acad-icon" style="top:10%;left:72%;animation-delay:0s;animation-duration:20s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
      </svg>
      <!-- Book icon -->
      <svg class="acad-icon" style="top:48%;left:94%;animation-delay:2s;animation-duration:22s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <!-- Pencil icon -->
      <svg class="acad-icon" style="top:80%;left:5%;animation-delay:3s;animation-duration:19s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
      <!-- Atom icon -->
      <svg class="acad-icon" style="top:25%;left:8%;animation-delay:1.5s;animation-duration:24s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <circle cx="12" cy="12" r="1"/>
        <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/>
        <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
      </svg>
      <!-- Chart/bar icon -->
      <svg class="acad-icon" style="top:60%;left:1%;animation-delay:4s;animation-duration:21s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>

      <!-- Sparkle dots scattered around -->
      <span class="sparkle" style="top:5%;left:35%;"></span>
      <span class="sparkle" style="top:22%;left:55%;animation-delay:0.8s;"></span>
      <span class="sparkle" style="top:40%;left:15%;animation-delay:1.6s;"></span>
      <span class="sparkle" style="top:58%;left:70%;animation-delay:0.4s;"></span>
      <span class="sparkle" style="top:75%;left:40%;animation-delay:1.2s;"></span>
      <span class="sparkle" style="top:88%;left:60%;animation-delay:2s;"></span>
      <span class="sparkle" style="top:15%;left:80%;animation-delay:0.6s;"></span>
      <span class="sparkle gold" style="top:33%;left:30%;animation-delay:1s;"></span>
      <span class="sparkle gold" style="top:66%;left:82%;animation-delay:1.4s;"></span>
      <span class="sparkle gold" style="top:50%;left:45%;animation-delay:0.2s;"></span>
    </div>

    <!-- ═══════ TOP GOLD HAIRLINE ═══════ -->
    <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-10" aria-hidden="true"></div>

    <!-- ═══════ MAIN CONTENT ═══════ -->
    <div class="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-16 lg:px-8 lg:py-20 z-10">

      <!-- Hero Grid -->
      <div class="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">

        <!-- ── LEFT COLUMN ── -->
        <section class="space-y-6 animate-fade-in-up">

          <!-- Hero Card -->
          <div class="hero-card group">
            <!-- Card top shimmer line -->
            <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-amber-500/60 via-violet-500/40 to-amber-500/60 rounded-t-[2rem]" aria-hidden="true"></div>
            <!-- Corner glow -->
            <div class="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl group-hover:bg-violet-600/20 transition-all duration-700" aria-hidden="true"></div>
            <div class="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-amber-500/8 blur-2xl" aria-hidden="true"></div>

            <div class="relative z-10 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
              <!-- Logo Badge -->
              <div class="logo-badge">
                <div class="logo-ring"></div>
                <img src="/logo.png" alt="Folusho Victory Schools logo" class="relative z-10 h-14 w-14 object-contain drop-shadow-lg" />
              </div>

              <!-- Headline -->
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <div class="h-[1px] w-8 bg-gradient-to-r from-amber-400 to-transparent"></div>
                  <p class="text-[9px] font-black uppercase tracking-[0.4em] text-amber-400">Welcome to</p>
                </div>
                <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
                  Folusho <span class="gold-text">Victory</span><br />School
                </h1>
                <p class="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                  A refined portal for academic result management, school operations, and guardian engagement — engineered with royal precision and executive clarity.
                </p>
              </div>
            </div>

            <!-- Portal Buttons -->
            <div class="relative z-10 mt-10 grid gap-3 sm:grid-cols-3">
              <button
                @click="navigateToLogin('admin')"
                id="btn-admin-portal"
                class="portal-btn portal-btn-purple shimmer-btn"
                aria-label="Go to Admin Portal"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping flex-shrink-0"></span>
                Admin Portal
              </button>

              <button
                @click="navigateToLogin('teacher')"
                id="btn-teacher-portal"
                class="portal-btn portal-btn-gold shimmer-btn"
                aria-label="Go to Teacher Portal"
              >
                Teacher Portal
              </button>

              <button
                @click="navigateToLogin('parent')"
                id="btn-parent-portal"
                class="portal-btn portal-btn-silver shimmer-btn"
                aria-label="Go to Parental Access"
              >
                Parental Access
                <ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Bottom Info Cards -->
          <div class="grid gap-4 sm:grid-cols-2 animate-fade-in-up-stagger-2">
            <article class="info-card group">
              <div class="info-card-icon group-hover:text-amber-400 transition-colors duration-300">
                <Star class="w-4 h-4" aria-hidden="true" />
              </div>
              <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Trusted Heritage</p>
              <h2 class="text-base font-black text-white leading-tight mb-2">School tradition meets digital speed.</h2>
              <p class="text-xs leading-6 text-slate-400">Keep every result, attendance update, and administrative action in one secure portal.</p>
            </article>

            <article class="info-card group">
              <div class="info-card-icon group-hover:text-violet-400 transition-colors duration-300">
                <Zap class="w-4 h-4" aria-hidden="true" />
              </div>
              <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Modern Learning</p>
              <h2 class="text-base font-black text-white leading-tight mb-2">Instant insights for teaching staff.</h2>
              <p class="text-xs leading-6 text-slate-400">A polished hub for assignments, student progress, and parent communication.</p>
            </article>
          </div>
        </section>

        <!-- ── RIGHT COLUMN ── -->
        <section class="relative self-start animate-fade-in-up-stagger-1">

          <!-- Main Trust Card -->
          <div class="trust-card group">
            <!-- Decorative inner orbs -->
            <div class="absolute -right-8 top-8 h-28 w-28 rounded-full bg-violet-600/8 blur-3xl group-hover:bg-violet-600/15 transition-all duration-700" aria-hidden="true"></div>
            <div class="absolute -left-6 bottom-8 h-20 w-20 rounded-full bg-amber-500/8 blur-3xl" aria-hidden="true"></div>

            <!-- Trust badge -->
            <div class="relative z-10 rounded-[1.75rem] border border-amber-500/15 bg-black/60 p-6 mb-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
              <div class="flex items-center gap-4">
                <div class="trust-icon-box">
                  <ShieldCheck class="h-6 w-6 text-amber-300" aria-hidden="true" />
                </div>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Why This Portal</p>
                  <h2 class="mt-1.5 text-xl font-black text-white leading-tight">Trusted for academic <span class="gold-text">control.</span></h2>
                </div>
              </div>
            </div>

            <!-- Feature list -->
            <div class="relative z-10 space-y-3">
              <article class="feature-row group/row">
                <span class="feature-num">01</span>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Authority</p>
                  <p class="text-sm leading-6 text-slate-300">A premium gateway for administrators, teachers, and families.</p>
                </div>
              </article>

              <article class="feature-row group/row">
                <span class="feature-num">02</span>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Clarity</p>
                  <p class="text-sm leading-6 text-slate-300">Every result and report presented with clean visual hierarchy.</p>
                </div>
              </article>

              <article class="feature-row group/row">
                <span class="feature-num">03</span>
                <div>
                  <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Harmony</p>
                  <p class="text-sm leading-6 text-slate-300">Elegant access for school leaders, educators, and guardians.</p>
                </div>
              </article>
            </div>

            <!-- Bottom stat strip -->
            <div class="relative z-10 mt-6 grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-5">
              <div class="text-center">
                <p class="text-xl font-black gold-text">290+</p>
                <p class="text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-1">Students</p>
              </div>
              <div class="text-center border-x border-slate-800/60">
                <p class="text-xl font-black text-violet-300">20+</p>
                <p class="text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-1">Faculty</p>
              </div>
              <div class="text-center">
                <p class="text-xl font-black text-slate-300">15+</p>
                <p class="text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-1">Classes</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>

    <!-- ═══════ BOTTOM FOOTER STRIP ═══════ -->
    <div class="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" aria-hidden="true"></div>
    <div class="absolute bottom-4 inset-x-0 text-center z-10">
      <p class="text-[9px] uppercase tracking-[0.35em] text-slate-600">© Folusho Victory Schools · Academic Portal</p>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════
   ROOT & BACKGROUND
═══════════════════════════════ */
.landing-root {
  background: #030206;
}

/* ═══════════════════════════════
   ACADEMIC BACKGROUND LAYER
═══════════════════════════════ */
.academic-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

/* Notebook ruled lines */
.ruled-lines {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent,
    transparent 38px,
    rgba(139, 92, 246, 0.04) 38px,
    rgba(139, 92, 246, 0.04) 39px
  );
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
}

/* Floating math symbols */
.acad-symbol {
  position: absolute;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 700;
  color: rgba(212, 175, 55, 0.07);
  user-select: none;
  animation: acad-float linear infinite;
  letter-spacing: 0;
}

/* Floating formula text */
.acad-formula {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(139, 92, 246, 0.09);
  user-select: none;
  animation: acad-float linear infinite;
  white-space: nowrap;
}

/* Floating SVG icons */
.acad-icon {
  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(212, 175, 55, 0.07);
  user-select: none;
  animation: acad-float linear infinite;
}

/* Float drift keyframes */
@keyframes acad-float {
  0%   { transform: translateY(0px) rotate(0deg);   opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translateY(-18px) rotate(4deg); opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(0px) rotate(0deg);   opacity: 0; }
}

/* Sparkle dots */
.sparkle {
  position: absolute;
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.25);
  animation: sparkle-blink 3s ease-in-out infinite;
}

.sparkle.gold {
  background: rgba(212, 175, 55, 0.35);
  width: 4px;
  height: 4px;
  box-shadow: 0 0 6px rgba(212, 175, 55, 0.4);
}

@keyframes sparkle-blink {
  0%, 100% { opacity: 0;    transform: scale(0.6); }
  50%       { opacity: 1;    transform: scale(1.4); }
}

/* ═══════════════════════════════
   AMBIENT ORBS
═══════════════════════════════ */
.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(120px);
}

.orb-purple {
  width: 700px;
  height: 700px;
  top: -180px;
  left: -150px;
  background: radial-gradient(circle, rgba(109, 40, 217, 0.18), transparent 70%);
  animation: orb-drift 18s ease-in-out infinite alternate;
}

.orb-gold {
  width: 600px;
  height: 600px;
  bottom: -150px;
  right: -100px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.12), transparent 70%);
  animation: orb-drift 22s ease-in-out infinite alternate-reverse;
}

.orb-violet-mid {
  width: 400px;
  height: 400px;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(139, 92, 246, 0.07), transparent 70%);
  animation: orb-pulse 14s ease-in-out infinite;
}

@keyframes orb-drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 30px) scale(1.08); }
}

@keyframes orb-pulse {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.12); }
}

/* ═══════════════════════════════
   ANIMATED GRID OVERLAY
═══════════════════════════════ */
.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(139, 92, 246, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  animation: grid-scroll 30s linear infinite;
}

@keyframes grid-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 60px 60px; }
}

/* ═══════════════════════════════
   FADE-IN ANIMATIONS
═══════════════════════════════ */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in-up-stagger-1 {
  opacity: 0;
  animation: fade-in-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
}

.animate-fade-in-up-stagger-2 {
  opacity: 0;
  animation: fade-in-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
}

/* ═══════════════════════════════
   GOLD TEXT GRADIENT
═══════════════════════════════ */
.gold-text {
  background: linear-gradient(135deg, #d4af37, #fbbf24, #f3d86b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ═══════════════════════════════
   HERO CARD
═══════════════════════════════ */
.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(212, 175, 55, 0.15);
  background: rgba(5, 3, 9, 0.78);
  padding: 2.5rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}

.hero-card:hover {
  border-color: rgba(212, 175, 55, 0.28);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.65), 0 0 60px rgba(139, 92, 246, 0.08);
}

/* ═══════════════════════════════
   LOGO BADGE
═══════════════════════════════ */
.logo-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 6rem;
  width: 6rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(139, 92, 246, 0.08);
  flex-shrink: 0;
}

.logo-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(212, 175, 55, 0.5), rgba(139, 92, 246, 0.3), rgba(212, 175, 55, 0), rgba(212, 175, 55, 0.5));
  animation: logo-spin 8s linear infinite;
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
}

@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ═══════════════════════════════
   PORTAL BUTTONS
═══════════════════════════════ */
.portal-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.portal-btn:hover {
  transform: translateY(-2px);
}

.portal-btn:active {
  transform: scale(0.97);
}

.portal-btn-purple {
  background: linear-gradient(135deg, #6d28d9, #7c3aed, #4c1d95);
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 8px 24px rgba(109, 40, 217, 0.35);
}

.portal-btn-purple:hover {
  box-shadow: 0 12px 36px rgba(109, 40, 217, 0.55), 0 0 20px rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.portal-btn-gold {
  background: linear-gradient(135deg, #d4af37, #fbbf24, #f59e0b);
  color: #0a0710;
  border: 1px solid rgba(212, 175, 55, 0.5);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
}

.portal-btn-gold:hover {
  box-shadow: 0 12px 36px rgba(212, 175, 55, 0.5);
}

.portal-btn-silver {
  background: rgba(0, 0, 0, 0.5);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.portal-btn-silver:hover {
  color: #fff;
  border-color: rgba(212, 175, 55, 0.35);
  background: rgba(139, 92, 246, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

/* Shimmer sweep */
.shimmer-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
  transform: skewX(-20deg);
}

.shimmer-btn:hover::after {
  animation: shimmer-sweep 0.8s ease-in-out forwards;
}

@keyframes shimmer-sweep {
  0%   { left: -100%; }
  100% { left: 150%; }
}

/* ═══════════════════════════════
   INFO CARDS (bottom 2)
═══════════════════════════════ */
.info-card {
  position: relative;
  border-radius: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(5, 3, 9, 0.65);
  padding: 1.5rem;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  transition: border-color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
  overflow: hidden;
}

.info-card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateY(-3px);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.55), 0 0 20px rgba(139, 92, 246, 0.07);
}

.info-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  color: #94a3b8;
  margin-bottom: 1rem;
}

/* ═══════════════════════════════
   TRUST CARD (right column)
═══════════════════════════════ */
.trust-card {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.18);
  background: rgba(5, 3, 9, 0.75);
  padding: 2rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  transition: border-color 0.4s ease;
}

.trust-card:hover {
  border-color: rgba(212, 175, 55, 0.2);
}

.trust-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3.5rem;
  width: 3.5rem;
  flex-shrink: 0;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.3), rgba(0, 0, 0, 0.8));
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 0 18px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* ═══════════════════════════════
   FEATURE ROWS
═══════════════════════════════ */
.feature-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: start;
  padding: 1rem 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.06);
  background: rgba(0, 0, 0, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-row:hover {
  border-color: rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.05);
  transform: translateX(4px);
}

.feature-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.2), rgba(0, 0, 0, 0.6));
  border: 1px solid rgba(212, 175, 55, 0.15);
  font-size: 0.7rem;
  font-weight: 900;
  color: #d4af37;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

/* ═══════════════════════════════
   RESPONSIVE
═══════════════════════════════ */
@media (max-width: 640px) {
  .portal-btn {
    width: 100%;
  }

  .hero-card {
    padding: 1.5rem;
  }
}

/* Academic Background Image for Landing Page */
.landing-root {
  background-image: 
    linear-gradient(135deg, rgba(88, 28, 135, 0.85), rgba(30, 27, 75, 0.90)),
    url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>
