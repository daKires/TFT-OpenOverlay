import { useEffect, useState } from 'react';

// Detecta o runtime Tauri do desktop. No browser este bloco não renderiza nada.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Telinha de configuração da chave do Jev. A chave é guardada num store local
// (tauri-plugin-store) pelo backend Rust; aqui só falamos com ele via invoke.
// Fora do Tauri não há o que configurar, então o componente se auto-esconde.
export function JevSettings() {
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isTauri) return;
    let cancelled = false;
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke<boolean>('has_jev_key'))
      .then((has) => {
        if (!cancelled) setHasKey(has);
      })
      .catch(() => {
        if (!cancelled) setHasKey(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isTauri) return null;

  async function save() {
    const trimmed = key.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_jev_key', { key: trimmed });
      setHasKey(true);
      setKey('');
    } catch {
      // Falha ao gravar: mantém o estado anterior e deixa o usuário tentar de novo.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="jev-settings">
      <div className="jev-settings__head">
        <span className="jev-settings__title">Chave do Jev</span>
        <span
          className={`jev-settings__status ${hasKey ? 'jev-settings__status--on' : 'jev-settings__status--off'}`}
        >
          {hasKey ? 'Chave configurada' : 'Sem chave'}
        </span>
      </div>
      <p className="jev-settings__hint">Cole a chave de API do Jev para ativar a análise híbrida.</p>
      <div className="jev-settings__row">
        <input
          className="jev-settings__input"
          type="password"
          placeholder="Cole aqui a chave do Jev"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="jev-settings__save" onClick={save} disabled={saving || key.trim() === ''}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}