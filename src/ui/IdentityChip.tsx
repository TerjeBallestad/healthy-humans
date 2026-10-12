import { COLOUR_CSS, identityLabel, type Identity } from '../content/identity';

/** The identity as one chip. A pair splits the background between its two colours, primary first. */
export function IdentityChip({ id }: { id: Identity }) {
  const a = COLOUR_CSS[id.primary];
  const b = COLOUR_CSS[id.secondary ?? id.primary];
  return (
    <span class="identity" style={{ '--a': a, '--b': b }}>
      {identityLabel(id)}
    </span>
  );
}
