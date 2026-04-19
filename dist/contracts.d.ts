export declare const MAX_IMAGE_LAYERS = 10;
export type ImageLayerId = string;
export interface BaseLayerContract {
    id: ImageLayerId;
    type: "image" | "text";
    name: string;
    width: number;
    height: number;
    visible: boolean;
    opacity: number;
    transform: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
    };
}
export interface ImageLayerContract extends BaseLayerContract {
    type: "image";
    sourceType: "file" | "url" | "generated";
}
export interface TextLayerContract extends BaseLayerContract {
    type: "text";
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    align: CanvasTextAlign;
}
export type DocumentLayerContract = ImageLayerContract | TextLayerContract;
export interface ImageDocumentContract {
    version: 1;
    maxLayers: typeof MAX_IMAGE_LAYERS;
    canvas: {
        presetId: string;
        width: number;
        height: number;
        name: string;
    };
    background: {
        presetId: string;
        name: string;
        src: string | null;
    };
    activeLayerId: ImageLayerId | null;
    layers: DocumentLayerContract[];
}
export type AddImageLayersRequest = {
    files: File[];
};
export type AddImageLayersResult = {
    ok: true;
    document: ImageDocumentContract;
    addedLayerIds: ImageLayerId[];
} | {
    ok: false;
    reason: "layer-limit-exceeded" | "empty-input";
    message: string;
};
//# sourceMappingURL=contracts.d.ts.map