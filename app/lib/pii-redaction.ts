import { createHmac } from 'crypto';

/**
 * PII Redaction Utilities
 * 
 * Provides safe logging functions that redact or hash personally identifiable information
 * to prevent exposure in logs while maintaining traceability through deterministic hashing.
 */

/**
 * Get the secret key for HMAC hashing of PII
 * Uses PII_HASH_SECRET if available, otherwise falls back to SESSION_SECRET or CLERK_SECRET_KEY
 */
function getPiiHashSecret(): string {
  const secret = 
    process.env.PII_HASH_SECRET || 
    process.env.SESSION_SECRET || 
    process.env.CLERK_SECRET_KEY;
  
  if (!secret) {
    console.warn('⚠️  No PII hash secret found - using fallback. Set PII_HASH_SECRET for production.');
    // Fallback to a default (not ideal for production, but better than nothing)
    return 'pii-redaction-fallback-secret-change-in-production';
  }
  
  return secret;
}

/**
 * Redacts the local part of an email address, keeping only the domain
 * Example: "user@example.com" -> "****@example.com"
 * 
 * @param email The email address to redact
 * @returns Redacted email with local part replaced by ****
 */
export function redactEmailLocalPart(email: string): string {
  if (!email || typeof email !== 'string') {
    return '****@****';
  }
  
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    // Not a valid email format, return redacted
    return '****@****';
  }
  
  const domain = email.substring(atIndex);
  return `****${domain}`;
}

/**
 * Creates a deterministic HMAC hash of an email address
 * This allows tracking the same email across logs without exposing the actual address
 * 
 * @param email The email address to hash
 * @returns Base64-encoded HMAC-SHA256 hash (first 16 chars for brevity)
 */
export function hashEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'hash:invalid';
  }
  
  const secret = getPiiHashSecret();
  const hash = createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('base64');
  
  // Return first 16 characters for brevity in logs
  return `hash:${hash.substring(0, 16)}`;
}

/**
 * Sanitizes a subject line by trimming and optionally hashing
 * Removes leading/trailing whitespace and limits length
 * 
 * @param subject The email subject to sanitize
 * @param maxLength Maximum length for the sanitized subject (default: 50)
 * @returns Sanitized subject or its hash if too long
 */
export function sanitizeSubject(subject: string, maxLength: number = 50): string {
  if (!subject || typeof subject !== 'string') {
    return '[no subject]';
  }
  
  const trimmed = subject.trim();
  
  if (trimmed.length === 0) {
    return '[empty subject]';
  }
  
  // If subject is short enough, return it as-is (subjects are generally safe to log)
  // But truncate if too long
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  // For long subjects, return truncated version with hash
  const truncated = trimmed.substring(0, maxLength);
  const secret = getPiiHashSecret();
  const hash = createHmac('sha256', secret)
    .update(trimmed)
    .digest('base64')
    .substring(0, 8);
  
  return `${truncated}... [hash:${hash}]`;
}

/**
 * Creates a safe logging object for email webhook data
 * Redacts email addresses and sanitizes subject lines
 * 
 * @param data Object containing to, from, and subject fields
 * @param options Options for redaction behavior
 * @returns Safe object with redacted/hashed values suitable for logging
 */
export function createSafeEmailLog(
  data: { to?: string | null; from?: string | null; subject?: string | null },
  options: {
    emailMode?: 'redact' | 'hash' | 'domain-only';
    subjectMode?: 'sanitize' | 'hash';
  } = {}
): { to: string; from: string; subject: string } {
  const { emailMode = 'redact', subjectMode = 'sanitize' } = options;
  
  let toSafe: string;
  let fromSafe: string;
  
  if (emailMode === 'hash') {
    toSafe = data.to ? hashEmail(data.to) : 'hash:missing';
    fromSafe = data.from ? hashEmail(data.from) : 'hash:missing';
  } else if (emailMode === 'domain-only') {
    toSafe = data.to ? extractDomain(data.to) : 'domain:missing';
    fromSafe = data.from ? extractDomain(data.from) : 'domain:missing';
  } else {
    // Default: redact local part
    toSafe = data.to ? redactEmailLocalPart(data.to) : '****@****';
    fromSafe = data.from ? redactEmailLocalPart(data.from) : '****@****';
  }
  
  const subjectSafe = 
    subjectMode === 'hash' 
      ? (data.subject ? hashEmail(data.subject) : 'hash:missing')
      : sanitizeSubject(data.subject || '');
  
  return {
    to: toSafe,
    from: fromSafe,
    subject: subjectSafe,
  };
}

/**
 * Extracts the domain part from an email address
 * Example: "user@example.com" -> "example.com"
 * 
 * @param email The email address
 * @returns The domain part or "unknown" if invalid
 */
function extractDomain(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'unknown';
  }
  
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return 'invalid';
  }
  
  return email.substring(atIndex + 1);
}


