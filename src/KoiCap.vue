<script setup lang="ts">
import {computed, onMounted, ref, shallowRef, useTemplateRef, watch} from "vue";
import {
  type BasicTransformEvent,
  type TPointerEventInfo,
  Canvas,
  FabricImage,
  type FabricObject,
  Point,
  Rect, Circle, Polyline, Line,

} from "fabric";
import BG from './assets/bg.webp'
import {useMagicKeys} from '@vueuse/core'

const predefineColors = ref([
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577',
])
const {Alt_1, Alt_2, Alt_3, Alt_4} = useMagicKeys()

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas")
const fabricRef = shallowRef<Canvas>()
const mousedownPoint = shallowRef<Point>()
const prePoint = shallowRef<Point>()
const actionBarPoint = shallowRef<Point>()
const currentObj = ref('')
const currentColor = ref('#ff4500')
const currentObjRef = shallowRef<FabricObject>()
const maskClipPath = new Rect({
  inverted: true,
  absolutePositioned: true,
})

const maskClipPathController = new Rect({
  fill: 'transparent',
  objectCaching: false,
  lockRotation: true,
})

const mask = new Rect({
  width: window.innerWidth,
  height: window.innerHeight,
  fill: 'transparent',
  clipPath: maskClipPath,
})

function init() {
  fabricRef.value = new Canvas(canvasRef.value as HTMLCanvasElement, {
    width: window.innerWidth,
    height: window.innerHeight,
    controlsAboveOverlay: true,
  });
  loadBg()
  loadEvent()
}

function maskMouseDown(e: TPointerEventInfo) {
  mousedownPoint.value = e.viewportPoint
  if (fabricRef.value) {
    maskClipPathController.set({
      left: e.viewportPoint.x,
      top: e.viewportPoint.y,
    })
    mask.set({
      fill: 'rgba(0, 0, 0, 0.5)',
    })
    fabricRef.value?.add(maskClipPathController)
  }
}

function maskMouseMove(e: TPointerEventInfo) {
  if (mousedownPoint.value) {
    maskClipPathController.set({
      width: Math.abs(e.viewportPoint.x - mousedownPoint.value.x),
      height: Math.abs(e.viewportPoint.y - mousedownPoint.value.y),
    });
  }
}

function maskMouseUp(e: TPointerEventInfo) {
  if (fabricRef.value && mousedownPoint.value) {
    mask.clipPath?.set({
      left: mousedownPoint.value.x,
      top: mousedownPoint.value.y,
      width: Math.abs(e.viewportPoint.x - mousedownPoint.value.x),
      height: Math.abs(e.viewportPoint.y - mousedownPoint.value.y),
    })

    if (Math.abs(e.viewportPoint.x - mousedownPoint.value.x) > 20) {
      fabricRef.value?.off('mouse:down', maskMouseDown)
      fabricRef.value?.off('mouse:move', maskMouseMove)
      fabricRef.value?.off('mouse:up', maskMouseUp)
      mousedownPoint.value = undefined
      actionBarPoint.value = e.viewportPoint
      loadMaskCtrlEvent()
    }
    fabricRef.value?.renderAll()
  }


}

function loadMaskCtrlEvent() {
  maskClipPathController.on('mousedown', maskClipPathCtrlMouseDown)
  maskClipPathController.on('mousemove', maskClipPathCtrlMouseMove)
  maskClipPathController.on('mouseup', maskClipPathCtrlMouseUp)
  maskClipPathController.on('scaling', maskClipPathCtrlScaling)
}

function maskClipPathCtrlMouseUp(e: TPointerEventInfo) {
  mousedownPoint.value = undefined
  // maskClipPathController.set({
  //   lockMovementX: false,
  // });
}

function maskClipPathCtrlMouseDown(e: TPointerEventInfo) {
  mousedownPoint.value = e.viewportPoint
}

