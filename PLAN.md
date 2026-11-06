# Healthy Humans: Act 1 Prototype Plan

Working title: **Healthy Humans**. Source pitch: `lifelines-incremental-onepager.md`. This plan replaces the one-pager where they disagree.

## Goal

Find the fun in Act 1. Success: Terje plays for 30 minutes and wants to keep going.

**Met on 2026-10-10:** Terje played for about 46 minutes (to Y3 M5 W4) and stopped only when every cap was reached. The next goal is a game that keeps growing past that point: automation, then several facilities.

## The game in one paragraph

You are the welfare state, a benevolent guardian that sees everything. Residents arrive who cannot manage daily life. You spend **omsorg** to nudge them through activities. Each activity is a rung on a ladder. Repetition builds skill, skill makes the nudge cheaper, and at last the resident does the activity alone. Then the next rung opens. When a resident is good enough, you discharge them. A better discharge pays more tax, but the waiting list and the clock push you to discharge early. The full game runs 20 in-game years. The score is how many healthy humans you produce.

## Glossary

One word, one meaning. The glossary lives on the PM board in `../healthy-humans-godot`: run `pm glossary` there.

## Mechanics (Act 1)

### Time

- Game time runs only while the game is open. No offline progress.
- Two clocks, as in Game Dev Story. The calendar shows year, month and week (`Y1 M4 W2`), one week per 24 s at 1x. Activities last a few real seconds and are not tied to the calendar. All economy rates are per week. One pause/play toggle (2x and 4x were removed). Menus, proposals and tips pause the game.
- `PACE` (0.7) scales decay, omsorg, staff and overskudd per real second.

### Needs

- Five needs, 0 to 100, each with its own decay rate per archetype.
- Below a threshold (30), the need shows a plain-language state, such as "dishes piling up". Overskudd grows in proportion to the share of needs above the threshold (changed in step 7c: the all-or-nothing rule stalled the game with four or more needs).
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

- The resident learns 6 rungs at the same time (the learning window, was 3). When one reaches skill level 3, its card says "independent" and the next rung opens.
- Routine activities below the current rung still repeat. At skill level 3 they happen by themselves. Below that, the need decays until you or staff nudge.
- Milestones need overskudd to start, and they come as proposals.
- Discharge tiers open at: rung 6 (fit to live alone), rung 9 (fit for work), rung 12 (healthy human).

### Nudges and skill

- One nudge costs 1 omsorg. The bar size is the **effort**: L0 = 12 nudges, L1 = 6, L2 = 3, L3 = 0 (automatic). One click is one nudge. Press-and-hold was tried and removed.
- A full bar means the effort is gone: the activity is **ready**. It holds one charge. A ready activity starts only when its need drops below 50, the same rule as an automatic activity. So you can stockpile ready activities, but only as far as your omsorg goes.
- The resident does ready activities lowest need first. On the same need, a nudged activity goes before an automatic one. Cards show the order as #1, #2, and so on.
- **Skill is active.** Completions give no skill. The player trains an activity with the arrow button on its card, paid with overskudd: 8, 15 and 25 for the three levels. Level 3 makes it automatic and opens the next rung.
- Each archetype has a skill sheet: some activities start at a higher level, and two are hard (twice the nudges at every level).
- Later (ideas from play, not built): several activities for each need.

### Omsorg

- Builds up at 1.25 per real second at 1x before `PACE` (so 0.875), up to a cap of 40. Omsorg, not tap speed, must be the limit.
- Upgrades: rate ×1.5 then ×2, cap 60 then 80. A nudge upgrade makes one nudge fill 2, then 3 segments.

### Proposals

- When a milestone is open and the resident has 20 overskudd, a proposal pauses the game: a scene card with the resident's face, the place and one line.
- The player picks "Go" or "Not now". "Not now" is free. "Go" costs the 20 overskudd and rolls the odds.
- A kroner slider raises the odds with diminishing returns toward 95%. The sure price (600, 900, 1400 kr) makes it certain.
- Success: the milestone is done. Failure: the overskudd and kroner are spent.
- Not built: 2 to 3 personal proposals or events for each archetype.

### Discharge

- When a tier is open, a "Discharge" button appears with the tier name.
- Discharge shows a dry vedtak (tier, axes, monthly tax), then a two-line glimpse of the person's life outside.
- Tax per week by tier (placeholder): 10 / 30 / 100 kr, for the rest of the game.
- The bed stands empty until the player admits someone from the waiting list ("Legg inn").

### Budget and staff

