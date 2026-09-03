# هايتيل (Hytale)

حزمة هايتيل على منصة سيرفرك (`serverk.gg`). هذا المستودع فيه كل شيء اللعبة تحتاجه عشان تشتغل على المنصة: ملف التعريف `serverk.yml`، الـ driver اللي يدير السيرفر، صورة الدوكر، والشروحات.

The Hytale game package for the Serverk platform (`serverk.gg`). This repo holds everything the game needs to run on the platform: the `serverk.yml` manifest, the driver that manages the server, the Docker image, and the guides.

## Layout

- `serverk.yml` — the game manifest: metadata, resources, ports, the downloader secret, backup rules, guides.
- `src/` — the bridge driver: install (the official Hytale downloader), lifecycle, query, backup, and the panel modules.
- `image/Dockerfile` — the runtime image: Temurin 25 JRE plus the Hytale downloader; the compiled bridge binary is its entrypoint.
- `assets/` — logo and banner (webp).
- `guides/` — player guides in Arabic and English.

## How a Hytale server comes up

1. `install` seeds the downloader credentials from the platform secret `HYTALE_DOWNLOADER_CREDENTIALS`, asks the downloader whether the installed version is current, and pulls `HytaleServer.jar` and `Assets.zip` when it is not. It runs on every boot and is a no-op on a healthy, current server.
2. `lifecycle` starts the JVM with a heap sized from the plan's memory, binds QUIC to the manifest's `game` port, and runs in `authenticated` auth mode.
3. The customer signs the server in once from the panel's Login tab with a device-code login on their own Hytale account. The tokens persist encrypted inside the server directory.

## Develop

Everything runs on [Bun](https://bun.sh):

```sh
bun install
bun run check
bun run tsc
bun run test
bun run validate
bun run compile
```

`validate` checks the manifest, assets, and driver wiring with the exact validation the platform runs at publish. `compile` produces `dist/bridge`, an amd64 binary — serverk publishes game images for `linux/amd64` only.

The `.githooks/pre-commit` hook is the gate: it runs `fix`, `tsc`, `test`, `validate`, and `serverk-bridge schema --check` on every commit. `bun install` wires it up through the `prepare` script.

The driver is built on [`@serverkgg/bridge`](https://www.npmjs.com/package/@serverkgg/bridge). `serverk-bridge link` points it at a local bridge checkout on every install — never commit a `file:` dependency.

## Contribute

- افتح issue لأي مشكلة أو اقتراح — بالعربي أو بالإنجليزي، كلها مرحّب فيها.
- Run `bun run check`, `bun run tsc`, `bun run test` and `bun run validate` before you open a pull request — the same checks the pre-commit hook runs.
- Releases are done by the Serverk team through the platform's central release pipeline; merged changes ride the next release.

## Arabic copy

Arabic is the source language of the platform. Player-facing strings in `serverk.yml` and the guides use Gulf gaming Arabic — the game's Arabic name is always «هايتيل», written solid.
