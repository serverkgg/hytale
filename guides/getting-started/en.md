## Create your server

From the **Create a server** page pick Hytale. 8GB of RAM is the comfortable experience, and 4GB is the smallest we allow.

After payment your machine starts provisioning — follow its progress on the order page. As soon as it is ready your server downloads the official Hytale installer, comes up in setup mode, and waits for you to sign in.

> [!note] There is nothing for you to download, and we never ask you for a password. Your Hytale account stays yours.

@[open](console)

## Sign your server in, once

A Hytale server has to identify itself to the game network before it can download the game files, and that is a step you do **once**, with your own account.

1. Start your server from the panel
2. Open the **Login** tab — the status reads **Setup stage**
3. Press **Start login** — a code and a link appear
4. Open the link in your browser, sign in with your Hytale account, and enter the code

@[open](panel:login)

> [!warning] The code expires in about 10 minutes. If it runs out, press **Start login** again and you get a fresh one.

## Let it download and start

The moment we see the sign-in succeed, your server downloads the full game files on its own — the assets file alone is over 3GB, so go make a coffee.

It then shuts down by itself and comes back up on the full game, already signed in. There is nothing for you to do; just watch the console until the status reads **Server installed**.

@[open](console)

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

## Your first day

- Your world lives on your server and keeps running with nobody online
- Turn on the whitelist from the Controls tab so only the people you allow can join
- The Players tab shows who is online, and lets you kick or ban
- Your world is safe — we take automatic backups, and you can take one yourself

@[open](backups)
