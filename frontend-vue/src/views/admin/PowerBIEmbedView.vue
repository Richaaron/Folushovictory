<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../../services/api'
import * as pbi from 'powerbi-client'

const embedContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')
const embedMeta = ref<{ reportId?: string; workspaceId?: string; tokenExpiration?: string | null; embedUrl?: string }>({})

let powerbiService: pbi.service.Service | null = null
let embeddedReport: pbi.Embed | null = null

async function fetchEmbedInfo() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get('/api/admin/powerbi/embed')
    embedMeta.value = {
      reportId: data.reportId,
      workspaceId: data.workspaceId,
      tokenExpiration: data.tokenExpiration,
      embedUrl: data.embedUrl
    }
    await renderPowerBI(data)
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Unable to load Power BI embed configuration.'
  } finally {
    loading.value = false
  }
}

function destroyEmbed() {
  if (embeddedReport && embedContainer.value && powerbiService) {
    powerbiService.reset(embedContainer.value)
    embeddedReport = null
  }
}

async function renderPowerBI(data: any) {
  if (!embedContainer.value) return

  destroyEmbed()

  if (!powerbiService) {
    powerbiService = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    )
  }

  const config: pbi.IEmbedConfiguration = {
    type: 'report',
    tokenType: pbi.models.TokenType.Embed,
    accessToken: data.embedToken,
    embedUrl: data.embedUrl,
    id: data.reportId,
    permissions: pbi.models.Permissions.Read,
    viewMode: pbi.models.ViewMode.View,
    settings: {
      filterPaneEnabled: false,
      navContentPaneEnabled: true,
      panes: {
        filters: { visible: false }
      }
    }
  }

  embeddedReport = powerbiService.embed(embedContainer.value, config)
}

const refreshEmbed = async () => {
  await fetchEmbedInfo()
}

onMounted(async () => {
  await fetchEmbedInfo()
})

onBeforeUnmount(() => {
  destroyEmbed()
})
</script>

<template>
  <div class="space-y-6 py-4 sm:py-8">
    <section class="rounded-[1.5rem] border border-[#C9A84C]/15 bg-[#1B2A4A]/40 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[11px] uppercase tracking-[0.35em] text-[#C9A84C]/70">Power BI Embed</p>
          <h1 class="text-3xl font-black text-[#F5F0E8]">Live embedded report</h1>
          <p class="max-w-2xl text-sm leading-relaxed text-[#F5F0E8]/60">
            Securely load the configured Power BI report using server-side token generation. This view keeps the embed token on the backend and renders the report in the admin console.
          </p>
        </div>
        <button
          class="btn-primary inline-flex items-center justify-center rounded-2xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#111827] shadow-lg shadow-[#C9A84C]/10 transition hover:bg-[#b59c4d]"
          @click="refreshEmbed"
          :disabled="loading"
        >
          {{ loading ? 'Reloading...' : 'Refresh Report' }}
        </button>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section class="rounded-[1.5rem] border border-[#C9A84C]/10 bg-[#11203A]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <p class="text-[10px] uppercase tracking-[0.35em] text-[#C9A84C]/60">Report details</p>
        <div class="mt-5 space-y-4 text-sm text-[#F5F0E8]/80">
          <div>
            <span class="block text-[#F5F0E8]/70">Report ID</span>
            <span class="block break-all text-[#F5F0E8]">{{ embedMeta.reportId || 'Not available' }}</span>
          </div>
          <div>
            <span class="block text-[#F5F0E8]/70">Workspace ID</span>
            <span class="block break-all text-[#F5F0E8]">{{ embedMeta.workspaceId || 'Not available' }}</span>
          </div>
          <div>
            <span class="block text-[#F5F0E8]/70">Token expires</span>
            <span class="block text-[#F5F0E8]">{{ embedMeta.tokenExpiration || 'Not available' }}</span>
          </div>
          <div>
            <span class="block text-[#F5F0E8]/70">Embed URL</span>
            <a
              v-if="embedMeta.embedUrl"
              :href="embedMeta.embedUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[#C9A84C] underline"
            >Open report in Power BI</a>
            <span v-else class="text-[#F5F0E8]">Not available</span>
          </div>
        </div>
      </section>

      <section class="rounded-[1.5rem] border border-[#C9A84C]/10 bg-[#0F1830]/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div class="mb-4 flex items-center justify-between gap-4">
          <p class="text-sm font-semibold text-[#F5F0E8]">Embedded report preview</p>
          <span class="rounded-full bg-[#C9A84C]/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#C9A84C]/80">
            Secure token
          </span>
        </div>

        <div class="rounded-3xl border border-[#C9A84C]/10 bg-[#0A1224] p-2 min-h-[640px]">
          <div v-if="loading" class="flex h-full items-center justify-center rounded-3xl text-sm text-[#F5F0E8]/60">
            Loading Power BI report…
          </div>
          <div v-else-if="error" class="flex h-full items-center justify-center rounded-3xl px-4 text-sm text-rose-300">
            {{ error }}
          </div>
          <div v-else ref="embedContainer" class="h-[640px] w-full rounded-3xl overflow-hidden bg-[#04090f]" />
        </div>
      </section>
    </div>
  </div>
</template>
