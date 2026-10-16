# Healthy Humans in Godot: plan

Decided with Terje on 2026-10-16. This file moves to the new repo when it exists.

## Why

- **Steam is the target.** itch.io (this web build) tests market fit first.
- **The game needs a cute 3D house.** Incremental games are usually only UI. A house where you watch the residents live should sell better.
- **Godot, not the browser.** The tilt-shift camera and the post-processing from `lifelines-core-loop` are essential, and we do not expect to get the same result on the web.
- **A third repo.** Rewrite Healthy Humans in Godot from scratch. Take only what we need from `lifelines-core-loop`: the furniture models, the character sprites, the camera, the lighting and the post-processing. Leave its sim behind, because its presentation code is tied to its own ActivityManager, CharacterEntity and buses.

## The look: pixel art, RPG frame, HD-2D world (Terje, 2026-10-16)

- **Pixel art for the sprites and the UI, a 3D tilt-shift world**, as in Octopath Traveler or Tunic. Terje draws pixel art fast in Aseprite, and the Lifelines character sprites already look like RPG characters. _Papers, Please_ and _Unpacking_ show that paper and pixel art work together.
- **The UI leans into an RPG theme.** The systems are already RPG systems, and the frame names them: skill levels are levels, omsorg is your mana, overskudd is the patient's stamina, the three milestone phases are a quest chain, the personality is the class, the roll is a dice roll, preparation is gear, staff are party members, discharge is the hero's ending. The activity loadout idea (abilities like WoW spells, some need a level or a class) fits as an ability bar.
- **The patient is the hero, and the player is the guide.** The tone stays warm, not mocking: the game is about mental health. The jokes come from the frame (a NAV meeting as a boss fight, the vedtak as a reward scroll), not from the patients.

### Pixel rules

- **One base resolution for the UI and the sprites, scaled by whole numbers only** (×2, ×3, ×4), with nearest filtering. Decide it in step 0: 640×360 is the first candidate (×3 = 1920×1080). A scale that is not a whole number blurs or wobbles the pixels.
- **The 3D world keeps full resolution**, with the tilt-shift and the post-processing from Lifelines. Only the sprites and the UI are pixel art.
- **Panels and buttons are 9-slice textures** from Terje's Aseprite files, as `StyleBoxTexture` in the theme. Lifelines already has an Aseprite importer.
- **A pixel font with æ, ø and å**, readable in long lines. It limits how much text a dialog holds, which also keeps the flat UI small.

## The biggest risk: the UI

The 3D house works (Lifelines shows it). The incremental loop works (this repo shows it). The UI is the unknown. In Lifelines the UI was never beautiful, and agentic UI work has been poor.

Lifelines already has the tools: two Theme resources, `theme_type_variation` in many places, and a UI driver that saves a screenshot and the Control tree for each step. So the problem is not wiring or feedback. It is taste. A screenshot shows that the UI works, not that it looks good. The rules below make the look a decision we take before the code, and make the code a task with a clear end.

### UI rules

1. **The look comes first, as a target.** Each screen has a target before any Godot work: Terje's pixel kit, and a mock of the screen drawn with it. The agent's task is "match this", and the check is the Godot screenshot next to the target. The look is **not** the web version: the game needs a more gamey look (Terje). The web version is only a reference for what each screen holds.
2. **Art assets carry the beauty, not code.** Terje draws the kit (see "The UI kit" below). Code never draws a panel with `StyleBoxFlat`: that looks like a prototype.
3. **One theme, no overrides.** All style lives in one `Theme` resource, as named variations (`CardPanel`, `ButtonPrimary`, `ButtonQuiet`, `Badge`, ...). Scenes set only `theme_type_variation`. A lint test fails when a `.tscn` contains `theme_override`. (Lifelines has 659 overrides in scenes and 138 in code: each is a place where the look drifts.)
4. **A small set of components, polished in one gallery scene.** About eight: dialog, card, primary and quiet button, bar, ring, badge, chip, tabs. Each shows in a gallery scene with fixture data, as in the Lifelines gym scenes. Terje and the agent polish the gallery until Terje likes it. After that, a screen is only a composition of finished components.
5. **Less flat UI, more in the world.** The effort ring sits over the furniture. A low need shows as a thought bubble over the character. The reaction shows on the character's face. The flat UI is a thin HUD and the dialogs.

## Order of work

Each step tests the biggest open risk first, and ends with something Terje can look at.

0. **The UI kit.** Terje draws the minimal kit in Aseprite (see "The UI kit" below) and picks a pixel font and the base resolution. Then a mock of the proposal dialog, drawn or pasted together from the kit, as the target for step 1.
   _Question: does the kit, with the RPG frame, feel like a game Terje wants to sell?_
1. **UI spike in the new repo.** The theme from Terje's kit, the components in a gallery scene, and two real screens built from them: the proposal dialog in its four steps (it holds the most: a question, a hand of cards, a dice roll and a reaction), and an activity card. Screenshots next to the targets.
   _Question: can we reach the target look in Godot with agentic work? If not, look at a fallback (for example a web UI on top of Godot through a webview addon, which is risky for Steam) before the rewrite._
2. **Port the sim.** About 1,500 lines of TypeScript in `src/sim/` and `src/content/`, pure and with tests. Port the tests too (GUT or gdUnit4), and the balance bot, so the numbers stay the same. Content stays as data.
   _Question: does the Godot build play the same as the web build, without the 3D?_
3. **The 3D house.** One room per bed, from the Lifelines furniture and sprites, with the camera, lighting, tilt-shift and post-processing. The house reads the sim state and never writes it. A click on a character selects the bed.
   _Question: is it more fun to watch Arvid than to watch bars?_
