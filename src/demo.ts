import { ImageKit } from "./index";
import { backgroundPresets, defaultBackgroundPreset, type BackgroundPreset } from "./backgrounds";
import { canvasPresets, defaultCanvasPreset, findCanvasPreset } from "./canvas-presets";
import { icons } from "./icons";
import {
  MAX_IMAGE_LAYERS,
  type DocumentLayerContract,
  type ImageDocumentContract,
  type ImageLayerContract,
  type TextLayerContract
} from "./contracts";
import "./demo.css";

const fileInput = query<HTMLInputElement>("#file");
const canvasPresetSelect = query<HTMLSelectElement>("#canvas-preset");
const textToolbar = query<HTMLDivElement>("#text-toolbar");
const textContentInput = query<HTMLTextAreaElement>("#text-content");
const textSizeSelect = query<HTMLSelectElement>("#text-size");
const textColorInput = query<HTMLInputElement>("#text-color");
const canvas = query<HTMLCanvasElement>("#canvas");
const preview = query<HTMLDivElement>("#preview");
const layersList = query<HTMLDivElement>("#layers");
const backgroundsList = query<HTMLDivElement>("#backgrounds");
const layerCount = query<HTMLSpanElement>("#layer-count");
const layerUp = query<HTMLButtonElement>("#layer-up");
const layerDown = query<HTMLButtonElement>("#layer-down");
const layerDelete = query<HTMLButtonElement>("#layer-delete");
const buttons = {
  rotate: query<HTMLButtonElement>("#rotate"),
  flip: query<HTMLButtonElement>("#flip"),
  lasso: query<HTMLButtonElement>("#lasso"),
  text: query<HTMLButtonElement>("#text"),
  textUppercase: query<HTMLButtonElement>("#text-uppercase"),
  textAlignLeft: query<HTMLButtonElement>("#text-align-left"),
  textAlignCenter: query<HTMLButtonElement>("#text-align-center"),
  textAlignRight: query<HTMLButtonElement>("#text-align-right"),
  download: query<HTMLButtonElement>("#download")
} as const;

interface ClientImageLayer extends ImageLayerContract {
  image: ImageKit;
  previewUrl: string;
}

type ClientTextLayer = TextLayerContract;
type ClientLayer = ClientImageLayer | ClientTextLayer;

type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface ViewportState {
  bounds: { width: number; height: number };
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  handle: ResizeHandle;
  layerId: string;
  startX: number;
  startY: number;
  startScaleX: number;
  startScaleY: number;
}

interface MoveState {
  layerId: string;
  startX: number;
  startY: number;
  startLayerX: number;
  startLayerY: number;
}

interface Point {
  x: number;
  y: number;
}

const documentContract: ImageDocumentContract = {
  version: 1,
  maxLayers: MAX_IMAGE_LAYERS,
  canvas: {
    presetId: defaultCanvasPreset.id,
    width: defaultCanvasPreset.width,
    height: defaultCanvasPreset.height,
    name: defaultCanvasPreset.name
  },
  background: {
    presetId: defaultBackgroundPreset.id,
    name: defaultBackgroundPreset.name,
    src: defaultBackgroundPreset.src
  },
  activeLayerId: null,
  layers: []
};

const layers: ClientLayer[] = [];
let viewportState: ViewportState | null = null;
let resizeState: ResizeState | null = null;
let moveState: MoveState | null = null;
let activeBackgroundImage: HTMLImageElement | null = null;
let lassoMode = false;
let lassoDrawing = false;
let lassoPoints: Point[] = [];

setupCanvasPresetSelect();
setupIcons();
renderBackgroundList();
setControls(false);
render();

fileInput.addEventListener("change", async () => {
  const files = Array.from(fileInput.files ?? []).slice(0, availableLayerSlots());

  if (files.length === 0) {
    fileInput.value = "";
    return;
  }

  for (const file of files) {
    const image = await ImageKit.fromFile(file);
    const layer = createLayer(file, image);

    layers.unshift(layer);
    documentContract.layers.unshift(layerToContract(layer));
    documentContract.activeLayerId = layer.id;
  }

  fileInput.value = "";
  setControls(true);
  render();
});