function maskClipPathCtrlMouseMove(e: TPointerEventInfo) {
  if (mousedownPoint.value) {
    maskClipPath.set({
      left: maskClipPathController.left,
      top: maskClipPathController.top,
    });
    prePoint.value = e.viewportPoint;
    actionBarPoint.value = e.viewportPoint
  }
}

function maskClipPathCtrlScaling(e) {
  if (currentObjRef.value) {
    fabricRef.value?.remove(currentObjRef.value)
    currentObjRef.value = undefined;
  }
  maskClipPath.set({
    width: e.transform.target.width * e.transform.target.scaleX,
    height: e.transform.target.height * e.transform.target.scaleY,
  })
  actionBarPoint.value = e.viewportPoint
}

function objMoving(e: BasicTransformEvent & { target: FabricObject }) {
  if (e.target.left <= 0) {
    e.target.set({
      left: 0
    })
  }
  if (e.target.top <= 0) {
    e.target.set({
      top: 0
    })
  }
  if (e.target.top + e.target.height * e.target.scaleY >= window.innerHeight) {
    e.target.set({
      top: window.innerHeight - e.target.height * e.target.scaleY,
    })
  }
  if (e.target.left + e.target.width * e.target.scaleX >= window.innerWidth) {
    e.target.set({
      left: window.innerWidth - e.target.width * e.target.scaleX,
    })
  }
}

function loadEvent() {
  if (fabricRef.value) {
    fabricRef.value.on('mouse:down', maskMouseDown)
    fabricRef.value.on('mouse:move', maskMouseMove)
    fabricRef.value.on('mouse:up', maskMouseUp)
    fabricRef.value?.on('object:moving', objMoving)
  }
}

function loadBg() {
  FabricImage.fromURL(BG).then(bgImage => {
    if (fabricRef.value) {
      fabricRef.value.backgroundImage = bgImage;
      fabricRef.value.overlayImage = mask;
    }
    fabricRef.value?.renderAll()
  })
}

function drawObjMouseDown(e) {
  mousedownPoint.value = e.viewportPoint
  switch (currentObj.value) {
    case "Rect":
      currentObjRef.value = new Rect({
        fill: currentColor.value,
        stroke: currentColor.value,
        left: e.viewportPoint.x,
        top: e.viewportPoint.y,
      })
      break;
    case "Circle":
      currentObjRef.value = new Circle({
        fill: currentColor.value,
        stroke: currentColor.value,
        radius: 0,
        left: e.viewportPoint.x,
        top: e.viewportPoint.y,
      })
      break;
    case "Arrow":
      const points: Point[] = [];
      currentObjRef.value = new Polyline(points, {
        fill: currentColor.value,
        stroke: currentColor.value,
        strokeWidth: 1,
        selectable: false,
        objectCaching: false,
      })
      break;
    case "Line":
      const pointer = e.viewportPoint;
      currentObjRef.value = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        fill: currentColor.value,
        stroke: currentColor.value,
        strokeWidth: 4,
        selectable: false,
      })
      break;
  }
  if (currentObjRef.value) {
    fabricRef.value?.add(currentObjRef.value)
    fabricRef.value?.renderAll()
  }
}

