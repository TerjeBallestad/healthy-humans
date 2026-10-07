export type UpgradeId = 'rota' | 'coffee' | 'calendar' | 'course';

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  /** One dry line under the name. */
  note: string;
  cost: number;
  /** Added to the omsorg cap. */
  capAdd?: number;
  /** Multiplies the omsorg rate. */
  rateMult?: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'rota',
    label: 'Extra hours in the rota',
    note: 'Someone agreed to stay until eight.',
    cost: 300,
    capAdd: 20,
  },
  {
    id: 'coffee',
    label: 'A better coffee machine',
    note: 'Approved after the third request.',
    cost: 500,
    rateMult: 1.25,
  },
  {
    id: 'calendar',
    label: 'Shared calendar',
    note: 'Nobody books the same room twice.',
    cost: 700,
    capAdd: 20,
  },
  {
    id: 'course',
    label: 'Course in motivational interviewing',
    note: 'Two days at a hotel in Lillestrøm.',
    cost: 1100,
    rateMult: 1.3,
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export const STAFF_NAMES = ['Kari', 'Jonas', 'Mette', 'Ali', 'Sigrid', 'Tore'];