buttons.rotate.addEventListener("click", () => {
  const layer = getActiveImageLayer();

  layer?.image.rotate(90);
  if (layer) {
    syncLayerSize(layer);
  }
  render();
});

buttons.flip.addEventListener("click", () => {
  getActiveImageLayer()?.image.flip("horizontal");
  render();
});

buttons.lasso.addEventListener("click", () => {
  lassoMode = !lassoMode;
  lassoPoints = [];
  render();
});

buttons.text.addEventListener("click", () => {
  const layer = createTextLayer();

  layers.unshift(layer);
  documentContract.activeLayerId = layer.id;
  render();
  textContentInput.focus();
  textContentInput.select();
});

buttons.download.addEventListener("click", async () => {
  if (layers.length === 0) {
    return;
  }

  const blob = await exportDocumentBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${documentContract.canvas.presetId}.png`;
  link.click();
  URL.revokeObjectURL(url);
});

textSizeSelect.addEventListener("change", () => {
  const layer = getActiveTextLayer();

  if (!layer) {
    return;
  }

  layer.fontSize = Number(textSizeSelect.value);
  syncTextLayerSize(layer);
  render();
});

textContentInput.addEventListener("input", () => {
  const layer = getActiveTextLayer();

  if (!layer) {
    return;
  }

  layer.text = textContentInput.value;
  syncTextLayerSize(layer);
  render();
});

textColorInput.addEventListener("input", () => {
  const layer = getActiveTextLayer();

  if (!layer) {
    return;
  }

  layer.color = textColorInput.value;
  render();
});

buttons.textUppercase.addEventListener("click", () => {
  const layer = getActiveTextLayer();

  if (!layer) {
    return;
  }

  layer.text = layer.text.toUpperCase();
  syncTextLayerSize(layer);
  render();
});

buttons.textAlignLeft.addEventListener("click", () => {
  setTextAlign("left");
});

buttons.textAlignCenter.addEventListener("click", () => {
  setTextAlign("center");
});

buttons.textAlignRight.addEventListener("click", () => {
  setTextAlign("right");
});

layerUp.addEventListener("click", () => {
  moveSelectedLayer(-1);
});

layerDown.addEventListener("click", () => {
  moveSelectedLayer(1);
});

layerDelete.addEventListener("click", () => {
  deleteSelectedLayer();
});

canvasPresetSelect.addEventListener("change", () => {
  const preset = findCanvasPreset(canvasPresetSelect.value);

  documentContract.canvas = {
    presetId: preset.id,
    width: preset.width,
    height: preset.height,
    name: preset.name
  };
  render();
});

window.addEventListener("resize", () => {
  render();
});

canvas.addEventListener("pointerdown", (event) => {
  const layer = getActiveLayer();
  const point = getCanvasPoint(event);

  if (!layer) {
    return;
  }

  if (lassoMode && layer.type === "image") {
    event.preventDefault();
    lassoDrawing = true;
    lassoPoints = [point];
    canvas.setPointerCapture(event.pointerId);
    render();
    return;
  }

  const moveHit = hitTestMoveHandle(event);
  const resizeHit = hitTestResizeHandle(event);

  if (!moveHit && !resizeHit) {
    return;
  }

  event.preventDefault();

  if (moveHit) {
    moveState = {
      layerId: layer.id,
      startX: point.x,
      startY: point.y,
      startLayerX: layer.transform.x,
      startLayerY: layer.transform.y
    };
  } else if (resizeHit) {
    resizeState = {
      handle: resizeHit,
      layerId: layer.id,
      startX: point.x,
      startY: point.y,
      startScaleX: layer.transform.scaleX,
      startScaleY: layer.transform.scaleY
    };
  }

  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (lassoDrawing) {
    event.preventDefault();
    lassoPoints.push(getCanvasPoint(event));
    render();
    return;
  }

  if (!resizeState && !moveState) {
    canvas.style.cursor = lassoMode ? "crosshair" : cursorForHit(hitTestMoveHandle(event), hitTestResizeHandle(event));
    return;
  }

  event.preventDefault();

  if (moveState) {
    moveActiveLayer(event);
  } else {
    resizeActiveLayer(event);
  }
});

canvas.addEventListener("pointerup", (event) => {
  if (lassoDrawing) {
    lassoDrawing = false;
    canvas.releasePointerCapture(event.pointerId);
    extractLassoSelection();
    return;
  }

  resizeState = null;
  moveState = null;
  canvas.releasePointerCapture(event.pointerId);
  canvas.style.cursor = cursorForHit(hitTestMoveHandle(event), hitTestResizeHandle(event));
});

canvas.addEventListener("pointerleave", () => {
  if (!resizeState && !moveState) {
    canvas.style.cursor = "";
  }
});

function render(): void {
  syncDocumentContract();
  renderLayerList();
  syncPreviewCanvasSize();
  setControls(layers.length > 0);
  layerCount.textContent = `${layers.length}/${MAX_IMAGE_LAYERS}`;
  fileInput.disabled = layers.length >= MAX_IMAGE_LAYERS;
  syncLayerOrderButtons();
  syncTextControls();
  syncLassoControls();

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo obtener el contexto 2D del canvas.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const bounds = getDocumentBounds();
  const scale = 1;
  const offsetX = 0;
  const offsetY = 0;
  viewportState = { bounds, scale, offsetX, offsetY };

  drawCanvasFrame(context);

  if (layers.length === 0) {
    return;
  }

  context.save();
  context.beginPath();
  context.rect(offsetX, offsetY, bounds.width * scale, bounds.height * scale);
  context.clip();

  for (const layer of [...layers].reverse()) {
    if (!layer.visible) {
      continue;
    }

    const drawX = offsetX + layer.transform.x * scale;
    const drawY = offsetY + layer.transform.y * scale;
    const drawWidth = layer.width * layer.transform.scaleX * scale;
    const drawHeight = layer.height * layer.transform.scaleY * scale;

    context.save();
    context.globalAlpha = layer.opacity;
    if (layer.type === "image") {
      context.drawImage(layer.image.toCanvas(), drawX, drawY, drawWidth, drawHeight);
    } else {
      drawTextLayer(context, layer, drawX, drawY, scale);
    }
    context.restore();
  }

  context.restore();

  drawActiveLayerSelection(context);
  drawLassoPath(context);
}

function setControls(enabled: boolean): void {
  Object.values(buttons).forEach((button) => {
    button.disabled = !enabled;
  });
  buttons.text.disabled = false;
}

function syncPreviewCanvasSize(): void {
  const panelWidth = preview.clientWidth;
  const panelHeight = preview.clientHeight;
  const scale = Math.min(
    panelWidth / documentContract.canvas.width,
    panelHeight / documentContract.canvas.height
  );
  const displayWidth = Math.max(1, Math.round(documentContract.canvas.width * scale));
  const displayHeight = Math.max(1, Math.round(documentContract.canvas.height * scale));

  if (canvas.width !== documentContract.canvas.width) {
    canvas.width = documentContract.canvas.width;
  }

  if (canvas.height !== documentContract.canvas.height) {
    canvas.height = documentContract.canvas.height;
  }

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
}

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`No se encontro el elemento ${selector}.`);
  }

  return element;
}

function createLayer(file: File, image: ImageKit): ClientImageLayer {
  const scale = Math.min(
    documentContract.canvas.width / image.width,
    documentContract.canvas.height / image.height,
    1
  );
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  return {
    id: crypto.randomUUID(),
    type: "image",
    name: file.name,
    sourceType: "file",
    width: image.width,
    height: image.height,
    visible: true,
    opacity: 1,
    transform: {
      x: (documentContract.canvas.width - scaledWidth) / 2,
      y: (documentContract.canvas.height - scaledHeight) / 2,
      scaleX: scale,
      scaleY: scale,
      rotation: 0
    },
    image,
    previewUrl: URL.createObjectURL(file)
  };
}

function createTextLayer(): ClientTextLayer {
  const layer: ClientTextLayer = {
    id: crypto.randomUUID(),
    type: "text",
    name: "Texto",
    width: 420,
    height: 72,
    visible: true,
    opacity: 1,
    transform: {
      x: documentContract.canvas.width / 2 - 210,
      y: documentContract.canvas.height / 2 - 36,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    },
    text: "TEXTO MEME",
    fontFamily: "Impact, Haettenschweiler, 'Arial Black', sans-serif",
    fontSize: Number(textSizeSelect.value),
    fontWeight: "700",
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 6,
    align: "left"
  };

  syncTextLayerSize(layer);

  return layer;
}

function renderLayerList(): void {
  layersList.replaceChildren(
    ...layers.map((layer) => {
      const item = document.createElement("button");
      const thumbnail = document.createElement("img");
      const textThumb = document.createElement("span");
      const meta = document.createElement("span");
      const name = document.createElement("strong");
      const size = document.createElement("small");

      item.type = "button";
      item.className = "layer-item";
      item.dataset.active = String(layer.id === documentContract.activeLayerId);
      item.addEventListener("click", () => {
        documentContract.activeLayerId = layer.id;
        render();
        if (layer.type === "text") {
          textContentInput.focus();
        }
      });

      name.textContent = layer.name;
      size.textContent = layer.type === "text" ? layer.text : `${layer.width} x ${layer.height}`;
      meta.append(name, size);

      if (layer.type === "image") {
        thumbnail.src = layer.previewUrl;
        thumbnail.alt = "";
        item.append(thumbnail, meta);
      } else {
        textThumb.className = "text-layer-thumb";
        textThumb.textContent = "T";
        item.append(textThumb, meta);
      }

      return item;
    })
  );
}

async function exportDocumentBlob(): Promise<Blob> {
  const output = document.createElement("canvas");
  const context = output.getContext("2d");

  output.width = documentContract.canvas.width;
  output.height = documentContract.canvas.height;

  if (!context) {
    throw new Error("No se pudo exportar el lienzo.");
  }

  drawDocumentBackground(context, output.width, output.height);

  for (const layer of [...layers].reverse()) {
    if (!layer.visible) {
      continue;
    }

    context.save();
    context.globalAlpha = layer.opacity;
    if (layer.type === "image") {
      context.drawImage(
        layer.image.toCanvas(),
        layer.transform.x,
        layer.transform.y,
        layer.width * layer.transform.scaleX,
        layer.height * layer.transform.scaleY
      );
    } else {
      drawTextLayer(context, layer, layer.transform.x, layer.transform.y, 1);
    }
    context.restore();
  }

  return new Promise((resolve, reject) => {
    output.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("No se pudo convertir el lienzo a imagen."));
    }, "image/png");
  });
}

function renderBackgroundList(): void {
  backgroundsList.replaceChildren(
    ...backgroundPresets.map((background) => {
      const item = document.createElement("button");
      const swatch = document.createElement("span");

      item.type = "button";
      item.className = "background-item";
      item.title = background.name;
      item.dataset.active = String(background.id === documentContract.background.presetId);
      item.addEventListener("click", async () => {
        await setDocumentBackground(background);
      });

      swatch.className = "background-swatch";
      if (background.src) {
        swatch.style.backgroundImage = `url("${background.src}")`;
      }

      item.append(swatch);

      return item;
    })
  );
}

async function setDocumentBackground(background: BackgroundPreset): Promise<void> {
  documentContract.background = {
    presetId: background.id,
    name: background.name,
    src: background.src
  };
  activeBackgroundImage = background.src ? await loadBackgroundImage(background.src) : null;
  renderBackgroundList();
  render();
}

function loadBackgroundImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar el fondo ${src}.`));
    image.src = src;
  });
}

