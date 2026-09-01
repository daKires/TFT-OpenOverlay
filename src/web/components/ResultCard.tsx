import { championName, componentName, type CompSuggestion, type CompTier } from '../../core/index';

const TIER_CLASS: Record<CompTier, string> = {
  S: 'tier-s',
  A: 'tier-a',
  B: 'tier-b',
  C: 'tier-c',
  D: 'tier-d',
};

interface Props {
  suggestion: CompSuggestion;
  rank: number;
}

export function ResultCard({ suggestion, rank }: Props) {
  const { comp, breakdown, why } = suggestion;
  const matched = new Set(why.matchedUnits);
  const pct = (x: number) => Math.round(x * 100);

  return (
    <article className={`card ${suggestion.isTopPick ? 'card--top' : ''}`}>
      <div className="card__head">
        <div className="rank">#{rank}</div>
        <div className="card__title">
          <h3>{comp.name}</h3>
          <div className="card__meta">
            {comp.tier && <span className={`tier ${TIER_CLASS[comp.tier]}`}>{comp.tier}</span>}
            {comp.avgPlacement != null && <span className="avg">colocação média {comp.avgPlacement.toFixed(1)}</span>}
          </div>
        </div>
        <div className="fit">
          <div className="fit__num">{pct(breakdown.fit)}%</div>
          <div className="fit__label">encaixe</div>
        </div>
      </div>

      <div className="bars">
        <Bar label="unidades" value={breakdown.unitOverlap} />
        <Bar label="itens" value={breakdown.itemBuildability} />
      </div>

      <div className="roster">
        {comp.units.map((u) => (
          <span
            key={u.championId}
            className={`u ${matched.has(u.championId) ? 'u--have' : 'u--miss'} ${u.role === 'carry' ? 'u--carry' : ''}`}
          >
            {u.role === 'carry' ? '★ ' : ''}
            {championName(u.championId)}
          </span>
        ))}
      </div>

      {why.carryItems.length > 0 && (
        <ul className="items">
          {why.carryItems.map((it) => (
            <li key={it.itemId} className={`item item--${it.status}`}>
              <span className="item__dot" />
              <span className="item__name">{it.itemName}</span>
              <span className="item__status">
                {it.status === 'complete' && 'montável agora'}
                {it.status === 'one-away' && `falta ${it.missing.map(componentName).join(', ')}`}
                {it.status === 'far' && `precisa de ${it.missing.map(componentName).join(' + ')}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar">
      <span className="bar__label">{label}</span>
      <span className="bar__track">
        <span className="bar__fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="bar__pct">{Math.round(value * 100)}%</span>
    </div>
  );
}
