## Hytale mods install on the server only

This is Hytale's biggest strength: a mod goes on your server and nowhere else. Your players download nothing, need no mod loader, and don't even have to know mods exist. The moment they join, your server sends them the mods. When they leave, the mods leave with the session.

So you install once, and everyone who joins you sees the same world with the same mods.

## Install from the Mods tab

@[open](panel:mods)

Search for the mod, press install, and we download it into your mods folder and remember which version it was built for. Everything comes from CurseForge, the official portal for Hytale mods.

> [!note] After installing, removing or turning a mod off, restart your server so it picks the change up. Mods are read at startup only.

Some authors block downloads outside the CurseForge site. We can't fetch those for you, so we give you the link instead, and you download it yourself and upload it from the file manager.

## Or upload it yourself

@[open](files:Server/mods)

Any `.zip` or `.jar` you drop into `Server/mods` works. Don't unzip it. Put the archive in as it is. Then restart.

Files you upload yourself appear in the Mods tab beside the rest, and you can turn them off or remove them from there like any other mod.

## There are two kinds of mod

- **Asset packs** (`.zip`): blocks, mobs, items and behavior built in the in-game Asset Editor, with no code.
- **Plugins** (`.jar`): Java code running on your server, such as minigames, economies, new commands, whatever logic you want.

Both go into the same `Server/mods` folder.

> [!warning] A `.jar` runs with full access inside your server. Only install from sources you trust.

## Updates break mods, and that's normal

Hytale locks the game and the server to the same build, and when a new version ships every plugin has to be rebuilt by its author. So a mod that works today can stop loading after an update, until its author publishes a new build.

That's why we record the version each mod was built for and flag it in the Mods tab once your server moves to a newer one. Watch for the flag, and update the mod when its author ships a build.

@[open](backups)

> [!note] Take a backup before any large update if you depend on mods. And removing a mod that added things to your world leaves holes where they were.

## Early plugins aren't supported

There is a category called early plugins that runs outside the normal plugin system and rewrites the server from the inside. Hytale itself calls it unsupported and unstable, and it needs a special launch flag. We never pass that flag, and the `earlyplugins` folder is locked here. Put your mods in `Server/mods` instead.

## If a mod doesn't load

- Check that you restarted your server after installing it
- Read the Console tab: a failed mod load is printed there in full
- Check that the mod was built for the Hytale version your server runs
- If it keeps failing, remove the mod and restart to confirm it's the cause