function setupCanvasPresetSelect(): void {
  const groups = new Map<string, HTMLOptGroupElement>();

  for (const preset of canvasPresets) {
    const group =
      groups.get(preset.category) ??
      (() => {
        const next = document.createElement("optgroup");

        next.label = preset.category;
        groups.set(preset.category, next);
        canvasPresetSelect.append(next);

        return next;
      })();
    const option = document.createElement("option");

    option.value = preset.id;
    option.textContent = `${preset.name} - ${preset.width} x ${preset.height} (${preset.ratio})`;
    group.append(option);
  }

  canvasPresetSelect.value = defaultCanvasPreset.id;
}

function setupIcons(): void {
  setButtonIcon(layerUp, icons.arrowUp);
  setButtonIcon(layerDown, icons.arrowDown);
  setButtonIcon(layerDelete, icons.trash);
  setButtonIcon(buttons.rotate, icons.rotate, "Rotar");
  setButtonIcon(buttons.flip, icons.flip, "Voltear");
  setButtonIcon(buttons.lasso, icons.lasso, "Lazo");
  setButtonIcon(buttons.text, icons.text, "Texto");
  setButtonIcon(buttons.download, icons.download, "Descargar");
  setButtonIcon(buttons.textUppercase, icons.uppercase);
  setButtonIcon(buttons.textAlignLeft, icons.alignLeft);
  setButtonIcon(buttons.textAlignCenter, icons.alignCenter);
  setButtonIcon(buttons.textAlignRight, icons.alignRight);
}

