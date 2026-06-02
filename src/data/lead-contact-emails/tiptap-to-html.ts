/**
 * Convert TipTap JSON content to HTML for email sending.
 * Handles paragraphs, bullet lists, bold, italic, underline, highlight, and links.
 */

import type { TiptapContent } from './tiptap-types';

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = {
  type: string;
  content?: Node[];
  text?: string;
  marks?: Mark[];
};

const escapeHtml = (raw: string): string =>
  raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getLinkHref = (marks: Mark[] | undefined): string | null => {
  const link = marks?.find((m) => m.type === 'link');
  const href = link?.attrs && typeof link.attrs.href === 'string' ? link.attrs.href : null;
  return href || null;
};

const renderTextNode = (node: Node): string => {
  if (!node.text) return '';
  const marks = node.marks ?? [];
  let html = escapeHtml(node.text);

  if (marks.some((m) => m.type === 'bold')) html = `<strong>${html}</strong>`;
  if (marks.some((m) => m.type === 'italic')) html = `<em>${html}</em>`;
  if (marks.some((m) => m.type === 'underline')) html = `<u>${html}</u>`;
  if (marks.some((m) => m.type === 'highlight')) html = `<mark style="background-color: #fef08a;">${html}</mark>`;

  const href = getLinkHref(marks);
  if (href) {
    const safeHref = escapeHtml(href);
    html = `<a href="${safeHref}" style="color: #2563eb; text-decoration: underline;">${html}</a>`;
  }

  return html;
};

const renderNode = (node: Node, index: number, siblings: Node[], insideList = false): string => {
  switch (node.type) {
    case 'paragraph': {
      if (!node.content || node.content.length === 0) {
        return ''; // Skip empty paragraphs
      }
      const content = node.content.map((n, i, arr) => renderNode(n, i, arr, insideList)).join('');
      
      // If inside a list item, don't wrap in <p> tags
      if (insideList) {
        return content;
      }
      
      return `<p style="margin: 0 0 1em 0;">${content}</p>`;
    }
    
    case 'orderedList': {
      const items = node.content?.map((n, i, arr) => renderNode(n, i, arr, true)).join('') || '';
      return `<ol style="margin: 0 0 1em 0; padding-left: 20px;">${items}</ol>`;
    }
    
    case 'bulletList': {
      const items = node.content?.map((n, i, arr) => renderNode(n, i, arr, true)).join('') || '';
      return `<ul style="margin: 0 0 1em 0; padding-left: 20px;">${items}</ul>`;
    }
    
    case 'listItem': {
      const content = node.content?.map((n, i, arr) => renderNode(n, i, arr, true)).join('') || '';
      return `<li style="margin: 0 0 0.25em 0;">${content}</li>`;
    }
    
    case 'text': {
      return renderTextNode(node);
    }
    
    case 'heading': {
      const level = (node as Node & { attrs?: { level?: number } }).attrs?.level ?? 1;
      const tag = level >= 1 && level <= 6 ? `h${level}` : 'p';
      const content = node.content?.map((n, i, arr) => renderNode(n, i, arr, insideList)).join('') || '';
      const margin = tag === 'h1' ? '0 0 0.5em 0' : '0 0 0.4em 0';
      return `<${tag} style="margin: ${margin}; font-weight: bold;">${content}</${tag}>`;
    }

    case 'hardBreak': {
      return '<br/>';
    }

    case 'image': {
      // Skip images - don't render them in emails
      return '';
    }
    
    default:
      return node.content?.map((n, i, arr) => renderNode(n, i, arr, insideList)).join('') || '';
  }
};

export const tiptapToHtml = (
  content: TiptapContent | Record<string, unknown>
): string => {
  const doc = content as TiptapContent;
  if (!doc?.content) return '';
  
  const nodes = doc.content as Node[];
  const bodyHtml = nodes.map((node, index) => renderNode(node, index, nodes)).join('');
  
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #333; margin: 0; padding: 0;">
        ${bodyHtml}
      </body>
    </html>
  `.trim();
};
