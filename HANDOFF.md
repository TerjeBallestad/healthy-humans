# Hand-off: Healthy Humans

Last session: 2026-10-07 to 2026-10-08. Read this first, then `PLAN.md`.

## Where things are

- **Live:** https://terjeballestad.github.io/healthy-humans/
- **Repo:** https://github.com/TerjeBallestad/healthy-humans (public, `main`). Each push runs the tests, builds and deploys to Pages.
- **Plan:** `PLAN.md` holds the spec, the glossary, the tuning and the build order. `lifelines-incremental-onepager.md` is the original pitch.
- **Steps 1 to 5 are done.** Step 6 (discharge) is next.

## What the game does now

1. Arvid moves in. He learns three rungs at a time, starting with eat, shower and sleep.
2. You spend **omsorg** (3 per nudge) to fill nudge bars. A full bar makes him do the activity.
3. Completions raise skill. Bars shrink from 4 to 2 to 1 nudge, and at ●●● the activity is automatic. It goes into "Handles alone", and the next rung opens. There are 9 routine rungs, from eat to calling someone.
4. **Budget** (120 kr per day) buys staff, who autoclick the lowest need, and four one-off requests, which raise the omsorg cap or rate.
5. **Overskudd** builds while every need is green. When there is enough, a **proposal** pauses the game:
   - **Try-alone:** success gives one skill level.
   - **Milestone:** NAV meeting, then job application, then work trial.

   Support costs 0, 150 or 350 kr. The dialog shows the stakes before you choose.
6. After the work trial, nothing more happens yet.

## Feedback from playtests, in order

| Feedback | What we did |
|---|---|
| Step 2 felt like "a grind that doesn't go anywhere" | Expected at that stage. Step 3 added skill and the ladder. |
| Too easy, too slow at 1x, wanted more at once | Three rungs at once, a faster clock, omsorg as the limit. |
| "Hard to keep him afloat at the start, but good" | Kept. Staff and the shop moved before proposals. |
| Double tap zooms on iOS | `touch-action: manipulation` on `html`. **Not confirmed on a real device yet.** |
| Frantic and stressful, should be tactical | 3 omsorg per nudge, bars 4/2/1, 18 s days. "Better, could be even slower, but add mechanics first." |
| Proposals not hitting right, reward unclear | Support moved to kroner, and the stakes are shown in the dialog. "A little better." |

## Open issues

- **Proposals still feel weak.** Milestones point to discharge, which does not exist yet. Step 6 should fix most of this. If they still feel weak after that, some ideas:
  - Support options written for each proposal (for example "Pay for a taxi to NAV").
  - Fewer proposals with bigger stakes.
  - Failure that teaches a little: +10% odds on the next try.
- **Tempo:** Terje wants it slower in the end. Try 24 s days in the balance pass.
- **Bot stress numbers:** a need is at 0 about 20 to 30% of the time. The bot plays without strategy, so watch for this in real play. The levers are `SPIRAL_PER_EMPTY_NEED` and the decay rates in `src/content/needs.ts`.
- **The shop is below the fold on a phone.** Add a small sign when something is affordable, if Terje misses it.
- **Activity lines are shared** by all archetypes and are written gender-neutral. Lines for one archetype only must go in the archetype data in step 6.

## Next: step 6, discharge and the next resident

Draft design. Confirm it with Terje before building.

- **Tiers:**
  - **Fit to live alone:** rungs 1 to 6 automatic.
  - **Fit for work:** NAV meeting and job application done, and all 9 routines automatic.
  - **Healthy human:** work trial done.
- **A "Discharge" button** appears with the best open tier. Discharge shows a dry vedtak (tier, monthly tax) and a two-line glimpse of his life outside.
- **Tax** per tier is added to the daily budget for the rest of the game. Placeholder: 10, 30 and 100 kr per day.
- **The waiting list** is a number that grows over time and shows as pressure. It has no mechanic yet.
- **The next resident** comes from 3 hand-written archetypes:
  - The man who has not left his flat (Arvid).
  - The young woman who sleeps all day.
  - The retired man who drinks a little too much.

  Each archetype has its own decay rates, intro and a few lines of its own. The data shape gets an optional colour vector, as in `lifelines-core-loop/resources/scripts/character_profile.gd`, for procedural residents later.
- **What carries over** to the next resident: budget, staff and upgrades. Skills and needs reset.
- **Question for play:** is "discharge now or wait" a real decision?

## How to work on it

```
npm run dev        # local dev server
npm test           # vitest, 25 tests
npm run sim        # balance bot: -- --taps-per-second=0.5 --shop=0 --days=120
npm run build      # type check and build
```

- **Code layout:**
  - `src/sim/` is pure TypeScript with no Preact. One game minute per `tickMinute`.
  - `src/content/` holds the data and all tuning numbers (`tuning.ts`).
  - `src/ui/` holds the components. `src/store.ts` holds the loop and the signals.
- **Saves:** bump `SAVE_VERSION` in `src/sim/state.ts` when the state shape changes. Old saves reset.
- **Screenshots:** Playwright is installed globally. Import it from `/Users/godstemning/.nvm/versions/node/v22.22.0/lib/node_modules/playwright/index.mjs`. Run `npx vite build && npx vite preview --port 5180`, then use a 390×844 viewport. The debug panel (⚙ or the backtick key) has 10x and 100x speed, fill omsorg, +1000 kr, proposal now, and reset save.
- **Way of working:** keep the process light. Make one playable change, deploy it, and let Terje play it. Terje's play test is the review. Build nothing deeper than the next play session.
