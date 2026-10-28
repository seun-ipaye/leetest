# LeetTest

A Chrome extension for randomized LeetCode practice and timed OA simulation. It lives in Chrome's side panel next to the problem you're solving.

- **Practice mode:** untimed and endless. Pick topics and difficulties, get a random problem, and get Accepted to unlock **Next** (or **Skip**).
- **OA mode:** random questions (3 by default), each timed by difficulty (10 / 20 / 30 min by default). Both are adjustable under **Advanced**. Any submit moves you on, right or wrong, and verdicts stay hidden until the results screen.
- **History:** every finished session is saved with a score trend and your weakest topics.

## Setup

Requires Node 20+.

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `dist` folder.
3. Click the LeetTest toolbar icon to open the side panel.

You need to be logged into LeetCode to submit. After changing code, run `npm run build` again and click the reload arrow on the extension.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run build`     | Typecheck and build into `dist/`     |
| `npm run dev`       | Rebuild on change (reload in Chrome) |
| `npm test`          | Run the Vitest suite                 |
| `npm run typecheck` | TypeScript only                      |
| `npm run lint`      | ESLint                               |
| `npm run format`    | Prettier                             |

## Problem bank

Problems come from [`data/problems.json`](data/problems.json), bundled into the extension. Each entry:

```json
{
  "id": 200,
  "slug": "number-of-islands",
  "title": "Number of Islands",
  "difficulty": "Medium",
  "tags": ["Array", "Depth-First Search", "Breadth-First Search", "Union-Find", "Matrix"],
  "paidOnly": false
}
```

- `slug` is the part of the URL after `leetcode.com/problems/`.
- `difficulty` is `Easy`, `Medium` or `Hard`.
- `tags` drive the topic picker, so keep spellings consistent with LeetCode's (e.g. `Graph Theory`).
- `paidOnly: true` entries are never picked.

`npm test` checks that every `id` and `slug` is unique.

## How it works

```
src/
├── sidepanel/    React UI: setup, active session, results, history
├── background/   Service worker: session engine, problem picker, OA timers, submission detection
└── shared/       Types, constants, typed messages, chrome.storage wrappers, stats
```

- **Session state** lives in `chrome.storage.local`, so it survives Chrome putting the service worker to sleep. The side panel watches storage and re-renders on its own.
- **OA timers** use `chrome.alarms`, one per question. Chrome may fire them up to ~30s late, so the clock can sit at "Time's up" briefly.
- **Submissions** are detected without touching LeetCode's page. When the session's tab polls LeetCode's judge (`/submissions/detail/<id>/check/`), the service worker reads the same URL to get the verdict, runtime and memory. Run results are ignored, and so are submits in other tabs or on other problems.
- **Session logic** (`background/session.ts`) is pure functions, so the mode rules are covered by unit tests.

### Permissions

| Permission                      | Why                                      |
| ------------------------------- | ---------------------------------------- |
| `sidePanel`                     | The UI                                   |
| `storage`                       | Sessions, settings, history              |
| `tabs`                          | Open problems, notice when you leave one |
| `alarms`                        | OA timers                                |
| `webRequest`                    | See when LeetCode checks a submission    |
| `https://leetcode.com/*` (host) | Read submission verdicts with your login |
