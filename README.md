# Interview Scheduler (Vue 2 + Vue Cal)

A small interview scheduling app built with **Vue 2** and **[Vue Cal v4](https://antoniandre.github.io/vue-cal-v4/)** (`vue-cal@legacy`).

## Roles

- **Interviewer** — Add, move, resize, and delete availability blocks on the week/day calendar (double-click a cell to create a 1-hour slot).
- **Candidate** — View open (green) slots and click to book; booked slots appear grey.

Data is persisted in the browser via `localStorage`, so you can open interviewer and candidate routes in two tabs to try the full flow.

## Setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

**Do not commit or push the `dist` folder** — it stays in `.gitignore`. GitHub Actions builds and deploys it to the `gh-pages` branch for you.

1. Push **source code only** to `main` on GitHub.
2. In the repo: **Settings → Pages → Build and deployment → Source** → **Deploy from a branch**.
3. Branch: **`gh-pages`**, folder: **`/ (root)`** — **not** `main`.
4. After each push to `main`, the [Deploy workflow](.github/workflows/deploy.yml) builds `dist` and updates `gh-pages`.

Live URL: `https://manishTalentpool.github.io/vueCalender/`

### Site blank or broken?

If the page title shows but the app is empty, Pages is probably serving **`main`** (dev `index.html` with `/src/main.js`) instead of the built site.

- **Fix:** Pages source must be branch **`gh-pages`**, not `main`.
- **Re-deploy:** GitHub → **Actions** → **Deploy to GitHub Pages** → **Run workflow**.
- **Verify:** View page source should reference `/vueCalender/assets/index-….js`, not `/src/main.js`.

## Notes

- Vue 2 requires `vue-cal@legacy` per the [Vue Cal installation docs](https://antoniandre.github.io/vue-cal-v4/).
- For production, replace `localStorage` with your API and add authentication.
