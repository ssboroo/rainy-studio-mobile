import test from "node:test";
import assert from "node:assert/strict";
import { composeVideoUrl,isTrustedStudioUrl,studioUrl } from "../src/studio-links.js";
test("only HTTPS and exact studio host are allowed",()=>{
 assert.equal(isTrustedStudioUrl("https://video.rainy.studio/studio","video"),true);
 assert.equal(isTrustedStudioUrl("https://voice.rainy.studio/","voice"),true);
 assert.equal(isTrustedStudioUrl("https://video.rainy.studio.evil.com/","video"),false);
 assert.equal(isTrustedStudioUrl("javascript:alert(1)","video"),false);
 assert.equal(isTrustedStudioUrl("http://video.rainy.studio/","video"),false);
 assert.equal(isTrustedStudioUrl("https://video.rainy.studio@evil.com/","video"),false);
 assert.equal(isTrustedStudioUrl("https://voice.rainy.studio/","video"),false);
});
test("video prompt preserves Mongolian while encoding query",()=>{
 const u=new URL(composeVideoUrl("kling-3","Монгол кино: өдрийн гэрэл & хөгжим"));
 assert.equal(u.origin,"https://video.rainy.studio");
 assert.equal(u.searchParams.get("model"),"kling-3");
 assert.equal(u.searchParams.get("prompt"),"Монгол кино: өдрийн гэрэл & хөгжим");
});
test("invalid model and protocol-relative path cannot redirect",()=>{
 const u=new URL(composeVideoUrl("https://evil.com",""));
 assert.equal(u.searchParams.has("model"),false);
 assert.equal(studioUrl("video","//evil.example"),"https://video.rainy.studio/");
});
