<script setup lang="ts">
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

async function checkout() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        items: cartStore.items,
        user_id: authStore.user?.id,
        contact_info: { name: authStore.user?.username, phone: "13800000000" } // Demo data
      })
    })
    
    if (res.ok) {
      cartStore.clearCart()
      alert("下单成功！")
      router.push('/orders')
    } else {
      alert("下单失败")
    }
  } catch (e) {
    alert("网络错误")
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-bold mb-6">购物车</h2>
    
    <div v-if="cartStore.items.length === 0" class="text-center py-20 bg-white rounded shadow">
      <p class="text-gray-500 mb-4">购物车空空如也</p>
      <router-link to="/" class="text-primary hover:underline">去选购</router-link>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded shadow overflow-hidden">
        <div v-for="item in cartStore.items" :key="item.id" class="p-4 border-b flex gap-4">
          <div class="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
             <img :src="item.image || 'https://placehold.co/100'" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg">{{ item.name }}</h3>
            <div class="text-sm text-gray-500 mt-1">
              <p>发货: {{ item.delivery }}</p>
              <p>规格: {{ item.specs.sectionSize }} | {{ item.specs.length }}mm</p>
            </div>
          </div>
          <div class="text-right">
             <p class="text-primary font-bold text-lg">¥{{ item.price }}</p>
             <p class="text-gray-500">x {{ item.quantity }}</p>
             <button @click="cartStore.removeFromCart(item.id)" class="text-red-500 text-sm mt-2 hover:underline">删除</button>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded shadow p-6 h-fit">
        <h3 class="text-lg font-bold mb-4 border-b pb-2">结算信息</h3>
        <div class="flex justify-between mb-2">
          <span>商品总数</span>
          <span>{{ cartStore.count }}</span>
        </div>
        <div class="flex justify-between mb-4 text-xl font-bold">
          <span>总计</span>
          <span class="text-primary">¥{{ cartStore.total.toFixed(2) }}</span>
        </div>
        <button @click="checkout" class="w-full bg-primary text-white py-3 rounded font-bold hover:bg-blue-700 transition">
          立即结算
        </button>
      </div>
    </div>
  </div>
</template>
