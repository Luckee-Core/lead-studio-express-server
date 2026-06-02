/**
 * Convert plain text (with **bold** markdown) to TipTap JSON.
 */

import type { TiptapContent } from './tiptap-types';

type TextNode = { type: 'text'; text: string; marks?: { type: 'bold' }[] };

const parseTextWithBold = (text: string): TextNode[] => {
  const nodes: TextNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        // Replace newlines with line breaks
        const parts = before.split('\n');
        parts.forEach((part, idx) => {
          if (part) nodes.push({ type: 'text', text: part });
          if (idx < parts.length - 1) nodes.push({ type: 'hardBreak' } as any);
        });
      }
    }
    nodes.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex);
    if (rest) {
      // Replace newlines with line breaks
      const parts = rest.split('\n');
      parts.forEach((part, idx) => {
        if (part) nodes.push({ type: 'text', text: part });
        if (idx < parts.length - 1) nodes.push({ type: 'hardBreak' } as any);
      });
    }
  }

  if (nodes.length === 0 && text) nodes.push({ type: 'text', text });
  return nodes;
};

export const textToTiptapContent = (text: string): TiptapContent => {
  const lines = text.split('\n');
  const content: unknown[] = [];
  let currentOrderedList: { type: 'orderedList'; attrs: { start: number }; content: unknown[] } | null = null;
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    
    if (!t) {
      if (currentOrderedList) {
        content.push(currentOrderedList);
        currentOrderedList = null;
      }
      i++;
      continue;
    }

    // Check for numbered list items (e.g., "1. ", "2. ")
    const numberedMatch = t.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const itemText = numberedMatch[2];
      if (!currentOrderedList) {
        currentOrderedList = { type: 'orderedList', attrs: { start: 1 }, content: [] };
      }
      currentOrderedList.content.push({
        type: 'listItem',
        content: [{ type: 'paragraph', content: parseTextWithBold(itemText) }],
      });
      i++;
    } else {
      if (currentOrderedList) {
        content.push(currentOrderedList);
        currentOrderedList = null;
      }
      
      // Check if this line is a bold header and next line is regular text (not a numbered list)
      const isBoldHeader = t.match(/^\*\*(.+)\*\*$/);
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const nextIsNumberedList = nextLine.match(/^\d+\.\s+/);
      
      if (isBoldHeader && nextLine && !nextLine.match(/^\*\*/) && !nextIsNumberedList) {
        // Merge bold header with next line (only if next line is NOT a numbered list)
        const headerText = isBoldHeader[1];
        const mergedText = `**${headerText}**\n${nextLine}`;
        content.push({ type: 'paragraph', content: parseTextWithBold(mergedText) });
        i += 2; // Skip next line since we merged it
      } else {
        content.push({ type: 'paragraph', content: parseTextWithBold(t) });
        i++;
      }
    }
  }

  if (currentOrderedList) content.push(currentOrderedList);

  return { type: 'doc', content };
};
