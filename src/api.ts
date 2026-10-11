import { VIDEO_URL, VOICE_URL } from "./config";
export type VideoModel = {
  slug:string; name:string; kind:"video"|"image"|"workflow";
  maker?:string; provider?:string; featured?:boolean; apiVerified?:boolean;
  capabilities?:string[]; description?:string;
};
export type VoiceOption = { id:string; name:string; description?:string; native_mn?:boolean; synced?:boolean; builtin?:boolean; };

async function requestJson(url:string):Promise<unknown> {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  try {
    const response=await fetch(url,{headers:{Accept:"application/json"},cache:"no-store",signal:controller.signal});
    if(!response.ok)throw new Error("HTTP "+response.status);
    return await response.json();
  } finally {clearTimeout(timer);}
}
const object=(v:unknown):v is Record<string,unknown> => Boolean(v)&&typeof v==="object"&&!Array.isArray(v);
export async function getVideoModels():Promise<VideoModel[]> {
  const data=await requestJson(VIDEO_URL+"/api/models");
  if(!object(data)||!Array.isArray(data.models))throw new Error("Видео загварын хариу буруу.");
  const filtered:VideoModel[]=[];
  for(const raw of data.models) {
    if(!object(raw)||typeof raw.slug!=="string"||typeof raw.name!=="string")continue;
    if(raw.kind!=="video"&&raw.kind!=="image"&&raw.kind!=="workflow")continue;
    filtered.push({
      slug:raw.slug,name:raw.name,kind:raw.kind,
      maker:typeof raw.maker==="string"?raw.maker:undefined,
      provider:typeof raw.provider==="string"?raw.provider:undefined,
      featured:raw.featured===true,apiVerified:raw.apiVerified===true,
      capabilities:Array.isArray(raw.capabilities)?raw.capabilities.filter((x):x is string=>typeof x==="string").slice(0,4):[],
      description:typeof raw.description==="string"?raw.description:undefined
    });
  }
  return filtered;
}
export async function getVoiceOptions():Promise<VoiceOption[]> {
  const data=await requestJson(VOICE_URL+"/api/voices");
  if(!object(data)||!Array.isArray(data.voices))throw new Error("Хоолойн жагсаалтын хариу буруу.");
  const filtered:VoiceOption[]=[];
  for(const v of data.voices) {
    if(!object(v)||typeof v.id!=="string"||typeof v.name!=="string")continue;
    filtered.push({
      id:v.id,name:v.name,description:typeof v.description==="string"?v.description:undefined,
      native_mn:v.native_mn===true,synced:v.synced===true,builtin:v.builtin===true,
    });
  }
  return filtered;
}
export type Connection = "ready" | "unavailable" | "checking";
export async function checkConnections():Promise<{video:Connection;voice:Connection}> {
  const [video,voice]=await Promise.allSettled([
    requestJson(VIDEO_URL+"/api/health"),
    requestJson(VOICE_URL+"/api/health")
  ]);
  const videoReady=video.status==="fulfilled"&&object(video.value)&&video.value.status==="ok";
  const voiceReady=voice.status==="fulfilled"&&object(voice.value)&&voice.value.ok===true;
  return {video:videoReady?"ready":"unavailable",voice:voiceReady?"ready":"unavailable"};
}