function setButtonIcon(button: HTMLButtonElement, icon: string, label?: string): void {
  button.innerHTML = label ? `${icon}<span>${label}</span>` : icon;
}

function moveLayer(fromIndex: number, toIndex: number): void {
  if (toIndex < 0 || toIndex >= layers.length) {
    return;
  }

  const [layer] = layers.splice(fromIndex, 1);
  layers.splice(toIndex, 0, layer);
  documentContract.activeLayerId = layer.id;
  render();
}

function moveSelectedLayer(direction: -1 | 1): void {
  const index = layers.findIndex((layer) => layer.id === documentContract.activeLayerId);

  if (index === -1) {
    return;
  }

  moveLayer(index, index + direction);
}

function syncLayerOrderButtons(): void {
  const activeIndex = layers.findIndex((layer) => layer.id === documentContract.activeLayerId);

  layerUp.disabled = activeIndex <= 0;
  layerDown.disabled = activeIndex === -1 || activeIndex >= layers.length - 1;
  layerDelete.disabled = activeIndex === -1;
}

function deleteSelectedLayer(): void {
  const index = layers.findIndex((layer) => layer.id === documentContract.activeLayerId);

  if (index === -1) {
    return;
  }

  const [removed] = layers.splice(index, 1);
  if (removed.type === "image") {
    URL.revokeObjectURL(removed.previewUrl);
  }
  documentContract.activeLayerId = layers[index]?.id ?? layers[index - 1]?.id ?? null;
  render();
}

