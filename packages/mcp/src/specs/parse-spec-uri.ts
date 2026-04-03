export function parseSpecUri(uri: string): string | null {
  const match = uri.match(/^spec:\/\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const name = match[1];

  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return null;
  }

  return name;
}
