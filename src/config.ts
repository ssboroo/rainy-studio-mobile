export const VIDEO_URL = "https://video.rainy.studio" as const;
export const VOICE_URL = "https://voice.rainy.studio" as const;
export const WEBSITE_URL = "https://rainy.studio" as const;

export type Studio = "video" | "voice";
export function originFor(studio: Studio) { return studio === "video" ? VIDEO_URL : VOICE_URL; }
