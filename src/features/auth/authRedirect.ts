const errorParameters = ["error", "error_code", "error_description"];

export function callbackHasError(search: string, hash: string): boolean {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return errorParameters.some(key => query.has(key) || fragment.has(key));
}

export function callbackUrl(origin: string, base: string): string {
  return new URL("auth/callback", new URL(base, origin)).href;
}
