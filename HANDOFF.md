# Hand-off: Healthy Humans

Last session: 2026-10-11 (9b). Read this first, then `PLAN.md`.

## Where things are

- **Live:** https://terjeballestad.github.io/healthy-humans/
- **Repo:** https://github.com/TerjeBallestad/healthy-humans (public, `main`). Each push runs the tests, builds and deploys to Pages.
- **itch.io (set up 2026-10-10, not published):** `npm run build:itch` builds into `dist-itch/` with relative paths. `npm run deploy:itch` builds and pushes it with butler (`~/.local/bin/butler`) to `ballestad-studios/healthy-humans:html5`, with the commit as the version. The page needs custom art before it goes public (about 30 emoji icons and faces, a 630×500 cover, screenshots).
- **Plan:** `PLAN.md` holds the spec, the glossary, the tuning and the build order. `lifelines-incremental-onepager.md` is the original pitch.
- **Steps 1 to 7k are done.** 7k (2026-10-10) is the economy and onboarding pass: bed income, a House tab and a mestring course for overskudd, omsorg rate and cap upgrades, a skill-up pip, toasts, gradual reveal and tips, and one pause/play toggle.
- **Last play (2026-10-10):** Terje played to Y3 M5 W4 (115 weeks, about 46 min at 1x) and found it "quite interesting tactically", with different ways to play. Pacing is good, not perfect. It ran out of fumes when every cap was reached (4 beds, 6 staff, all upgrades). The onboarding tips work well after two fixes (a 1.5 s click delay, and a pause while a tip shows). Not yet played: the pause/play toggle, omsorg without a box, and the hire pool with one of each role.
- **Direction (Terje, 2026-10-09):** a classic incremental arc. Frantic clicking early, then upgrades that do more and more of the work, so play moves from execution to tactics to strategy. The end game is moving beds, staff and residents between facilities and rooms: "optimized little factories for healthy humans".
- **Next (designed 2026-10-11):** step 9 in `PLAN.md`. 9a is played: the game keeps going, with a fine tune later. **9b (office slots and the case worker) is built and not played yet.** Then 9c intake course, 9d discharge course. Then a second facility as a tab. Smaller candidates: glanceable needs on the activity cards, joker cards, roommate traits, candidates of different quality.

## What the game does now

0. **Onboarding (new games only).** `seen` in the state lists the parts shown and the tips done. Old saves have no list and skip it. The staff panel shows at 400 kr, Upgrades at the first affordable upgrade, the venteliste with "+ Bed" and the 👷/💀 chips when a bed or a discharge is possible, and overskudd at the first skill-up. One "Click here" tip shows at a time, on its element: nudge, omsorg at 0, train, hire, upgrades, bed, admit, discharge. The milestone proposal has its own three tips (the milestone track, the wager slider and odds, Go and the overskudd cost), placed to the right of the dialog. A click on the target or "OK" completes it, but only after 1.5 s (`GRACE_MS`), and clicks pass through the bubble. Terje lost tips to fast clicking before that. The game pauses while a tip shows (`resumeSpeed`, as for menus). A tip waits until its target is on screen, and reveals also update after each player action, because a paused game has no ticks. A toast that repeats an unseen tip is skipped.

