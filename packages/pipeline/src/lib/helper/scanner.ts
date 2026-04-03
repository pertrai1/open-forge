/**
 * Memory injection scanner — detect and sanitize prompt injection attempts
 * in persistent files (HANDOFF.md, LESSONS.md).
 */

/** Type of injection finding. */
export type ScanFindingType =
  | 'instruction-override'
  | 'invisible-unicode'
  | 'exfiltration';

/** A single finding from the injection scanner. */
export interface ScanFinding {
  /** Category of the finding. */
  readonly type: ScanFindingType;
  /** The regex pattern that matched. */
  readonly pattern: string;
  /** The matched text. */
  readonly match: string;
}

/** Result of scanning content for injection attempts. */
export interface ScanResult {
  /** Whether the content is clean (no findings). */
  readonly clean: boolean;
  /** All findings detected. */
  readonly findings: readonly ScanFinding[];
}

/** Patterns that attempt to override agent instructions. */
const INSTRUCTION_OVERRIDE_PATTERNS: readonly RegExp[] = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /new\s+rule\s*:/i,
  /you\s+must\s+now\b/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|directives|rules)/i,
  /override\s+(?:all\s+)?(?:previous|system)\s+(?:instructions|prompts)/i,
  /from\s+now\s+on\s*,?\s+(?:you|always|never)/i,
];

/** Invisible Unicode code points used for prompt smuggling. */
const INVISIBLE_UNICODE_CODEPOINTS = [
  0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0x2061, 0x2062, 0x2063,
  0x2064, 0xfeff,
];

function codePointToEscape(cp: number): string {
  const HEX_RADIX = 16;
  const UNICODE_ESCAPE_WIDTH = 4;
  return `\\u${cp.toString(HEX_RADIX).padStart(UNICODE_ESCAPE_WIDTH, '0')}`;
}

const INVISIBLE_UNICODE_PATTERN = new RegExp(
  `[${INVISIBLE_UNICODE_CODEPOINTS.map(codePointToEscape).join('')}]`,
  'gu'
);

/** URL pattern for exfiltration detection. */
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

/** Base64 strings longer than 50 characters. */
const BASE64_PATTERN = /[A-Za-z0-9+/]{50,}={0,2}/g;

/**
 * Scan text content for prompt injection patterns.
 * Returns a ScanResult indicating whether threats were detected.
 */
export function scanForInjection(content: string): ScanResult {
  const findings: ScanFinding[] = [];

  for (const pattern of INSTRUCTION_OVERRIDE_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      findings.push({
        type: 'instruction-override',
        pattern: pattern.source,
        match: match[0],
      });
    }
  }

  const invisibleMatches = content.match(INVISIBLE_UNICODE_PATTERN);
  if (invisibleMatches) {
    findings.push({
      type: 'invisible-unicode',
      pattern: INVISIBLE_UNICODE_PATTERN.source,
      match: `${invisibleMatches.length} invisible character(s) found`,
    });
  }

  const urlMatches = content.match(URL_PATTERN);
  if (urlMatches) {
    for (const url of urlMatches) {
      findings.push({
        type: 'exfiltration',
        pattern: URL_PATTERN.source,
        match: url,
      });
    }
  }

  const b64Matches = content.match(BASE64_PATTERN);
  if (b64Matches) {
    for (const b64 of b64Matches) {
      findings.push({
        type: 'exfiltration',
        pattern: BASE64_PATTERN.source,
        match: b64,
      });
    }
  }

  return {
    clean: findings.length === 0,
    findings,
  };
}

/**
 * Remove invisible Unicode characters from text content.
 * Preserves all visible text.
 */
export function sanitizeUnicode(content: string): string {
  return content.replace(INVISIBLE_UNICODE_PATTERN, '');
}
