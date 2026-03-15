# SteelQuote Pro v2.0

Steel fabrication estimating system — R&R Fabrication.

## Local dev
```
npm install
npm run dev
```

## Deploy to Railway
Push to GitHub. Railway auto-deploys from main branch.
Root directory: `steelquote-pro` (set in Railway > Settings > Source > Root Directory)

## Features
- Takeoff list with Excel/CSV upload
- Multi-supplier material pricing
- Shop labor + burden rate calculator (PW does NOT apply to shop labor)
- Erection — multiple erectors per job, PW adder per erector
- Paint & galvanizing
- Prevailing wage (field/erector labor only — Davis-Bacon)
- Print/PDF quote output
- Price lists: suppliers, erectors, galvanizers
