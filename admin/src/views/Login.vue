<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('admin')
const password = ref('admin123')
const router = useRouter()
const authStore = useAuthStore()
const error = ref('')

async function handleLogin() {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (res.ok) {
      if (data.user.role !== 'admin') {
        error.value = "Access Denied: Not an admin"
        return
      }
      authStore.login(data.token, data.user)
      router.push('/')
    } else {
      error.value = data.error
    }
  } catch (e) {
    error.value = "Login failed"
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-800">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-primary">管理员后台登录</h2>
      <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded mb-4">{{ error }}</div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-gray-700 mb-1">用户名</label>
          <input v-model="username" type="text" class="w-full border rounded px-3 py-2" required>
        </div>
        <div>
          <label class="block text-gray-700 mb-1">密码</label>
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2" required>
        </div>
        <button type="submit" class="w-full bg-primary text-white py-2 rounded hover:bg-blue-700">登录</button>
      </form>
    </div>
  </div>
</template>
