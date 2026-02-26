<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const orders = ref<any[]>([])
const loading = ref(true)

async function fetchOrders() {
  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    orders.value = await res.json()
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">订单管理</h2>
    
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="p-4 font-medium text-gray-500">ID</th>
            <th class="p-4 font-medium text-gray-500">用户ID</th>
            <th class="p-4 font-medium text-gray-500">联系人</th>
            <th class="p-4 font-medium text-gray-500">总价</th>
            <th class="p-4 font-medium text-gray-500">状态</th>
            <th class="p-4 font-medium text-gray-500">创建时间</th>
            <th class="p-4 font-medium text-gray-500">详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" class="border-b hover:bg-gray-50">
            <td class="p-4">{{ o.id }}</td>
            <td class="p-4">{{ o.user_id || 'Guest' }}</td>
            <td class="p-4">{{ o.contact_info?.name }} / {{ o.contact_info?.phone }}</td>
            <td class="p-4 font-bold text-primary">¥{{ o.total_price.toFixed(2) }}</td>
            <td class="p-4"><span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{{ o.status }}</span></td>
            <td class="p-4 text-gray-500">{{ new Date(o.created_at).toLocaleString() }}</td>
            <td class="p-4">
               <div class="text-xs text-gray-500 max-w-xs truncate">
                 {{ o.items.map((i:any) => i.name).join(', ') }}
               </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
