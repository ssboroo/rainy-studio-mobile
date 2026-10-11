export declare const VIDEO_ORIGIN: string;
export declare const VOICE_ORIGIN: string;
export declare function isTrustedStudioUrl(url:string, studio:"video"|"voice"):boolean;
export declare function composeVideoUrl(model:string,prompt:string):string;
export declare function studioUrl(studio:"video"|"voice",path?:string):string;
