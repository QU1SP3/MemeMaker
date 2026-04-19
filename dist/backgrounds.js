const modules = import.meta.glob("./assets/backgrounds/*.{png,jpg,jpeg,webp,svg,avif,gif}", {
    eager: true,
    import: "default",
    query: "?url"
});
const discoveredBackgrounds = Object.entries(modules)
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
export const backgroundPresets = [
    {
        id: "none",
        name: "Blanco",
        src: null
    },
    ...discoveredBackgrounds
];
export const defaultBackgroundPreset = backgroundPresets[0];
function titleFromId(id) {
    return id
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
//# sourceMappingURL=backgrounds.js.map