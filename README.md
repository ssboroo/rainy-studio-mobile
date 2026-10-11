# RAINY Studio Mobile ☂️

**Монгол хэл дээрх AI бүтээлч экосистемийн Android + iOS апп** — Video Studio (Higgsfield-backed) болон Voice Studio (ElevenLabs-backed) хоёр тусдаа веб системийг нэг native интерфейсээс ашиглана.

> Status: **MVP development**. No claim of published App Store / Play Store app, working single-sign-on or completed card/in-app purchases.

## What the initial app does

- Native React Native/Expo dark-themed home, search, workflow templates and product navigation.
- Fetches public model catalog from `https://video.rainy.studio/api/models` and available voices from `https://voice.rainy.studio/api/voices`, with safe offline/error states.
- Compose Mongolian video prompts, choose a model, and open the existing authenticated RAVS production workflow **with the prompt/model**.
- Compose Mongolian voice scripts, pick a voice and emotion direction, **copy script** and enter the existing authenticated Voice Studio workflow.
- Open each product's real account-scoped generation history and account views through embedded first-party HTTPS WebViews. Browser sessions are **separate**; no pretend unified wallet/login.
- No merchant credentials / Higgsfield / ElevenLabs API keys in the app.

## Start

Requires **Node.js 22.13+** and Expo SDK 57.

```bash
git clone https://github.com/ssboroo/rainy-studio-mobile.git
cd rainy-studio-mobile
npm install
npx expo install --fix
npm run start
```

Open in Expo Go or a development build. Run `npm run android`, `npm run ios` (macOS simulator or EAS cloud for a build), or `npx eas-cli build --platform android --profile preview`.

## Architecture / boundaries

- **No direct native paid generation yet**. The existing servers use HTTP-only browser session authentication and Voice requires CSRF and Origin checks. Native app uses a WebView on approved first-party origins for protected actions instead of bypassing security or storing a raw password.
- RAVS and Voice accounts, subscriptions and credit wallets are separate. SSO, consolidated history, push job notifications, full direct mobile APIs and video/voice MP4 assembly are future phases.
- **In-app payments are not launched.** App Store/Google Play digital-service billing rules must be resolved before public store release; do not rely on the existing web Wire checkout for store approval.
- A backend job can succeed only when provider credentials, user balance and upstream API endpoint are operational. No fabricated offline generations.

## Developer references

- Video backend: https://github.com/ssboroo/rainyaivideostudio
- Voice backend: https://github.com/ssboroo/rainy_tts
- Expo SDK: https://docs.expo.dev/versions/v57.0.0/
- Native WebView: https://docs.expo.dev/versions/latest/sdk/webview/

## Validation

```bash
npm run typecheck
npm run test
npx expo-doctor
```

Production checklist is in `docs/RELEASE_CHECKLIST_MN.md`.

© 2026 RAINY Studio. Independent product; third-party API integrations do not represent official partnership.
