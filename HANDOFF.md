# Hand-off: Healthy Humans

Last session: 2026-10-09 (7j). Read this first, then `PLAN.md`.

## Where things are

- **Live:** https://terjeballestad.github.io/healthy-humans/
- **Repo:** https://github.com/TerjeBallestad/healthy-humans (public, `main`). Each push runs the tests, builds and deploys to Pages.
- **Plan:** `PLAN.md` holds the spec, the glossary, the tuning and the build order. `lifelines-incremental-onepager.md` is the original pitch.
- **Steps 1 to 7j are done.** 7j (staff as units: candidates, staff cards, omsorg training) is live. Waiting for Terje to play it.
- **Direction (Terje, 2026-10-09):** a classic incremental arc. Frantic clicking early, then upgrades that do more and more of the work, so play moves from execution to tactics to strategy. The end game is moving beds, staff and residents between facilities and rooms: "optimized little factories for healthy humans".
- **Next candidates:** staff specialisations, case worker and intake rules, joker cards. See "Automation ladder" under open issues.

## What the game does now

1. Arvid moves in. He learns six rungs at a time (`LEARNING_WINDOW`, was 3), so food, hygiene, energy and home are active from the start.
2. You spend **omsorg** (1 per nudge) to fill effort bars on activity cards. One click is one nudge (press-and-hold was removed after play). A full bar makes the activity **ready**. It starts when its need drops below 50. Ready activities go lowest need first, and the cards show #1, #2.
3. Completions raise skill. Bars shrink from 12 to 6 to 3 nudges, and at ●●● the activity is automatic. It goes into "Handles alone", and the next rung opens. There are 9 routine rungs, from eat to calling someone.
4. **Budget** (120 kr per week) buys staff and **requests** (`src/content/upgrades.ts`).
   - **Requests:** your click (course: a nudge fills 2 segments, then supervision: 3) and the machine (calendar: staff ×1.5, then handover: ×2). A "Requests" button opens a menu with tabs ("Your work", "Staff"). Each line of upgrades is one card with an icon, title, effect, level pips, price and Buy. Only the next level shows. The game pauses while a menu is open (`src/ui/modal.ts`).
   - **Staff as units (7j, `src/content/staff.ts`, `src/sim/staff.ts`):** hiring works as in Game Dev Story. "Hire" pays for a job ad (400 kr ×1.5 for each staff member). One week later 3 candidates answer, each with a name, a face, a role and a rolled sheet. You pick one, and it costs only the wage. Picking closes the ad. "Turn them all down" closes it with no hire, and the fee is lost. Up to 6 staff.
     - **Miljøarbeider** (40 kr/week): one speciality (a need: Cooking, Hygiene, Sleep, Housework, Social). They nudge bars of their speciality first, and there a nudge fills 2 segments. Otherwise they help the lowest need.
     - **Coach** (60 kr/week): a sheet of the highest level they can teach for each activity (rolled: three activities at lvl 1, sometimes one at lvl 2 or 3). The coaches spend the residents' overskudd on any level that a coach in the house can teach. The cheapest level goes first, then the lowest need. They keep 20 overskudd for a proposal while a milestone is open. Training is instant, so more coaches only add coverage.
     - **Profiles (Game Dev Story style):** candidates and staff cards share one profile: name, a role button (icon and title; hover or click shows what the role does), a face (rolled per person, `STAFF_FACES`) and a table. The ×2 chip on a speciality explains itself the same way. Miljøarbeider: all five areas with the activities they cover and the nudge (×2 on a speciality). Coach: activities with "lvl 1", "lvl 2" or "independent". Terje found icon + pips too hard to parse.
     - **Staff card:** click a staff chip in the panel. **Training costs omsorg** (Terje's choice, as a drain on omsorg): a new speciality is 30, a coach level is 10, 20 or 35.
     - Coaches have a wage on purpose, as a brake on growth (Terje).
   - **Pace (7i):** `PACE` (0.7) in `tuning.ts` scales need decay, omsorg, staff and overskudd per real second. Activity durations and the calendar do not change. In the bot, the work trial comes at the same time as before, because kroner per week gate progress.
5. **Overskudd** builds with the share of needs that are green. You spend it with the **arrow** on each activity card: 8, 15 or 25 overskudd raises one activity one level. The card shows the level (lvl 1 to 3). Completions give no skill. When a milestone is open and there is enough overskudd, a **proposal** pauses the game:
   - **Milestone:** NAV meeting, then job application, then work trial.
   - **Scene card (7g):** the resident's face (an emoji for now, `face` in archetypes), a dotted path, and the place (`place` and `placeIcon` in milestones). One short line. The overskudd bar marks the 20 the proposal costs in red stripes. The cost is paid on "Go", and the stripes drain. "Not now" is free (Terje: the overskudd is the price of doing it).
   - **Wager:** a kroner slider, any whole amount. Odds rise with diminishing returns toward 95%. The sure price (600, 900, 1400 kr) makes it certain. The knob stops at the budget. A black mark shows the stop, and the track past it is hatched.
   - **Result:** a marker sweeps the odds bar and stops at the roll. The result line appears, and the milestone dot on the three-step track fills in.

6. **Discharge:** when a tier opens, a button shows it, and the bed card says "discharge". The vedtak shows the tax, what waiting gives, and who is first in line. Signing shows a two-line glimpse. Then the bed stands empty.
   - **Beds:** you start with one. "+ Bed" in the strip buys more (1500 kr, ×1.6 each, up to 4). All beds share omsorg and staff. Staff help the lowest need across all beds.
   - **Admission:** each person on the venteliste has a "Legg inn" button while a bed is free. You choose who.
   - Tiers: fit to live alone (rungs 1 to 6 automatic, +10 kr/week), fit for work (NAV, application, all routines, +30), healthy human (work trial, +100).
   - Budget, staff, upgrades and omsorg carry over. Skills, needs and milestones reset.
   - **Traits (7e):** each referral rolls one trait (`src/content/traits.ts`): Cooks (eat and dishes start at lvl 2), Tidy (home decays at half rate), Family visits (overskudd +50%), Rich (double tax). The trait shows on the list and on the resident.
   - **Skill sheets (7f):** each archetype has start levels and two hard activities (`skills` and `hard` in `src/content/archetypes.ts`). A hard activity takes `HARD_EFFORT` (2) times the nudges at every level, so 24/12/6. The trait's start skill stacks with the sheet (the higher level wins). The list row shows strengths as icons with dots and hard activities as "×2". Arvid: dishes 2, laundry 1, hard walk and call. Maja: call 3, shower 2, eat 1, hard sleep and groceries. Rolf: groceries 3, eat 2, walk 2, hard shower and tidy.
   - **Health (7f, replaced patience from 7e):** each referral rolls health 50 to 90. It drops 3 per week. At 0 the person is lost, and the log line only implies it ("was found by a neighbour. The case is closed."). At admission, each point below 100 costs 0.5 start need and 0.5% decay strain. The referral tempo stays at one each 3 weeks. Terje wants to catch up with it in the long run and watch the list shrink.
   - The waiting list cycles archetypes: Arvid, Maja (23, sleeps all day), Rolf (67, retired, drinks a little). All are grey-boxes in `src/content/archetypes.ts`. With three archetypes, names can repeat across beds and the list.
7. **Two clocks, as in Game Dev Story.** The calendar shows `Y1 M4 W2`, and one week is 24 s at 1x. Activities last real seconds (eat 2 s, sleep 4 s) and are not tied to the calendar. Everything that was per day is now per week, with the same numbers. The sim counts ticks: 60 per real second (`src/sim/time.ts`).

## Feedback from playtests, in order

| Feedback                                            | What we did                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 2 felt like "a grind that doesn't go anywhere" | Expected at that stage. Step 3 added skill and the ladder.                                                                                  |
| Too easy, too slow at 1x, wanted more at once       | Three rungs at once, a faster clock, omsorg as the limit.                                                                                   |
| "Hard to keep him afloat at the start, but good"    | Kept. Staff and the shop moved before proposals.                                                                                            |
| Double tap zooms on iOS                             | `touch-action: manipulation` on `html`. **Not confirmed on a real device yet.**                                                             |
| Frantic and stressful, should be tactical           | 3 omsorg per nudge, bars 4/2/1, 18 s days. "Better, could be even slower, but add mechanics first."                                         |
| Proposals not hitting right, reward unclear         | Support moved to kroner, and the stakes are shown in the dialog. "A little better."                                                         |
| Waiting list too hidden, no urgency                 | 7a: the venteliste is a panel with the cost of each wait and a countdown to the next referral.                                              |
| Staff queue sleep many times, he sleeps when rested | 7a: a full bar is one charge, and it starts only when the need is low.                                                                      |
| Long narrow list, no overview                       | 7a: three-column landscape layout. Below 900 px it stacks.                                                                                  |
| Skill should be active, bought with overskudd       | 7c: training with overskudd. No practice XP, no try-alone. Overskudd now grows with the green share of needs.                               |
| Time for more beds                                  | 7d: beds bought with kroner, a strip of bed cards, Legg inn. Bot with 2 to 3 beds and no staff: needs low 66% of the time.                  |
| Training panel not needed. Hold-to-nudge unwanted   | Training moved to an arrow on each card. One click is one nudge. Terje trains the cheap levels first, then finishes one activity at a time. |
| Wants more activities at the same time              | Learning window 3 → 6. Bot: need at 0 for 15% of the time (was 8%). With all 9 open it was 28%.                                             |
| Activities too short to see, clock tied to them     | Calendar in weeks (Y M W), activities in real seconds. The resident is busy about 78% of the time.                                          |
| 7d: picks the top patient, all the same, list grows | 7e: a trait for each referral, and people leave after 10 to 30 weeks. The wait cost had capped, so every row read "−85, +50%".              |
| 7e: traits help, but identities are weak            | 7f: a skill sheet for each archetype, with strengths and hard activities.                                                                   |
| 7e: patience bar is weak, wants Papers, Please      | 7f: the bar is health. At 0 the person is lost, implied in the log. Health at admission sets the start.                                     |
| 7f: can't read "0/24" while clicking fast           | The effort bar is a ring of segments around the icon, one per nudge. 24 thin segments look costly at a glance.                              |
| Proposals: too much text, overskudd cost unseen     | 7g: scene card with a face and a place, a kroner slider with a sure price, the overskudd bar drains, a marker rolls on the odds bar.        |
| Requests feel pointless, omsorg is always capped    | 7h: requests are now mults (your nudge ×2/×3, staff ×1.5/×2) and a coach that spends overskudd on levels you switch on.                     |
| 7h: wants a menu with descriptions, panes           | 7i: requests menu with "Your work" and "Staff" panes and longer descriptions. Pauses the game.                                              |
| 7i: panes should be tabs, too much text             | Tabs, one card per line with icon, title, effect, price and Buy. Only the next level shows.                                                 |
| 7i: miljøarbeider and coach are the same mechanic   | 7j: staff are units with a role and a sheet, hired from candidates. Staff cards train specialities and coach levels for omsorg.             |
| 7j: roles and specialities are a mystery            | Profiles with a role line and a stats table in words, as in Game Dev Story. Training buttons sit in the table rows.                         |
| Fee + wage at pick felt odd                         | Game Dev Story hiring: pay for a job ad, candidates come a week later, the pick costs only the wage.                                        |
| 7h: coach toggles remove the strategy               | 7i: coach steps are one-way. The coach keeps 20 overskudd for a proposal while a milestone is open.                                         |
| 7h: needs are a blind spot, game too fast           | 7i: `PACE` 0.7 on decay, omsorg, staff and overskudd. Glanceable needs not built yet.                                                       |
| Max level label "alone"                             | Now "independent".                                                                                                                          |
| 7d: tactical rhythm is good, wants strategic layer  | Not built. A new patient is hard for a while, two at once is too much. Full omsorg or more staff makes it fine. Tempo at 24 s is fine.      |

## Open issues

- **Automation ladder (from 2026-10-09).** Built: nudge mult, staff mult, coach. Not built:
  - **Case worker:** proposals resolve by a rule ("wager up to 300 kr").
  - **Intake coordinator:** a free bed fills by a rule ("lowest health first").
  - **Joker cards (Balatro):** rule effects such as "if omsorg is above X, overskudd ×Y". Or things with an omsorg running cost: turn omsorg into overskudd for residents, or into kroner. A staff member who spends omsorg (personal trainer) is odd, because other staff do not.
  - **Roommate traits:** traits that act across beds. Terje likes them. Alumni and outreach: Terje is not convinced.
- **Resident resources are a blind spot (Terje, 7h).** In the execution phase you only see that needs are red and that you should click. The player has no link to the overskudd bar. Wanted: a glanceable link, such as "hygiene is low, so click shower". The pace slowdown is the first step. Next idea: show each card's trigger need on the card.
- **Omsorg is free.** With the nudge mult it is even more free. It needs drains and conversions. The execution phase may also be too short now. Terje wants the player to spend some time there. Tune later.
- **Staff are invisible.** Only their actions show. The initial pop on the ring is the first fix. A 50% upgrade is hard to feel.
- **Proposal cost, kroner or omsorg:** Terje: kroner feel wrong in theme but work, because they cost something. Omsorg fits the theme better (encouraging the resident), but with stable residents omsorg is always at the cap, so it feels free. Kept kroner for now.
- **Trait strength:** Terje says double tax and overskudd +50% are good incentives, "perhaps a bit weak".
- **Tempo:** fine at 24 s weeks (Terje, after 3.5 game years, about 48 min at 1x).
- **Bot stress numbers:** a need is at 0 about 20 to 30% of the time. The bot plays without strategy, so watch for this in real play. The levers are `SPIRAL_PER_EMPTY_NEED` and the decay rates in `src/content/needs.ts`.
- **The shop is below the fold on a phone.** Terje plays on a wide screen. Drop this unless phone play comes back.
- **Activity lines are shared** by all archetypes and are written gender-neutral. Lines for one archetype only go in `src/content/archetypes.ts`.
- **Archetypes are grey-boxes.** Terje plans a procedural personality system. Keep archetype data loose and easy to change. The `colours` field is there for that and is unused.

## Ideas from Terje for after 7a (not built)

- Effort depends on the resident and the activity. Some residents start with skills. A job application could be 32 nudges with no skill.
- Many activities, several for each need (brødskive and dinner for food).
- ~~Overskudd spent on training.~~ Built in 7c, with one skill for each activity (Terje chose this over categories).

## Earlier: rest of step 6

- **Play feedback on 6a:** "discharge now or wait" was not an interesting decision. Waiting cost nothing, so waiting always won. Terje thinks it may need several beds and a waiting list.
- **6b, the cheap test (live):** one bed, plus a waiting list with a cost. Does a waiting cost alone make the decision interesting?
  - One person joins the list every 3 weeks. One person waits at the start.
  - The first in line moves in next. Each week waited takes 2 points from every start need (floor 15) and adds 2% decay (cap 50%). The strain fades by 5% per week.
  - The top bar shows "Helped" and "Waiting". The vedtak shows what the wait has cost so far.
  - With one bed, the list always grows. That pressure is part of the test.
  - Tuning is at the end of `src/content/tuning.ts`.
- **If the test fails:** two beds that share omsorg and staff. `PLAN.md` puts more than one bed out of scope for Act 1, so that changes the plan. UI idea: tabs, or two compact cards.
- ~~Third archetype~~: Rolf, added in 7d.

## How to work on it

```
npm run dev        # local dev server
npm test           # vitest, 60 tests
npm run sim        # balance bot: -- --taps-per-second=0.5 --shop=0 --weeks=120 --deep=1 --beds=1
npm run build      # type check and build
```

- **Code layout:**
  - `src/sim/` is pure TypeScript with no Preact. One game minute per `tickMinute`.
  - `src/content/` holds the data and all tuning numbers (`tuning.ts`).
  - `src/ui/` holds the components. `src/store.ts` holds the loop and the signals.
- **Saves:** bump `SAVE_VERSION` in `src/sim/state.ts` when the state shape changes. Old saves reset.
- **Screenshots:** Playwright is installed globally. Import it from `/Users/godstemning/.nvm/versions/node/v22.22.0/lib/node_modules/playwright/index.mjs`. Run `npx vite build && npx vite preview --port 5180`, then use a 390×844 viewport. The debug panel (⚙ or the backtick key) has 10x and 100x speed, fill omsorg, +1000 kr, proposal now, fill needs, all automatic, next milestone, and reset save.
- **Signals gotcha:** `@preact/signals` skips a child whose props did not change. The state is one mutable object, so a child that gets `s` as a prop does not re-render. Call `useGame()` in every component that reads the state.
- **Way of working:** keep the process light. Make one playable change, deploy it, and let Terje play it. Terje's play test is the review. Build nothing deeper than the next play session.
