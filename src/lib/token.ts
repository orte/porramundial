/**
 * Genera un token aleatorio URL-safe para que cada porra pueda editarse antes
 * del bloqueo sin necesidad de autenticación.
 */
export function generateEditToken(): string {
  // 32 caracteres alfanuméricos: ~190 bits de entropía, más que suficiente
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
