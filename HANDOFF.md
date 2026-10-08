# Hand-off: Healthy Humans

Last session: 2026-10-08. Read this first, then `PLAN.md`.

## Where things are

- **Live:** https://terjeballestad.github.io/healthy-humans/
- **Repo:** https://github.com/TerjeBallestad/healthy-humans (public, `main`). Each push runs the tests, builds and deploys to Pages.
- **Plan:** `PLAN.md` holds the spec, the glossary, the tuning and the build order. `lifelines-incremental-onepager.md` is the original pitch.
- **Steps 1 to 6b are done.** Step 7a (ready queue and landscape layout) is live. Waiting for Terje to play 7a.

## What the game does now

1. Arvid moves in. He learns three rungs at a time, starting with eat, shower and sleep.
2. You spend **omsorg** (1 per nudge) to fill effort bars on activity cards. Press and hold to keep nudging. A full bar makes the activity **ready**. It starts when its need drops below 50. Ready activities go lowest need first, and the cards show #1, #2.
3. Completions raise skill. Bars shrink from 12 to 6 to 3 nudges, and at ●●● the activity is automatic. It goes into "Handles alone", and the next rung opens. There are 9 routine rungs, from eat to calling someone.
4. **Budget** (120 kr per day) buys staff, who autoclick the lowest need, and four one-off requests, which raise the omsorg cap or rate.
5. **Overskudd** builds while every need is green. When there is enough, a **proposal** pauses the game:
   - **Try-alone:** success gives one skill level.
   - **Milestone:** NAV meeting, then job application, then work trial.

   Support costs 0, 150 or 350 kr. The dialog shows the stakes before you choose.

6. **Discharge:** when a tier opens, a button shows it. The vedtak shows the tax, what waiting gives, and who comes next. Signing shows a two-line glimpse, then the next resident moves in.
   - Tiers: fit to live alone (rungs 1 to 6 automatic, +10 kr/day), fit for work (NAV, application, all routines, +30), healthy human (work trial, +100).
   - Budget, staff, upgrades and omsorg carry over. Skills, needs and milestones reset.
   - Residents cycle: Arvid, then Maja (23, sleeps all day). Both are grey-boxes in `src/content/archetypes.ts`.
7. Days are 24 s at 1x (was 18).

## Feedback from playtests, in order

| Feedback                                            | What we did                                                                                         |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Step 2 felt like "a grind that doesn't go anywhere" | Expected at that stage. Step 3 added skill and the ladder.                                          |
| Too easy, too slow at 1x, wanted more at once       | Three rungs at once, a faster clock, omsorg as the limit.                                           |
| "Hard to keep him afloat at the start, but good"    | Kept. Staff and the shop moved before proposals.                                                    |
| Double tap zooms on iOS                             | `touch-action: manipulation` on `html`. **Not confirmed on a real device yet.**                     |
| Frantic and stressful, should be tactical           | 3 omsorg per nudge, bars 4/2/1, 18 s days. "Better, could be even slower, but add mechanics first." |
| Proposals not hitting right, reward unclear         | Support moved to kroner, and the stakes are shown in the dialog. "A little better."                 |
| Waiting list too hidden, no urgency                 | 7a: the venteliste is a panel with the cost of each wait and a countdown to the next referral.      |
| Staff queue sleep many times, he sleeps when rested | 7a: a full bar is one charge, and it starts only when the need is low.                              |
| Long narrow list, no overview                       | 7a: three-column landscape layout. Below 900 px it stacks.                                          |

## Open issues

- **Proposals still feel weak.** Milestones point to discharge, which does not exist yet. Step 6 should fix most of this. If they still feel weak after that, some ideas:
  - Support options written for each proposal (for example "Pay for a taxi to NAV").
  - Fewer proposals with bigger stakes.
  - Failure that teaches a little: +10% odds on the next try.
- **Tempo:** Terje wants it slower in the end. Try 24 s days in the balance pass.
- **Bot stress numbers:** a need is at 0 about 20 to 30% of the time. The bot plays without strategy, so watch for this in real play. The levers are `SPIRAL_PER_EMPTY_NEED` and the decay rates in `src/content/needs.ts`.
- **The shop is below the fold on a phone.** Add a small sign when something is affordable, if Terje misses it.
- **Activity lines are shared** by all archetypes and are written gender-neutral. Lines for one archetype only go in `src/content/archetypes.ts`.
- **Archetypes are grey-boxes.** Terje plans a procedural personality system. Keep archetype data loose and easy to change. The `colours` field is there for that and is unused.

## Ideas from Terje for after 7a (not built)

- Effort depends on the resident and the activity. Some residents start with skills. A job application could be 32 nudges with no skill.
- Many activities, several for each need (brødskive and dinner for food).
- Skill categories (cooking, household) that raise a family of activities. Overskudd spent to train them. This could replace try-alone proposals.

## Earlier: rest of step 6

- **Play feedback on 6a:** "discharge now or wait" was not an interesting decision. Waiting cost nothing, so waiting always won. Terje thinks it may need several beds and a waiting list.
- **6b, the cheap test (live):** one bed, plus a waiting list with a cost. Does a waiting cost alone make the decision interesting?
  - One person joins the list every 3 days. One person waits at the start.
  - The first in line moves in next. Each day waited takes 2 points from every start need (floor 15) and adds 2% decay (cap 50%). The strain fades by 5% per day.
  - The top bar shows "Helped" and "Waiting". The vedtak shows what the wait has cost so far.
  - With one bed, the list always grows. That pressure is part of the test.
  - Tuning is at the end of `src/content/tuning.ts`.
- **If the test fails:** two beds that share omsorg and staff. `PLAN.md` puts more than one bed out of scope for Act 1, so that changes the plan. UI idea: tabs, or two compact cards.
- **Third archetype:** the retired man who drinks a little too much. Add an entry to `ARCHETYPES`.
- **Small issue:** the "needs" text for the next tier lists all parts, also the parts that are done.

## How to work on it

```
npm run dev        # local dev server
npm test           # vitest, 38 tests
npm run sim        # balance bot: -- --taps-per-second=0.5 --shop=0 --days=120
npm run build      # type check and build
```

- **Code layout:**
  - `src/sim/` is pure TypeScript with no Preact. One game minute per `tickMinute`.
  - `src/content/` holds the data and all tuning numbers (`tuning.ts`).
  - `src/ui/` holds the components. `src/store.ts` holds the loop and the signals.
- **Saves:** bump `SAVE_VERSION` in `src/sim/state.ts` when the state shape changes. Old saves reset.
- **Screenshots:** Playwright is installed globally. Import it from `/Users/godstemning/.nvm/versions/node/v22.22.0/lib/node_modules/playwright/index.mjs`. Run `npx vite build && npx vite preview --port 5180`, then use a 390×844 viewport. The debug panel (⚙ or the backtick key) has 10x and 100x speed, fill omsorg, +1000 kr, proposal now, fill needs, all automatic, next milestone, and reset save.
- **Way of working:** keep the process light. Make one playable change, deploy it, and let Terje play it. Terje's play test is the review. Build nothing deeper than the next play session.
