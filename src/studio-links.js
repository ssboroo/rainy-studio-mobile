/** No URL can escape our two approved HTTPS studio origins inside the in-app browser. */
export const VIDEO_ORIGIN = "https://video.rainy.studio";
export const VOICE_ORIGIN = "https://voice.rainy.studio";
export function isTrustedStudioUrl(url,studio) {
  if(url==="about:blank")return true;
  try {
    const parsed=new URL(url);
    const expected=new URL(studio==="video"?VIDEO_ORIGIN:VOICE_ORIGIN);
    return parsed.protocol==="https:"&&parsed.origin===expected.origin&&
      !parsed.username&&!parsed.password;
  } catch { return false; }
}
export function composeVideoUrl(model, prompt) {
  const u=new URL("/studio",VIDEO_ORIGIN);
  if(model && /^[a-z0-9._/-]{1,120}$/i.test(model)) u.searchParams.set("model",model);
  // The Video website explicitly supports /studio?model=...&prompt=...
  if(prompt && prompt.trim()) u.searchParams.set("prompt",prompt.trim().slice(0,2400));
  return u.toString();
}
export function studioUrl(studio,path="/") {
  const origin=studio==="video"?VIDEO_ORIGIN:VOICE_ORIGIN;
  const valid=path.startsWith("/")&&!path.startsWith("//")?path:"/";
  return new URL(valid,origin).toString();
}
