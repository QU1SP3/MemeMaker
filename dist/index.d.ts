export type CanvasLike = HTMLCanvasElement | OffscreenCanvas;
export type { AddImageLayersRequest, AddImageLayersResult, ImageDocumentContract, ImageLayerContract, ImageLayerId } from "./contracts";
export { MAX_IMAGE_LAYERS } from "./contracts";
export type { CanvasPreset, CanvasPresetCategory } from "./canvas-presets";
export { canvasPresets, defaultCanvasPreset, findCanvasPreset } from "./canvas-presets";
export type ImageSource = Blob | ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | string;
export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ResizeOptions {
    width?: number;
    height?: number;
    fit?: "contain" | "cover" | "stretch";
}
export interface TextOptions {
    x: number;
    y: number;
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    maxWidth?: number;
    strokeColor?: string;
    strokeWidth?: number;
}
export interface ExportOptions {
    type?: string;
    quality?: number;
}
export interface FileExportOptions extends ExportOptions {
    name?: string;
    lastModified?: number;
}
export declare class ImageKit {
    private canvas;
    private constructor();
    static from(source: ImageSource): Promise<ImageKit>;
    static fromFile(file: File | Blob): Promise<ImageKit>;
    static fromUrl(url: string): Promise<ImageKit>;
    get width(): number;
    get height(): number;
    clone(): ImageKit;
    crop(rect: CropRect): this;
    resize(options: ResizeOptions): this;
    rotate(degrees: number): this;
    flip(direction: "horizontal" | "vertical" | "both"): this;
    transpose(): this;
    drawText(text: string, options: TextOptions): this;
    toCanvas(): CanvasLike;
    toBlob(options?: ExportOptions): Promise<Blob>;
    toFile(options?: FileExportOptions): Promise<File>;
    toDataUrl(options?: ExportOptions): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map