async function extractLassoSelection(): Promise<void> {
  const sourceLayer = getActiveImageLayer();
  const points = lassoPoints;

  lassoPoints = [];
  lassoMode = false;

  if (!sourceLayer || points.length < 3) {
    render();
    return;
  }

  const localPoints = points.map((point) => ({
    x: (point.x - sourceLayer.transform.x) / sourceLayer.transform.scaleX,
    y: (point.y - sourceLayer.transform.y) / sourceLayer.transform.scaleY
  }));
  const bounds = getPointBounds(localPoints);

  if (bounds.width < 2 || bounds.height < 2) {
    render();
    return;
  }

  const output = document.createElement("canvas");
  const context = output.getContext("2d");

  output.width = Math.ceil(bounds.width);
  output.height = Math.ceil(bounds.height);

  if (!context) {
    render();
    return;
  }

  context.save();
  context.beginPath();
  localPoints.forEach((point, index) => {
    const x = point.x - bounds.x;
    const y = point.y - bounds.y;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.closePath();
  context.clip();
  context.drawImage(sourceLayer.image.toCanvas(), -bounds.x, -bounds.y);
  context.restore();

  const blob = await canvasToBlob(output);
  const image = await ImageKit.from(blob);
  const layer = createExtractedLayer(sourceLayer, image, output, bounds);

  layers.unshift(layer);
  documentContract.activeLayerId = layer.id;
  render();
}

function createExtractedLayer(
  sourceLayer: ClientImageLayer,
  image: ImageKit,
  output: HTMLCanvasElement,
  bounds: { x: number; y: number; width: number; height: number }
): ClientImageLayer {
  return {
    id: crypto.randomUUID(),
    type: "image",
    name: `${sourceLayer.name} seleccion`,
    sourceType: "generated",
    width: output.width,
    height: output.height,
    visible: true,
    opacity: 1,
    transform: {
      x: sourceLayer.transform.x + bounds.x * sourceLayer.transform.scaleX,
      y: sourceLayer.transform.y + bounds.y * sourceLayer.transform.scaleY,
      scaleX: sourceLayer.transform.scaleX,
      scaleY: sourceLayer.transform.scaleY,
      rotation: 0
    },
    image,
    previewUrl: output.toDataURL("image/png")
  };
}

function getPointBounds(points: Point[]): { x: number; y: number; width: number; height: number } {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function canvasToBlob(source: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    source.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("No se pudo crear la capa seleccionada."));
    }, "image/png");
  });
}

