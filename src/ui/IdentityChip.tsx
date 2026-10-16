import { COLOUR_CSS, identityLabel, type Identity } from '../content/identity';
import { identitiesShown } from '../sim/institution';
import { useGame } from '../store';

/**
 * The identity as one chip. A pair splits the background between its two colours, primary first.
 * Hidden until the player buys the personality upgrade.
 */
export function IdentityChip({ id, tip }: { id: Identity; tip?: string }) {
  const s = useGame();
  if (!identitiesShown(s)) return null;
  const a = COLOUR_CSS[id.primary];
  const b = COLOUR_CSS[id.secondary ?? id.primary];
  return (
    <span class="identity" data-tip={tip} style={{ '--a': a, '--b': b }}>
      {identityLabel(id)}
    </span>
  );
}
