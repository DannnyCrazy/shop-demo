<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore()
const error = ref('')

async function handleSubmit() {
  const url = isRegister.value ? '/api/register' : '/api/login'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok) {
      authStore.login(data.token, data.user)
      router.push('/')
    } else {
      error.value = data.error
    }
  } catch (e) {
    error.value = "Request failed"
  }
}

function toggleMode() {
  isRegister.value = !isRegister.value
  error.value = ''
  username.value = ''
  password.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-primary">
        {{ isRegister ? '注册账号' : '登录商城' }}
      </h2>
      <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded mb-4">{{ error }}</div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-gray-700 mb-1">用户名</label>
          <input v-model="username" type="text" class="w-full border rounded px-3 py-2" required placeholder="请输入用户名">
        </div>
        <div>
          <label class="block text-gray-700 mb-1">密码</label>
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2" required placeholder="请输入密码">
        </div>
        <button type="submit" class="w-full bg-primary text-white py-2 rounded hover:bg-blue-700 transition">
          {{ isRegister ? '立即注册' : '登录' }}
        </button>
      </form>
      
      <div class="mt-4 text-center text-sm">
        <button @click="toggleMode" class="text-primary hover:underline">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </button>
      </div>
      
      <p v-if="!isRegister" class="mt-4 text-center text-xs text-gray-500">Demo账户: admin / admin123</p>
    </div>
  </div>
</template>