function drawLassoPath(context: CanvasRenderingContext2D): void {
  if (lassoPoints.length < 2) {
    return;
  }

  context.save();
  context.setLineDash([6, 4]);
  context.strokeStyle = "#0f766e";
  context.lineWidth = 2;
  context.beginPath();
  lassoPoints.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.stroke();
  context.restore();
}

function syncLassoControls(): void {
  const enabled = Boolean(getActiveImageLayer());

  buttons.lasso.disabled = !enabled;
  buttons.lasso.dataset.active = String(lassoMode && enabled);

  if (!enabled) {
    lassoMode = false;
    lassoPoints = [];
  }
}

function drawTextLayer(
  context: CanvasRenderingContext2D,
  layer: ClientTextLayer,
  x: number,
  y: number,
  viewportScale: number
): void {
  context.font = `${layer.fontWeight} ${layer.fontSize * layer.transform.scaleY * viewportScale}px ${layer.fontFamily}`;
  context.fillStyle = layer.color;
  context.strokeStyle = layer.strokeColor;
  context.lineJoin = "round";
  context.lineWidth = layer.strokeWidth * layer.transform.scaleY * viewportScale;
  context.textAlign = layer.align;
  context.textBaseline = "top";
  const lineHeight = layer.fontSize * 1.1 * layer.transform.scaleY * viewportScale;
  const maxWidth = layer.width * layer.transform.scaleX * viewportScale;
  const textX = resolveTextX(layer, x, maxWidth);

  for (const [index, line] of getTextLines(layer).entries()) {
    const lineY = y + index * lineHeight;

    context.strokeText(line, textX, lineY, maxWidth);
    context.fillText(line, textX, lineY, maxWidth);
  }
}

function drawActiveLayerSelection(context: CanvasRenderingContext2D): void {
  const rect = getActiveLayerScreenRect();

  if (!rect) {
    return;
  }

  const activeLayer = getActiveLayer();
  const handles = activeLayer?.type === "image" ? getResizeHandles(rect) : null;

  context.save();
  context.setLineDash([5, 4]);
  context.lineWidth = 1;
  context.strokeStyle = "#111827";
  context.strokeRect(rect.x, rect.y, rect.width, rect.height);
  context.setLineDash([]);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#111827";

  if (handles) {
    for (const handle of Object.values(handles)) {
      context.fillRect(handle.x, handle.y, handle.size, handle.size);
      context.strokeRect(handle.x, handle.y, handle.size, handle.size);
    }
  }

  drawMoveHandle(context, rect);

  context.restore();
}

function drawCanvasFrame(context: CanvasRenderingContext2D): void {
  if (!viewportState) {
    return;
  }

  context.save();
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 1;
  drawDocumentBackground(
    context,
    viewportState.bounds.width * viewportState.scale,
    viewportState.bounds.height * viewportState.scale,
    viewportState.offsetX,
    viewportState.offsetY
  );
  context.strokeRect(
    viewportState.offsetX,
    viewportState.offsetY,
    viewportState.bounds.width * viewportState.scale,
    viewportState.bounds.height * viewportState.scale
  );
  context.restore();
}

function drawDocumentBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  x = 0,
  y = 0
): void {
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, height);

  if (!activeBackgroundImage) {
    return;
  }

  context.drawImage(activeBackgroundImage, x, y, width, height);
}

function hitTestResizeHandle(event: PointerEvent): ResizeHandle | null {
  if (getActiveLayer()?.type !== "image") {
    return null;
  }

  const rect = getActiveLayerScreenRect();

  if (!rect) {
    return null;
  }

  const point = getCanvasPoint(event);
  const handles = getResizeHitHandles(rect);

  for (const [handle, box] of Object.entries(handles)) {
    if (
      point.x >= box.x &&
      point.x <= box.x + box.size &&
      point.y >= box.y &&
      point.y <= box.y + box.size
    ) {
      return handle as ResizeHandle;
    }
  }

  return null;
}

