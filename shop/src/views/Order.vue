<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const orders = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!authStore.isAuthenticated) return
  try {
    const res = await fetch('/api/my-orders', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      orders.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-bold mb-6">我的订单</h2>
    
    <div v-if="!authStore.isAuthenticated" class="text-center py-20">
      <p>请先登录查看订单</p>
      <router-link to="/login" class="text-primary">去登录</router-link>
    </div>
    
    <div v-else-if="loading" class="text-center">加载中...</div>
    
    <div v-else-if="orders.length === 0" class="text-center py-20 bg-white rounded shadow">
      <p class="text-gray-500">暂无订单</p>
    </div>
    
    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="bg-white rounded shadow p-4 border">
        <div class="flex justify-between border-b pb-2 mb-2">
          <span class="font-bold">订单号 #{{ order.id }}</span>
          <span class="text-gray-500 text-sm">{{ new Date(order.created_at).toLocaleString() }}</span>
          <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{{ order.status }}</span>
        </div>
        <div class="space-y-2">
          <div v-for="(item, idx) in order.items" :key="idx" class="flex justify-between text-sm">
            <span>{{ item.name }} (x{{ item.quantity }})</span>
            <span>¥{{ item.price }}</span>
          </div>
        </div>
        <div class="mt-2 pt-2 border-t text-right font-bold">
          总计: <span class="text-primary">¥{{ order.total_price.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
