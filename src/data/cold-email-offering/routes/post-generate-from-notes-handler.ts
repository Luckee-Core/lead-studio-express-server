import type { Request, Response } from 'express';
import { getManagedAnthropicClient } from '../../../services/ai/anthropic-client';
import { processGenerateColdEmailOfferingFromNotes } from '../../../ai/cold-email-offering/generate-from-notes/process-generate-from-notes';

/**
 * POST /api/data/cold-email-offerings/generate-from-notes
 * Body: { source_notes: string }
 */
export const postGenerateFromNotesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawNotes = req.body?.source_notes;
    if (typeof rawNotes !== 'string' || !rawNotes.trim()) {
      res.status(400).json({ success: false, error: 'source_notes is required' });
      return;
    }

    const anthropic = getManagedAnthropicClient();
    if (!anthropic) {
      res.status(503).json({ success: false, error: 'Anthropic client not configured' });
      return;
    }

    const result = await processGenerateColdEmailOfferingFromNotes(anthropic, {
      sourceNotes: rawNotes.trim(),
    });

    if (!result.success || !result.title || !result.hook || !result.description) {
      res.status(400).json({
        success: false,
        error: result.error ?? 'Failed to generate offering',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        title: result.title,
        hook: result.hook,
        description: result.description,
      },
    });
  } catch (error) {
    console.error('❌ POST /cold-email-offerings/generate-from-notes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
