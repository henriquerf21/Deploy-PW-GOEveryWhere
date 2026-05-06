<template>
  <div class="gummy-bot-wrapper">
    <!-- Botão Flutuante -->
    <button 
      class="gummy-fab" 
      @click="toggleChat"
      :class="{ 'is-open': isOpen }"
      aria-label="Falar com o Gummy Bot"
    >
      <i class="bi" :class="isOpen ? 'bi-x-lg' : 'bi-robot'"></i>
    </button>

    <!-- Janela de Chat -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div class="bot-info">
            <i class="bi bi-robot"></i>
            <div>
              <strong>Gummy Bot</strong>
              <small>Assistente GoEverywhere</small>
            </div>
          </div>
          <button class="btn-clear" @click="clearChat" title="Limpar conversa">
            <i class="bi bi-trash"></i>
          </button>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
            <div class="message-bubble">
              {{ msg.text }}
            </div>
          </div>
          <div v-if="isLoading" class="message-row bot">
            <div class="message-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <input 
            type="text" 
            v-model="currentMessage" 
            @keyup.enter="sendMessage"
            placeholder="Pergunta-me qualquer coisa..." 
            :disabled="isLoading"
          />
          <button @click="sendMessage" :disabled="!currentMessage.trim() || isLoading" class="btn-send">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { API_URL } from '../config/env.js';

const isOpen = ref(false);
const currentMessage = ref('');
const messages = ref([
  { role: 'bot', text: 'Olá! Sou o Gummy Bot. Como posso ajudar-te hoje com as tuas encomendas?' }
]);
const isLoading = ref(false);
const messagesContainer = ref(null);

function toggleChat() {
  isOpen.value = !isOpen.value;
}

function clearChat() {
  messages.value = [
    { role: 'bot', text: 'Olá! Sou o Gummy Bot. Como posso ajudar-te hoje com as tuas encomendas?' }
  ];
}

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

async function sendMessage() {
  const text = currentMessage.value.trim();
  if (!text) return;

  messages.value.push({ role: 'user', text });
  currentMessage.value = '';
  isLoading.value = true;
  scrollToBottom();

  try {
    const response = await fetch(`${API_URL}/bo/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: text,
        history: messages.value.map(m => ({ role: m.role, text: m.text }))
      })
    });

    const data = await response.json();
    
    if (data.reply) {
      messages.value.push({ role: 'bot', text: data.reply });
    } else {
      messages.value.push({ role: 'bot', text: data.error || 'Desculpa, ocorreu um erro.' });
    }
  } catch (error) {
    messages.value.push({ role: 'bot', text: 'Erro de ligação ao servidor.' });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}
</script>

<style scoped>
.gummy-bot-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  font-family: 'Poppins', sans-serif;
}

.gummy-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--cf-cta, #00c853);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0,200,83,0.4);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.gummy-fab:hover {
  transform: scale(1.05);
}
.gummy-fab.is-open {
  background: #334155;
  box-shadow: 0 4px 12px rgba(51,65,85,0.3);
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: var(--cf-cta, #00c853);
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-clear {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-clear:hover {
  background: rgba(255, 255, 255, 0.4);
}
.bot-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.bot-info i {
  font-size: 1.5rem;
  background: rgba(255,255,255,0.2);
  padding: 0.5rem;
  border-radius: 50%;
}
.bot-info div {
  display: flex;
  flex-direction: column;
}
.bot-info strong {
  font-size: 1rem;
  line-height: 1.2;
}
.bot-info small {
  font-size: 0.75rem;
  opacity: 0.9;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
}

.message-row {
  display: flex;
  width: 100%;
}
.message-row.user {
  justify-content: flex-end;
}
.message-row.bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}
.message-row.user .message-bubble {
  background: var(--cf-cta, #00c853);
  color: white;
  border-bottom-right-radius: 4px;
}
.message-row.bot .message-bubble {
  background: white;
  color: #1e293b;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.chat-input-area {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.5rem;
}
.chat-input-area input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  outline: none;
  font-family: inherit;
}
.chat-input-area input:focus {
  border-color: var(--cf-cta, #00c853);
}
.btn-send {
  background: var(--cf-cta, #00c853);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Typing Indicator */
.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #94a3b8;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom right;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
