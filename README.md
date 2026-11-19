# Demon Picture Poker

A browser picture-poker game where every card is a real level from the Extreme Demon List. Cards that share a rarity make a hand, and you beat the dealer to win coins. Holding the #1 (Apex) card wins the game.

## Play

Open `index.html` in a browser, or host it for free with GitHub Pages:

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set the source to the `main` branch, root folder, and save.
4. Your game will be live at `https://<your-username>.github.io/<repo-name>/`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page markup |
| `style.css` | Styles |
| `script.js` | Game logic |
| `assets/dealer.png` | Dealer image |
| `assets/demon.png` | Demon icon on the card backs |
| `assets/bgm.mp3` | Background music |

## Game modes

- **Play vs Bot:** you play against the dealer bot. Pick a difficulty first:
  - **Pussy:** genuinely stupid and easy to beat (random discards, sometimes keeps its worst cards).
  - **Easy:** a little easier than average (often makes random mistakes).
  - **Medium:** average player (keeps matches and rare cards, occasional slips).
  - **Hard:** a little bit challenging (simulates its options, but doesn't look at your hand).
  - **Insane:** a good challenge (simulates its options against your actual final hand).
  - **Mogger:** the smartest player ever (tests every possible hold thousands of times against your hand, never makes a mistake).
- **Play vs Player:** type a name and you enter the lobby. If no rooms exist you are put into a new room and wait. If rooms exist you can join one or create your own, and a room can be locked with a password.

## Discord login (required)

Players must log in with Discord before they can play. There is no separate name or picture: the Discord display name and avatar are used everywhere. After logging in they reach the game mode screen, which has their account (rank and wins), the global leaderboard, and the Play vs Bot / Play vs Player buttons.

Setup (one time):
1. Go to <https://discord.com/developers/applications> and create an application.
2. Under **OAuth2 → Redirects**, add the exact address the game is hosted at, e.g. `https://<your-username>.github.io/<repo-name>/` (add the `.../index.html` version too if you link to it).
3. Copy the **Client ID** and paste it into `DISCORD_CLIENT_ID` at the top of `script.js`.

It uses Discord's browser-only OAuth2 flow with the `identify` scope. The access token is used once to read the username and avatar, and is never stored. Only the name and a 160px avatar are kept in the browser, so players stay logged in until they press log out. It won't work when `index.html` is opened as a local file.

## Global leaderboard

The leaderboard counts **wins against other players only** (bot games and draws never count; playing yourself in two tabs doesn't count either). Each win is recorded by the winner's browser. It is stored in a free Firebase Realtime Database:

1. Create a project at <https://console.firebase.google.com>, then **Build → Realtime Database → Create database**.
2. Open the **Rules** tab and paste:

```json
{
  "rules": {
    ".read": true,
    "players": {
      "$id": {
        ".write": "$id.matches(/^[0-9]{5,25}$/)",
        ".validate": "newData.hasChildren(['name'])",
        "name": { ".validate": "newData.isString() && newData.val().length <= 40" },
        "av": { ".validate": "newData.isString() && newData.val().matches(/^https:\\/\\/cdn\\.discordapp\\.com\\//)" },
        "wins": { ".validate": "newData.isNumber() && newData.val() >= (data.exists() ? data.val() : 0) && newData.val() <= (data.exists() ? data.val() : 0) + 1" },
        "$other": { ".validate": false }
      }
    }
  }
}
```
3. Copy the database URL (like `https://your-project-default-rtdb.firebaseio.com`) into `LEADERBOARD_DB` at the top of `script.js`.

Until it is set, the leaderboard panel says it isn't set up. The rules stop a player from jumping their wins by more than 1 per write, but because the game has no server of its own, a determined cheater could still send repeated requests. Treat the board as friendly competition.

## Notes

- Multiplayer is peer-to-peer using [PeerJS](https://peerjs.com) (loaded from unpkg) and its free public signaling server, so no backend of your own is needed. If a network blocks WebRTC, matches may not connect.
- The room list is kept by whichever player's browser claimed the lobby first. If that player leaves, another player takes over automatically. Room passwords are checked by the room's host and are never sent to the lobby.
- Level data is fetched live from the [AREDL API](https://api.aredl.net), and card thumbnails come from YouTube. The game needs an internet connection.
