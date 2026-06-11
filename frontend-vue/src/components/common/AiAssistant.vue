<template>
  <div class="ai-assistant-container">
    <!-- Chat Button -->
    <button
      @click="toggleOpen"
      class="chat-toggle-btn"
      :class="{ 'is-open': isOpen }"
      :title="isOpen ? 'Close AI Assistant' : 'Open AI Assistant'"
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span v-if="messageCount > 0" class="badge">{{ messageCount }}</span>
    </button>

    <!-- Sidebar Panel -->
    <div class="chat-sidebar" :class="{ 'is-open': isOpen }">
      <!-- Header -->
      <div class="chat-header">
        <h2>AI Assistant</h2>
        <button @click="toggleOpen" class="close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!hasMessages" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <p class="empty-title">Welcome to AI Assistant</p>
          <p class="empty-desc">Ask me anything about your studies, assignments, or school matters!</p>
        </div>

        <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.role">
          <div class="message-avatar">
            <span v-if="msg.role === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-bubble">
            <p class="message-text">{{ msg.content }}</p>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">🤖</div>
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ error }}
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <form @submit.prevent="sendMessage" class="input-form">
          <textarea
            v-model="inputMessage"
            @keydown.enter.ctrl="sendMessage"
            @keydown.enter.meta="sendMessage"
            placeholder="Type your message... (Ctrl+Enter to send)"
            class="message-input"
            :disabled="isLoading"
            rows="3"
          ></textarea>
          <button
            type="submit"
            class="send-btn"
            :disabled="isLoading || !inputMessage.trim()"
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7522035 3.50612381,10.7522035 L16.6915026,11.5376905 C16.6915026,11.5376905 17.1624089,11.5376905 17.1624089,12.0089827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"
              ></path>
            </svg>
          </button>
        </form>

        <!-- Clear History Button -->
        <button
          v-if="hasMessages"
          @click="clearMessages"
          class="clear-btn"
          title="Clear chat history"
        >
          Clear history
        </button>
      </div>
    </div>

    <!-- Overlay (closes sidebar when clicked) -->
    <div
      v-if="isOpen"
      class="chat-overlay"
      @click="toggleOpen"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAiStore } from '../stores/aiStore'

const aiStore = useAiStore()
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const isOpen = computed(() => aiStore.isOpen)
const messages = computed(() => aiStore.messages)
const isLoading = computed(() => aiStore.isLoading)
const error = computed(() => aiStore.error)
const messageCount = computed(() => aiStore.messageCount)
const hasMessages = computed(() => aiStore.hasMessages)

async function sendMessage() {
  const msg = inputMessage.value.trim()
  if (!msg) return

  inputMessage.value = ''
  await aiStore.sendMessage(msg)

  // Scroll to bottom
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function clearMessages() {
  if (confirm('Are you sure you want to clear the chat history?')) {
    aiStore.clearMessages()
  }
}

function toggleOpen() {
  aiStore.toggleOpen()
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Auto-scroll on new messages
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  z-index: 999;
}

/* Chat Toggle Button */
.chat-toggle-btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  font-size: 24px;
}

.chat-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.chat-toggle-btn.is-open {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  transform: scale(1.05);
}

.chat-toggle-btn .icon {
  width: 24px;
  height: 24px;
}

.chat-toggle-btn .badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f5576c;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
}

/* Sidebar */
.chat-sidebar {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  max-width: 90vw;
  height: 600px;
  max-height: 70vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px) scale(0.95);
  transition: all 0.3s ease;
  overflow: hidden;
}

.chat-sidebar.is-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* Messages Container */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
  color: #667eea;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0;
  color: #374151;
}

.empty-desc {
  font-size: 13px;
  margin: 0;
  padding: 0 8px;
}

/* Messages */
.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.message-bubble {
  background: white;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  max-width: 80%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  margin-left: auto;
}

.message.assistant .message-bubble {
  background: #f0f1f3;
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.message-time {
  display: block;
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.7;
}

.message.user .message-time {
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.8);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 20px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fee;
  color: #c33;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.error-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Input Area */
.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.input-form {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.message-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  font-weight: 400;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.clear-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Overlay */
.chat-overlay {
  display: none;
}

.chat-sidebar.is-open ~ .chat-overlay {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
  z-index: 998;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .chat-sidebar {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    bottom: 80px;
    right: 16px;
  }

  .message-bubble {
    max-width: 90%;
  }
}
</style>
