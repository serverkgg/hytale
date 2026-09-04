## Why your server updates itself

Hytale locks the client and the server to the same version: a player on a newer build cannot join an older server. So your server asks Hytale every hour whether a new version shipped, downloads it in the background, warns the players who are online, and applies it **15 minutes later**, on time, whether or not someone is still inside.

Most of the time that means you do nothing at all: the update arrives on its own, and your players get a countdown instead of a locked door. If it lands mid-session, the world is saved first and the server is back within seconds.

> [!note] Why not wait until the server is empty? Because one player who never leaves would lock everyone else out: anyone whose game already updated cannot join until the server updates too.

> [!note] Before any update your server takes its own snapshot of the world and the config, on top of the backups we keep for you.

## What actually happens

1. The server notices a new version and tells the players who are online
2. It downloads it in the background without stopping
3. It warns the players that the update lands in 15 minutes, saves the world, applies it, and comes back in seconds

@[open](console)

## What changes and what stays

Changes: `Server/HytaleServer.jar`, `Assets.zip` and the start scripts. They are protected in the file manager so they cannot be deleted by accident.

Stays exactly as it was: your world under `Server/universe/`, your settings in `Server/config.json`, the whitelist, the bans and your mods.

@[open](files)

:::when server.version
The version currently installed on your server:

@[field](server.version)
:::

> [!warning] Hytale is early, and updates can change worlds and mods. If you depend on mods, take a backup before any large update.

@[open](backups)

## If you would rather drive it yourself

Everything is available from the console:

@[command](/update status)

@[command](/update check)

@[command](/update download)

Then `/update apply --confirm` installs the staged version and restarts right away, without the 15-minute countdown.

## If an update fails

- Check that your server is signed in, from the Account tab — an update needs a signed-in account
- Read the console tab: any download error is printed there in full
- Restart once more — most download failures are temporary
- If it keeps failing, open a support ticket and we will look at it with you
