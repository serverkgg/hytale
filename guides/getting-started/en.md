## Create your server

From the **Create a server** page pick Hytale. 8GB of RAM is the comfortable experience, and 4GB is the smallest we allow.

After payment your machine starts provisioning — follow its progress on the order page. There is nothing to set up: as soon as the machine is ready your server downloads the official Hytale files and starts on its own.

> [!note] The first install takes a while — the assets file alone is over 3GB. Watch all of it from the console tab.

@[open](console)

## Sign your server in, once

A Hytale server has to identify itself to the game network before it accepts players, and that is a step you do **once**, with your own account.

1. Open the **Login** tab in your server panel
2. Press **Start login** — a code and a link appear
3. Open the link in your browser, sign in with your Hytale account, and paste the code
4. Come back to the panel — the status turns to **Signed in**

@[open](panel:login)

> [!warning] The code expires within minutes. If it runs out, press **Start login** again and you get a fresh one.

We keep the sign-in encrypted inside your server, so you never repeat it on a restart.

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