- Kommune grant: 120 kr per week, plus 40 for each bed after the first. The funding upgrades multiply it.
- Staff come from a job ad (Game Dev Story style): pay the ad, three candidates answer a week later (at least one of each role), and the pick costs only the wage. Up to 6 staff.
- A miljøarbeider (40 kr/week) nudges bars across all beds, first and stronger on their specialities. A coach (60 kr/week) spends the residents' overskudd on the skill levels they can teach.
- Staff training costs omsorg: a new speciality, a coach level, or the mestring course (+25% overskudd for every resident).
- The House upgrades multiply overskudd for every resident (common room ×1.5, garden ×2).

### Residents

- Beds: one at the start. More beds are bought with kroner (1000 kr, ×1.6 each, up to 4), and each adds to the grant. All beds share omsorg and staff. A strip of bed cards sits above the selected resident.
- Three hand-written archetypes. Each has a name, a short intro, decay rates per need, a skill sheet and 2 to 3 events. The skill sheet (7f) gives start levels for some activities and marks others as hard (twice the nudges at every level).
- Each referral rolls a trait and a health value (50 to 90). Health drops by 3 per week on the list. Low health at admission means lower start needs and faster decay. At 0 the person is lost, and the log only implies what happened.
  - The man who has not left his flat in a year.
  - The young woman who sleeps all day.
  - The retired man who drinks a little too much.
- Archetype data has an optional color vector field (White, Blue, Black, Red, Green), as in `lifelines-core-loop/resources/scripts/character_profile.gd`. Act 1 ignores it. It prepares procedural residents later.

## Out of scope for Act 1

Relapse, Acts 2 and 3, the clock speed-up, procedural personalities, hidden traits, mentors and local businesses, visual apartment, offline progress, sound. Several facilities are the next step after Act 1 (see "After Act 1").

## Tech

- **Stack:** Preact, TypeScript, Vite, @preact/signals, Vitest.
- **Sim/UI split:** `src/sim/` has no Preact imports. `tick(state)` advances the sim by one tick, 1/60 of a real second at 1x. The store owns the state and exposes signals for the UI.
- **Determinism:** seeded RNG in the state. The same seed and inputs give the same run.
- **Content as data:** activities, archetypes and events live in typed TS files under `src/content/`.
- **Save:** JSON in localStorage, with a version field. Wipe on version mismatch while we prototype. Optional new fields keep old saves.
- **Debug panel:** time speed up to 100x, add omsorg and budget, set skill levels, reset the save. Toggle with a key.
- **Balance script:** `npm run sim` runs a greedy bot in Node and prints real time to each rung, time with low needs, and taps per second. Target: 6 to 8 minutes per resident ladder at about one tap every two seconds.
- **Deploy:** GitHub Actions to GitHub Pages on push to main.

### Layout

