# Healthy Humans: Act 1 Prototype Plan

Working title: **Healthy Humans**. Source pitch: `lifelines-incremental-onepager.md`. This plan replaces the one-pager where they disagree.

## Goal

Find the fun in Act 1. Success: Terje plays for 30 minutes and wants to keep going.

## The game in one paragraph

You are the welfare state, a benevolent guardian that sees everything. Residents arrive who cannot manage daily life. You spend **omsorg** to nudge them through activities. Each activity is a rung on a ladder. Repetition builds skill, skill makes the nudge cheaper, and at last the resident does the activity alone. Then the next rung opens. When a resident is good enough, you discharge them. A better discharge pays more tax, but the waiting list and the clock push you to discharge early. The full game runs 20 in-game years. The score is how many healthy humans you produce.

## Glossary

One word, one meaning.

| Term | Meaning |
|---|---|
| **Omsorg** | The player's resource. Builds up over game time to a cap. Spent on nudges and proposals. |
| **Budget** | Money. From a monthly kommune grant plus tax from discharged residents. Pays for staff. |
| **Need** | A resident value that decays over time: hunger, hygiene, energy, home, social. |
| **Overskudd** | The resident's resource. Builds up only while all needs are above their threshold. Fuels proposals. |
| **Activity** | Something a resident does. Each activity is one rung. |
| **Rung** | One step on the ladder. The current rung is the lowest activity that is not yet automatic. |
| **Nudge** | One click on an activity. Puts omsorg into its nudge bar. A full bar makes the resident do the activity. |
| **Skill level** | Per activity, 0 to 3. Each level makes the nudge bar smaller. Level 3 means automatic. |
| **Proposal** | An event where the resident suggests something. Accept or decline. Add omsorg to raise the odds. |
| **Discharge tier** | Fit to live alone, fit for work, healthy human. Sets tax yield. |
| **Waiting list** | A number that grows over time. Shown as pressure. No mechanic in Act 1. |
| **Staff** | Bought with budget. Autoclicks nudges on routine activities. |

## Mechanics (Act 1)

### Time
- Game time runs only while the game is open. No offline progress.
- The calendar shows days and weeks. Speed controls: pause, 1x, 2x, 4x.
- 1 game day = 12 real seconds at 1x (was 20, felt too slow).

### Needs
- Five needs, 0 to 100, each with its own decay rate per archetype.
- Below a threshold (placeholder 30), the need shows a plain-language state, such as "dishes piling up". No overskudd while any need is below its threshold.
- A need at 0 makes the other needs decay faster. This is a light spiral.

### The ladder
Each activity is one rung. Routine activities repeat and refill a need. Milestone activities happen once.

| # | Activity | Kind | Refills |
|---|---|---|---|
| 1 | Eat | Routine | hunger |
| 2 | Shower | Routine | hygiene |
| 3 | Sleep at night | Routine | energy |
| 4 | Do the dishes | Routine | home |
| 5 | Laundry | Routine | home, hygiene |
| 6 | Tidy the room | Routine | home |
| 7 | Buy groceries | Routine | hunger (bigger refill) |
| 8 | Go for a walk | Routine | energy, social |
| 9 | Call someone | Routine | social |
| 10 | Meeting at NAV | Milestone | — |
| 11 | Job application | Milestone | — |
| 12 | Work trial | Milestone | — |

- The resident learns 3 rungs at the same time (the learning window). When one reaches skill level 3, it folds into a "Handles alone" list and the next rung opens.
- Routine activities below the current rung still repeat. At skill level 3 they happen by themselves. Below that, the need decays until you or staff nudge.
- Milestones need overskudd to start, and they come as proposals.
- Discharge tiers open at: rung 6 (fit to live alone), rung 9 (fit for work), rung 12 (healthy human).

### Nudges and skill
- Nudge bar cost by skill level: L0 = 12 clicks, L1 = 6, L2 = 3, L3 = 0 (automatic).
- Each completed activity gives skill XP for that activity: 5 completions per level. Nudging is allowed when the need is full, so omsorg sets the pace.
- One click = 1 omsorg.

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
- Tax per month by tier (placeholder): 1 / 3 / 10 budget.
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
- **Balance script:** `npm run sim` runs a greedy bot in Node and prints real time to each rung, time with low needs, and taps per second. Target: 6 to 8 minutes per resident ladder.
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

1. **Scaffold.** Vite + Preact + TS, git repo, GitHub Pages deploy, empty debug panel.
   *Question: does the link work on your phone?*
2. **Clock, needs, nudges.** Calendar, speed controls, five needs decaying, omsorg pool, nudge bars for rungs 1 to 3.
   *Question: is nudging a bar and seeing the resident act satisfying by itself?*
3. **Skill and the ladder.** Skill levels shrink the bars, rungs go automatic and fade, new rungs appear.
   *Question: does a rung going automatic feel good?*
4. **Overskudd and proposals.** Overskudd builds while needs are met, proposal dialog, odds words, milestone rungs.
   *Question: are proposals interesting choices or noise?*
5. **Discharge and the next resident.** Tiers, vedtak, tax, budget, waiting list number, three archetypes.
   *Question: is "discharge now or wait" a real decision?*
6. **Staff and balance.** One staff hire, the balance script, a first tuning pass.
   *Question: the 30-minute test.*

## Open questions to answer in play

- Is the omsorg cap needed?
- Is a need at 0 for 30% of the time too harsh for a relaxed player? (`npm run sim -- --taps-per-second=2`)
- Do staff also need to generate omsorg, or only autoclick?
- Does the light spiral at 0 add tension or only frustration?
- Is the waiting list number enough pressure without a mechanic?