function resizeActiveLayer(event: PointerEvent): void {
  if (!resizeState || !viewportState) {
    return;
  }

  const layer = layers.find((candidate) => candidate.id === resizeState?.layerId);
  const point = getCanvasPoint(event);

  if (!layer) {
    return;
  }

  const dx = (point.x - resizeState.startX) / viewportState.scale;
  const dy = (point.y - resizeState.startY) / viewportState.scale;
  const widthDirection = resizeState.handle === "nw" || resizeState.handle === "sw" ? -1 : 1;
  const heightDirection = resizeState.handle === "nw" || resizeState.handle === "ne" ? -1 : 1;
  const nextWidth = layer.width * resizeState.startScaleX + dx * widthDirection;
  const nextHeight = layer.height * resizeState.startScaleY + dy * heightDirection;

  layer.transform.scaleX = Math.max(0.05, nextWidth / layer.width);
  layer.transform.scaleY = Math.max(0.05, nextHeight / layer.height);
  render();
}

function moveActiveLayer(event: PointerEvent): void {
  if (!moveState || !viewportState) {
    return;
  }

  const layer = layers.find((candidate) => candidate.id === moveState?.layerId);
  const point = getCanvasPoint(event);

  if (!layer) {
    return;
  }

  layer.transform.x = moveState.startLayerX + (point.x - moveState.startX) / viewportState.scale;
  layer.transform.y = moveState.startLayerY + (point.y - moveState.startY) / viewportState.scale;
  render();
}

function hitTestMoveHandle(event: PointerEvent): boolean {
  const rect = getActiveLayerScreenRect();

  if (!rect) {
    return false;
  }

  const point = getCanvasPoint(event);
  const handle = getMoveHandle(rect);

  return (
    point.x >= handle.x &&
    point.x <= handle.x + handle.size &&
    point.y >= handle.y &&
    point.y <= handle.y + handle.size
  );
}

function getActiveLayerScreenRect():
  | { x: number; y: number; width: number; height: number }
  | null {
  const layer = getActiveLayer();

  if (!layer || !viewportState) {
    return null;
  }

  return {
    x: viewportState.offsetX + layer.transform.x * viewportState.scale,
    y: viewportState.offsetY + layer.transform.y * viewportState.scale,
    width: layer.width * layer.transform.scaleX * viewportState.scale,
    height: layer.height * layer.transform.scaleY * viewportState.scale
  };
}

function getResizeHandles(rect: { x: number; y: number; width: number; height: number }) {
  const size = 10;
  const half = size / 2;

  return {
    nw: { x: rect.x - half, y: rect.y - half, size },
    ne: { x: rect.x + rect.width - half, y: rect.y - half, size },
    sw: { x: rect.x - half, y: rect.y + rect.height - half, size },
    se: { x: rect.x + rect.width - half, y: rect.y + rect.height - half, size }
  };
}

function getResizeHitHandles(rect: { x: number; y: number; width: number; height: number }) {
  const canvasRect = canvas.getBoundingClientRect();
  const displayScale = canvasRect.width > 0 ? canvas.width / canvasRect.width : 1;
  const size = Math.max(22, Math.round(34 * displayScale));
  const half = size / 2;

  return {
    nw: { x: rect.x - half, y: rect.y - half, size },
    ne: { x: rect.x + rect.width - half, y: rect.y - half, size },
    sw: { x: rect.x - half, y: rect.y + rect.height - half, size },
    se: { x: rect.x + rect.width - half, y: rect.y + rect.height - half, size }
  };
}

function getMoveHandle(rect: { x: number; y: number; width: number; height: number }) {
  const size = 28;

  return {
    x: rect.x + rect.width / 2 - size / 2,
    y: rect.y + rect.height / 2 - size / 2,
    size
  };
}

