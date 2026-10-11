# RAINY Studio Mobile — Release checklist (2026-10-11)

## MVP scope (current)
- Native UI: Нүүр, Видео, Voice, Төслүүд, Профайл.
- Public catalog: RAVS `GET /api/models`, Voice `GET /api/voices`.
- Native prompt composer: video website accepts `/studio?model=...&prompt=...`.
- Voice composer: text and mood are **copied**; user selects voice/mood on the website; no claim of automatically generated audio.
- Secure site WebView: independent site accounts and real existing authenticated production workflows.
- Remote health check: frontend displays site connectivity, not provider billing success.
- No unified credit wallet, no Apple/Google IAP, no native paid generation, no automatic merged MP4.

## 1. Run local checks
```powershell
npm install
npx expo install --fix
npm run typecheck
npm test
npx expo-doctor
npx expo start -c
```
**Do not** commit API keys or credentials. Expo JS bundles are public.

## 2. Android internal testing
- Create Expo account. `npx eas-cli login`, then `npx eas-cli build:configure`.
- Check owner/project link and `studio.rainy.mobile` package ID before first build.
- `npx eas-cli build --platform android --profile preview` creates APK for testers.
- Test navigation, both HTTPS origins, failed network, WebView login, upload/media permissions, playback, file downloads, accessibility and Android back.
- Confirm Billing restrictions before any public Play submission.

## 3. iOS TestFlight
- Enroll Apple Developer Program and choose a unique Bundle ID (current placeholder `studio.rainy.mobile`).
- `npx eas-cli build --platform ios --profile production` after signing credentials/configuration.
- Test on real iPhone: protected cookies, Voice SameSite=Strict session, File chooser, microphone permissions and media export. Add usage descriptions and permissions only when features need them.
- Native web-only checkout for digital AI credits may violate Apple's App Review. **Do not submit to public App Store before native billing design, legal/policy/privacy review and correct purchase handling.**

## 4. Production readiness gates
- Write unified SSO only after an audited backend OAuth/PKCE mobile client implementation with deep-link verification; never send passwords or store server secrets in the client.
- Native paid create/status endpoints require mobile access tokens, server-enforced scopes, explicit quote/credit cap, idempotency keys and customer consent. Never emulate a browser session or bypass CSRF.
- Validate RAVS and Voice server health, then real generation on *owned test accounts*, with real positive and negative provider/API quota outcomes and failed-job refund checks.
- Validate users see correct total spend before any payment or generation, maintain distinct upstream ledgers until a true cross-app ledger is built.
- Support account deletion, privacy policy, data and media retention, permission rationales, Apple/Google billing requirements and localization.
- The current WebView approach is an INTERNAL MVP, not a guarantee of approval under App Store design guideline 4.2.

## GitHub projects
- Mobile: https://github.com/ssboroo/rainy-studio-mobile
- Video: https://github.com/ssboroo/rainyaivideostudio
- Voice: https://github.com/ssboroo/rainy_tts
