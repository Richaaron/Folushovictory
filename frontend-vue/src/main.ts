import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    // Optionally trigger a toast notification here
  },
  onOfflineReady() {
    // App is ready to work offline
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
