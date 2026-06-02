/**
 * Convert TipTap JSON to plain text.
 */

import type { TiptapContent } from './tiptap-types';

type Node = { type: string; content?: Node[]; text?: string };

const extractText = (nodes: Node[]): string => {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text ?? '';
      if (node.type === 'paragraph' || node.type === 'heading')
        return (node.content ? extractText(node.content) : '') + '\n';
      if (node.type === 'bulletList' || node.type === 'orderedList')
        return node.content ? extractText(node.content) : '';
      if (node.type === 'listItem') {
        const text = node.content ? extractText(node.content) : '';
        return '- ' + text.trim() + '\n';
      }
      if (node.type === 'hardBreak') return '\n';
      if (node.content) return extractText(node.content);
      return '';
    })
    .join('');
};

export const tiptapToPlainText = (content: TiptapContent | Record<string, unknown>): string => {
  const doc = content as TiptapContent;
  if (!doc?.content) return '';
  return extractText(doc.content as Node[]).trim();
};
