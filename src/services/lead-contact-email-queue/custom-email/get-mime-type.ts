/**
 * Get MIME type from EmailAttachmentType
 */

import type { EmailAttachmentType } from '../../../data/lead-contact-email-attachments/types';

export const getMimeType = (fileType: EmailAttachmentType): string => {
  switch (fileType) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
      return 'image/jpeg';
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
};
