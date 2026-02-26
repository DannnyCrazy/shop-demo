<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const products = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/products')
    products.value = await res.json()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-bold mb-6 text-industrial">商品列表</h2>
    
    <div v-if="loading" class="text-center py-10">加载中...</div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="product in products" :key="product.id" class="bg-white rounded shadow hover:shadow-md transition p-4 border">
        <div class="h-48 bg-gray-100 rounded mb-4 overflow-hidden flex items-center justify-center">
           <!-- Placeholder image if no image -->
           <img :src="product.images?.[0] || 'https://placehold.co/400'" class="object-cover w-full h-full" />
        </div>
        <h3 class="font-bold text-lg mb-2">{{ product.name }}</h3>
        <p class="text-gray-500 text-sm mb-2 line-clamp-2">{{ product.description }}</p>
        <div class="flex justify-between items-center mt-4">
          <span class="text-primary font-bold text-lg">¥{{ product.price }}</span>
          <RouterLink :to="`/product/${product.id}`" class="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            去选型
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
