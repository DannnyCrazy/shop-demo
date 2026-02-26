<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import * as GUI from "babylonjs-gui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Ruler,
  Trash2,
  MousePointer2,
  Palette,
  Lightbulb,
} from "lucide-vue-next";

const props = defineProps<{
  url: string;
  name: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const engine = shallowRef<BABYLON.Engine | null>(null);
const scene = shallowRef<BABYLON.Scene | null>(null);
const camera = shallowRef<BABYLON.ArcRotateCamera | null>(null);
const loadedMeshes = shallowRef<BABYLON.AbstractMesh[]>([]);

// Measurement state
const isMeasuring = ref(false);
const measurePoints = ref<BABYLON.Vector3[]>([]);
const measureMarkers = ref<BABYLON.TransformNode[]>([]);
const measureLines = ref<BABYLON.LinesMesh[]>([]);
const distanceLabels = ref<GUI.AdvancedDynamicTexture | null>(null);
const lastDistance = ref<string | null>(null);

// Transparency state
const transparency = ref(1.0);
const originalMaterials = new Map<
  BABYLON.AbstractMesh,
  { material: BABYLON.Material; alpha: number }
>();

// Lighting state
const lightingMode = ref<"studio" | "inspection">("studio");
const sceneLights = ref<BABYLON.Light[]>([]);

// Initialize Babylon.js
const initBabylon = () => {
  if (!canvasRef.value) return;

  try {
    const _engine = new BABYLON.Engine(canvasRef.value, true);
    engine.value = _engine;

    const _scene = new BABYLON.Scene(_engine);
    scene.value = _scene;

    // Set background color to match other viewers
    _scene.clearColor = new BABYLON.Color4(0.94, 0.94, 0.94, 1); // #f0f0f0

    // Camera
    const _camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      BABYLON.Vector3.Zero(),
      _scene
    );
    _camera.attachControl(canvasRef.value, true);
    _camera.minZ = 0.1;
    _camera.wheelPrecision = 2;
    camera.value = _camera;

    // Initialize with studio lighting
    setupStudioLighting();

    // GUI for measurements
    distanceLabels.value = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Set up rendering groups - important for measurement visibility
    _scene.setRenderingAutoClearDepthStencil(1, false, false);
    _scene.setRenderingAutoClearDepthStencil(0, true, true);

    // Handle window resize
    window.addEventListener("resize", () => {
      _engine.resize();
    });

    // Render loop
    _engine.runRenderLoop(() => {
      _scene.render();
    });

    // Setup picking for measurement
    _scene.onPointerDown = (evt, pickResult) => {
      if (!isMeasuring.value) return;
      // Left click
      if (evt.button === 0 && pickResult.hit && pickResult.pickedPoint) {
        addMeasurePoint(pickResult.pickedPoint);
      }
    };
  } catch (err) {
    console.error("Failed to initialize Babylon.js:", err);
  }
};

// Lighting setup functions
const clearLights = () => {
  if (!scene.value) return;
  sceneLights.value.forEach((light) => light.dispose());
  sceneLights.value = [];
};

// Studio Lighting - 三点布光，适合产品展示
const setupStudioLighting = () => {
  if (!scene.value) return;

  clearLights();
  const _scene = scene.value;

  // 环境光 - 提供基础照明，增加地面反射
  const hemiLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    _scene
  );
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new BABYLON.Color3(0.95, 0.95, 0.95);
  hemiLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.55); // 增加地面反射
  sceneLights.value.push(hemiLight);

  // 多个方向的柔和光源，实现均匀照明
  const directions = [
    {
      dir: new BABYLON.Vector3(-1, -1, -1),
      pos: new BABYLON.Vector3(10, 15, 10),
      intensity: 0.25,
    }, // 右前上
    {
      dir: new BABYLON.Vector3(1, -0.5, -1),
      pos: new BABYLON.Vector3(-10, 12, 8),
      intensity: 0.25,
    }, // 左前上
    {
      dir: new BABYLON.Vector3(0, -1, 1),
      pos: new BABYLON.Vector3(0, 12, -12),
      intensity: 0.25,
    }, // 后上
    {
      dir: new BABYLON.Vector3(0, 1, 0),
      pos: new BABYLON.Vector3(0, -10, 0),
      intensity: 0.2,
    }, // 下
    {
      dir: new BABYLON.Vector3(-1, 0, 1),
      pos: new BABYLON.Vector3(10, 5, -8),
      intensity: 0.2,
    }, // 右后
    {
      dir: new BABYLON.Vector3(1, 0, 1),
      pos: new BABYLON.Vector3(-10, 5, -8),
      intensity: 0.2,
    }, // 左后
  ];

  directions.forEach((config, i) => {
    const light = new BABYLON.DirectionalLight(
      `uniformLight_${i}`,
      config.dir,
      _scene
    );
    light.position = config.pos;
    light.intensity = config.intensity;
    light.diffuse = new BABYLON.Color3(0.95, 0.95, 0.98);
    sceneLights.value.push(light);
  });

  lightingMode.value = "studio";
};

