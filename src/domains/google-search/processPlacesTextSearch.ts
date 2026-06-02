/**
 * Calls Google Places API (New) Text Search using GOOGLE_MAPS_API_KEY from the environment.
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 */

const LOG_PREFIX = '[google-search:places]';

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

/** Max places per request; Google coerces higher values to 20. */
const SEARCH_TEXT_PAGE_SIZE = 20;

/**
 * Google documents a maximum of 60 results across all pages for Text Search (New).
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 */
const SEARCH_TEXT_HARD_CAP = 60;

/** When `maxPlaces` is omitted, keep previous behavior: a single page (up to 20). */
const DEFAULT_MAX_PLACES = SEARCH_TEXT_PAGE_SIZE;

/**
 * `nextPageToken` must be in the field mask to paginate.
 * @see https://developers.google.com/maps/documentation/places/web-service/text-search
 */
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,places.location,nextPageToken';

/** Brief pause before using `pageToken`; token may not be valid immediately after issue. */
const PAGINATION_DELAY_MS = 2000;

export type PlacesTextSearchPlace = {
  placeId: string;
  displayName: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  latitude?: number;
  longitude?: number;
};

type GooglePlaceRaw = {
  id?: string;
  name?: string;
  displayName?: { text?: string } | string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  location?: { latitude?: number; longitude?: number };
};

const displayNameText = (raw: GooglePlaceRaw): string => {
  const d = raw.displayName;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && typeof d.text === 'string') return d.text;
  return '';
};

const placeIdFrom = (raw: GooglePlaceRaw): string => {
  if (raw.id) return raw.id;
  const name = raw.name || '';
  const prefix = 'places/';
  if (name.startsWith(prefix)) return name.slice(prefix.length);
  return name;
};

const mapPlace = (raw: GooglePlaceRaw): PlacesTextSearchPlace | null => {
  const placeId = placeIdFrom(raw);
  const displayName = displayNameText(raw).trim();
  if (!placeId && !displayName) return null;
  const out: PlacesTextSearchPlace = {
    placeId: placeId || displayName,
    displayName: displayName || placeId,
  };
  if (raw.formattedAddress) out.formattedAddress = raw.formattedAddress;
  if (typeof raw.rating === 'number') out.rating = raw.rating;
  if (typeof raw.userRatingCount === 'number') out.userRatingCount = raw.userRatingCount;
  if (raw.websiteUri) out.websiteUri = raw.websiteUri;
  if (raw.googleMapsUri) out.googleMapsUri = raw.googleMapsUri;
  if (raw.nationalPhoneNumber) out.nationalPhoneNumber = raw.nationalPhoneNumber;
  if (raw.location) {
    if (typeof raw.location.latitude === 'number') out.latitude = raw.location.latitude;
    if (typeof raw.location.longitude === 'number') out.longitude = raw.location.longitude;
  }
  return out;
};

export type ProcessPlacesTextSearchInput =
  | { textQuery: string; maxPlaces?: number }
  | { businessName: string; city: string; state: string; maxPlaces?: number };

const buildTextQuery = (input: ProcessPlacesTextSearchInput): string => {
  if ('textQuery' in input && typeof input.textQuery === 'string') {
    return input.textQuery.trim();
  }
  if ('businessName' in input) {
    return [input.businessName.trim(), input.city.trim(), input.state.trim()].filter(Boolean).join(' ');
  }
  return '';
};

const resolveRequestedCap = (input: ProcessPlacesTextSearchInput): number => {
  const raw = input.maxPlaces != null ? Number(input.maxPlaces) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_MAX_PLACES;
  }
  return Math.min(Math.floor(raw), SEARCH_TEXT_HARD_CAP);
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type PageFetchResult =
  | { ok: true; places: PlacesTextSearchPlace[]; nextPageToken?: string }
  | { ok: false; rawError: string };

const fetchPlacesTextSearchPage = async (
  apiKey: string,
  textQuery: string,
  pageToken: string | undefined
): Promise<PageFetchResult> => {
  const body: Record<string, unknown> = {
    textQuery,
    pageSize: SEARCH_TEXT_PAGE_SIZE,
  };
  if (pageToken) {
    body.pageToken = pageToken;
  }

  let response: Response;
  try {
    response = await fetch(PLACES_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} fetch failed`, message);
    return { ok: false, rawError: message };
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error(`${LOG_PREFIX} non-JSON response status=${response.status}`, text.slice(0, 200));
    return { ok: false, rawError: `Places API returned non-JSON (HTTP ${response.status})` };
  }

  if (!response.ok) {
    const errObj = json as { error?: { message?: string; status?: string } };
    const msg = errObj.error?.message || `HTTP ${response.status}`;
    console.warn(`${LOG_PREFIX} error ${msg}`);
    return { ok: false, rawError: msg };
  }

  const data = json as { places?: GooglePlaceRaw[]; nextPageToken?: string };
  const rawPlaces = Array.isArray(data.places) ? data.places : [];
  const places: PlacesTextSearchPlace[] = [];
  for (const p of rawPlaces) {
    const mapped = mapPlace(p);
    if (mapped) places.push(mapped);
  }

  const nextPageToken =
    typeof data.nextPageToken === 'string' && data.nextPageToken.length > 0
      ? data.nextPageToken
      : undefined;

  return { ok: true, places, nextPageToken };
};

/**
 * Text search for places. Uses server env GOOGLE_MAPS_API_KEY.
 * Pass either `textQuery` (e.g. Maps scrape search_query) or businessName + city + state.
 * Optional `maxPlaces` (default 20): fetches additional pages via `nextPageToken` up to min(maxPlaces, 60).
 */
export const processPlacesTextSearch = async (
  input: ProcessPlacesTextSearchInput
): Promise<{ places: PlacesTextSearchPlace[]; rawError?: string }> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    console.warn(`${LOG_PREFIX} GOOGLE_MAPS_API_KEY is not set`);
    return { places: [], rawError: 'GOOGLE_MAPS_API_KEY is not configured on the server' };
  }

  const textQuery = buildTextQuery(input);

  if (!textQuery) {
    return { places: [], rawError: 'Empty query' };
  }

  const requestedCap = resolveRequestedCap(input);
  const startedAt = Date.now();
  console.log(
    `${LOG_PREFIX} textQuery=${JSON.stringify(textQuery)} requestedCap=${requestedCap}`
  );

  const aggregated: PlacesTextSearchPlace[] = [];
  let pageToken: string | undefined;
  let pageIndex = 0;
  const maxPages = Math.ceil(SEARCH_TEXT_HARD_CAP / SEARCH_TEXT_PAGE_SIZE) + 1;

  while (aggregated.length < requestedCap && pageIndex < maxPages) {
    if (pageToken) {
      await sleep(PAGINATION_DELAY_MS);
    }

    const page = await fetchPlacesTextSearchPage(apiKey, textQuery, pageToken);
    pageIndex += 1;

    if (!page.ok) {
      if (aggregated.length === 0) {
        return { places: [], rawError: page.rawError };
      }
      console.warn(`${LOG_PREFIX} page ${pageIndex} failed after partial results: ${page.rawError}`);
      break;
    }

    for (const p of page.places) {
      if (aggregated.length >= requestedCap) break;
      aggregated.push(p);
    }

    pageToken = page.nextPageToken;
    if (!pageToken || aggregated.length >= requestedCap) {
      break;
    }
  }

  console.log(
    `${LOG_PREFIX} ok count=${aggregated.length} pages=${pageIndex} durationMs=${Date.now() - startedAt}`
  );

  return { places: aggregated };
};
