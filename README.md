# README.md
# LahzeBusinessBot 🎁🤖

> Create and share personalized "moments" with QR-Codes on Telegram!  

LahzeBusinessBot is a Telegram bot that allows users to craft unique moments with text, photos, videos, voice messages audio files, and Google Maps links, , instagram, google drive ,linkedin and ... — all tied to a custom QR code. Perfect for gifts, events, or sharing memories with friends.

---

## Features ✨

- Generate unique links with expiry (admin-only)
- Share moments with multiple media types:
  - Text
  - Photo
  - Video
  - Voice
  - Audio (mp3/m4a/wav/ogg/aac)
  - Google Maps links
  - Google Drive
  - Fal Hafez
  - Phone number
  - Email Address
  - Facebook
  - X account
  - WhatsUp
  - Linkedin
  - Telegram
  - WebSite
  - Card number
- Persian date formatting for link validity
- Admin panel via Telegram commands
- QR-Code generation for sharing links
- Easy database management with MySQL
- Clean and modular project structure

---

## Project Structure 🗂️
```bash
lahze-bot/
├─ index.js # Entry point
├─ config.js # Configuration (DB, bot token, etc.)
├─ db/ # Database helpers
│ ├─ index.js
│ ├─ init.js
│ ├─ links.js
│ ├─ customerData.js
│ └─ choices.js
├─ utils/ # Utility functions
│ ├─ persianDate.js
│ └─ qr.js
├─ services/ # Core services and logic
│ ├─ flow.js
│ └─ labels.js
└─ handlers/ # Telegram message & callback handlers
├─ start.js
├─ message.js
└─ callback.js



---

## Setup ⚙️

1. Clone the repo:  

git clone https://github.com/yourusername/LahzeBusinessBot.git
cd LahzeBusinessBot

2. Install dependencies:

npm install

3. Create a .env file based on your environment:

TOKEN=YOUR_TELEGRAM_BOT_TOKEN
LAHZE_ADMIN_IDS=YOUR_ADMIN_IDS
DB_HOST=localhost
DB_USER=lahze_user
DB_PASS=StrongPass_123!
DB_NAME=lahze_db


4. Initialize the database:
5. Start the bot:

node index.js
