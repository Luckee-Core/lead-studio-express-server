/**
 * Build a RFC 2822 MIME message for Gmail API (From, To, Subject, text, html, attachments).
 * Uses multipart/alternative for text+html and multipart/mixed when attachments exist.
 */

export type MimeAttachment = {
  content: string; // base64
  filename: string;
  type: string;
};

export type BuildMimeMessageParams = {
  from: string; // "Name <email@domain.com>"
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: MimeAttachment[];
};

const boundary = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Encode a string for use in MIME headers (e.g. Subject, From display name).
 * Uses UTF-8 and base64 where needed for non-ASCII.
 */
const encodeHeaderValue = (value: string): string => {
  if (!/[^\x00-\x7f]/.test(value)) {
    return value;
  }
  const encoded = Buffer.from(value, 'utf8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
};

/**
 * Build raw MIME message string suitable for Gmail API users.messages.send (raw base64url).
 */
export const buildMimeMessage = (params: BuildMimeMessageParams): string => {
  const { from, to, subject, text, html, attachments = [] } = params;

  const safeSubject = subject.replace(/\r?\n/g, ' ');
  const subjectHeader = `Subject: ${encodeHeaderValue(safeSubject)}`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    subjectHeader,
    'MIME-Version: 1.0',
  ];

  if (attachments.length === 0) {
    lines.push('Content-Type: multipart/alternative; boundary="alt"', '', '--alt', 'Content-Type: text/plain; charset=UTF-8', '', text, '--alt', 'Content-Type: text/html; charset=UTF-8', '', html, '--alt--');
    return lines.join('\r\n');
  }

  const mixedBoundary = boundary('mixed');
  lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`, '');

  // First part: body as multipart/alternative
  lines.push(`--${mixedBoundary}`, 'Content-Type: multipart/alternative; boundary="alt"', '', '--alt', 'Content-Type: text/plain; charset=UTF-8', '', text, '--alt', 'Content-Type: text/html; charset=UTF-8', '', html, '--alt--');

  const wrapBase64 = (raw: string): string => {
    const clean = raw.replace(/\s/g, '');
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += 76) {
      chunks.push(clean.slice(i, i + 76));
    }
    return chunks.join('\r\n');
  };

  for (const att of attachments) {
    lines.push(
      `--${mixedBoundary}`,
      `Content-Type: ${att.type}; name="${att.filename.replace(/"/g, '\\"')}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${att.filename.replace(/"/g, '\\"')}"`,
      '',
      wrapBase64(att.content)
    );
  }

  lines.push(`--${mixedBoundary}--`);
  return lines.join('\r\n');
};
