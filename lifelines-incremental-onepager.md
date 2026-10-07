# Lifelines: Social Realist Incremental

**Working title:** Lifelines
**Genre:** Incremental / clicker with prestige
**Platform:** Web prototype, Steam later

## Pitch

You run a social housing unit. Residents arrive unable to keep up with the basics of daily life. By clicking, hiring staff and improving the environment you keep their needs afloat, until they build enough *overskudd* to learn the skills they need to manage on their own. When you decide a resident is ready, they move out, get scored, and return to society as a tax-paying healthy human who funds the next round of help.

## Aesthetics (MDA)

- **Satisfying growth:** clicks get replaced by routines, routines get replaced by independence.
- **Empathic curiosity:** each resident is a small puzzle. You learn who they are by how they respond.
- **Nordic melancholy with dry warmth:** everyday struggles shown plainly. The system counts people as numbers; the game quietly shows them as people.

## Core Loop

1. **Click a resident** to nudge them: eat, wash, sleep, go outside, call someone. Immediate visible response.
2. **Keep needs above thresholds.** While all basic needs are met, the resident earns **overskudd**.
3. **Spend overskudd on skills** that lower need decay or let the resident handle a need themselves.
4. **Hire staff and upgrade the environment** to automate upkeep you can't click yourself.
5. **Discharge** the resident when you judge them ready. They are scored and become a **healthy human** who pays tax into your budget.

## Layers

| Layer | Resource | Role |
|---|---|---|
| Needs | Hunger, hygiene, sleep, social, energy | Upkeep. Decay over time. |
| Personal | Overskudd | Earned only while needs are met. Buys skills. |
| Institution | Budget, staff hours, beds | Automates upkeep. Shared across residents. |
| Meta | Healthy humans | Accumulate permanently. Pay tax into the budget. Their quality sets the yield. |
| Scale | Institutions | Bought with tax income. Each one produces more healthy humans. |

## Systems

- **Thresholds and states.** A need below its threshold triggers a state such as starving, filthy or withdrawn. States block overskudd and speed up decay of other needs.
- **Spirals.** States feed each other (withdrawn makes hygiene slip, filthy hurts social). Recoverable, but expensive.
- **Hidden traits.** Each resident has personality traits (Big 5 based) that change which nudges work and how fast needs decay. Traits are revealed gradually through clicking.
- **Skill stages.** Each skill moves through three stages: staff does it, resident does it when nudged, resident does it on their own.
- **Attention as the scarce resource.** Several residents at once. Skills matter because they free your clicks for someone else.
- **Regression.** Unattended residents drift back toward their old equilibrium. Offline regression is capped so returning never feels punishing.

## Discharge and Scoring

- **Scored on axes:** arbeidsevne (work ability), stabilitet (stability) and selvstendighet (independence). Together they give a final score, presented as a dry bureaucratic vedtak, followed by a short warm glimpse of the person's life outside.
- **Score sets tax yield** and **relapse risk**. A weak discharge pays little and may come back through the door later, with their tax income gone.
- **The waiting list.** Beds are limited and the queue keeps growing. Sometimes you have to let people go before they are properly ready to make room. The game never says whether that was right.
- **Institution quality raises the ceiling.** Early on, your best possible discharge is modest. Better facilities and staff unlock higher skill tiers, which make higher-quality healthy humans with higher tax yields possible.

## Contributions (optional layer)

At discharge, a resident with a high enough score can contribute in one of three ways instead of plain tax:

- **Taxpayer (default):** steady income to the budget.
- **Mentor:** returns as low-cost staff. Gives up their tax, but residents they work with earn more overskudd.
- **Local business:** opens something in the neighborhood, like a café, which gives a passive environment bonus (for example, slower social decay for all residents).

One choice per discharge keeps it simple and makes the meta layer feel like a growing community. Can be cut if the core works without it.

## Growth and Scale

- **Prestige through people.** Each resident is a mini-run. Healthy humans are never spent; they accumulate and keep paying tax, acting as the permanent multiplier across all runs.
- **Compounding loop.** Taxes fund new institutions, institutions produce more healthy humans, healthy humans pay more taxes. Each institution grows linearly, and buying new ones with the output creates the exponential curve.
- **The zoom out.** Early game: clicking one person's dishes. Mid game: managing staff across a few buildings. Late game: running a network of institutions where most individuals are automated. The player gradually becomes the welfare system itself.
- **Reasons to zoom back in.** Hard cases that staff can't handle get escalated to the player, and residents in a spiral flag on the map. The late game is mostly systems, but the moments that matter are still about one person.
- **Possible second tier (later):** expanding into a new kommune with harder residents and a fresh upgrade set, while existing institutions keep running as passive income.

## Tone Rules

- No diagnoses or clinical labels. States are shown through behavior and the apartment (curtains closed, dishes piling up, phone off) with short, plain labels.
- The theme is never stated. The welfare system's role and the value of ordinary competence come through in the mechanics.
- Small numbers. The late game escalates toward an ordinary life.

## PENS Check

- **Competence:** reading residents correctly, pulling them out of spirals, achieving higher discharge scores.
- **Autonomy:** choosing who gets your attention, which skills to invest in, and when someone is ready to leave.
- **Relatedness:** residents you got to know, leaving, and sometimes coming back as mentors.

## First Prototype

One resident, one apartment, four needs, overskudd, three skills, one staff hire, and a simple discharge score feeding tax income. Goal: test whether keeping someone afloat feels engaging, whether the first need becoming self-managed feels good, and whether deciding when to discharge is an interesting choice.

## Open Questions

- Godot (reuse existing sim) or web stack (faster UI iteration)?
- How many residents at once before juggling turns into chores?
- What does the player actually spend clicks *on* beyond needs: events, visits, outings?
- Does the waiting list pressure feel meaningful, or just stressful?
- How does the UI handle the zoom from one apartment to a network of institutions?
