<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import BabylonViewer from '@/components/BabylonViewer.vue'
import { FileText, Box } from 'lucide-vue-next'

const route = useRoute()
const cartStore = useCartStore()

const product = ref<any>(null)
const loading = ref(true)

// Selection State
const form = reactive({
  seriesType: 'oubiao',
  sectionSize: '4080', // Default matches the STL file name hint
  thickness: '2.0',
  length: 6000,
  surfaceType: 'yangji',
  priceType: 'notax',
  
  // Processing
  processCut: false,
  processDrill: false,
  drillSize: 6,
  processTap: false,
  tapSize: 6,
  processChamfer: false
})

// Derived State
const slotWidth = computed(() => {
  const map: any = {
    "2020": { oubiao: 6, guobiao: 6 },
    "3030": { oubiao: 8, guobiao: 8 },
    "4040": { oubiao: 8, guobiao: 8 },
    "4080": { oubiao: 10, guobiao: 10 }
  }
  const size = form.sectionSize
  if (!map[size]) return '-'
  return `槽${map[size][form.seriesType]}`
})

const stockNum = computed(() => {
  const map: any = { "2020": 1500, "3030": 1200, "4040": 2000, "4080": 800 }
  return map[form.sectionSize] || 0
})

const deliveryDate = computed(() => {
  const hasProcess = form.processCut || form.processDrill || form.processTap || form.processChamfer
  return hasProcess ? "7-10天（加工件）" : "3天（标准件）"
})

const price = computed(() => {
  const size = form.sectionSize
  const thick = parseFloat(form.thickness)
  const length = form.length
  
  // Base Meter Price
  let baseMeter = size=="2020"?16:size=="3030"?32:size=="4040"?50:88;
  baseMeter += thick * 7;
  
  // Surface
  if(form.surfaceType=="black") baseMeter +=3;
  if(form.surfaceType=="spray") baseMeter +=8;
  
  // Processing Fee
  let processFee = 0;
  if(form.processCut && length>6000) processFee +=5;
  if(form.processDrill){
      const d = form.drillSize;
      processFee += d==5?3:d==6?4:5;
  }
  if(form.processTap){
      const t = form.tapSize;
      processFee += t==5?4:t==6?5:6;
  }
  if(form.processChamfer) processFee +=8;
  
  // Total
  let totalPrice = (baseMeter * (length/1000)) + processFee;
  if(form.priceType=="tax") totalPrice *=1.13;
  
  return {
    baseMeter: baseMeter.toFixed(2),
    processFee: processFee.toFixed(2),
    totalPrice: totalPrice.toFixed(2)
  }
})

const selectResult = computed(() => {
  const series = form.seriesType=="oubiao"?"欧标":"国标"
  return `${series}${form.sectionSize}×${form.thickness}mm | ${slotWidth.value} | ${form.length}mm | ${form.surfaceType}`
})

const accessoryList = computed(() => {
  const data: any = {
    "2020":[{name:"2020 L型角件",spec:"槽6专用",bolt:"M5×10",price:2.2},{name:"2020 T型螺母",spec:"槽6专用",bolt:"M5",price:0.5}],
    "3030":[{name:"3030 L型角件",spec:"槽8专用",bolt:"M6×12",price:3.5},{name:"3030 T型螺母",spec:"槽8专用",bolt:"M6",price:0.8}],
    "4040":[{name:"4040 L型角件",spec:"槽8专用",bolt:"M6×16",price:5.0},{name:"4040 T型螺母",spec:"槽8专用",bolt:"M6",price:1.0}],
    "4080":[{name:"4080 L型角件",spec:"槽10专用",bolt:"M8×20",price:9.0},{name:"4080 T型螺母",spec:"槽10专用",bolt:"M8",price:2.0}]
  }
  return data[form.sectionSize] || []
})

