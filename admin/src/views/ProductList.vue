<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const products = ref<any[]>([])
const loading = ref(true)
const showModal = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: 0,
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'profile',
  model_url: '',
  doc_url: ''
})

async function fetchProducts() {
  try {
    const res = await fetch('/api/products')
    products.value = await res.json()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: 0, name: '', description: '', price: 0, stock: 0, category: 'profile', model_url: '', doc_url: '' })
  showModal.value = true
}

function openEdit(p: any) {
  isEdit.value = true
  Object.assign(form, p)
  showModal.value = true
}

async function save() {
  const url = isEdit.value ? `/api/products/${form.id}` : '/api/products'
  const method = isEdit.value ? 'PUT' : 'POST'
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(form)
    })
    
    if (res.ok) {
      showModal.value = false
      fetchProducts()
    } else {
      alert("保存失败")
    }
  } catch (e) {
    alert("网络错误")
  }
}

async function remove(id: number) {
  if (!confirm("确认删除?")) return
  try {
    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    fetchProducts()
  } catch (e) {}
}

onMounted(fetchProducts)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">商品管理</h2>
      <button @click="openAdd" class="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
        <Plus class="w-4 h-4" /> 新增商品
      </button>
    </div>
    
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="p-4 font-medium text-gray-500">ID</th>
            <th class="p-4 font-medium text-gray-500">名称</th>
            <th class="p-4 font-medium text-gray-500">价格</th>
            <th class="p-4 font-medium text-gray-500">库存</th>
            <th class="p-4 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" class="border-b hover:bg-gray-50">
            <td class="p-4">{{ p.id }}</td>
            <td class="p-4 font-medium">{{ p.name }}</td>
            <td class="p-4">¥{{ p.price }}</td>
            <td class="p-4">{{ p.stock }}</td>
            <td class="p-4 flex gap-2">
              <button @click="openEdit(p)" class="text-blue-600 hover:text-blue-800"><Edit class="w-4 h-4"/></button>
              <button @click="remove(p.id)" class="text-red-600 hover:text-red-800"><Trash2 class="w-4 h-4"/></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 class="text-xl font-bold mb-4">{{ isEdit ? '编辑商品' : '新增商品' }}</h3>
        <form @submit.prevent="save" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">名称</label>
            <input v-model="form.name" class="w-full border rounded px-3 py-2" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">描述</label>
            <textarea v-model="form.description" class="w-full border rounded px-3 py-2"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">价格</label>
              <input v-model.number="form.price" type="number" step="0.01" class="w-full border rounded px-3 py-2" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">库存</label>
              <input v-model.number="form.stock" type="number" class="w-full border rounded px-3 py-2" required>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">模型URL (如 /AH-GB01-4080D-L50-8.stl)</label>
            <input v-model="form.model_url" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">文档URL (如 /document.pdf)</label>
            <input v-model="form.doc_url" class="w-full border rounded px-3 py-2">
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" @click="showModal=false" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">取消</button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
