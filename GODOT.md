# Healthy Humans in Godot: plan

Decided with Terje on 2026-10-16. This file moves to the new repo when it exists.

## Why

- **Steam is the target.** itch.io (this web build) tests market fit first.
- **The game needs a cute 3D house.** Incremental games are usually only UI. A house where you watch the residents live should sell better.
- **Godot, not the browser.** The tilt-shift camera and the post-processing from `lifelines-core-loop` are essential, and we do not expect to get the same result on the web.
- **A third repo.** Rewrite Healthy Humans in Godot from scratch. Take only what we need from `lifelines-core-loop`: the furniture models, the character sprites, the camera, the lighting and the post-processing. Leave its sim behind, because its presentation code is tied to its own ActivityManager, CharacterEntity and buses.

## The biggest risk: the UI

The 3D house works (Lifelines shows it). The incremental loop works (this repo shows it). The UI is the unknown. In Lifelines the UI was never beautiful, and agentic UI work has been poor.

Lifelines already has the tools: two Theme resources, `theme_type_variation` in many places, and a UI driver that saves a screenshot and the Control tree for each step. So the problem is not wiring or feedback. It is taste. A screenshot shows that the UI works, not that it looks good. The rules below make the look a decision we take before the code, and make the code a task with a clear end.

### UI rules

1. **The look comes first, as a target image.** Each screen has a target before any Godot work. The agent's task is "match this image", and the check is the Godot screenshot next to the target. The look is **not** the web version: the game needs a different, more gamey look (Terje). The web version is only a reference for what each screen holds.
2. **Art assets carry the beauty, not code.** Panels as 9-slice textures, one good font and real icons. A rounded `StyleBoxFlat` looks like a prototype. Buy a UI kit that fits the style, or pay an artist for one style sheet (panel, button, bar, ring, badge, chip, icons). The itch.io page needs about 30 icons anyway.
3. **One theme, no overrides.** All style lives in one `Theme` resource, as named variations (`CardPanel`, `ButtonPrimary`, `ButtonQuiet`, `Badge`, ...). Scenes set only `theme_type_variation`. A lint test fails when a `.tscn` contains `theme_override`. (Lifelines has 659 overrides in scenes and 138 in code: each is a place where the look drifts.)
4. **A small set of components, polished in one gallery scene.** About eight: dialog, card, primary and quiet button, bar, ring, badge, chip, tabs. Each shows in a gallery scene with fixture data, as in the Lifelines gym scenes. Terje and the agent polish the gallery until Terje likes it. After that, a screen is only a composition of finished components.
5. **Less flat UI, more in the world.** The effort ring sits over the furniture. A low need shows as a thought bubble over the character. The reaction shows on the character's face. The flat UI is a thin HUD and the dialogs.

## Order of work

Each step tests the biggest open risk first, and ends with something Terje can look at.

0. **Find the look.** Two or three style directions as mock images of the same two screens (the proposal dialog and an activity card, over a house in the background). Terje picks one, or a mix. Then: buy a UI kit or brief an artist for that direction.
   _Question: which look feels like a game Terje wants to sell?_
1. **UI spike in the new repo.** The theme, the eight components in a gallery scene, and two real screens built from them: the proposal dialog in its four steps, and an activity card. Screenshots next to the target images.
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
