# Healthy Humans: Act 1 Prototype Plan

Working title: **Healthy Humans**. Source pitch: `lifelines-incremental-onepager.md`. This plan replaces the one-pager where they disagree.

## Goal

Find the fun in Act 1. Success: Terje plays for 30 minutes and wants to keep going.

## The game in one paragraph

You are the welfare state, a benevolent guardian that sees everything. Residents arrive who cannot manage daily life. You spend **omsorg** to nudge them through activities. Each activity is a rung on a ladder. Repetition builds skill, skill makes the nudge cheaper, and at last the resident does the activity alone. Then the next rung opens. When a resident is good enough, you discharge them. A better discharge pays more tax, but the waiting list and the clock push you to discharge early. The full game runs 20 in-game years. The score is how many healthy humans you produce.

## Glossary

One word, one meaning.

| Term               | Meaning                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Omsorg**         | The player's resource. Builds up over game time to a cap. Spent on nudges and proposals.                 |
| **Budget**         | Money. From a monthly kommune grant plus tax from discharged residents. Pays for staff.                  |
| **Need**           | A resident value that decays over time: hunger, hygiene, energy, home, social.                           |
| **Overskudd**      | The resident's resource. Builds up only while all needs are above their threshold. Fuels proposals.      |
| **Activity**       | Something a resident does. Each activity is one rung.                                                    |
| **Rung**           | One step on the ladder. The current rung is the lowest activity that is not yet automatic.               |
| **Nudge**          | One click on an activity. Puts omsorg into its nudge bar. A full bar makes the resident do the activity. |
| **Skill level**    | Per activity, 0 to 3. Each level makes the nudge bar smaller. Level 3 means automatic.                   |
| **Proposal**       | An event where the resident suggests something. Accept or decline. Add omsorg to raise the odds.         |
| **Discharge tier** | Fit to live alone, fit for work, healthy human. Sets tax yield.                                          |
| **Waiting list**   | A number that grows over time. Shown as pressure. No mechanic in Act 1.                                  |
| **Staff**          | Bought with budget. Autoclicks nudges on routine activities.                                             |

## Mechanics (Act 1)

### Time

- Game time runs only while the game is open. No offline progress.
- Two clocks, as in Game Dev Story. The calendar shows year, month and week (`Y1 M4 W2`), one week per 24 s at 1x. Activities last a few real seconds and are not tied to the calendar. All economy rates are per week. Speed controls: pause, 1x, 2x, 4x.
- 1 game day = 24 real seconds at 1x. Tried 12 (frantic) and 18 (better, "could be even slower").

### Needs

- Five needs, 0 to 100, each with its own decay rate per archetype.
- Below a threshold (placeholder 30), the need shows a plain-language state, such as "dishes piling up". No overskudd while any need is below its threshold.
- A need at 0 makes the other needs decay faster. This is a light spiral.

### The ladder

Each activity is one rung. Routine activities repeat and refill a need. Milestone activities happen once.

| #   | Activity        | Kind      | Refills                |
| --- | --------------- | --------- | ---------------------- |
| 1   | Eat             | Routine   | hunger                 |
| 2   | Shower          | Routine   | hygiene                |
| 3   | Sleep at night  | Routine   | energy                 |
| 4   | Do the dishes   | Routine   | home                   |
| 5   | Laundry         | Routine   | home, hygiene          |
| 6   | Tidy the room   | Routine   | home                   |
| 7   | Buy groceries   | Routine   | hunger (bigger refill) |
| 8   | Go for a walk   | Routine   | energy, social         |
| 9   | Call someone    | Routine   | social                 |
| 10  | Meeting at NAV  | Milestone | —                      |
| 11  | Job application | Milestone | —                      |
| 12  | Work trial      | Milestone | —                      |

- The resident learns 3 rungs at the same time (the learning window). When one reaches skill level 3, it folds into a "Handles alone" list and the next rung opens.
- Routine activities below the current rung still repeat. At skill level 3 they happen by themselves. Below that, the need decays until you or staff nudge.
- Milestones need overskudd to start, and they come as proposals.
- Discharge tiers open at: rung 6 (fit to live alone), rung 9 (fit for work), rung 12 (healthy human).

### Nudges and skill

- One nudge costs 1 omsorg. The bar size is the **effort**: L0 = 12 nudges, L1 = 6, L2 = 3, L3 = 0 (automatic). Press and hold a card to keep nudging.
- A full bar means the effort is gone: the activity is **ready**. It holds one charge. A ready activity starts only when its need drops below 50, the same rule as an automatic activity. So you can stockpile ready activities, but only as far as your omsorg goes.
- The resident does ready activities lowest need first. On the same need, a nudged activity goes before an automatic one. Cards show the order as #1, #2, and so on.
- Each completed activity gives skill XP for that activity: 5 completions per level. The need sets the pace of completions.
- Later (ideas from play, not built): effort that depends on the resident and the activity (a job application could be 32 nudges), several activities for each need, skill categories (cooking, household) that cover many activities, and overskudd spent on training.

### Omsorg

- Builds up at 1.25 per game hour (2.5 per real second at 1x), up to a cap of 40. Omsorg, not tap speed, must be the limit.