// Inspection Lighting - 工业检测照明，多方向均匀光源
const setupInspectionLighting = () => {
  if (!scene.value) return;

  clearLights();
  const _scene = scene.value;

  // 环境光
  const hemiLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    _scene
  );
  hemiLight.intensity = 0.6;
  hemiLight.diffuse = new BABYLON.Color3(0.9, 0.9, 0.95);
  sceneLights.value.push(hemiLight);

  // 顶部光源 - 模拟顶部照明
  const topLight = new BABYLON.PointLight(
    "topLight",
    new BABYLON.Vector3(0, 15, 0),
    _scene
  );
  topLight.intensity = 1.0;
  topLight.diffuse = new BABYLON.Color3(1, 1, 1);
  topLight.range = 50;
  sceneLights.value.push(topLight);

  // 四个方向的点光源 - 模拟环形无影灯效果
  const positions = [
    new BABYLON.Vector3(10, 8, 0), // 右侧
    new BABYLON.Vector3(-10, 8, 0), // 左侧
    new BABYLON.Vector3(0, 8, 10), // 前方
    new BABYLON.Vector3(0, 8, -10), // 后方
  ];

  positions.forEach((pos, i) => {
    const light = new BABYLON.PointLight(`sideLight_${i}`, pos, _scene);
    light.intensity = 0.8;
    light.diffuse = new BABYLON.Color3(0.98, 0.98, 1);
    light.range = 40;
    sceneLights.value.push(light);
  });

  // 强光从上方 - 增强细节可见度
  const spotLight = new BABYLON.SpotLight(
    "spotLight",
    new BABYLON.Vector3(0, 20, 0),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI / 3,
    2,
    _scene
  );
  spotLight.intensity = 0.9;
  spotLight.diffuse = new BABYLON.Color3(1, 1, 1);
  sceneLights.value.push(spotLight);

  lightingMode.value = "inspection";
};

const toggleLighting = () => {
  if (lightingMode.value === "studio") {
    setupInspectionLighting();
  } else {
    setupStudioLighting();
  }
};

// Improved Load Model using ImportMeshAsync to track specific meshes
const loadModelImproved = async (url: string, name: string) => {
  if (!scene.value || !url) return;

  // Clear previous
  loadedMeshes.value.forEach((m) => {
    // Don't dispose camera/light/markers
    m.dispose(false, true);
  });
  loadedMeshes.value = [];
  originalMaterials.clear();
  clearMeasurements();

  try {
    console.log("Babylon loading (improved):", name, url);
    let extension = "";
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".stl")) extension = ".stl";
    else if (lowerName.endsWith(".glb") || lowerName.endsWith(".gltf"))
      extension = ".glb"; // .glb loader handles both usually

    // Note: For blob URLs, Babylon needs the extension hint in the filename or 4th arg?
    // SceneLoader.ImportMeshAsync(meshNames, rootUrl, sceneFilename, scene, onProgress, pluginExtension)

    // We pass empty string for rootUrl and the blob url as sceneFilename.
    // BUT Babylon treats sceneFilename as relative if rootUrl is present.
    // Actually: ImportMeshAsync("", url, "", scene.value, undefined, extension)

    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "",
      url,
      scene.value,
      undefined,
      extension
    );

    const meshes = result.meshes;
    loadedMeshes.value = meshes as BABYLON.AbstractMesh[];

    // Center and Normalize
    if (meshes.length > 0) {
      // Create a parent to normalize scale if needed, or just frame camera
      const worldExtends = scene.value.getWorldExtends((mesh) => {
        return meshes.includes(mesh);
      });

      // Calculate center manually as worldExtends returns {min, max}
      const center = worldExtends.min.add(worldExtends.max).scale(0.5);

      // Frame camera
      camera.value?.setTarget(center);

      // Adjust radius
      const size = worldExtends.max.subtract(worldExtends.min);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (camera.value) {
        camera.value.radius = maxDim * 2;
        camera.value.lowerRadiusLimit = maxDim * 0.1;
        camera.value.upperRadiusLimit = maxDim * 10;
      }

      // Apply current transparency setting to new model
      if (transparency.value < 1) {
        updateTransparency(transparency.value);
      }
    }
  } catch (e) {
    console.error("Babylon load failed", e);
  }
};

