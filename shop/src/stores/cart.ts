import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: number // unique cart item id
  productId: number
  name: string
  price: number
  quantity: number
  specs: any // selected specs
  delivery: string
  image: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(JSON.parse(localStorage.getItem('cart') || '[]'))

  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  function addToCart(item: Omit<CartItem, 'id'>) {
    items.value.push({ ...item, id: Date.now() })
    save()
  }

  function removeFromCart(id: number) {
    items.value = items.value.filter(i => i.id !== id)
    save()
  }

  function clearCart() {
    items.value = []
    save()
  }

  function save() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  return { items, total, count, addToCart, removeFromCart, clearCart }
})
