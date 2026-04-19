# browser-image-kit

Libreria TypeScript para manipular imagenes en navegadores modernos usando APIs nativas como Canvas, ImageBitmap, Blob y OffscreenCanvas cuando esta disponible.

## Inicio rapido

```ts
import { ImageKit } from "browser-image-kit";

const image = await ImageKit.fromFile(file);

const output = await image
  .crop({ x: 20, y: 20, width: 500, height: 500 })
  .resize({ width: 1000 })
  .rotate(90)
  .drawText("Demo", {
    x: 32,
    y: 64,
    font: "bold 40px sans-serif",
    color: "#ffffff",
    strokeColor: "#111111",
    strokeWidth: 4
  })
  .toBlob({ type: "image/webp", quality: 0.9 });
```

## Comandos

```bash
npm install
npm run build
```

## Estado

Primera base funcional:

- cargar desde `File`, `Blob`, `ImageBitmap`, `HTMLImageElement`, `HTMLCanvasElement`, `OffscreenCanvas` o URL
- recortar
- escalar
- rotar
- voltear
- transponer
- dibujar texto
- exportar a `Blob`, `File`, `DataURL` o canvas

