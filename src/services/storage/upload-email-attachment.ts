/**
 * Upload email attachment to Supabase Storage
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type UploadEmailAttachmentInput = {
  leadId: string;
  leadContactId: string;
  emailId: string;
  file: Buffer;
  fileName: string;
  contentType: string;
};

export type UploadEmailAttachmentResult = {
  storagePath: string;
  publicUrl: string;
};

/**
 * Sanitize filename for storage - remove Unicode spaces, control chars, and path separators
 */
const sanitizeStorageFilename = (name: string): string => {
  return name
    .replace(/[\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, '_') // Unicode spaces and control chars
    .replace(/[/\\]/g, '_') // Path separators
    .replace(/\s+/g, '_') // Regular spaces
    .trim();
};

export const uploadEmailAttachment = async (
  supabase: SupabaseClient,
  input: UploadEmailAttachmentInput
): Promise<UploadEmailAttachmentResult> => {
  const bucket = 'lead-email-attachments';
  const sanitizedFileName = sanitizeStorageFilename(input.fileName);
  const storagePath = `${input.leadId}/${input.leadContactId}/${input.emailId}/${sanitizedFileName}`;

  const { error } = await supabase.storage.from(bucket).upload(storagePath, input.file, {
    contentType: input.contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { storagePath, publicUrl: urlData.publicUrl };
};