// Measurement Functions
const addMeasurePoint = (point: BABYLON.Vector3) => {
  if (!scene.value) return;

  // Create larger marker
  const marker = BABYLON.MeshBuilder.CreateSphere(
    "marker",
    { diameter: 0.8 },
    scene.value
  );
  marker.position = point;
  const mat = new BABYLON.StandardMaterial("markerMat", scene.value);
  mat.diffuseColor = BABYLON.Color3.Red();
  mat.emissiveColor = new BABYLON.Color3(0.3, 0, 0); // Make it glow slightly
  marker.material = mat;

  // Make marker always visible on top
  marker.renderingGroupId = 1;

  measurePoints.value.push(point);
  measureMarkers.value.push(marker);

  // For distance measurement, we need 2 points
  if (measurePoints.value.length === 2) {
    const p1 = measurePoints.value[0];
    const p2 = measurePoints.value[1];

    if (!p1 || !p2) return;

    // Draw line with better visibility
    const line = BABYLON.MeshBuilder.CreateLines(
      "line",
      {
        points: [p1, p2],
      },
      scene.value
    );
    line.color = BABYLON.Color3.Yellow();
    line.renderingGroupId = 1; // Make line always visible on top
    measureLines.value.push(line);

    // Calculate distance
    const dist = BABYLON.Vector3.Distance(p1, p2);
    lastDistance.value = dist.toFixed(4);

    // Add label
    addDistanceLabel(p1, p2, dist);

    // Reset points for next measurement (each pair is independent)
    measurePoints.value = [];
  }
};

const addDistanceLabel = (
  p1: BABYLON.Vector3,
  p2: BABYLON.Vector3,
  dist: number
) => {
  if (!distanceLabels.value) return;

  const midPoint = p1.add(p2).scale(0.5);

  const label = new GUI.Rectangle("distanceLabel");
  label.background = "black";
  label.height = "30px";
  label.alpha = 0.7;
  label.width = "100px";
  label.cornerRadius = 5;
  label.thickness = 1;
  label.linkOffsetY = -30;

  distanceLabels.value.addControl(label);

  const dummyNode = new BABYLON.TransformNode("distanceDummy", scene.value);
  dummyNode.position = midPoint;
  label.linkWithMesh(dummyNode);
  measureMarkers.value.push(dummyNode as any);

  const text = new GUI.TextBlock();
  text.text = dist.toFixed(3);
  text.color = "white";
  label.addControl(text);
};

const clearMeasurements = () => {
  measureMarkers.value.forEach((m) => m.dispose());
  measureLines.value.forEach((l) => l.dispose());
  measureMarkers.value = [];
  measureLines.value = [];
  measurePoints.value = [];
  lastDistance.value = null;

  if (distanceLabels.value) {
    distanceLabels.value.dispose();
    distanceLabels.value = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  }
};

const toggleMeasure = () => {
  isMeasuring.value = !isMeasuring.value;
  if (!isMeasuring.value) {
    measurePoints.value = []; // Reset current pending pair
  }
};

