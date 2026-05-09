# Telegram Personal Assistant Bot

A production-ready Telegram bot to manage tasks and reminders with natural language input using Groq. It stores everything in SQLite via Prisma and sends scheduled reminders every minute.

## Features

- Telegram commands: /start, /help, /tasks, /add, /delete, /done, /today, /tomorrow
- Natural language reminders powered by Groq (OpenAI-compatible)
- Cron-based reminders that persist after restarts
- Daily summary message (enabled by default)
- Pending-task list reminder every 4 hours (configurable)
- SQLite database with Prisma ORM
- PM2-ready scripts
- Optional Dockerfile

## Quick Start

1) Install dependencies

npm install

2) Create your environment file

Copy .env.example to .env and fill in the values.

3) Create the database

npx prisma migrate dev --name init

4) Start the bot

npm run dev

## Environment Variables

Required:
- TELEGRAM_BOT_TOKEN
- GROQ_API_KEY

Optional:
- DATABASE_URL (default: file:./dev.db)
- TIMEZONE (default: America/Bogota)
- GROQ_MODEL (default: llama-3.3-70b-versatile)
- GROQ_TRANSCRIPTION_MODEL (default: whisper-large-v3-turbo)
- DAILY_SUMMARY_TIME (default: 20:00)
- LIST_SUMMARY_INTERVAL_HOURS (default: 3, set 0 to disable)

## Usage Examples

- /add remind me tomorrow at 8am to study marketing
- /add call Luisa in 2 hours
- /add buy groceries tonight
- /tasks
- /done 3
- /delete 2

You can also send plain text without /add and the bot will treat it as a new reminder.

## Architecture

- src/bot: Bot creation and setup
- src/commands: Command handlers
- src/ai: Groq integration and parsing
- src/services: Database operations
- src/scheduler: Cron jobs for reminders and daily summary
- src/utils: Formatting, time helpers, logging
- prisma: Prisma schema

## Production Build

npm run build
npm run start

## PM2 Setup

1) Build the project
npm run build

2) Start with PM2
pm2 start dist/index.js --name telegram-bot

3) Save the process list
pm2 save

4) Enable startup on boot
pm2 startup

Follow the command printed by PM2 to finalize the startup configuration.

## Oracle Free Tier Ubuntu Deployment

1) Update packages
sudo apt-get update
sudo apt-get install -y nodejs npm sqlite3

2) Clone your repo and install dependencies
npm install

3) Configure environment
cp .env.example .env

4) Run Prisma migrations
npx prisma migrate deploy

5) Build and start with PM2
npm run build
pm2 start dist/index.js --name telegram-bot
pm2 save
pm2 startup

6) Firewall setup
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status

Note: This bot uses long polling, so no inbound ports are required beyond SSH.

## Docker (Optional)

docker build -t telegram-bot .
docker run --env-file .env telegram-bot
"# reminder_4_me" 
