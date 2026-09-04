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

1. **Bootstrap.** `install` resolves the newest `Server` release from `https://maven.hytale.com/release/com/hypixel/hytale/Server/maven-metadata.xml`, verifies the published `.sha1`, and downloads `HytaleServer.jar` into the volume root through the agent's artifact cache. It also writes `auth.key`, the per-server passphrase the encrypted credential store derives its key from. `lifecycle` runs the jar as `java -jar HytaleServer.jar --bootstrap`; `--bootstrap` implies `--bare`, so no port is bound, but the server still prints the `Hytale Server Booted!` banner the ready pattern watches for.
2. **Sign-in.** The customer signs the server in once from the panel's Login tab with a device-code login on their own Hytale account. On the `Authentication successful` line the driver issues `/update download`, and the server extracts the full payload into the official layout, migrates `auth.enc`, `auth.key` and `config.json` into `Server/`, and exits.
3. **Server.** The bridge supervisor relaunches, the driver now sees the payload, writes the driver-owned `Update` and `Backup` blocks into `Server/config.json` plus `jvm.options` (heap, G1, `-XX:AOTCache=HytaleServer.aot`), and runs the official wrapper: `bash start.sh --bind 0.0.0.0:<port> --auth-mode authenticated`. Hytale's own update checker then owns the version: it stages updates, warns players, and applies them on a 15-minute schedule (`AutoApplyMode: Scheduled`) by exiting with code 8, which `start.sh` handles inside the wrapper, so the bridge never sees a crash. Once the updated server reports ready, the driver drops `updater/backup`, the rollback copy `start.sh` leaves behind.

Nothing in this package needs a Serverk-owned Hytale account or a platform secret.

### Sign-in persistence

`/auth persistence Encrypted` stores the OAuth tokens in `auth.enc`, encrypted with a key derived from the first passphrase the server can find: `HYTALE_AUTH_KEY_FILE`, `HYTALE_AUTH_KEY`, the hardware UUID, or a generated `auth.key` beside the store. The image has an empty `/etc/machine-id`, no dbus id, an unreadable `product_uuid` as uid 1000 and no `dmidecode`, so the hardware UUID always fails (a `WARN` with a stack trace at every boot, harmless), and the bridge lifecycle sets no environment for the game. The passphrase is therefore `auth.key`, which the driver generates at install instead of leaving it to the server's first boot; it is protected in the file manager, kept across a reset and archived with the backups. The log line to expect is `Using auto-generated encryption key from auth.key`, never `Cannot derive encryption key`.

### Stopping

`start.sh` runs `java` as a child of `bash` without `exec`, so a signal sent to the wrapper never reaches the server: `SIGTERM` kills `bash` and leaves `java` orphaned. The driver's stop path is therefore the console, `/stop` followed by a wait for `Shutdown completed!`; the supervisor's signal escalation is the fallback and only works once the bridge signals the process group rather than the wrapper pid.

### Ports

The manifest declares one UDP port per server (`5520`–`5569`). A query plugin needs a second one: `Nitrado:Query` binds the game port plus 3 and Physgun's `hytale-sourcequery` the game port plus 1, so either would land on a neighbour's game port today. Shipping one means adding a second manifest port and widening the host range, not reusing this one.

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