```
src/
  sim/        state.ts, tick.ts, actions.ts, selectors.ts, staff.ts, institution.ts,
              proposals.ts, discharge.ts, reveal.ts, time.ts, rng.ts, save.ts
  content/    activities.ts, archetypes.ts, milestones.ts, needs.ts, staff.ts,
              tiers.ts, traits.ts, upgrades.ts, tuning.ts
  ui/         App.tsx, TopBar.tsx, ResidentStrip.tsx, ResidentPanel.tsx, ActivityPanel.tsx,
              WaitingList.tsx, InstitutionPanel.tsx, StaffMenus.tsx, RequestsMenu.tsx,
              ProposalDialog.tsx, DischargeDialog.tsx, Tips.tsx, Toasts.tsx, Log.tsx,
              DebugPanel.tsx, modal.ts
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
4. **Budget, staff and the shop.** Done (later reworked in 7h to 7k). Kommune grant, staff that autoclick the lowest need, one-off omsorg upgrades. Moved before proposals after play: the early struggle makes help feel good now, and overskudd needs green needs.
   _Question: does hiring the first staff member feel like relief?_
5. **Overskudd and proposals.** Done (the dialog was rebuilt in 7g). Overskudd builds while all needs are green. Proposals pause the game: try-alone (success = one skill level) or a milestone (NAV, job application, work trial). Support costs 0, 150 or 350 kr (moved from omsorg after play). The dialog shows what you win and lose before you choose. Odds as words.
   _Question: are proposals interesting choices or noise?_
6. **Discharge and the next resident.** Done: tiers, vedtak, tax, glimpse, and two grey-box archetypes (Arvid, Maja) that cycle. Budget, staff and upgrades carry over. Days slowed to 24 s. Play showed "now or wait" was not a decision, because waiting cost nothing. 6b adds a waiting list with a cost: the longer the next person waits, the worse they arrive. The top bar shows Helped and Waiting. Next: the third archetype, and maybe two beds.
   _Question: is "discharge now or wait" a real decision?_
7. **Ready queue and landscape layout.** 7a: a full bar makes an activity ready, and the need decides when it starts. 1 omsorg per nudge, bars 12/6/3. Three-column landscape layout with the venteliste on screen. Fixes staff queueing sleep many times.
   _Question: does "I make it possible, they choose when" feel better than "I click, they do it"?_
   7b: calendar in weeks and activities in real seconds. Learning window 6.
   7c: **active skills.** Training with overskudd replaces practice XP and try-alone proposals.
   _Question: is choosing what to train a real decision?_
   7d: **more beds.** Buy beds with kroner, admit with "Legg inn", one omsorg pool and one staff team for all. Third archetype: Rolf.
   _Question: does choosing which person to help make the game more tactical?_
   7e: a trait for each referral, and people leave the list after 10 to 30 weeks.
   7f: **identities and health.** A skill sheet for each archetype. Health replaces patience on the list.
   _Question: does choosing who to admit feel like matching a person to your capacity?_
   7g: **proposal scene card.** A face, a place and one line. A kroner slider with diminishing odds and a sure price. The overskudd cost is paid when the card opens, and the bar drains. A marker rolls on the odds bar.
   _Question: do proposals now feel like a bet you set yourself?_
   7h: **mults and automation.** Requests become a stronger nudge, faster staff, and a coach that spends overskudd on levels you switch on.
   _Question: does the game start to play itself in a way that frees you to think?_
   7i: requests menu with two panes, a one-way coach that keeps overskudd for proposals, and `PACE` 0.7.
   7j: **staff as units.** Candidates with a role and a sheet. Miljøarbeidere have specialities, coaches have a sheet of levels they can teach. Training costs omsorg. Coaches have a wage.
   _Question: is choosing and training staff a strategic layer you enjoy?_
   7k: **economy and onboarding.** Each bed adds to the grant. Overskudd from a House tab and a mestring course. Omsorg rate and cap upgrades. A skill-up pip and toasts. A gradual reveal with one "Click here" tip at a time, also in the proposal. One pause/play toggle.
   _Question: answered on 2026-10-10. Terje played 46 minutes and stopped at the caps._
8. **Balance pass.** Tune with `npm run sim`. The 30-minute test passed in play. Pacing is "good, not perfect".
9. **Automation and growth without caps.** Designed with Terje on 2026-10-11. Four small steps, each one playable.
   _Question: can the house run while you look elsewhere?_
   9a: **upgrades without an end.** More steps on top of each line, not small levels between them (a try with +10% levels did not work). Rate lines ×1.5 each step with no end, the omsorg cap +20 with no end, the nudge +1 segment up to 4. Each step costs 2.2 times the last. Names past the written ones are placeholders ("Garden III") until Terje writes them. Fixes "ran out of fumes when every cap was reached".
   9a is played (2026-10-11): the game keeps going after the old caps. It needs a fine tune later.
   9b: **facility slots and the case worker.** Built 2026-10-11, played 2026-10-12: works well. The facility defines its slots. The first facility has 4 generic office slots, open from the start (Terje). Any role can take a slot. Hiring starts from the first free slot: you choose the role for the job ad (miljøarbeider, coach or case worker), and all candidates have that role. Later: candidates of different quality. Slots do not depend on the beds, so later facilities can differ: a 1:1 intensive care unit, or 12 beds with 1 miljøarbeider that admits only advanced residents.
   - **One coach, maxed.** A coach can learn every level of every activity. No skill slots: Terje prefers to max one coach to a jigsaw of partial sheets.
   - **Case worker, proposals.** Before the hire you make the kroner wager yourself (the contractor phase, as in Game Dev Story). After the hire the case worker takes every proposal, and there is no manual option. The resident still pays the 20 overskudd. Odds, armor style (changed 2026-10-11): competence ÷ (competence + difficulty). Competence is the resident's skill levels plus a bonus per failed try. The case worker's level and the kroner wager both divide the difficulty, with diminishing returns.
   - **Case worker training costs kroner, with diminishing returns.** Levels 1 to 5. The price grows each level. The odds come close to 100% but never reach it.
   - **The proposal UI stays.** The dialog shows the scene card, the milestone track and the odds bar with the case worker's odds, without the slider. The marker rolls by itself. The dialog stays until a click (closing by itself was too fast to read). Later each archetype and potential gets its own milestones, so each resident tells a story through them. Show them while there are 1 or 2 facilities. Hide them later if they become noise.
     9c: **intake course** (case worker training). Built 2026-10-12, played: the mechanics work, the UI needs work. The case worker admits to a free bed by a priority the player chooses: lowest health, best match, or richest. This is a choice about values, not a forecast. "Richest" pays well and should feel wrong.
     9d: **discharge course** (case worker training). The case worker discharges at a tier the player chooses, "healthy human" by default.
10. **A second facility.** See "After Act 1".
11. **Patient identity, first version.** Built 2026-10-12, not played yet. See "Patient identity" below.

- Each patient rolls an identity. The first three are single colours, all different. Then 80% pairs.
- 12 milestone cards, 4 per phase, each with a hidden fit per colour. A hand holds the best and the worst fit of the phase and one other, in a fixed order.
- The roll is as before. The reaction face shows the fit after the roll: 🤩 🙂 😶 on a success, 😤 😕 😞 on a failure.
- "Fit for work" needs an identity and a mastery success and all routines. "Healthy human" needs a purpose success and pays that card's tax (job 100, business 60, kids' team 30, volunteering 20). Quality (1 + 0.1 per point of fit, at least 0.2) multiplies every tier's tax.
- Not in it: primærkontakt, talking, the story timeline, more cards and unlocks, hidden identity, a planning course.
  _Question: do the patients feel like people, and does learning the fit feel like the Game Dev Tycoon table?_
  Played 2026-10-16: it did not work. The identity is sprung on the player with no frame, the chip does not register, the hand gets random clicks, and the reaction is too subtle. One panel held too many concepts: milestone, phase, card, personality, overskudd, competence, difficulty and wager.
  11b: **one decision at a time.** Built 2026-10-16, not played yet. The proposal is four short steps, and the patient tells the story:
  1. **The question.** The phase as a question ("What do you recommend, so Arvid can find out who they really are?") and the hand. "Not now" is here.
  2. **The answer.** The patient answers the pick, and sounds sure, unsure or doubtful from the odds (`READY_SURE` 0.7, `READY_UNSURE` 0.45). The odds bar stays, with words (Terje). The wager is now **preparation**: kroner for lessons, a plan, someone who goes along. It fits every card. After the hire, the case worker prepares the patient, and the slider goes. "Go" shows the overskudd cost. "Something else" goes back to the hand.
  3. **The attempt.** One line, and the marker rolls on the odds bar.
  4. **The reaction.** The reaction face, then two lines: one for the fit ("I really hated it."), then one for the result ("But I learned a thing or two."). The result line is keyed by the fit too, so it can agree or contrast. Then two plain stamps ("✓ It worked", "😞 Not a fit"). The phase track ticks on a success.
  - **Personalities are an upgrade the player buys** (Terje: the player has it, not the case worker). The "Personality profiles" line (Your work tab, 800 kr, one step) shows after the first milestone try. Before it, no chips show anywhere, and the playbook does not prefill (it is keyed by identity). After the buy, a tip points at the chip and explains it.
  - **The resident panel lists every try** ("Tried:") with ✓ or ✗ and the reaction face, so what the player learned stays on screen.
  - All new lines are placeholders marked `TODO(Terje)`.
    _Question: does each step make sense to a first-time player, and does buying personalities feel like a light turning on?_
    11c: **fit acts at once, and a gentler wager.** Built 2026-10-16, not played yet. Terje: the fit did nothing you could feel (only a tax multiplier at discharge), and the armor wager was too steep.
  - **Fit effects, shown on the reaction screen in one plain line.** A good fit that works in identity or mastery: overskudd grows 25% faster for the rest of the stay (`FIT_OVERSKUDD_BOOST`, adds up). A good purpose card that works: tax ×1.5 at discharge (`FIT_TAX_MULT`). This replaces the old quality sum. A poor fit, whatever the roll: strain +0.2, so needs drop 20% faster for a while, as after a long wait (`FIT_POOR_STRAIN`). Neutral: nothing. Fit still does not change the odds, so the odds bar cannot leak the hidden table.
  - **Preparation closes the gap to certain.** Competence against difficulty gives the odds alone. Kroner close the gap to 100% along a gentle curve, `(1 − e^(−1.5x)) / (1 − e^(−1.5))` for share x of the full price (`PREP_CURVE`). The full price is sure. Arvid at competence 13 on an identity card: 57% alone, 65% at 60 kr, 71% at 120 kr, 86% at 300 kr, 100% at 600 kr.
  - **A case worker prepares like a share of the full price:** 18% per level (`CASEWORKER_SHARE_PER_LEVEL`). Lvl 1 gives 70% in the example above, lvl 5 gives 98%, never sure.
    Played 2026-10-16 (11b, 11c and the training badge): the milestones work well mechanically, and they are fun to play with. Next: a content pass by Terje on all milestone text (see "Milestone content" in `HANDOFF.md`).

## After Act 1: several facilities

Terje's direction (2026-10-10). Not built, not final.

- **Decided 2026-10-16: a Godot rewrite in a third repo, for Steam.** See `../healthy-humans-godot/ROADMAP.md`. This web build stays for itch.io and market fit.
- In the end the game joins the Godot sim in `../lifelines-core-loop`. Facilities are places on a map, and you see residents move and do activities. In this UI, facilities can be tabs.
- The top-level play: which staff go to which facility, and which patient goes to which bed. Moves should cost something.
- Facilities are blank slates. The furniture and objects you put in them specialise them. A label such as "works as a rusbolig" can emerge from the objects. Objects change rules. Staff skills change rates.
- Staff are defined by their skills, not by fixed roles. Open: a job specialization the player chooses, to frame "work with this patient type".
- Ideas, none chosen: potential on referrals (the highest tier they can reach), disorders with their own ladder and one new rule each (rus: craving rises, relapse drops a skill; ADHD: the effort ring leaks; angst: locked activities and calm; psychosis: medication only a nurse fills), more activities per need.

## Patient identity (grilling, 2026-10-12)

Terje: patients are too anonymous. The game should in the end focus on the patients and give them an identity journey: they find out who they are and which milestones fit them. In Lifelines the colour identity worked in the background and stayed invisible to the player. Here the model is the genre and platform table from Game Dev Tycoon: the player slowly learns which combinations work. The table is not shown in the game. It lives in the player's head. Several versions will be tried.

Settled so far:

- **Identity is visible, fit is discovered.** The referral shows the patient's identity. The player learns what fits it. Hiding the identity can come later, if it feels too easy.
- **The fit table is hidden data.** Each milestone is a row, and the five colours are the columns, with a value from −3 to +3 per cell. A patient's fit with a milestone is the sum of their two colours, with both colours counted the same (changed 2026-10-16: with the primary at 60%, one chip could hide two different fits, so the player could not learn it). Five columns give all ten pairs, so what the player learns about one colour carries over to new pairs.
- **The player learns the fit from a reaction after the milestone.** It shows whether the milestone fit, apart from whether the roll succeeded. Terje writes the reaction lines.
- **Two results, four outcomes.** Competence decides whether a milestone works (the roll). Fit decides what it means (the reaction). Success with a good fit: flourishing. Success with a poor fit: it worked, but left the patient empty (a Crooked Rung, as in Lifelines). Failure with a good fit: they want to try again. Failure with a poor fit: it hurt.
- **The patient offers a hand of 2 or 3 milestones.** When a proposal comes, the player picks one or says "Not now". The hand comes from the patient's identity: usually one good fit, one neutral, one poor. Milestones become cards from a pool that grows with unlocks, not fixed steps on one path. A case worker course can later pick from the hand by a rule.
- **Three phases of milestones (Terje).** Identity first: find out who you are (a NAV meeting, a therapist, a meditation retreat, a trip). Then mastery: a challenge (build a boat, fix the garden, learn the piano, a course, study). Then purpose: give back to the world (a job, or other ways, still open). Each hand draws from the patient's current phase.
- **Purpose milestones differ in tax.** A job pays the most, volunteering little. Each purpose fits some colours more than others (for example volunteering for White, gigs for Red, a business for Black). The last choice of a stay is between kroner and the patient's flourishing. A good fit should still pay something through the quality, so the kind choice is not always a loss.
- **On screen: one coloured chip with the pair name (Terje).** Blue + Red shows as one chip, "Creative", with its background split between blue and red (a blend fails for pairs such as White + Black, which turns grey). The pair name adds flavour. The risk is cognitive load: the player must learn ten names and still think in two colours to read the fit. If that fails, split the chip into two single chips ("Analytical" + "Passionate"). Our own palette, not the MTG colours. Terje writes the five single and ten pair keywords. The Lifelines words in `color_keywords.gd` serve as placeholders.
- **Identities can be a single colour (Terje).** The first patients are single colours, so the player learns the five columns one at a time before pairs come. A single colour counts its column at full weight, so its reactions are stronger and easier to read. Its chip has one colour.
- **The player always picks the card. The case worker only raises the odds.** No full automation of the pick (Terje): if this is what the game is about, it stays an explicit choice. To keep it light, the pick is prefilled with the player's last choice for the same identity and phase, when that card is in the hand. After the first time, it costs one click to confirm.
- Parked (Terje): a patient who arrives with a high-paid job and burns out, and leaves with volunteering in addition to the job. Probably more complex than it is worth.
- **Maslow is the shape of the ladder** (routines, then belonging, then milestones, then identity). **Ikigai is a candidate score** for the whole stay: love (fit), good at (competence), world needs (the milestone's value), paid for (tax). Not settled.

Open: what the outcomes change in the game, Ikigai as the score, colours or keywords on screen, more milestones and how they unlock, the primærkontakt, talking, and a visible story.

## Profile and layers (grilling, 2026-10-25)

Terje: rungs make no sense to the player. Several actions per need is a given. The question is how the choice gets interesting. Settled in a short grilling, to build one step at a time.

- **Five layers, from Maslow:** body, home, belonging, esteem, purpose. A layer opens when each need in it has an independent action. Esteem opens with identity and mastery milestone successes, purpose with a purpose success. The patient reaches a layer through whichever action the player chose for each need.
- **The profile is an Ikigai diagram, per patient, in the character menu.** The layers show there too. Each layer opens one part: body opens good at (aptitude per action, how far it trains), home opens loves (liking per action), belonging opens who they are (the colour chip), esteem opens world needs (milestone fit), purpose opens paid for (the discharge). Before a part opens, the player guesses from what they know of the colours.
- **Tests, per patient:** the player orders a test (aptitude, personality, ...) in the character menu. It costs kroner, the result comes after one week, and it opens one whole part before its layer. The global "Personality profiles" upgrade goes.
- **Action choice:** liking pays or costs now (overskudd), aptitude sets the potential. Not settled: the sizes, and whether a disliked action drains overskudd while it runs.
- **Unlocks:** the actions of a layer open when the layer below opens. Some actions also have a prerequisite (another action, or a colour). This replaces the learning window in the sim. The furniture detail shows a locked action's layer as a small pyramid, and the needs of the layer below with a full or empty mark.
- **Open, next steps:** how prerequisites show in the furniture detail. The character menu layout (mock in Aseprite first). The list of actions per need, with names by Terje. The sizes of liking and aptitude.

## Activities, Fit and aptitude (grilling, 2026-11-06)

Settles "Action choice" above, for the furniture menu in the Godot build. Terms and decisions are on the board in `../healthy-humans-godot` (`pm glossary`, DD-005 to DD-007). No new mechanics: each rule reuses one that exists.

- **What a nudge means.** A nudge does not make the patient eat. It helps them take care of their nutrition, their finances, their home: to live a healthy independent life. The mechanics simplify this. When the basic needs are covered, the patient moves to more complex needs and more complex activities.
- **Fit covers activities too.** Fit is how well a milestone or an activity suits the identity, from the colours, with the same maths. "Liking" and "affinity" are not used. Each run of an activity gives or takes overskudd by its Fit.
- **Slow growth only, never a real drain.** A resident with all needs above the threshold and only disliked activities still gains overskudd. The balance bot tests this.
- **Fit's weight grows with the activity's layer.** A disliked sandwich costs almost nothing. A disliked fancy dinner costs more, and a liked one gives more.
- **Aptitude is the highest skill level an activity can reach**, 1 to 3. Below 3 it never becomes independent. It replaces "hard". It is authored per archetype, not taken from the colours, so liked and able do not go together (DD-006). Aptitude is what they are good at, Fit is what they like.
- **Skill level stays per activity.** Each activity is in one **category**, a life skill area apart from the needs (such as Household or Finance, 3 or 4 of them, names by Terje). The category level is the sum of its activities' skill levels. A layer opens at category levels. This replaces "each need has an independent action", so the player can climb through liked activities.
- **Chains.** A need has activities across the layers, for example sandwich, then frozen pizza, then fancy dinner. Aptitude decides how far up the chain a resident can go.
- **Discovery.** Fit shows on the face during each run. The furniture menu shows "?" until the first run, then the face seen. Aptitude shows as level pips: those above the aptitude stay "?" until the activity reaches its top, then they lock. The first run also gives a hint line per archetype and activity (text by Terje). A test shows everything.
- **The loadout (trial, DD-007).** The resident's nine slots on the activity bar. Only activities in the loadout run, also independent ones, and staff nudge only those. Independent activities stay on the bar until the player takes them off: the bar shows and teaches independence. To test if this fails: independent activities run off the bar too. More slots can be an unlock later.
- **Furniture (DD-005).** Each activity belongs to one piece of furniture. A click on furniture opens the furniture menu and never nudges. The menu lists the activities in layer order, locked ones too, with what opens them. The game pauses while it is open. Only the activity bar nudges and trains.
- **Open:** whether the furniture in a room decides which activities exist (bought furniture adds activities). The category names and the layer gates. The chains per need, with names by Terje. The Fit and aptitude numbers (balance bot). The profile shows Fit and the colours, which partly tell the same thing: settle it with the character menu.

## Proposal screen spec (2026-11-01)

The target for Terje's Aseprite mock at 640×360, and later for the Godot UI spike. The flow is 11b and 11c as played: four steps, one decision at a time. This spec only moves it onto the new screen. Every line the player reads is a slot for Terje, named here by what it says, not written.

**Placement (Terje, 2026-11-01): split between the room and the bar.** The patient speaks in a bubble over the head in the room. The hand takes the place of the action bar, like an RPG battle menu. The odds bar sits under the cards. The reaction shows on the faces, in the bubble, and on the bars on the left edge. This moves to the 3D house with no change.

**For the whole proposal:**

- The game is paused, as now.
- The action bar and the omsorg bar are hidden. The proposal owns the bottom of the screen.
- The furniture does not respond, and the character window is closed.
- The roster and the needs on the left edge stay. They show what the proposal costs and what it did.
- The identity chip shows only when the patient's "who they are" part is open (the 10-25 grilling: tests replace the "Personality profiles" upgrade).
- Clicks wait `GRACE_MS` on each step, as now.

### Step 1: the question

**The decision:** which card, or not now.

- **The bubble** holds the phase as a question about this patient.
- **The patient** in the room has a small quest mark over the head while the bubble is open.
- **Three cards** sit where the action bar was. Each shows the card's icon and name.
- **The playbook pick** is raised and outlined, so one click confirms it.
- **A card the patient has tried** has a small mark with the reaction face it got.
- **"Not now"** is a quiet button at the right end of the row.
- **The overskudd row** on the left edge marks the 20 the proposal costs in red stripes.

**Hover only:**

- On a card: the place, and every earlier try of this card by this patient with the result.
- On the chip: what the identity is.

### Step 2: the answer

**The decision:** how much to prepare, then go or pick something else.

- **The bubble** holds the patient's answer to the pick. The patient sounds sure, unsure or doubtful from the odds (`readiness`).
- **The picked card** stays in its place. The other two dim.
- **The odds bar** under the cards shows the chance as a fill and a percentage.
- **The preparation slider** sits next to the card, from 0 to the sure price. The knob stops at the budget, and the track past it is hatched, as now.
- **With a case worker**, their portrait and level sit in place of the slider.
- **"Go"** is the primary button. It shows the kroner and the overskudd it costs.
- **"Something else"** is a quiet button. It goes back to step 1.

**Hover only:**

- On the odds bar: competence against difficulty, and what preparation or the case worker adds.
- On the case worker: their name and what their level gives.

### Step 3: the attempt

**No decision.** It lasts `ATTEMPT_MS`.

- **The bubble** holds one line about the attempt.
- **The roll marker** runs along the odds bar and stops at the roll.
- **The overskudd row** drains the striped 20.

### Step 4: the reaction

**No decision.** A click on Continue or anywhere on the screen closes it.

- **The face** in the room and on the roster portrait turns into the reaction face (6 faces: success or failure, times good, neutral or poor fit).
- **The bubble** holds two lines: one for the fit, then one for the result, keyed by the fit.
- **Two stamps** sit over the card: the result (it worked, or not), and the fit (good, neutral or poor).
- **The phase track** (three dots) shows next to the stamps. The current dot ticks on a success.
- **The fit effect plays on the bars, with no line (Terje, 2026-11-01).** A good fit in identity or mastery: the overskudd row pulses, and a small buff icon stays next to it for the stay. A poor fit: the need rows pulse, and a small debuff icon stays while the strain lasts. A good purpose card: a buff icon on the roster portrait, for the tax at discharge.
- **"Continue"** sits at the right end of the row.

**Hover only:**

- On a buff or debuff icon: what it does, how big it is, and where it came from.

### Kit pieces this needs

Already drawn: window and card 9-slices, buttons, quiet buttons, bars, the portraits, the need and overskudd icons.

Still to draw:

- **Speech bubble**, 9-slice with a tail.
- **Card states:** normal, hover, picked, dimmed.
- **Odds bar fill** and the **roll marker**.
- **Slider knob.**
- **Stamps:** good, poor, neutral.
- **Phase dots:** empty, now, done.
- **Quest mark** over the head.
- **Buff and debuff icons**, small, for the bar rows and the portrait.
- **Icons:** the 12 milestone cards and the 6 reaction faces (as faces or portrait overlays).

### Start: the player opens it from the character window (Terje, 2026-11-01)

Terje: the proposal that opens by itself is chill, but mid-game the player mostly waits for it, with no sign of when it comes. Today three hidden gates decide it (`maybePropose`): the phase is open, the patient has 20 overskudd, and `PROPOSAL_COOLDOWN_WEEKS` (3) have passed since the last proposal. The cooldown starts when the proposal opens, so "Not now" also costs 3 weeks.

- **The gates show as one thing that fills.** The character window shows how close each gate is: the phase, the overskudd against the 20 mark, and the cooldown. The portrait shows the sum as a small fill or ring.
- **When all three are open, a quest mark shows** on the portrait and over the patient in the room. The game does not pause.
- **The player opens the proposal from the character window** (or with a click on the quest mark). Then step 1 starts, and the game pauses as before.
- **This is the first verb of the character window as the place to manage one patient** (see "Diagnose and prescribe" below).
  _Question: does the player feel in control of the timing, or does a proposal they can ignore lose its pull?_

### Open

- **The card size.** Three cards with an icon and a name must fit the bar area. A first guess is 72×56 each, with a 32×32 icon. Terje decides in the mock.
- **The tax buff on the portrait** may be too far from its effect. The discharge has no place on the main screen yet.

## Candidate: a shorter wait between tries (2026-11-01)

Terje: the wait after a failed try is annoying, mostly at the third milestone. It also builds anticipation for the next try, so keep the wait, and let the player pay to make it shorter.

- **An upgrade line or a case worker course shortens `PROPOSAL_COOLDOWN_WEEKS`.** For example 3 weeks, then 2, then 1. Not decided: an upgrade line (kroner) or a casework course (one case worker plans the next try sooner).
- **Maybe "Not now" should not start the cooldown**, or start a shorter one. Today it costs the full 3 weeks.
- It needs the gates to show first (see "Start" in the proposal spec), or the player cannot feel the change.

## Diagnose and prescribe (open, 2026-11-01)

Terje's dilemma. The standard incremental recipe is proven. The thesis carried for a year through `lifelines-core-loop` is the identities: nurture broken people into healthy humans. Terje feels obliged to explore an identity-based "diagnose and prescribe" model, with the character window as the place to manage one patient: discover personality and purpose, diagnose malformed behaviour and prescribe changes, train skills, and maybe start milestones. The fear: the design space is large, and it can grow the scope and damage what works.

Notes from the session, not decisions:

- **The two need not compete.** The incremental recipe is the engine (currencies, upgrades, the move from clicking to tactics to strategy). The identity is what the decisions are about. Game Dev Tycoon's genre and topic table is the model: a hidden fit, discovered inside a tycoon shell. The milestone hand is a small version of it, and it works.
- **Most of it is already in this plan as small verbs:**
  - Discover: tests and the profile parts (see "Profile and layers").
  - Prescribe: the actions on the bar (liking, aptitude) and the milestone card.
  - Train: exists.
  - Start a milestone: the proposal start above.
  - Diagnose malformed behaviour: new, and the largest. It links to the disorder ideas under "After Act 1". Park it until discover and prescribe are fun.
- **A scope rule.** Each new patient verb uses a currency the game already has, is playable on its own in one step, and has a kill question. A verb that fails its question goes out.

## Content production (parked, 2026-10-16)

The milestone mechanics work and are fun (Terje, 2026-10-16). The content is placeholder and does not hold together yet. In play, a Contemplative patient got a neutral fit on the meditation retreat, and the neutral line ("Not my cup of tea") read as a poor fit. Two fixes are in: pairs count both colours at 50%, and the neutral line sounds neutral. The rest waits for a content pass. Keep these rules in mind, so the content work stays clear and has an end:

- **More cards per phase.** Four cards per phase give a hand of three that hardly changes. More cards also give the fit table more to teach.
- **Lines per card by default, with an override per archetype.** Each card has its own lines (the answer, the attempt, the reactions) that work for every patient. An archetype can override the lines that matter ("Arvid on the retreat"). The code looks for the archetype line first, then the card line, then a generic line. Lines can then come one at a time, and the game always has something to show.
- **The fit table and the keywords are written together.** Each card's fit row must match the words on the chips, so that "Contemplative likes the retreat" makes sense to a player. The current table is from the first grilling and does not follow the keywords (for example Self-care, Black, hates the retreat).
- **Each identity needs a clear like and a clear dislike in each phase.** Today pairs such as Protective and Dutiful are neutral on almost every card, so the player learns nothing from them.
- **A coverage script.** It lists the cards and identities with missing lines or flat fits, and prints the fit of every card for every identity, so the content pass has a checklist and an end.

- Is the omsorg cap needed? (There are now cap upgrades, so it is part of the economy.)
- Is a need at 0 for 30% of the time too harsh for a relaxed player? (`npm run sim -- --taps-per-second=2`)
- Should omsorg turn into overskudd or kroner (conversions)? Training drains it now.
- Does the light spiral at 0 add tension or only frustration?
- What keeps the game growing after every cap is reached?
