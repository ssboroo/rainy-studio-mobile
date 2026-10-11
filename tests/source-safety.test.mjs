import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const app=readFileSync("App.tsx","utf8");
const api=readFileSync("src/api.ts","utf8");
const config=readFileSync("src/config.ts","utf8");
test("only first-party HTTPS public endpoints used by mobile",()=>{
 assert.match(config,/https:\/\/video\.rainy\.studio/);
 assert.match(config,/https:\/\/voice\.rainy\.studio/);
 assert.match(api,/\/api\/models/);
 assert.match(api,/\/api\/voices/);
});
test("protected workflows stay server-side or first-party WebView",()=>{
 assert.match(app,/isTrustedStudioUrl/);
 assert.match(app,/onShouldStartLoadWithRequest/);
 assert.doesNotMatch(app,/HF_CREDENTIALS|ELEVENLABS_API_KEY|WIRE_MN_API_KEY|sk_live_/);
 assert.doesNotMatch(api,/HF_CREDENTIALS|ELEVENLABS_API_KEY|WIRE_MN_API_KEY|sk_live_/);
});
