import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './authStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export const useAiStore = defineStore('ai', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isOpen = ref(false)
  const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  const messageCount = computed(() => messages.value.length)
  const hasMessages = computed(() => messages.value.length > 0)

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim()) return

    const authStore = useAuthStore()
    if (!authStore.token) {
      error.value = 'Please log in to use the AI assistant'
      return
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }
    messages.value.push(userMsg)

    isLoading.value = true
    error.value = null

    try {
      // Format conversation history for API
      const conversationHistory = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await axios.post(
        `${apiEndpoint}/ai/chat`,
        {
          message: userMessage,
          conversationHistory,
        },
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      )

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.data.message,
        timestamp: Date.now(),
      }
      messages.value.push(assistantMsg)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to send message'
      // Remove the user message if API call failed
      messages.value = messages.value.filter(m => m.id !== userMsg.id)
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages() {
    messages.value = []
    error.value = null
  }

  function toggleOpen() {
    isOpen.value = !isOpen.value
  }

  function setOpen(open: boolean) {
    isOpen.value = open
  }

  return {
    messages,
    isLoading,
    error,
    isOpen,
    messageCount,
    hasMessages,
    sendMessage,
    clearMessages,
    toggleOpen,
    setOpen,
  }
})