// Transparency control functions
const updateTransparency = (alpha: number) => {
  if (!scene.value) return;

  transparency.value = alpha;

  loadedMeshes.value.forEach((mesh) => {
    // Get or create material for this mesh
    let material = mesh.material;

    // If mesh has no material, create a default one
    if (!material) {
      const stdMat = new BABYLON.StandardMaterial(
        `stl_material_${mesh.id}`,
        scene.value!
      );
      stdMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
      stdMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      mesh.material = stdMat;
      material = stdMat;
    }

    // Store original material data if not already stored
    if (!originalMaterials.has(mesh)) {
      let originalAlpha = 1.0;
      if (material instanceof BABYLON.StandardMaterial) {
        originalAlpha = material.alpha;
      } else if (material instanceof BABYLON.PBRMaterial) {
        originalAlpha = material.alpha;
      }
      originalMaterials.set(mesh, { material, alpha: originalAlpha });
    }

    // Apply transparency directly to the material (no cloning)
    if (material instanceof BABYLON.StandardMaterial) {
      material.alpha = alpha;
      material.transparencyMode =
        alpha < 1
          ? BABYLON.Material.MATERIAL_ALPHABLEND
          : BABYLON.Material.MATERIAL_OPAQUE;
      material.backFaceCulling = false;
      material.markAsDirty(BABYLON.Material.AllDirtyFlag);
    } else if (material instanceof BABYLON.PBRMaterial) {
      material.alpha = alpha;
      (material as any).albedoAlpha = alpha;
      material.transparencyMode =
        alpha < 1
          ? BABYLON.Material.MATERIAL_ALPHABLEND
          : BABYLON.Material.MATERIAL_OPAQUE;
      material.backFaceCulling = false;
      material.markAsDirty(BABYLON.Material.AllDirtyFlag);
    }
  });

  // Force scene render to update
  scene.value.markAllMaterialsAsDirty(BABYLON.Material.AllDirtyFlag);
};

// Watchers
watch(
  () => props.url,
  (newUrl) => {
    if (newUrl) {
      loadModelImproved(newUrl, props.name);
    }
  }
);

// Lifecycle
onMounted(() => {
  initBabylon();
  if (props.url) {
    loadModelImproved(props.url, props.name);
  }
});

onUnmounted(() => {
  if (engine.value) {
    engine.value.dispose();
  }
});
</script>

<template>
  <div class="w-full h-full relative group">
    <canvas ref="canvasRef" class="w-full h-full outline-none touch-none" />

    <!-- Toolbar -->
    <div
      class="absolute top-4 left-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <div
        class="flex gap-2 bg-background/80 backdrop-blur p-1 rounded-md border shadow-sm"
      >
        <Button
          size="icon"
          variant="ghost"
          :class="{ 'bg-primary/20 text-primary': isMeasuring }"
          @click="toggleMeasure"
          title="测量工具 (Measure Tool)"
        >
          <Ruler class="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          @click="clearMeasurements"
          title="清除测量 (Clear Measurements)"
        >
          <Trash2 class="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          :class="{
            'bg-primary/20 text-primary': lightingMode === 'inspection',
          }"
          @click="toggleLighting"
          :title="
            lightingMode === 'studio' ? '切换到检测照明' : '切换到摄影棚照明'
          "
        >
          <Lightbulb class="w-4 h-4" />
        </Button>
      </div>

      <Card
        v-if="lastDistance"
        class="p-2 bg-background/90 backdrop-blur border shadow-sm"
      >
        <div class="text-xs text-muted-foreground">Last Distance</div>
        <div class="text-lg font-bold font-mono">{{ lastDistance }}</div>
      </Card>

      <!-- Transparency Control -->
      <Card class="p-3 bg-background/90 backdrop-blur border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Palette class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">透明度</span>
        </div>
        <div class="grid grid-cols-4 gap-1">
          <Button
            v-for="level in [25, 50, 75, 100]"
            :key="level"
            size="sm"
            variant="outline"
            :class="{
              'bg-primary/20 border-primary text-primary': transparency === level / 100
            }"
            @click="updateTransparency(level / 100)"
            class="h-8 text-xs"
          >
            {{ level }}%
          </Button>
        </div>
      </Card>

      <!-- Lighting Mode Indicator -->
      <Card class="p-2 bg-background/90 backdrop-blur border shadow-sm">
        <div class="text-xs text-muted-foreground mb-1">照明模式</div>
        <div class="text-sm font-medium">
          {{ lightingMode === "studio" ? "摄影棚照明" : "检测照明" }}
        </div>
        <div class="text-xs text-muted-foreground mt-1">
          {{
            lightingMode === "studio"
              ? "三点布光，适合展示"
              : "多方向均匀，适合检测"
          }}
        </div>
      </Card>
    </div>

    <div
      v-if="!url"
      class="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none"
    >
      请选择模型 (Please select a model)
    </div>

    <div
      v-if="isMeasuring"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-sm pointer-events-none flex items-center gap-2"
    >
      <MousePointer2 class="w-3 h-3" />
      <span>点击模型上的两点进行测量</span>
    </div>
  </div>
</template>
