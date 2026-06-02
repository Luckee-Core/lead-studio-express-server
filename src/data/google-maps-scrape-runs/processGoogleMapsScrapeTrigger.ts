/**
 * Runs Google Places API (New) Text Search for the scrape run's search_query (no n8n).
 * Creates one lead per place when the display name does not match an existing lead
 * `name` / `business_name` (trimmed, case-insensitive). Skips duplicates and still
 * uses idempotency_key per scrape run + place id when inserting.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { processPlacesTextSearch } from '../../domains/google-search/processPlacesTextSearch';
import { createLead } from '../leads/create';
import { getAllLeads } from '../leads/get-all';
import { getGoogleMapsScrapeRunById } from './get-by-id';
import { updateGoogleMapsScrapeRun } from './update';
import type { GoogleMapsScrapeRunRow } from './get-all';

export type GoogleMapsScrapeNameDuplicate = {
  googleMapsDisplayName: string;
  existingLeadId: string;
  existingLeadName: string;
};

export type GoogleMapsScrapeTriggerResult = {
  scrapeRun: GoogleMapsScrapeRunRow;
  businessesScraped: number;
  leadsCreated: number;
  leadsSkippedDuplicateName: number;
  nameDuplicates: GoogleMapsScrapeNameDuplicate[];
  durationMs: number;
};

/** Trim + lowercase for a single business-name equality check (1:1). */
const normalizeLeadNameKey = (value: string): string => value.trim().toLowerCase();

type ExistingNameHit = { leadId: string; matchedName: string };

const buildExistingNameLookup = (
  leads: Awaited<ReturnType<typeof getAllLeads>>
): Map<string, ExistingNameHit> => {
  const map = new Map<string, ExistingNameHit>();
  for (const lead of leads) {
    const pairs: { key: string; label: string }[] = [];
    const bn = lead.business_name?.trim();
    const nm = lead.name?.trim();
    if (bn) {
      const key = normalizeLeadNameKey(bn);
      if (key) pairs.push({ key, label: bn });
    }
    if (nm) {
      const key = normalizeLeadNameKey(nm);
      if (key && !pairs.some((p) => p.key === key)) {
        pairs.push({ key, label: nm });
      }
    }
    for (const p of pairs) {
      if (!map.has(p.key)) {
        map.set(p.key, { leadId: lead.id, matchedName: p.label });
      }
    }
  }
  return map;
};

/**
 * Places Text Search → optional lead rows. Requires GOOGLE_MAPS_API_KEY (not n8n).
 */
export const processGoogleMapsScrapeTrigger = async (
  supabase: SupabaseClient,
  scrapeRunId: string
): Promise<GoogleMapsScrapeTriggerResult> => {
  const started = Date.now();

  const run = await getGoogleMapsScrapeRunById(supabase, scrapeRunId);
  if (!run) {
    throw new Error(`Google Maps scrape run not found: ${scrapeRunId}`);
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    const msg = 'GOOGLE_MAPS_API_KEY is not configured (Places API)';
    console.error(`❌ ${msg}`);
    const failed = await updateGoogleMapsScrapeRun(supabase, scrapeRunId, {
      status: 'failed',
      error: msg,
      completed_at: new Date().toISOString(),
      duration: Math.round(Date.now() - started),
    });
    return {
      scrapeRun: failed,
      businessesScraped: 0,
      leadsCreated: 0,
      leadsSkippedDuplicateName: 0,
      nameDuplicates: [],
      durationMs: Date.now() - started,
    };
  }

  const textQuery = run.search_query?.trim() || '';
  if (!textQuery) {
    const failed = await updateGoogleMapsScrapeRun(supabase, scrapeRunId, {
      status: 'failed',
      error: 'search_query is empty',
      completed_at: new Date().toISOString(),
      duration: Math.round(Date.now() - started),
    });
    return {
      scrapeRun: failed,
      businessesScraped: 0,
      leadsCreated: 0,
      leadsSkippedDuplicateName: 0,
      nameDuplicates: [],
      durationMs: Date.now() - started,
    };
  }

  console.log('🗺️ Google Maps scrape (Places API):', {
    scrapeRunId: run.id,
    textQueryPreview: textQuery.slice(0, 120),
  });

  const maxPlaces =
    run.max_results != null && Number(run.max_results) > 0
      ? Number(run.max_results)
      : undefined;

  const { places, rawError } = await processPlacesTextSearch({
    textQuery,
    maxPlaces,
  });

  if (rawError) {
    console.error('❌ Places text search failed:', rawError);
    const failed = await updateGoogleMapsScrapeRun(supabase, scrapeRunId, {
      status: 'failed',
      error: rawError,
      completed_at: new Date().toISOString(),
      duration: Math.round(Date.now() - started),
    });
    return {
      scrapeRun: failed,
      businessesScraped: 0,
      leadsCreated: 0,
      leadsSkippedDuplicateName: 0,
      nameDuplicates: [],
      durationMs: Date.now() - started,
    };
  }

  const max =
    run.max_results != null && Number(run.max_results) > 0
      ? Number(run.max_results)
      : places.length;
  const limited = places.slice(0, Math.min(max, places.length));

  const existingLeads = await getAllLeads(supabase);
  const existingByNameKey = buildExistingNameLookup(existingLeads);

  const nameDuplicates: GoogleMapsScrapeNameDuplicate[] = [];
  let leadsSkippedDuplicateName = 0;
  let leadsCreated = 0;

  for (const p of limited) {
    const nameKey = normalizeLeadNameKey(p.displayName);
    if (nameKey) {
      const hit = existingByNameKey.get(nameKey);
      if (hit) {
        leadsSkippedDuplicateName += 1;
        nameDuplicates.push({
          googleMapsDisplayName: p.displayName,
          existingLeadId: hit.leadId,
          existingLeadName: hit.matchedName,
        });
        continue;
      }
    }

    const idempotencyKey = `gmaps-places:${run.id}:${p.placeId}`.slice(0, 255);
    const notesParts = [
      `Source: Google Places API (scrape run ${run.id})`,
      p.googleMapsUri ? `Maps: ${p.googleMapsUri}` : null,
    ].filter(Boolean);
    try {
      const created = await createLead(supabase, {
        name: p.displayName,
        business_name: p.displayName,
        address: p.formattedAddress,
        website: p.websiteUri,
        business_phone: p.nationalPhoneNumber,
        phone: p.nationalPhoneNumber ?? undefined,
        notes: notesParts.join('\n'),
        idempotency_key: idempotencyKey,
      });
      leadsCreated += 1;
      if (nameKey) {
        existingByNameKey.set(nameKey, {
          leadId: created.id,
          matchedName: p.displayName.trim(),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/duplicate|unique|idempotency/i.test(message)) {
        continue;
      }
      console.warn('⚠️ Lead create skipped:', message);
    }
  }

  const businessesScraped = limited.length;

  const updated = await updateGoogleMapsScrapeRun(supabase, scrapeRunId, {
    status: 'completed',
    results_count: businessesScraped,
    businesses_imported: leadsCreated,
    completed_at: new Date().toISOString(),
    duration: Math.round(Date.now() - started),
    error: null,
  });

  console.log('✅ Places scrape completed:', {
    scrapeRunId,
    businessesScraped,
    leadsCreated,
    leadsSkippedDuplicateName,
    durationMs: Date.now() - started,
  });

  return {
    scrapeRun: updated,
    businessesScraped,
    leadsCreated,
    leadsSkippedDuplicateName,
    nameDuplicates,
    durationMs: Date.now() - started,
  };
};
