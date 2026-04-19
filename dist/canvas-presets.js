export const canvasPresets = [
    {
        id: "instagram-feed-portrait",
        category: "Instagram",
        name: "Instagram Feed Portrait",
        width: 1080,
        height: 1350,
        ratio: "4:5"
    },
    {
        id: "instagram-feed-square",
        category: "Instagram",
        name: "Instagram Feed Square",
        width: 1080,
        height: 1080,
        ratio: "1:1"
    },
    {
        id: "instagram-feed-landscape",
        category: "Instagram",
        name: "Instagram Feed Landscape",
        width: 1080,
        height: 566,
        ratio: "1.91:1"
    },
    {
        id: "instagram-story-reel",
        category: "Instagram",
        name: "Instagram Story / Reel",
        width: 1080,
        height: 1920,
        ratio: "9:16"
    },
    {
        id: "facebook-feed-square",
        category: "Facebook",
        name: "Facebook Feed Square",
        width: 1080,
        height: 1080,
        ratio: "1:1"
    },
    {
        id: "facebook-feed-portrait",
        category: "Facebook",
        name: "Facebook Feed Portrait",
        width: 1080,
        height: 1350,
        ratio: "4:5"
    },
    {
        id: "facebook-feed-landscape",
        category: "Facebook",
        name: "Facebook Feed Landscape",
        width: 1200,
        height: 628,
        ratio: "1.91:1"
    },
    {
        id: "facebook-story",
        category: "Facebook",
        name: "Facebook Story",
        width: 1080,
        height: 1920,
        ratio: "9:16"
    },
    {
        id: "linkedin-post-landscape",
        category: "LinkedIn",
        name: "LinkedIn Post Landscape",
        width: 1200,
        height: 628,
        ratio: "1.91:1"
    },
    {
        id: "linkedin-post-square",
        category: "LinkedIn",
        name: "LinkedIn Post Square",
        width: 1200,
        height: 1200,
        ratio: "1:1"
    },
    {
        id: "linkedin-post-portrait",
        category: "LinkedIn",
        name: "LinkedIn Post Portrait",
        width: 720,
        height: 900,
        ratio: "4:5"
    },
    {
        id: "tiktok-video-post",
        category: "TikTok",
        name: "TikTok Vertical Post",
        width: 1080,
        height: 1920,
        ratio: "9:16"
    },
    {
        id: "x-post-landscape",
        category: "X",
        name: "X Post Landscape",
        width: 1600,
        height: 900,
        ratio: "16:9"
    },
    {
        id: "x-post-portrait",
        category: "X",
        name: "X Post Portrait",
        width: 1080,
        height: 1350,
        ratio: "4:5"
    },
    {
        id: "x-card",
        category: "X",
        name: "X Card / Link Preview",
        width: 1200,
        height: 628,
        ratio: "1.91:1"
    },
    {
        id: "pinterest-standard-pin",
        category: "Pinterest",
        name: "Pinterest Standard Pin",
        width: 1000,
        height: 1500,
        ratio: "2:3"
    },
    {
        id: "pinterest-idea-pin",
        category: "Pinterest",
        name: "Pinterest Idea Pin",
        width: 1080,
        height: 1920,
        ratio: "9:16"
    },
    {
        id: "youtube-thumbnail",
        category: "YouTube",
        name: "YouTube Thumbnail",
        width: 1280,
        height: 720,
        ratio: "16:9"
    },
    {
        id: "youtube-community-landscape",
        category: "YouTube",
        name: "YouTube Community Landscape",
        width: 1200,
        height: 675,
        ratio: "16:9"
    },
    {
        id: "youtube-community-square",
        category: "YouTube",
        name: "YouTube Community Square",
        width: 1080,
        height: 1080,
        ratio: "1:1"
    }
];
export const defaultCanvasPreset = canvasPresets[0];
export function findCanvasPreset(id) {
    return canvasPresets.find((preset) => preset.id === id) ?? defaultCanvasPreset;
}
//# sourceMappingURL=canvas-presets.js.map