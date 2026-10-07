import type { NeedId } from './needs';

export type ActivityId =
  | 'eat'
  | 'shower'
  | 'sleep'
  | 'dishes'
  | 'laundry'
  | 'tidy'
  | 'groceries'
  | 'walk'
  | 'call';

export interface ActivityDef {
  id: ActivityId;
  /** Position on the ladder, starting at 1. */
  rung: number;
  label: string;
  /** Short noun for the "handles alone" list. */
  noun: string;
  /** Game minutes the activity takes. */
  duration: number;
  /** Total points added to each need over the duration. */
  refills: Partial<Record<NeedId, number>>;
  /** When automatic, the resident starts it when this need drops low. */
  trigger: NeedId;
  /** Status line while the resident does it. */
  doing: string;
  /** Log line when done. */
  done: string;
  /** Log line when the rung first appears. */
  appears: string;
  /** Log line when it becomes automatic. */
  independent: string;
}

export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'eat',
    rung: 1,
    label: 'Eat',
    noun: 'eating',
    duration: 30,
    refills: { food: 45 },
    trigger: 'food',
    doing: 'Eating something from the freezer.',
    done: 'Ate.',
    appears: 'The fridge has a jar of mustard and not much else.',
    independent: 'Made breakfast. Nobody asked.',
  },
  {
    id: 'shower',
    rung: 2,
    label: 'Shower',
    noun: 'showering',
    duration: 20,
    refills: { hygiene: 70 },
    trigger: 'hygiene',
    doing: 'In the shower.',
    done: 'Showered.',
    appears: 'The bathroom smells of old towels.',
    independent: 'Showered and put on a clean shirt.',
  },
  {
    id: 'sleep',
    rung: 3,
    label: 'Sleep',
    noun: 'sleeping',
    duration: 8 * 60,
    refills: { energy: 90 },
    trigger: 'energy',
    doing: 'Asleep.',
    done: 'Woke up.',
    appears: 'Awake at four in the morning again, scrolling.',
    independent: 'Slept without the phone in bed.',
  },
  {
    id: 'dishes',
    rung: 4,
    label: 'Do the dishes',
    noun: 'dishes',
    duration: 40,
    refills: { home: 35 },
    trigger: 'home',
    doing: 'At the sink, sleeves rolled up.',
    done: 'Did the dishes.',
    appears: 'Every cup in the flat is in the sink.',
    independent: 'Washed the cup right after using it.',
  },
  {
    id: 'laundry',
    rung: 5,
    label: 'Laundry',
    noun: 'laundry',
    duration: 90,
    refills: { home: 20, hygiene: 25 },
    trigger: 'hygiene',
    doing: 'Waiting for the washing machine.',
    done: 'Hung up the laundry.',
    appears: 'The laundry basket became a laundry pile.',
    independent: 'Clean towels in the cupboard.',
  },
  {
    id: 'tidy',
    rung: 6,
    label: 'Tidy the room',
    noun: 'tidying',
    duration: 60,
    refills: { home: 50 },
    trigger: 'home',
    doing: 'Picking things up off the floor.',
    done: 'Tidied the room.',
    appears: 'You can no longer see the floor.',
    independent: 'Opened the curtains and tidied up.',
  },
  {
    id: 'groceries',
    rung: 7,
    label: 'Buy groceries',
    noun: 'groceries',
    duration: 60,
    refills: { food: 60 },
    trigger: 'food',
    doing: 'At the shop. Holding the list.',
    done: 'Came home with two bags.',
    appears: 'The freezer is empty.',
    independent: 'Went to the shop. Said hello to the cashier.',
  },
  {
    id: 'walk',
    rung: 8,
    label: 'Go for a walk',
    noun: 'walks',
    duration: 45,
    refills: { social: 20, energy: 10 },
    trigger: 'social',
    doing: 'Walking around the block.',
    done: 'Came back from a walk.',
    appears: 'Watching people outside from behind the curtain.',
    independent: 'Took the long way home.',
  },
  {
    id: 'call',
    rung: 9,
    label: 'Call someone',
    noun: 'phone calls',
    duration: 20,
    refills: { social: 40 },
    trigger: 'social',
    doing: 'On the phone with family.',
    done: 'Hung up. Sat for a while.',
    appears: 'Nine missed calls from family.',
    independent: 'Called home. Just to talk.',
  },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a])) as Record<
  ActivityId,
  ActivityDef
>;
