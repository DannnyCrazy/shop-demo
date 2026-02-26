<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { LayoutDashboard, ShoppingBag, LogOut, Package } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <div class="p-4 border-b flex items-center gap-2">
        <Package class="text-primary w-6 h-6" />
        <span class="font-bold text-lg text-primary">商城管理后台</span>
      </div>
      
      <nav class="flex-1 p-4 space-y-2">
        <RouterLink to="/products" class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" active-class="bg-blue-50 text-primary font-medium">
          <LayoutDashboard class="w-5 h-5" />
          商品管理
        </RouterLink>
        <RouterLink to="/orders" class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded" active-class="bg-blue-50 text-primary font-medium">
          <ShoppingBag class="w-5 h-5" />
          订单管理
        </RouterLink>
      </nav>
      
      <div class="p-4 border-t">
        <button @click="logout" class="flex items-center gap-2 text-red-600 hover:text-red-800 w-full px-4 py-2">
          <LogOut class="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-auto p-8">
      <RouterView />
    </main>
  </div>
</template>
