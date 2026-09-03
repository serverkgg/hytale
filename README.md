# هايتيل (Hytale)

حزمة هايتيل على منصة سيرفرك (`serverk.gg`). هذا المستودع فيه كل شيء اللعبة تحتاجه عشان تشتغل على المنصة: ملف التعريف `serverk.yml`، الـ driver اللي يدير السيرفر، صورة الدوكر، والشروحات.

The Hytale game package for the Serverk platform (`serverk.gg`). This repo holds everything the game needs to run on the platform: the `serverk.yml` manifest, the driver that manages the server, the Docker image, and the guides.

## Layout

- `serverk.yml` — the game manifest: metadata, resources, ports, backup rules, guides. It declares no platform secret.
- `src/` — the bridge driver: install (the Maven bootstrap installer), lifecycle, query, and the panel modules.
- `image/Dockerfile` — the runtime image: Temurin 25 JRE; the compiled bridge binary is its entrypoint.
- `assets/` — logo and banner (webp).
- `guides/` — player guides in Arabic and English.

## How a Hytale server comes up

The driver has two stages, decided every launch by whether the official payload (`Server/HytaleServer.jar`, `Assets.zip`, `start.sh`) is on the volume.

1. **Bootstrap.** `install` resolves the newest `Server` release from `https://maven.hytale.com/release/com/hypixel/hytale/Server/maven-metadata.xml`, verifies the published `.sha1`, and downloads `HytaleServer.jar` into the volume root through the agent's artifact cache. `lifecycle` runs it as `java -jar HytaleServer.jar --bootstrap`.
2. **Sign-in.** The customer signs the server in once from the panel's Login tab with a device-code login on their own Hytale account. On the `Authentication successful` line the driver issues `/update download`, and the server extracts the full payload into the official layout, migrates its credentials into `Server/`, and exits.
3. **Server.** The bridge supervisor relaunches, the driver now sees the payload, writes the driver-owned `Update` and `Backup` blocks into `Server/config.json` plus `jvm.options`, and runs the official wrapper: `bash start.sh --bind 0.0.0.0:<port> --auth-mode authenticated --disable-sentry`. Hytale's own update checker then owns the version: it stages updates and applies them by exiting with code 8, which `start.sh` handles inside the wrapper, so the bridge never sees a crash.

Nothing in this package needs a Serverk-owned Hytale account or a platform secret.

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
