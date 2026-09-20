export interface Economy {
  gold?: number;
  level?: number;
  stage?: string;
  hp?: number;
}

interface Props {
  economy: Economy;
  onChange: (economy: Economy) => void;
}

export function BoardContext({ economy, onChange }: Props) {
  return (
    <div className="economy">
      <div className="picker__head">
        <h3>Economia</h3>
        <span className="picker__hint">estado do seu tabuleiro</span>
      </div>
      <div className="economy__grid">
        <label className="economy__field">
          <span className="economy__label">Ouro</span>
          <input
            className="economy__input"
            type="number"
            min={0}
            inputMode="numeric"
            value={economy.gold ?? ''}
            onChange={(e) =>
              onChange({ ...economy, gold: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </label>
        <label className="economy__field">
          <span className="economy__label">Nível</span>
          <input
            className="economy__input"
            type="number"
            min={1}
            max={10}
            inputMode="numeric"
            value={economy.level ?? ''}
            onChange={(e) =>
              onChange({ ...economy, level: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </label>
        <label className="economy__field">
          <span className="economy__label">Estágio</span>
          <input
            className="economy__input"
            type="text"
            placeholder="3-2"
            value={economy.stage ?? ''}
            onChange={(e) => onChange({ ...economy, stage: e.target.value })}
          />
        </label>
        <label className="economy__field">
          <span className="economy__label">HP</span>
          <input
            className="economy__input"
            type="number"
            min={0}
            inputMode="numeric"
            value={economy.hp ?? ''}
            onChange={(e) =>
              onChange({ ...economy, hp: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        </label>
      </div>
    </div>
  );
}
