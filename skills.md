# Dashboard Skills

These are slash commands you can type directly in OpenClaw (Claude Code) to add data to your dashboard without opening the browser.

---

## 🚀 First Time Setup

Before using any command, run this once to connect to your dashboard:

```
/setup
```

It will ask you for:
1. **Your dashboard URL** — the web address where your app is running (e.g. `https://your-app.vercel.app`)
2. **Your bearer token** — found on your dashboard under **Control → API Access → Copy Token**

Your settings are saved locally and reused automatically. If a command says your token expired, just run `/setup` again to paste a fresh one.

> **Note:** Tokens expire after about 1 hour. This is normal — just copy a new one from the Control page when it happens.

---

## 📋 Available Commands

### `/idea <text>`
Add a new idea to your **Ideas board**.

```
/idea Create a YouTube series about morning routines
/idea Follow up with podcast guests about cross-promotion
/idea Test new email subject line format
```

---

### `/business <name>`
Create a new **Business board** with a Kanban layout.

```
/business Self Mastery Co
/business West Valley Shoutouts
/business New Coaching Program
```

---

### `/commands <name> - <description>`
Add a new entry to your **Command Center**.

```
/commands /morning - Run my morning content review routine
/commands /weekly - Pull weekly stats from all platforms
/commands /publish - Approve and publish pending clips
```

The name and description are separated by ` - ` (space, dash, space).

---

### `/resource <title> <url>`
Add a **resource link** to one of your Business boards. If you have multiple businesses, it will ask you which one.

```
/resource Sales Page https://selfmasteryco.com/sales
/resource Onboarding Doc https://docs.google.com/...
/resource Brand Kit
```

The URL is optional — you can add a resource with just a title.

---

### `/vault <title>`
Save something to your **Vault** for later reference.

```
/vault Morning Routine Checklist
/vault Cold Email Template - templates
/vault Podcast Pitch Script https://docs.google.com/...
```

You can optionally add a category at the end using ` - <category>` or include a URL.

---

### `/status`
Show a summary of everything in your **Control Center** — API keys, AI models, cron jobs, tasks, channels, and integrations.

```
/status
```

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| "Haven't connected your dashboard yet" | Run `/setup` |
| "Token has expired" | Go to Control page → Copy Token → run `/setup` |
| Command created but not showing in UI | Refresh the browser page |
| Wrong dashboard URL | Run `/setup` again to update it |

---

## 🗂 Where Data Shows Up

| Command | Dashboard Page |
|---------|---------------|
| `/idea` | `/ideas` |
| `/business` | `/businesses` |
| `/commands` | `/commands` |
| `/resource` | `/businesses` (inside the board) |
| `/vault` | `/vault` |
| `/status` | Summary of `/control` |
