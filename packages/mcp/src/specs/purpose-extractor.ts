export function extractPurpose(markdown: string): string | null {
  if (!markdown) {
    return null;
  }

  const match = markdown.match(/## Purpose\n\n([^\n]+)/);
  return match ? match[1] : null;
}
