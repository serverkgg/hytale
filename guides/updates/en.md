## Why your server updates itself

Hytale locks the client and the server to the same version: a player on a newer build cannot join an older server, and the other way round. So every time your server boots it asks the official downloader for the current version, and pulls it before starting if anything moved.

When your server is already current the check finishes in seconds and downloads nothing.

> [!note] That means a **restart** is all it takes to catch up after a game update.

## What it actually downloads

- `Server/HytaleServer.jar` — the server program itself
- `Assets.zip` — the assets file, over 3GB

Both are protected in the file manager so they cannot be deleted by accident. Your world lives under `universe/` and an update never touches it.

@[open](files)

## When a new version ships

1. Restart your server from the panel
2. Watch the console tab — you will see the download as it runs
3. As soon as it finishes, the server starts on the new version

:::when server.version
The version currently installed on your server:

@[field](server.version)
:::

> [!warning] Hytale is early, and updates can change worlds and mods. Take a backup before any large update — a minute now saves a headache later.

@[open](backups)

## If an update fails

- Check that your server is signed in, from the Login tab
- Read the console tab: any download error is printed there in full
- Restart once more — most download failures are temporary
- If it keeps failing, open a support ticket and we will look at it with you
