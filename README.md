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
- **Profile picture (optional):** pick one on the first screen. Your opponent sees it in place of the shopkeeper sprite. After choosing it you can drag and zoom it into the circle frame (use "adjust" to change it later). It is shrunk to 160px and stored only in your browser.

## Notes

- Multiplayer is peer-to-peer using [PeerJS](https://peerjs.com) (loaded from unpkg) and its free public signaling server, so no backend of your own is needed. If a network blocks WebRTC, matches may not connect.
- The room list is kept by whichever player's browser claimed the lobby first. If that player leaves, another player takes over automatically. Room passwords are checked by the room's host and are never sent to the lobby.
- Level data is fetched live from the [AREDL API](https://api.aredl.net), and card thumbnails come from YouTube. The game needs an internet connection.