### Proposals

- The resident suggests something, such as "I think I could go to the shop alone today."
- The player accepts or declines. On accept, the player can add omsorg to raise the odds. Odds show as words: "a stretch", "maybe", "likely".
- Success: skill XP or a milestone completed. Failure: the omsorg spent is lost.
- Each archetype has 2 to 3 personal proposals or events, plus shared ones.

### Discharge

- When a tier is open, a "Discharge" button appears with the tier name.
- Discharge shows a dry vedtak (tier, axes, monthly tax), then a two-line glimpse of the person's life outside.
- Tax per week by tier (placeholder): 10 / 30 / 100 kr, for the rest of the game.
- A new resident arrives in the empty bed.

### Budget and staff

- Kommune grant: fixed budget per month.
- One staff hire in Act 1. Staff cost budget per month and autoclick the lowest unfinished routine at a fixed rate.

### Residents

- One bed in Act 1.
- Three hand-written archetypes. Each has a name, a short intro, decay rates per need, a starting rung, and 2 to 3 events.
  - The man who has not left his flat in a year.
  - The young woman who sleeps all day.
  - The retired man who drinks a little too much.
- Archetype data has an optional color vector field (White, Blue, Black, Red, Green), as in `lifelines-core-loop/resources/scripts/character_profile.gd`. Act 1 ignores it. It prepares procedural residents later.

## Out of scope for Act 1

Relapse, Acts 2 and 3, the clock speed-up, more than one bed, procedural personalities, hidden traits, mentors and local businesses, visual apartment, offline progress, sound.

## Tech

- **Stack:** Preact, TypeScript, Vite, @preact/signals, Vitest.
- **Sim/UI split:** `src/sim/` has no Preact imports. `tick(state, dtMs)` advances the sim. The store owns the state and exposes signals for the UI.
- **Determinism:** seeded RNG in the state. The same seed and inputs give the same run.
- **Content as data:** activities, archetypes and events live in typed TS files under `src/content/`.
- **Save:** JSON in localStorage, with a version field. Wipe on version mismatch while we prototype.
- **Debug panel:** time speed up to 100x, add omsorg and budget, set skill levels, reset the save. Toggle with a key.
- **Balance script:** `npm run sim` runs a greedy bot in Node and prints real time to each rung, time with low needs, and taps per second. Target: 6 to 8 minutes per resident ladder at about one tap every two seconds.
- **Deploy:** GitHub Actions to GitHub Pages on push to main.

### Layout

```
src/
  sim/        state.ts, tick.ts, actions.ts, rng.ts, save.ts
  content/    activities.ts, archetypes.ts, events.ts, tuning.ts
  ui/         App.tsx, ResidentPanel.tsx, NudgeBar.tsx, ProposalDialog.tsx,
              DischargeDialog.tsx, TopBar.tsx, DebugPanel.tsx
  store.ts    signals + game loop
  main.tsx
scripts/
  balance.ts
```

## Build order

Each step ends with something playable and one question to answer by playing.

1. **Scaffold.** Done.
2. **Clock, needs, nudges.** Done.
3. **Skill and the ladder.** Done. Retuned after play: 12 s days, three rungs at once, omsorg as the limit.
4. **Budget, staff and the shop.** Kommune grant, staff that autoclick the lowest need, one-off omsorg upgrades. Moved before proposals after play: the early struggle makes help feel good now, and overskudd needs green needs.
   _Question: does hiring the first staff member feel like relief?_
5. **Overskudd and proposals.** Done. Overskudd builds while all needs are green. Proposals pause the game: try-alone (success = one skill level) or a milestone (NAV, job application, work trial). Support costs 0, 150 or 350 kr (moved from omsorg after play). The dialog shows what you win and lose before you choose. Odds as words.
   _Question: are proposals interesting choices or noise?_
6. **Discharge and the next resident.** First half done: tiers, vedtak, tax, glimpse, and two grey-box archetypes (Arvid, Maja) that cycle. Budget, staff and upgrades carry over. Days slowed to 24 s. Play showed "now or wait" was not a decision, because waiting cost nothing. 6b adds a waiting list with a cost: the longer the next person waits, the worse they arrive. The top bar shows Helped and Waiting. Next: the third archetype, and maybe two beds.
   _Question: is "discharge now or wait" a real decision?_
7. **Ready queue and landscape layout.** 7a: a full bar makes an activity ready, and the need decides when it starts. 1 omsorg per nudge, bars 12/6/3. Three-column landscape layout with the venteliste on screen. Fixes staff queueing sleep many times.
   _Question: does "I make it possible, they choose when" feel better than "I click, they do it"?_
8. **Balance pass.** Tune with `npm run sim`.
   _Question: the 30-minute test._

## Open questions to answer in play

- Is the omsorg cap needed?
- Is a need at 0 for 30% of the time too harsh for a relaxed player? (`npm run sim -- --taps-per-second=2`)
- Do staff also need to generate omsorg, or only autoclick?
- Does the light spiral at 0 add tension or only frustration?
- Is the waiting list number enough pressure without a mechanic?
