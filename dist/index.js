export { MAX_IMAGE_LAYERS } from "./contracts";
export { canvasPresets, defaultCanvasPreset, findCanvasPreset } from "./canvas-presets";
const defaultExport = {
    type: "image/png",
    quality: 0.92
};
export class ImageKit {
    canvas;
    constructor(canvas) {
        this.canvas = canvas;
    }
    static async from(source) {
        const drawable = await loadDrawable(source);
        const canvas = createCanvas(readWidth(drawable), readHeight(drawable));
        const context = getContext(canvas);
        context.drawImage(drawable, 0, 0);
        closeIfBitmap(drawable);
        return new ImageKit(canvas);
    }
    static fromFile(file) {
        return ImageKit.from(file);
    }
    static fromUrl(url) {
        return ImageKit.from(url);
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    clone() {
        const next = createCanvas(this.width, this.height);
        getContext(next).drawImage(this.canvas, 0, 0);
        return new ImageKit(next);
    }
    crop(rect) {
        assertPositiveRect(rect);
        const sx = clamp(rect.x, 0, this.width);
        const sy = clamp(rect.y, 0, this.height);
        const sw = clamp(rect.width, 1, this.width - sx);
        const sh = clamp(rect.height, 1, this.height - sy);
        const next = createCanvas(sw, sh);
        getContext(next).drawImage(this.canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        this.canvas = next;
        return this;
    }
    resize(options) {
        const { width, height, fit = "contain" } = options;
        if (!width && !height) {
            throw new Error("resize requires width, height, or both.");
        }
        const size = resolveResize(this.width, this.height, width, height, fit);
        const next = createCanvas(size.width, size.height);
        const context = getContext(next);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(this.canvas, size.sourceX, size.sourceY, size.sourceWidth, size.sourceHeight, 0, 0, size.width, size.height);
        this.canvas = next;
        return this;
    }
    rotate(degrees) {
        const radians = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        const nextWidth = Math.max(1, Math.round(this.width * cos + this.height * sin));
        const nextHeight = Math.max(1, Math.round(this.width * sin + this.height * cos));
        const next = createCanvas(nextWidth, nextHeight);
        const context = getContext(next);
        context.translate(nextWidth / 2, nextHeight / 2);
        context.rotate(radians);
        context.drawImage(this.canvas, -this.width / 2, -this.height / 2);
        this.canvas = next;
        return this;
    }
    flip(direction) {
        const next = createCanvas(this.width, this.height);
        const context = getContext(next);
        const scaleX = direction === "horizontal" || direction === "both" ? -1 : 1;
        const scaleY = direction === "vertical" || direction === "both" ? -1 : 1;
        context.translate(scaleX === -1 ? this.width : 0, scaleY === -1 ? this.height : 0);
        context.scale(scaleX, scaleY);
        context.drawImage(this.canvas, 0, 0);
        this.canvas = next;
        return this;
    }
    transpose() {
        const next = createCanvas(this.height, this.width);
        const context = getContext(next);
        context.translate(0, this.width);
        context.rotate(-Math.PI / 2);
        context.scale(-1, 1);
        context.drawImage(this.canvas, -this.width, 0);
        this.canvas = next;
        return this;
    }
    drawText(text, options) {
        const context = getContext(this.canvas);
        context.font = options.font ?? "32px sans-serif";
        context.fillStyle = options.color ?? "#000000";
        context.textAlign = options.align ?? "left";
        context.textBaseline = options.baseline ?? "alphabetic";
        if (options.strokeColor || options.strokeWidth) {
            context.strokeStyle = options.strokeColor ?? "#ffffff";
            context.lineWidth = options.strokeWidth ?? 2;
            context.strokeText(text, options.x, options.y, options.maxWidth);
        }
        context.fillText(text, options.x, options.y, options.maxWidth);
        return this;
    }
    toCanvas() {
        return this.canvas;
    }
    async toBlob(options = {}) {
        const exportOptions = { ...defaultExport, ...options };
        if ("convertToBlob" in this.canvas) {
            return this.canvas.convertToBlob(exportOptions);
        }
        const canvas = this.canvas;
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }
                reject(new Error("Canvas export failed."));
            }, exportOptions.type, exportOptions.quality);
        });
    }
    async toFile(options = {}) {
        const type = options.type ?? defaultExport.type;
        const blob = await this.toBlob({ type, quality: options.quality });
        return new File([blob], options.name ?? `image.${extensionFromMime(type)}`, {
            type,
            lastModified: options.lastModified ?? Date.now()
        });
    }
    async toDataUrl(options = {}) {
        const exportOptions = { ...defaultExport, ...options };
        if ("toDataURL" in this.canvas) {
            return this.canvas.toDataURL(exportOptions.type, exportOptions.quality);
        }
        const blob = await this.toBlob(exportOptions);
        return blobToDataUrl(blob);
    }
}
async function loadDrawable(source) {
    if (typeof source === "string") {
        return loadImageElement(source);
    }
    if (source instanceof Blob) {
        if ("createImageBitmap" in globalThis) {
            return createImageBitmap(source, { imageOrientation: "from-image" });
        }
        return loadImageElement(URL.createObjectURL(source), true);
    }
    return source;
}
function loadImageElement(src, revokeAfterLoad = false) {
    if (!("Image" in globalThis)) {
        throw new Error("HTMLImageElement is not available in this environment.");
    }
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            if (revokeAfterLoad) {
                URL.revokeObjectURL(src);
            }
            resolve(image);
        };
        image.onerror = () => {
            if (revokeAfterLoad) {
                URL.revokeObjectURL(src);
            }
            reject(new Error(`Failed to load image: ${src}`));
        };
        image.src = src;
    });
}
function createCanvas(width, height) {
    const safeWidth = Math.max(1, Math.round(width));
    const safeHeight = Math.max(1, Math.round(height));
    if ("OffscreenCanvas" in globalThis) {
        return new OffscreenCanvas(safeWidth, safeHeight);
    }
    if (!globalThis.document) {
        throw new Error("Canvas is not available in this environment.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    return canvas;
}
function getContext(canvas) {
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("2D canvas context is not available.");
    }
    return context;
}
function readWidth(source) {
    if ("naturalWidth" in source && typeof source.naturalWidth === "number") {
        return source.naturalWidth;
    }
    return Number(source.width);
}
function readHeight(source) {
    if ("naturalHeight" in source && typeof source.naturalHeight === "number") {
        return source.naturalHeight;
    }
    return Number(source.height);
}
function resolveResize(currentWidth, currentHeight, width, height, fit = "contain") {
    if (fit === "stretch") {
        return {
            width: width ?? currentWidth,
            height: height ?? currentHeight,
            sourceX: 0,
            sourceY: 0,
            sourceWidth: currentWidth,
            sourceHeight: currentHeight
        };
    }
    if (!width) {
        const ratio = height / currentHeight;
        return resized(currentWidth * ratio, height, currentWidth, currentHeight);
    }
    if (!height) {
        const ratio = width / currentWidth;
        return resized(width, currentHeight * ratio, currentWidth, currentHeight);
    }
    if (fit === "cover") {
        const sourceRatio = currentWidth / currentHeight;
        const targetRatio = width / height;
        if (sourceRatio > targetRatio) {
            const sourceWidth = currentHeight * targetRatio;
            return {
                width,
                height,
                sourceX: (currentWidth - sourceWidth) / 2,
                sourceY: 0,
                sourceWidth,
                sourceHeight: currentHeight
            };
        }
        const sourceHeight = currentWidth / targetRatio;
        return {
            width,
            height,
            sourceX: 0,
            sourceY: (currentHeight - sourceHeight) / 2,
            sourceWidth: currentWidth,
            sourceHeight
        };
    }
    const ratio = Math.min(width / currentWidth, height / currentHeight);
    return resized(currentWidth * ratio, currentHeight * ratio, currentWidth, currentHeight);
}
function resized(width, height, sourceWidth, sourceHeight) {
    return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
        sourceX: 0,
        sourceY: 0,
        sourceWidth,
        sourceHeight
    };
}
function assertPositiveRect(rect) {
    if (rect.width <= 0 || rect.height <= 0) {
        throw new Error("Crop width and height must be greater than zero.");
    }
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function extensionFromMime(type) {
    const extension = type.split("/")[1]?.replace("jpeg", "jpg");
    return extension || "png";
}
function closeIfBitmap(source) {
    if ("close" in source && typeof source.close === "function") {
        source.close();
    }
}
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
//# sourceMappingURL=index.js.map