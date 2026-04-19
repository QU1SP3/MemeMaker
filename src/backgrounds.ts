export interface BackgroundPreset {
  id: string;
  name: string;
  src: string | null;
}

type GlobImageModule = string;

const modules = import.meta.glob<GlobImageModule>(
  "./assets/backgrounds/*.{png,jpg,jpeg,webp,svg,avif,gif}",
  {
    eager: true,
    import: "default",
    query: "?url"
  }
);

const discoveredBackgrounds: BackgroundPreset[] = Object.entries(modules)
  .map(([path, src]) => {
    const filename = path.split("/").pop() ?? path;
    const id = filename.replace(/\.[^.]+$/, "");

    return {
      id,
      name: titleFromId(id),
      src: String(src)
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const backgroundPresets: BackgroundPreset[] = [
  {
    id: "none",
    name: "Blanco",
    src: null
  },
  ...discoveredBackgrounds
];

export const defaultBackgroundPreset = backgroundPresets[0];

function titleFromId(id: string): string {
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
