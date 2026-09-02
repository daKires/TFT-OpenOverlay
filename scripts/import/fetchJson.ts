/** GET JSON com timeout e mensagem de erro clara (usa o fetch nativo do Node 18+). */
export async function fetchJson(url: string, timeoutMs = 90_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'tft-openoverlay-importer' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`falha ao buscar ${url}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}
