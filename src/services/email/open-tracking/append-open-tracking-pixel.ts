import { getOpenTrackingBaseUrl } from './get-open-tracking-base-url';

/**
 * Append a 1×1 tracking image to HTML when base URL and token are set.
 */
export const appendOpenTrackingPixel = (
  html: string,
  openTrackingToken: string | null | undefined
): string => {
  const baseUrl = getOpenTrackingBaseUrl();
  if (!baseUrl || !openTrackingToken) {
    return html;
  }

  const pixelUrl = `${baseUrl}/api/email/open?t=${encodeURIComponent(openTrackingToken)}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }

  return `${html}${pixel}`;
};