1. Arvid moves in. He learns six rungs at a time (`LEARNING_WINDOW`, was 3), so food, hygiene, energy and home are active from the start.
2. You spend **omsorg** (1 per nudge) to fill the effort ring on activity cards: a ring of segments around the icon, one per nudge. Staff nudges pop the staff member's initial on the ring. One click is one nudge (press-and-hold was removed after play). A full bar makes the activity **ready**. It starts when its need drops below 50. Ready activities go lowest need first, and the cards show #1, #2.
3. Skill comes from training with overskudd (item 5). Bars shrink from 12 to 6 to 3 nudges, and at the last level the activity is automatic: the card says "independent", and the next rung opens. There are 9 routine rungs, from eat to calling someone.
4. **Budget** (120 kr per week, the kommune grant) buys staff and **upgrades** (`src/content/upgrades.ts`). Code still calls the menu `RequestsMenu`.
   - **Upgrades without an end (9a, 2026-10-11):** six lines (`LINES` in `src/content/upgrades.ts`): your nudge, omsorg rate, omsorg cap, staff, kommune grant, house (overskudd). The state holds the steps bought per line (`levels`). Each step is one clear change: rate lines (omsorg rate, staff, grant, house) ×1.5 each step with no end, the omsorg cap +20 with no end, and the nudge +1 segment, ending at 4. Each step costs 2.2 times the last. Terje's old names are steps 1 and 2. Past them the names repeat with a number ("Garden III"), a placeholder for Terje. A first try with ten small +10% levels between named milestones did not work (Terje: too small to feel, fractional segments). Saves from version 22 and 23 migrate. The game pauses while a menu is open (`src/ui/modal.ts`).
   - **Staff as units (7j, `src/content/staff.ts`, `src/sim/staff.ts`):** hiring works as in Game Dev Story. **Office slots (9b):** the house has 4 generic slots (`MAX_STAFF`), open from the start. The staff panel lists the staff, then the free slots as dashed boxes. The first free slot holds "Hire" (or the countdown, or "Pick a candidate"). "Hire" opens a role menu (`PostAdMenu`): miljøarbeider, coach or case worker. The ad costs 400 kr ×1.5 for each staff member, and the slot counts down "Søknadsfrist: 7 dager". One week later 3 candidates of that role answer (`adRole` in the state), each with a name, a face and a rolled sheet. The pick menu opens by itself (once per batch, not over a proposal or a vedtak). You pick one, and it costs only the wage. "Turn them all down" closes the ad, and the fee is lost. Old saves with more than 4 staff keep them.
     - **Miljøarbeider** (40 kr/week, 0.35 nudges/s before `PACE` and the staff upgrades, was 0.75, then 0.4): one speciality (a need: Cooking, Hygiene, Sleep, Housework, Social). They nudge bars of their speciality first, and there a nudge fills 2 segments. Otherwise they help the lowest need.
     - **Coach** (60 kr/week): a sheet of the highest level they can teach for each activity (rolled: three activities at lvl 1, sometimes one at lvl 2 or 3). The coaches spend the residents' overskudd on any level that a coach in the house can teach. The cheapest level goes first, then the lowest need. They keep 20 overskudd for a proposal while a milestone is open. Training is instant, so more coaches only add coverage.
     - **Profiles (Game Dev Story style):** candidates and staff cards share one profile: name, a role button (icon and title; hover or click shows what the role does), a face (rolled per person, `STAFF_FACES`) and a table. The ×2 chip on a speciality explains itself the same way. Miljøarbeider: all five areas with the activities they cover and the nudge (×2 on a speciality). Coach: activities with "lvl 1", "lvl 2" or "independent". Terje found icon + pips too hard to parse.
     - **Staff card:** click a staff chip in the panel. It shows the profile only, with a "Training →" button.
     - **Training menu:** a "Training" button sits between Hire and Upgrades (Terje: training on the staff card was easy to miss and did not feel like training). One tab for each staff member. Each course is a card like an upgrade: "Hygiene course" for a miljøarbeider, "Teach shower" with level pips for a coach. **Training costs omsorg** (Terje's choice, as a drain on omsorg): a new speciality is 30, a coach level is 10, 20 or 35. Any staff member can take the **mestring course** (40 omsorg, the top card): +25% overskudd for every resident, added per staff member (`MESTRING_BONUS`), then multiplied by the house line (`overskuddMult`). The profile shows it as a last row.
     - Coaches have a wage on purpose, as a brake on growth (Terje).
     - **Case worker (9b, 60 kr/week):** a level from 1 to 5 (Terje: "skill 61 tells me nothing"). Candidates start at lvl 1 (70%) or lvl 2. Each level is a skill in points (`CASEWORKER_SKILL`: 50, 60, 70, 80, 90). After the first hire the case worker takes every milestone, and the player has no wager. The odds are the skill minus the milestone's `difficulty` (NAV 0, application 10, work trial 25). With more than one, the highest level takes it. The resident still pays the 20 overskudd. The dialog still shows: the scene card, the track, the case worker's face and name, and the odds bar with the roll. It stays until a click on Continue or outside the card (Terje: closing by itself after 4 s was too fast to read). The profile shows the level and the odds on each milestone. The **casework course** in the training menu costs kroner, not omsorg (`CASEWORK_COST`: 400, 750, 1400, 2600 kr), and says "Odds +10% on every milestone". Saves from the first 9b build convert the old skill to a level.
     - **Wages grow with courses (Terje, 2026-10-11):** each course a staff member has adds `WAGE_PER_LEVEL` to the wage (miljøarbeider +10, coach +5, case worker +15 kr/week): specialities past the first, coaching levels past 3, case worker levels past 1, and the mestring course. A candidate with a better sheet asks for more. Each course card shows "wage +N kr/week", red when the income cannot pay it, and the course is locked then.
   - **Pace (7i):** `PACE` (0.7) in `tuning.ts` scales need decay, omsorg, staff and overskudd per real second. Activity durations and the calendar do not change. In the bot, the work trial comes at the same time as before, because kroner per week gate progress.
5. **Overskudd** builds with the share of needs that are green. You spend it with the **arrow** on each activity card: 8, 15 or 25 overskudd raises one activity one level. The card shows the level (lvl 1 to 3). Completions give no skill. When a milestone is open and there is enough overskudd, a **proposal** pauses the game:
   - **Milestone:** NAV meeting, then job application, then work trial.
   - **Scene card (7g):** the resident's face (an emoji for now, `face` in archetypes), a dotted path, and the place (`place` and `placeIcon` in milestones). One short line. The overskudd bar marks the 20 the proposal costs in red stripes. The cost is paid on "Go", and the stripes drain. "Not now" is free (Terje: the overskudd is the price of doing it).
   - **Wager:** a kroner slider, any whole amount. Odds rise with diminishing returns toward 95%. The sure price (600, 900, 1400 kr) makes it certain. The knob stops at the budget. A black mark shows the stop, and the track past it is hatched.
   - **Result:** a marker sweeps the odds bar and stops at the roll. The result line appears, and the milestone dot on the three-step track fills in.

6. **Discharge:** when a tier opens, a button shows it, and the bed card says "discharge". The vedtak shows the tax, what waiting gives, and who is first in line. Signing shows a two-line glimpse. Then the bed stands empty.
   - **Beds:** you start with one. "+ Bed" in the strip buys more (1000 kr, was 1500, ×1.6 each, up to 4). Each extra bed adds `GRANT_PER_BED` (40 kr/week) to the grant, and the funding upgrades multiply it. All beds share omsorg and staff. Miljøarbeidere work across all beds: their speciality first, then the lowest need.
   - **Admission:** each person on the venteliste has a "Legg inn" button while a bed is free. You choose who. The list sorts by health, worst first, and scrolls on its own so the staff panel stays in view. Click a row for the referral card (`PatientCard`): face, intro, trait, health with weeks left and the cost at admission, and a table of start levels and nudges per activity.
   - Tiers: fit to live alone (rungs 1 to 6 automatic, +10 kr/week), fit for work (NAV, application, all routines, +30), healthy human (work trial, +100).
   - Budget, staff, upgrades and omsorg carry over. Skills, needs and milestones reset.
   - **Traits (7e):** each referral rolls one trait (`src/content/traits.ts`): Cooks (eat and dishes start at lvl 2), Tidy (home decays at half rate), Family visits (overskudd +50%), Rich (double tax). The trait shows on the list and on the resident.
   - **Skill sheets (7f):** each archetype has start levels and two hard activities (`skills` and `hard` in `src/content/archetypes.ts`). A hard activity takes `HARD_EFFORT` (2) times the nudges at every level, so 24/12/6. The trait's start skill stacks with the sheet (the higher level wins). The list row shows strengths as icons with dots and hard activities as "×2". Arvid: dishes 2, laundry 1, hard walk and call. Maja: call 3, shower 2, eat 1, hard sleep and groceries. Rolf: groceries 3, eat 2, walk 2, hard shower and tidy.
   - **Health (7f, replaced patience from 7e):** each referral rolls health 50 to 90. It drops 3 per week. At 0 the person is lost, and the log line only implies it ("was found by a neighbour. The case is closed."). At admission, each point below 100 costs 0.5 start need and 0.5% decay strain. The referral tempo stays at one each 3 weeks. Terje wants to catch up with it in the long run and watch the list shrink.
   - The waiting list cycles archetypes: Arvid, Maja (23, sleeps all day), Rolf (67, retired, drinks a little). All are grey-boxes in `src/content/archetypes.ts`. With three archetypes, names can repeat across beds and the list.
7. **Two clocks, as in Game Dev Story.** The calendar shows `Y1 M4 W2`, and one week is 24 s at 1x. Activities last real seconds (eat 2 s, sleep 4 s) and are not tied to the calendar. Everything that was per day is now per week, with the same numbers. The sim counts ticks: 60 per real second (`src/sim/time.ts`).
8. **HUD:** chips with an outline, as cold data: `Y1 M7 W2`, `3054 kr +120/w`, `👷 helped`, `💀 lost`. Omsorg (`Omsorg [bar] 40/40`) sits straight on the background, with no box. Time has one pause/play toggle (1x). The debug panel keeps 10x and 100x.

## Feedback from playtests, in order

| Feedback                                              | What we did                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 2 felt like "a grind that doesn't go anywhere"   | Expected at that stage. Step 3 added skill and the ladder.                                                                                  |
| Too easy, too slow at 1x, wanted more at once         | Three rungs at once, a faster clock, omsorg as the limit.                                                                                   |
| "Hard to keep him afloat at the start, but good"      | Kept. Staff and the shop moved before proposals.                                                                                            |
| Double tap zooms on iOS                               | `touch-action: manipulation` on `html`. **Not confirmed on a real device yet.**                                                             |
| Frantic and stressful, should be tactical             | 3 omsorg per nudge, bars 4/2/1, 18 s days. "Better, could be even slower, but add mechanics first."                                         |
| Proposals not hitting right, reward unclear           | Support moved to kroner, and the stakes are shown in the dialog. "A little better."                                                         |
| Waiting list too hidden, no urgency                   | 7a: the venteliste is a panel with the cost of each wait and a countdown to the next referral.                                              |
| Staff queue sleep many times, he sleeps when rested   | 7a: a full bar is one charge, and it starts only when the need is low.                                                                      |
| Long narrow list, no overview                         | 7a: three-column landscape layout. Below 900 px it stacks.                                                                                  |
| Skill should be active, bought with overskudd         | 7c: training with overskudd. No practice XP, no try-alone. Overskudd now grows with the green share of needs.                               |
| Time for more beds                                    | 7d: beds bought with kroner, a strip of bed cards, Legg inn. Bot with 2 to 3 beds and no staff: needs low 66% of the time.                  |
| 7d: tactical rhythm is good, wants strategic layer    | Not built. A new patient is hard for a while, two at once is too much. Full omsorg or more staff makes it fine. Tempo at 24 s is fine.      |
| Training panel not needed. Hold-to-nudge unwanted     | Training moved to an arrow on each card. One click is one nudge. Terje trains the cheap levels first, then finishes one activity at a time. |
| Wants more activities at the same time                | Learning window 3 → 6. Bot: need at 0 for 15% of the time (was 8%). With all 9 open it was 28%.                                             |
| Activities too short to see, clock tied to them       | Calendar in weeks (Y M W), activities in real seconds. The resident is busy about 78% of the time.                                          |
| 7d: picks the top patient, all the same, list grows   | 7e: a trait for each referral, and people leave after 10 to 30 weeks. The wait cost had capped, so every row read "−85, +50%".              |
| 7e: traits help, but identities are weak              | 7f: a skill sheet for each archetype, with strengths and hard activities.                                                                   |
| 7e: patience bar is weak, wants Papers, Please        | 7f: the bar is health. At 0 the person is lost, implied in the log. Health at admission sets the start.                                     |
| 7f: can't read "0/24" while clicking fast             | The effort bar is a ring of segments around the icon, one per nudge. 24 thin segments look costly at a glance.                              |
| Proposals: too much text, overskudd cost unseen       | 7g: scene card with a face and a place, a kroner slider with a sure price, the overskudd bar drains, a marker rolls on the odds bar.        |
| Requests feel pointless, omsorg is always capped      | 7h: requests are now mults (your nudge ×2/×3, staff ×1.5/×2) and a coach that spends overskudd on levels you switch on.                     |
| 7h: wants a menu with descriptions, panes             | 7i: requests menu with "Your work" and "Staff" panes and longer descriptions. Pauses the game.                                              |
| 7h: coach toggles remove the strategy                 | 7i: coach steps are one-way. The coach keeps 20 overskudd for a proposal while a milestone is open.                                         |
| 7h: needs are a blind spot, game too fast             | 7i: `PACE` 0.7 on decay, omsorg, staff and overskudd. Glanceable needs not built yet.                                                       |
| Max level label "alone"                               | Now "independent".                                                                                                                          |
| 7i: panes should be tabs, too much text               | Tabs, one card per line with icon, title, effect, price and Buy. Only the next level shows.                                                 |
| 7i: miljøarbeider and coach are the same mechanic     | 7j: staff are units with a role and a sheet, hired from candidates. Staff cards train specialities and coach levels for omsorg.             |
| 7j: roles and specialities are a mystery              | Profiles with a role line and a stats table in words, as in Game Dev Story. Training buttons sit in the table rows.                         |
| Fee + wage at pick felt odd                           | Game Dev Story hiring: pay for a job ad, candidates come a week later, the pick costs only the wage.                                        |
| Big lull after the first hire, workers too strong     | Worker base rate 0.75 → 0.4 nudges/s. Bot: a need at 0 for 47% of the time (was 25%) at 0.5 taps/s.                                         |
| Venteliste scrolls the staff away, worst cases hidden | The venteliste scrolls on its own, worst health on top. Rows open a referral card.                                                          |
| Bed at 1500 feels unreasonable, wants money mults     | Bed 1000 kr. Funding tab: grant ×1.5, then ×2. "Requests" is "Upgrades" again.                                                              |
| Training on the staff card is easy to miss            | A Training button and menu, with courses as cards. The staff card is a profile only.                                                        |
| HUD should be cold data like the date                 | Chips with outlines. No "Budget", "Helped", "per nudge" labels.                                                                             |
| Hire menu should pop up, beds should pay              | The hire menu opens when candidates arrive. Each extra bed: +40 kr/week grant.                                                              |
| Overskudd is the last tight spot                      | House tab: common room ×1.5, garden ×2. Mestring course for any staff member: +25% overskudd each, for omsorg.                              |
| Wants omsorg upgrades, not only nudge upgrades        | "Your work" gets two more lines: omsorg rate (×1.5, ×2) and omsorg cap (60, 80).                                                            |
| Discharged list squeezes the venteliste to 0 rows     | Discharged shows a count per tier and the tax, not the names.                                                                               |
| Skill-up and affordable things are easy to miss       | Gold pip on the bed card when a skill-up is ready. Toasts when an upgrade or a hire becomes affordable, once each, beside the button.                          |
| The start is overwhelming for new players             | Gradual reveal and one "Click here" tip at a time, with the text Terje wrote for nudge and train.                                           |
| Tips dismissed by fast clicking before being read     | Tips ignore clicks for 1.5 s, and the bubble lets clicks through. OK is faded until then.                                                   |
| The game should pause while a tip shows               | It pauses, and resumes when the tip is done.                                                                                                |
| A hire pool can be three coaches                      | Every pool has at least one miljøarbeider and one coach.                                                                                    |
| The milestone also needs tips                         | Three tips in the proposal: the track, the wager, Go.                                                                                       |
| Too many time controls, omsorg in a box               | One pause/play toggle. Omsorg without background or border.                                                                                 |
| Venteliste collapses when the staff list grows        | The venteliste keeps up to 45% of the left column. The staff panel scrolls on its own below it.                                            |
| Milestone dialog dismissed by fast clicking           | The proposal buttons ignore clicks for 1.5 s (`GRACE_MS`, shared with the tips), on open and again when the result shows.                  |
| Milestone stuck after an upgrade menu opened on it    | Closing a menu no longer restarts the clock under a proposal or a vedtak. The scene card is keyed by the tick the proposal opened.        |
| Toasts bottom right, unreadable in play               | Each toast sits beside its button (Upgrades, or the Hire slot) with an arrow and the upgrade's icon. Bottom right if the button is gone.  |

## Open issues

- **Next big step (Terje, 2026-10-10): several facilities.** The direction and the ideas are in `PLAN.md` under "After Act 1". Automate the wager and admissions first.

- **Automation ladder (from 2026-10-09).** Built: nudge mult, staff mult, staff as units with specialities and coach sheets. Not built:
  - **Case worker and intake:** designed as step 9 in `PLAN.md` (2026-10-11). A rule-based wager was dropped: a strategy for an unknown future position asks too much of the player.
  - **Joker cards (Balatro):** rule effects such as "if omsorg is above X, overskudd ×Y". Or things with an omsorg running cost: turn omsorg into overskudd for residents, or into kroner. A staff member who spends omsorg (personal trainer) is odd, because other staff do not.
  - **Roommate traits:** traits that act across beds. Terje likes them. Alumni and outreach: Terje is not convinced.
- **Resident resources are a blind spot (Terje, 7h).** In the execution phase you only see that needs are red and that you should click. The player has no link to the overskudd bar. Wanted: a glanceable link, such as "hygiene is low, so click shower". The pace slowdown is the first step. Next idea: show each card's trigger need on the card.
- **Lull after the first hire (Terje, 7j).** Workers cut to 0.35, beds to 1000 kr, and each bed pays 40 kr/week. Terje found the pacing good after that (2026-10-10). Watch for it after tuning.
- **Omsorg is free.** With the nudge mult it is even more free. Staff training (specialities, coach levels, mestring) is now a drain, and the rate and cap upgrades make omsorg grow. Conversions (omsorg into overskudd or kroner) are not built. The execution phase may also be too short now. Terje wants the player to spend some time there. Tune later.
- **Staff are invisible.** Only their actions show. The initial pop on the ring is the first fix. A 50% upgrade is hard to feel.
- **Proposal cost, kroner or omsorg:** Terje: kroner feel wrong in theme but work, because they cost something. Omsorg fits the theme better (encouraging the resident), but with stable residents omsorg is always at the cap, so it feels free. Kept kroner for now.
- **Trait strength:** Terje says double tax and overskudd +50% are good incentives, "perhaps a bit weak".
- **Tempo:** fine at 24 s weeks (Terje, after 3.5 game years, about 48 min at 1x). A full run to the caps was about 46 min (2026-10-10). 2x and 4x are gone. A fast-forward could come back as an upgrade if staff do all the work.
- **Bot stress numbers:** a need is at 0 about 20 to 30% of the time. The bot plays without strategy, so watch for this in real play. The levers are `SPIRAL_PER_EMPTY_NEED` and the decay rates in `src/content/needs.ts`.
- **The shop is below the fold on a phone.** Terje plays on a wide screen. Drop this unless phone play comes back.
- **Activity lines are shared** by all archetypes and are written gender-neutral. Lines for one archetype only go in `src/content/archetypes.ts`.
- **Archetypes are grey-boxes.** Terje plans a procedural personality system. Keep archetype data loose and easy to change. The `colours` field is there for that and is unused.

## Ideas from Terje for after 7a (not built)

- Effort depends on the resident and the activity. Some residents start with skills. A job application could be 32 nudges with no skill.
- Many activities, several for each need (brødskive and dinner for food).
- ~~Overskudd spent on training.~~ Built in 7c, with one skill for each activity (Terje chose this over categories).

## Earlier: step 6

- 6a play: "discharge now or wait" was not a decision, because waiting cost nothing. 6b added a waiting list with a cost, and 7d to 7f grew it into beds, traits, skill sheets and health.

## How to work on it

```
npm run dev        # local dev server
npm test           # vitest, 76 tests
npm run sim        # balance bot: -- --taps-per-second=0.5 --shop=0 --weeks=120 --deep=1 --beds=1
npm run build      # type check and build
npm run deploy:itch  # build for itch.io and push with butler
```

- **Code layout:**
  - `src/sim/` is pure TypeScript with no Preact. `tick(state)` advances one tick, 1/60 of a real second at 1x.
  - `src/sim/reveal.ts` and `src/ui/Tips.tsx` hold the onboarding. `src/ui/Toasts.tsx` holds the toasts.
  - `src/content/` holds the data and all tuning numbers (`tuning.ts`).
  - **All player-facing text lives in `src/content/`.** `text.ts` holds the UI labels, dialogs, tips, toasts and sim log lines, grouped by screen. The other content files hold activity, need, upgrade, milestone, archetype, staff, trait and tier text. Terje writes all player text by hand (no gen-AI text, so itch.io needs no AI text tag). Do not write new copy: use a plain placeholder marked for Terje and say so. The debug panel keeps its own labels.
  - `src/ui/` holds the components. `src/store.ts` holds the loop and the signals.
- **Saves:** bump `SAVE_VERSION` in `src/sim/state.ts` when the state shape changes. Old saves reset. An optional field (as `seen` and `mestring`) keeps old saves, so Terje keeps his game.
- **Screenshots:** Playwright is installed globally. Import it from `/Users/godstemning/.nvm/versions/node/v22.22.0/lib/node_modules/playwright/index.mjs`. Run `npx vite build && npx vite preview --port 5180`, then use a 1400×900 viewport (Terje plays on a wide screen). A new game starts with tips, which pause the game and ignore clicks for 1.5 s: wait, then click "OK". To test a late game, read the save from `localStorage` (`healthy-humans-save`), change it, and load it with `addInitScript` in a new page. A plain reload saves over it. The debug panel (⚙ or the backtick key) has 10x and 100x speed, fill omsorg, +1000 kr, proposal now, fill needs, all automatic, next milestone, and reset save.
- **Signals gotcha:** `@preact/signals` skips a child whose props did not change. The state is one mutable object, so a child that gets `s` as a prop does not re-render. Call `useGame()` in every component that reads the state.
- **Way of working:** keep the process light. Make one playable change, deploy it, and let Terje play it. Terje's play test is the review. Build nothing deeper than the next play session.
