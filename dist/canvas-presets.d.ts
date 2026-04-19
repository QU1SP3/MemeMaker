export type CanvasPresetCategory = "Instagram" | "Facebook" | "LinkedIn" | "TikTok" | "X" | "Pinterest" | "YouTube" | "Custom";
export interface CanvasPreset {
    id: string;
    category: CanvasPresetCategory;
    name: string;
    width: number;
    height: number;
    ratio: string;
}
export declare const canvasPresets: CanvasPreset[];
export declare const defaultCanvasPreset: CanvasPreset;
export declare function findCanvasPreset(id: string): CanvasPreset;
//# sourceMappingURL=canvas-presets.d.ts.map