function drawMoveHandle(
  context: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number }
): void {
  const handle = getMoveHandle(rect);
  const centerX = handle.x + handle.size / 2;
  const centerY = handle.y + handle.size / 2;

  context.fillStyle = "rgba(255, 255, 255, 0.88)";
  context.strokeStyle = "#111827";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(centerX, centerY, handle.size / 2, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(centerX - 8, centerY);
  context.lineTo(centerX + 8, centerY);
  context.moveTo(centerX, centerY - 8);
  context.lineTo(centerX, centerY + 8);
  context.stroke();
}

function getCanvasPoint(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function cursorForHit(moveHit: boolean, resizeHandle: ResizeHandle | null): string {
  if (moveHit) {
    return "move";
  }

  return cursorForHandle(resizeHandle);
}

function cursorForHandle(handle: ResizeHandle | null): string {
  if (handle === "nw" || handle === "se") {
    return "nwse-resize";
  }

  if (handle === "ne" || handle === "sw") {
    return "nesw-resize";
  }

  return "";
}

function getActiveLayer(): ClientLayer | null {
  if (!documentContract.activeLayerId) {
    return null;
  }

  return layers.find((layer) => layer.id === documentContract.activeLayerId) ?? null;
}

function getActiveImageLayer(): ClientImageLayer | null {
  const layer = getActiveLayer();

  return layer?.type === "image" ? layer : null;
}

function getActiveTextLayer(): ClientTextLayer | null {
  const layer = getActiveLayer();

  return layer?.type === "text" ? layer : null;
}

function availableLayerSlots(): number {
  return Math.max(0, MAX_IMAGE_LAYERS - layers.length);
}

function getDocumentBounds(): { width: number; height: number } {
  return {
    width: documentContract.canvas.width,
    height: documentContract.canvas.height
  };
}

function syncLayerSize(layer: ClientImageLayer): void {
  layer.width = layer.image.width;
  layer.height = layer.image.height;
}

function syncTextControls(): void {
  const layer = getActiveTextLayer();

  textToolbar.hidden = !layer;
  textSizeSelect.disabled = !layer;
  textContentInput.disabled = !layer;
  textColorInput.disabled = !layer;
  buttons.textUppercase.disabled = !layer;
  buttons.textAlignLeft.disabled = !layer;
  buttons.textAlignCenter.disabled = !layer;
  buttons.textAlignRight.disabled = !layer;

  if (layer) {
    textContentInput.value = layer.text;
    textSizeSelect.value = String(layer.fontSize);
    textColorInput.value = layer.color;
    buttons.textAlignLeft.dataset.active = String(layer.align === "left");
    buttons.textAlignCenter.dataset.active = String(layer.align === "center");
    buttons.textAlignRight.dataset.active = String(layer.align === "right");
  }
}

function syncTextLayerSize(layer: ClientTextLayer): void {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
  const lines = getTextLines(layer);
  const widestLine = Math.max(...lines.map((line) => context.measureText(line || " ").width));

  layer.width = Math.max(80, Math.ceil(widestLine));
  layer.height = Math.ceil(layer.fontSize * 1.1 * lines.length);
  layer.name = "Texto";
}

function getTextLines(layer: ClientTextLayer): string[] {
  return layer.text.split(/\r?\n/);
}

function resolveTextX(layer: ClientTextLayer, x: number, width: number): number {
  if (layer.align === "center") {
    return x + width / 2;
  }

  if (layer.align === "right") {
    return x + width;
  }

  return x;
}

function setTextAlign(align: CanvasTextAlign): void {
  const layer = getActiveTextLayer();

  if (!layer) {
    return;
  }

  layer.align = align;
  render();
}

function syncDocumentContract(): void {
  documentContract.layers = layers.map(layerToContract);
}

function layerToContract(layer: ClientLayer): DocumentLayerContract {
  const base = {
    id: layer.id,
    type: layer.type,
    name: layer.name,
    width: layer.width,
    height: layer.height,
    visible: layer.visible,
    opacity: layer.opacity,
    transform: { ...layer.transform }
  };

  if (layer.type === "image") {
    return {
      ...base,
      type: "image",
      sourceType: layer.sourceType
    };
  }

  return {
    ...base,
    type: "text",
    text: layer.text,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    color: layer.color,
    strokeColor: layer.strokeColor,
    strokeWidth: layer.strokeWidth,
    align: layer.align
  };
}