// Preview Tab
const activeTab = ref<'3d' | 'doc'>('3d')
const modelUrl = computed(() => product.value?.model_url ? `/static${product.value.model_url}` : '') // Proxy handles /static
const docUrl = computed(() => product.value?.doc_url ? `/static${product.value.doc_url}` : '')

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await fetch(`/api/products/${id}`)
    if(res.ok) {
        product.value = await res.json()
        // If product name implies size, set it (simple logic for demo)
        if(product.value.name.includes("4080")) form.sectionSize = "4080"
        else if(product.value.name.includes("4040")) form.sectionSize = "4040"
        else if(product.value.name.includes("3030")) form.sectionSize = "3030"
        else if(product.value.name.includes("2020")) form.sectionSize = "2020"
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function addToCart() {
  if (stockNum.value <= 0) {
    alert("库存不足！")
    return
  }
  cartStore.addToCart({
    productId: product.value.id,
    name: selectResult.value,
    price: parseFloat(price.value.totalPrice),
    quantity: 1,
    specs: { ...form },
    delivery: deliveryDate.value,
    image: product.value.images?.[0] || ''
  })
  alert("已加入购物车")
}

function exportPDF() {
  alert("PDF导出功能模拟：已生成报价单 " + selectResult.value)
}
</script>

<template>
  <div v-if="loading" class="text-center py-20">加载中...</div>
  <div v-else-if="!product" class="text-center py-20">商品未找到</div>
  
  <div v-else class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      <!-- Left Selection Panel -->
      <div class="lg:col-span-2 bg-white rounded shadow p-5 border">
        <h3 class="text-lg font-bold mb-4 border-b pb-2">选型参数</h3>
        <div class="space-y-3 text-sm">
          <div>
            <label class="block text-gray-700 mb-1">型材系列</label>
            <select v-model="form.seriesType" class="w-full border rounded px-2 py-1.5">
              <option value="oubiao">欧标型材</option>
              <option value="guobiao">国标型材</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">截面规格</label>
            <select v-model="form.sectionSize" class="w-full border rounded px-2 py-1.5">
              <option value="2020">2020</option>
              <option value="3030">3030</option>
              <option value="4040">4040</option>
              <option value="4080">4080</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">槽宽（自动匹配）</label>
            <input type="text" :value="slotWidth" class="w-full border rounded px-2 py-1.5 bg-gray-100" readonly>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">实时库存</label>
            <input type="text" :value="stockNum + ' 米'" class="w-full border rounded px-2 py-1.5 bg-green-50 text-green-600 font-bold" readonly>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">壁厚(mm)</label>
            <select v-model="form.thickness" class="w-full border rounded px-2 py-1.5">
              <option value="1.2">1.2</option>
              <option value="1.5">1.5</option>
              <option value="2.0">2.0</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">长度(mm)｜标准6000mm</label>
            <input type="number" v-model="form.length" min="100" class="w-full border rounded px-2 py-1.5">
          </div>
          <div>
            <label class="block text-gray-700 mb-1">表面处理</label>
            <select v-model="form.surfaceType" class="w-full border rounded px-2 py-1.5">
              <option value="yangji">阳极氧化(银白)</option>
              <option value="black">阳极氧化(黑色)</option>
              <option value="spray">静电喷涂</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">报价类型</label>
            <select v-model="form.priceType" class="w-full border rounded px-2 py-1.5">
              <option value="notax">不含税价</option>
              <option value="tax">含税13%价</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">发货周期</label>
            <input type="text" :value="deliveryDate" class="w-full border rounded px-2 py-1.5 bg-yellow-50 text-yellow-600 font-bold" readonly>
          </div>

          <!-- Processing -->
          <div class="pt-3 border-t">
            <label class="block text-gray-700 mb-2">追加工（工厂收费）</label>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="flex items-center">
                <input type="checkbox" v-model="form.processCut" class="mr-2">
                <label>切割加工</label>
              </div>
              <span class="text-xs text-gray-500">≤6m免费 / 5元/刀</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="flex items-center">
                <input type="checkbox" v-model="form.processDrill" class="mr-2">
                <label>打孔</label>
              </div>
              <select v-model="form.drillSize" :disabled="!form.processDrill" class="text-xs border rounded w-16">
                <option :value="5">M5</option>
                <option :value="6">M6</option>
                <option :value="8">M8</option>
              </select>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="flex items-center">
                <input type="checkbox" v-model="form.processTap" class="mr-2">
                <label>攻丝</label>
              </div>
              <select v-model="form.tapSize" :disabled="!form.processTap" class="text-xs border rounded w-16">
                <option :value="5">M5</option>
                <option :value="6">M6</option>
                <option :value="8">M8</option>
              </select>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="flex items-center">
                <input type="checkbox" v-model="form.processChamfer" class="mr-2">
                <label>倒角</label>
              </div>
              <span class="text-xs text-gray-500">8元/件</span>
            </div>
          </div>

          <button @click="addToCart" class="w-full bg-primary text-white py-2 rounded mt-2 hover:bg-blue-700 transition">选型加入购物车</button>
          <button @click="exportPDF" class="w-full border border-primary text-primary py-2 rounded mt-1 hover:bg-blue-50 transition">导出PDF报价单</button>
        </div>

        <!-- Result -->
        <div class="mt-4 p-3 bg-gray-50 rounded text-sm">
          <p class="text-gray-600">选型描述：<span class="text-xs">{{ selectResult }}</span></p>
          <p class="text-gray-600 mt-1">米价：<span class="font-bold">¥{{ price.baseMeter }}/米</span></p>
          <p class="text-gray-600">加工费：<span class="font-bold">¥{{ price.processFee }}</span></p>
          <p class="text-gray-600 font-medium mt-1">总长总价：<span class="text-primary font-bold">¥{{ price.totalPrice }} {{ form.priceType=='tax'?'(含税)':'' }}</span></p>
        </div>

        <!-- Accessories -->
        <div class="mt-5 pt-3 border-t">
          <h3 class="text-sm font-bold mb-2">该规格专用配件</h3>
          <div class="space-y-1 max-h-52 overflow-y-auto text-xs">
            <div v-for="item in accessoryList" :key="item.name" class="flex items-center gap-2 p-2 border rounded hover:bg-blue-50 transition">
              <div class="flex-1">
                <p class="font-medium">{{ item.name }}</p>
                <p class="text-gray-500">{{ item.spec }} | {{ item.bolt }}</p>
              </div>
              <p class="text-primary">¥{{ item.price.toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Preview Panel -->
      <div class="lg:col-span-3 bg-white rounded shadow border flex flex-col overflow-hidden h-[800px]">
        <div class="flex border-b">
          <button 
            @click="activeTab='3d'" 
            :class="['px-6 py-3 font-medium flex items-center gap-2', activeTab=='3d' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700']"
          >
            <Box class="w-4 h-4"/> 3D模型预览
          </button>
          <button 
            @click="activeTab='doc'" 
            :class="['px-6 py-3 font-medium flex items-center gap-2', activeTab=='doc' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700']"
          >
            <FileText class="w-4 h-4"/> 产品文档
          </button>
        </div>
        
        <div class="flex-1 relative bg-gray-100">
          <!-- 3D Viewer -->
          <div v-if="activeTab==='3d'" class="w-full h-full">
             <BabylonViewer :url="modelUrl" :name="product.name" />
          </div>
          
          <!-- PDF Viewer -->
          <div v-if="activeTab==='doc'" class="w-full h-full p-4">
             <iframe v-if="docUrl" :src="docUrl" class="w-full h-full border rounded bg-white"></iframe>
             <div v-else class="flex items-center justify-center h-full text-gray-400">暂无文档</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
