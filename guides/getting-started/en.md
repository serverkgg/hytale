## Create your server

From the **Create a server** page pick Hytale. 8GB of RAM is the comfortable experience, and 4GB is the smallest we allow.

After payment your machine starts provisioning — follow its progress on the order page. As soon as it is ready your server downloads the official Hytale installer, comes up in setup mode, and waits for you to sign in.

> [!note] There is nothing for you to download, and we never ask you for a password. Your Hytale account stays yours.

@[open](console)

## Sign your server in, once

A Hytale server has to identify itself to the game network before it can download the game files, and that is a step you do **once**, with your own account.

The panel opens on the **Setup** page by itself and walks the whole thing. Your server starts, asks Hytale for a sign-in code, and the page shows you the code and the link — you press nothing to get them.

1. Open the link the setup page shows, in your browser
2. Sign in with your own Hytale account
3. Enter the code from the page

@[open](setup)

> [!warning] A code lives about 10 minutes. If it runs out, the page takes a fresh one by itself, and there is a **Get a new code** button whenever you want one.

## Let it download and start

The moment the sign-in lands, the setup page moves to the download step and shows the progress. The game files are well over a gigabyte, so go make a coffee.

Your server then shuts down by itself and comes back up on the full game, already signed in. There is nothing for you to do — the page tells you when it is done.

@[open](setup)

> [!note] The sign-in is stored encrypted inside your server, so you never repeat this step on a restart.

## Join the game

:::when server.address
Copy your address:

@[field](server.address)

Then inside Hytale:

1. From the main menu choose **Multiplayer**
2. Press **Direct Connect**
3. Paste the address and port together, and join
:::else
Your server is still setting up, so it has no address yet — it appears here the moment the install finishes.
:::

> [!note] If you set a join password from the Settings tab, the game will ask every player for it. This is the easiest way to keep the server private for your group.

## Switch or sign out the account

The account your server is signed in with lives in the **Account** tab, and you can change it while the server is running. **Switch account** signs the current account out and puts a fresh code on the setup page for the next one. **Sign out** only clears the sign-in, and your server takes no players until you sign it back in.

@[open](panel:account)

## Your first day

- Your world lives on your server and keeps running with nobody online
- Turn on the whitelist from the Controls tab so only the people you allow can join
- The Players tab shows who is online, and lets you kick or ban
- Your world is safe — we take automatic backups, and you can take one yourself

@[open](backups)
