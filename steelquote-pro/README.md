# SteelQuote Pro

Steel fabrication estimating system. Vite + React, deploys to Railway.

---

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Railway (step by step)

### 1. Create a GitHub repo

1. Go to github.com and sign in
2. Click the **+** icon (top right) → New repository
3. Name it `steelquote-pro`
4. Set to Private
5. Do NOT check "Add a README" (we already have one)
6. Click **Create repository**

### 2. Push this code to GitHub

Open a terminal in this folder and run:

```bash
git init
git add .
git commit -m "Initial commit — SteelQuote Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/steelquote-pro.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### 3. Connect to Railway

1. Go to railway.app and sign in (you can use your GitHub account)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub if prompted
5. Select `steelquote-pro` from the list
6. Railway will detect it's a Node/Vite project and start building automatically

### 4. Configure the start command

In Railway, go to your project → **Settings** → **Deploy**:

- Build command: `npm run build`
- Start command: `npx serve dist -p $PORT`

Railway should pick this up automatically from `railway.toml`, but verify it's set correctly.

### 5. Get your URL

Once deployed, Railway gives you a URL like:
`https://steelquote-pro-production.up.railway.app`

That's your live app. Every time you push to GitHub, Railway auto-deploys.

---

## File structure

```
steelquote-pro/
├── index.html          # Entry point
├── package.json
├── vite.config.js
├── railway.toml        # Railway deployment config
├── .gitignore
└── src/
    ├── main.jsx        # React root
    ├── index.css       # Global styles
    ├── App.jsx         # Main app + all tab components
    ├── components.jsx  # Shared UI components
    └── constants.js    # Default data + formatters + styles
```

---

## Future integration notes

- This tool will connect to the shop dashboard system via **job number**
- Job number is the linking key between all tools
- Real-time labor integration: hook actual timesheet hours per job into the burden rate calculation