function drawObjMouseMove(e) {
  if (currentObjRef.value && mousedownPoint.value) {
    const pointer = e.viewportPoint;
    switch (currentObj.value) {
      case "Rect":
        currentObjRef.value.set({
          left: Math.min(mousedownPoint.value.x, e.viewportPoint.x),
          top: Math.min(mousedownPoint.value.y, e.viewportPoint.y),
          width: Math.abs(mousedownPoint.value.x - e.viewportPoint.x),
          height: Math.abs(mousedownPoint.value.y - e.viewportPoint.y),
        })
        break;
      case "Circle":
        currentObjRef.value.set({
          left: Math.min(mousedownPoint.value.x, e.viewportPoint.x),
          top: Math.min(mousedownPoint.value.y, e.viewportPoint.y),
          radius: Math.min(Math.abs(mousedownPoint.value.x - e.viewportPoint.x), Math.abs(mousedownPoint.value.y - e.viewportPoint.y)) / 2,
        })
        break;
      case "Arrow":
        let fromX = mousedownPoint.value.x, fromY = mousedownPoint.value.y, tox = 0, toy = 0;
        tox = pointer.x;
        toy = pointer.y;

        const angle = Math.atan2(toy - fromY, tox - fromX);

        const headLen = 10;  // arrow head size
        tox = tox - (headLen) * Math.cos(angle);
        toy = toy - (headLen) * Math.sin(angle);
        const points = [
          {
            x: fromX,
            y: fromY
          },
          // {
          //   x: fromX - (headLen / 4) * Math.cos(angle - Math.PI / 2),
          //   y: fromY - (headLen / 4) * Math.sin(angle - Math.PI / 2)
          // },
          {
            x: tox - (headLen / 4) * Math.cos(angle - Math.PI / 2),
            y: toy - (headLen / 4) * Math.sin(angle - Math.PI / 2)
          },
          {
            x: tox - (headLen) * Math.cos(angle - Math.PI / 3),
            y: toy - (headLen) * Math.sin(angle - Math.PI / 3)
          },
          {
            x: tox + (headLen) * Math.cos(angle),  // tip
            y: toy + (headLen) * Math.sin(angle)
          },
          {
            x: tox - (headLen) * Math.cos(angle + Math.PI / 3),
            y: toy - (headLen) * Math.sin(angle + Math.PI / 3)
          },
          {
            x: tox - (headLen / 4) * Math.cos(angle + Math.PI / 2),
            y: toy - (headLen / 4) * Math.sin(angle + Math.PI / 2)
          },
          // {
          //   x: fromX - (headLen / 4) * Math.cos(angle + Math.PI / 2),
          //   y: fromY - (headLen / 4) * Math.sin(angle + Math.PI / 2)
          // },
          {
            x: fromX,
            y: fromY
          }
        ];
        // @ts-ignore
        Object.assign(currentObjRef.value.points, points)
        currentObjRef.value.setCoords();
        break;
      case "Line":
        currentObjRef.value?.set({
          x2: pointer.x,
          y2: pointer.y,
        })
        break
    }

    fabricRef.value?.renderAll()
  }
}

function drawObjMouseUp(e) {
  mousedownPoint.value = undefined
  currentObjRef.value = undefined;
}

watch(currentObj, (v) => {
  if (v) {
    maskClipPathController.set({
      lockMovementX: true,
      lockMovementY: true,
    })
    if (fabricRef.value) {
      fabricRef.value.off('mouse:move', maskMouseMove)
      fabricRef.value.on('mouse:down', drawObjMouseDown)
      fabricRef.value.on('mouse:move', drawObjMouseMove)
      fabricRef.value.on('mouse:up', drawObjMouseUp)
    }
  }
})
watch(Alt_1, (v) => {
  if (v) {
    currentObj.value = 'Rect'
  }
})
watch(Alt_2, (v) => {
  if (v) {
    currentObj.value = 'Circle'
  }
})
watch(Alt_3, (v) => {
  if (v) {
    currentObj.value = 'Arrow'
  }
})
watch(Alt_4, (v) => {
  if (v) {
    currentObj.value = 'Line'
  }
})
onMounted(init)

const actionBarStyle = computed(() => {
  if (!actionBarPoint.value) {
    return {
      display: 'none',
    }
  }
  const maxTop = window.innerHeight - 60;

  let top = maskClipPathController.top + maskClipPathController.height * maskClipPathController.scaleY
  if (top > maxTop) {
    top = maskClipPathController.top - 60;
  }
  return {
    display: 'block',
    left: `${maskClipPathController.left}px`,
    top: `${top}px`,
  };
})
</script>

<template>
  <div class="action-bar" :style="actionBarStyle">
    <el-space>
      <el-color-picker v-model="currentColor" show-alpha :predefine="predefineColors"/>
    </el-space>
  </div>
  <canvas ref="canvas"></canvas>
</template>

<style scoped>
.action-bar {
  padding-top: 20px;
  position: absolute;
  z-index: 1
}
</style>