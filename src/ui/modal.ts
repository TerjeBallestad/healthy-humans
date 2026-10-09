import { signal } from '@preact/signals';
import { act } from '../store';

export type Modal =
  | { kind: 'requests' }
  | { kind: 'hire' }
  | { kind: 'staff'; index: number }
  | { kind: 'patient'; index: number }
  | { kind: 'training'; index: number };

/** The open menu, if any. The game is paused while one is open. */
export const modal = signal<Modal | null>(null);

export function openModal(m: Modal) {
  if (!modal.value)
    act((g) => {
      g.resumeSpeed = g.speed || g.resumeSpeed;
      g.speed = 0;
    });
  modal.value = m;
}

export function closeModal() {
  modal.value = null;
  act((g) => (g.speed = g.resumeSpeed));
}
