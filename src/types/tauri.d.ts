// Tipos mínimos do runtime Tauri v2 usados nesta camada JS.
//
// O pacote real (@tauri-apps/api) só é necessário pra empacotar o app desktop.
// Como o gate de CI roda apenas JS (typecheck + test) e o toolchain Rust/pacote
// Tauri pode não estar instalado nesse ambiente, declaramos aqui a superfície
// que o nosso código consome via `import('@tauri-apps/api/core')`. Se o pacote
// real estiver presente, as declarações fazem merge (overload) sem conflito.
declare module '@tauri-apps/api/core' {
  export function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}