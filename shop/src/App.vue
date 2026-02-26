<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useCartStore } from './stores/cart'
import { useAuthStore } from './stores/auth'
import { ShoppingCart, User, Package } from 'lucide-vue-next'

const cartStore = useCartStore()
const authStore = useAuthStore()
</script>

<template>
  <header class="sticky top-0 z-40 bg-white shadow">
    <div class="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between">
      <RouterLink to="/" class="flex items-center space-x-2">
        <Package class="text-primary w-6 h-6" />
        <span class="text-xl font-bold text-primary">铝型材厂家官方商城</span>
      </RouterLink>
      
      <nav class="hidden md:flex space-x-6 text-sm">
        <RouterLink to="/" class="text-industrial font-medium hover:text-primary">选型首页</RouterLink>
        <RouterLink to="/orders" class="text-industrial font-medium hover:text-primary">我的订单</RouterLink>
        <a href="#contact" class="text-industrial font-medium hover:text-primary">联系厂家</a>
      </nav>
      
      <div class="flex items-center space-x-4">
        <RouterLink v-if="!authStore.isAuthenticated" to="/login" class="text-sm font-medium hover:text-primary">
          登录 / 注册
        </RouterLink>
        <div v-else class="flex items-center gap-2">
          <User class="w-4 h-4" />
          <span class="text-sm">{{ authStore.user?.username }}</span>
          <button @click="authStore.logout()" class="text-xs text-red-500 hover:underline">退出</button>
        </div>

        <RouterLink to="/cart" class="relative text-industrial hover:text-primary">
          <ShoppingCart class="w-6 h-6" />
          <span v-if="cartStore.count > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{ cartStore.count }}
          </span>
        </RouterLink>
      </div>
    </div>
  </header>

  <main class="min-h-screen bg-gray-50">
    <RouterView />
  </main>

  <footer id="contact" class="py-6 bg-primary text-white mt-auto">
    <div class="container mx-auto px-4 text-center">
      <h3 class="text-xl font-bold mb-3">厂家联系方式</h3>
      <p class="mb-1">销售热线：138-8888-8888</p>
      <p class="mb-1">微信同号：138-8888-8888</p>
      <p class="mb-1">厂家地址：广东省佛山市XX区XX工业园XX路88号</p>
    </div>
  </footer>
</template>