4. **Move UI into the world.** Rings on the furniture, thought bubbles, faces. A click on the furniture nudges its activity.
   _Question: can the player play mostly in the house, with the panels as support?_

## Design points for the 3D house

- **Pace.** Activities last 2 to 4 s. A walk to the fridge cannot take longer than the meal. Small rooms, fast walks, or a short walk and a cut.
- **Scale.** 4 beds now, several facilities later. The view must read when zoomed out: a dollhouse with rooms side by side, and later a map. One small room per resident, not one detailed apartment.
- **Assets.** The Lifelines furniture names (`bedDouble`, `kitchenFridge`) look like Kenney's Furniture Kit. Check the license before use.
- **Renderer.** Lifelines uses Forward+, which does not run on the web. Steam builds can keep Forward+. An itch.io web build of the Godot version would need the Compatibility renderer, so the web build may stay on this repo until Steam.

## The UI kit (step 0, for Terje)

Sizes are at the base resolution (640×360), before the whole-number scale. They are first guesses, so change them as the art needs. One `.aseprite` file per piece, with each state as a frame or a tag. For 9-slice pieces, mark the slice in Aseprite (the slice tool with a 9-patch centre), so the importer knows where to stretch.

### Must have: the proposal dialog and an activity card need these

| #   | Piece          | Kind                    | States                                         | First size         | Used for                                                  |
| --- | -------------- | ----------------------- | ---------------------------------------------- | ------------------ | --------------------------------------------------------- |
| 1   | Window         | 9-slice                 | one                                            | 48×48, 8 px border | Dialogs: the quest window                                 |
| 2   | Card           | 9-slice                 | normal, hover, selected, disabled              | 32×32, 6 px border | Milestone cards in the hand, activity cards               |
| 3   | Button         | 9-slice                 | normal, hover, pressed, disabled               | 32×16, 4 px border | Go, Not now, Continue, Buy                                |
| 4   | Quiet button   | 9-slice                 | normal, hover, pressed, disabled               | 32×16, 4 px border | Something else, Not now, Close                            |
| 5   | Bar frame      | 9-slice                 | one                                            | 32×8, 2 px border  | Needs, overskudd, omsorg, the odds bar                    |
| 6   | Bar fill       | 3-slice, tiles in x     | one per colour: good, low, mana, stamina, odds | 8×4                | The fill inside the bar frame                             |
| 7   | Roll marker    | sprite                  | 2 to 4 frames of a bounce                      | 4×12               | The dice-roll marker on the odds bar                      |
| 8   | Slider knob    | sprite                  | normal, hover, dragged                         | 10×10              | The preparation slider                                    |
| 9   | Badge          | 9-slice                 | one                                            | 10×10, 3 px border | Counts on Upgrades and Training                           |
| 10  | Chip           | 9-slice, tinted in code | one, in grey, so code can tint it per colour   | 16×10, 4 px border | The personality (class) chip, tags such as traits         |
| 11  | Stamp          | 9-slice                 | good, poor, neutral                            | 24×12, 4 px border | "It worked", "Not a fit" on the reaction                  |
| 12  | Phase track    | sprites                 | dot: empty, now, done                          | 8×8                | Identity, mastery, purpose: the quest chain               |
| 13  | Effort ring    | sprite sheet            | 12 segments filling, plus "ready"              | 24×24              | The nudge ring (later over the furniture in the 3D house) |
| 14  | Level-up arrow | sprite                  | normal, hover, ready (pulses)                  | 12×12              | Train an activity                                         |
| 15  | Icons, set 1   | sprites                 | one                                            | 16×16              | See below                                                 |
| 16  | Pixel font     | font                    | regular, and bold or a second font for titles  | 8 px or 10 px tall | All text. Needs æ, ø, å, the dashes in "−20", and ✓ ✗     |

**Icons, set 1 (16×16):** omsorg (mana), overskudd (stamina), kroner, the five needs (food, hygiene, energy, home, social), the nine activities (eat, shower, sleep, dishes, laundry, tidy, groceries, walk, call), the twelve milestone cards (NAV, therapist, retreat, trip, boat, garden, piano, course, job, volunteering, kids' team, business), ✓ and ✗, and the six reaction faces (or face overlays for the portrait).

### Next: the rest of the screens

| Piece           | Kind                             | Used for                                                        |
| --------------- | -------------------------------- | --------------------------------------------------------------- |
| Tabs            | 9-slice, normal, hover, selected | The upgrades and training menus                                 |
| Tooltip         | 9-slice                          | Hover text, the tip bubbles, with a small arrow sprite          |
| Portrait frame  | 9-slice                          | Residents, staff and candidates                                 |
| Toast           | 9-slice                          | Toasts                                                          |
| Thought bubble  | sprite set                       | A low need over a character, in the 3D house                    |
| Speech bubble   | 9-slice with a tail              | Barks and the patient's answer                                  |
| Scroll / vedtak | 9-slice                          | The discharge vedtak as a reward scroll                         |
| Icons, set 2    | 16×16                            | Staff roles, upgrade lines, traits, tiers, beds, the venteliste |

### Notes for drawing

- **Draw the pieces in grey where code tints them** (the chip, maybe the bar fill), so one sprite covers every colour.
- **Keep borders a whole number of pixels, and the same on all four sides where you can.** The 9-slice margins in the theme are then simple.
- **Leave 1 px of space for the hover and pressed shift** in buttons, so the label can move down 1 px when pressed without a new sprite.
- **Use one palette for the whole kit.** It keeps the UI calm next to a busy 3D world, and code can use the same colours for text.
