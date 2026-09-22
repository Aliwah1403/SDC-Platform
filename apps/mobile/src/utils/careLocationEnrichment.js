const FIELD_NAMES = ['name', 'address', 'coordinates', 'phone', 'website', 'categories'];

const CONFIDENCE_VALUES = Object.freeze({
  high: 1,
  medium: 0.75,
  low: 0.5,
  unavailable: null,
});

function numericConfidence(value) {
  if (Number.isFinite(value)) return Math.max(0, Math.min(1, value));
  return CONFIDENCE_VALUES[value] ?? null;
}

function legacyField(value, confidence, observedAt) {
  return {
    value: value ?? null,
    source: 'maps_url',
    sourceId: null,
    sourceUrl: null,
    sourceTitle: null,
    evidence: null,
    evidenceType: null,
    observedAt,
    confidence: numericConfidence(confidence),
    status: 'extracted',
  };
}

function stringValue(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || null;
}

function definedValue(...values) {
  return values.find((value) => value !== undefined && value !== null) ?? null;
}

function normalizeGrounding(value) {
  if (!value || typeof value !== 'object') return null;
  const searchEntryPoint = value.searchEntryPoint || value.search_entry_point || {};
  const rawSources = value.sources || value.sourceList || value.source_list || value.groundingSources || [];
  const sources = (Array.isArray(rawSources) ? rawSources : [])
    .map((source) => {
      if (typeof source === 'string') return { url: source, title: null };
      if (!source || typeof source !== 'object') return null;
      const url = stringValue(source.url, source.sourceUrl, source.source_url, source.uri);
      if (!url) return null;
      return {
        url,
        title: stringValue(source.title, source.sourceTitle, source.source_title, source.name),
      };
    })
    .filter(Boolean)
    .slice(0, 5);
  const searchEntryPointHtml = stringValue(
    value.searchEntryPointHtml,
    value.search_entry_point_html,
    value.searchEntryPointHTML,
    searchEntryPoint.renderedContent,
    searchEntryPoint.rendered_content,
    searchEntryPoint.html,
  );
  return {
    ...value,
    summary: stringValue(value.summary, value.groundedSummary, value.grounded_summary, value.text),
    sources,
    searchEntryPointHtml,
  };
}

function normalizeField(field, fallback, observedAt) {
  if (!field || typeof field !== 'object' || !Object.prototype.hasOwnProperty.call(field, 'value')) {
    return fallback;
  }
  return {
    value: field.value ?? null,
    source: typeof field.source === 'string' ? field.source : fallback.source,
    sourceId: stringValue(field.sourceId, field.source_id) ||
      (typeof field.source === 'string' && field.source === 'gemini_search'
        ? stringValue(field.sourceUrl, field.source_url)
        : null),
    sourceUrl: stringValue(field.sourceUrl, field.source_url),
    sourceTitle: stringValue(field.sourceTitle, field.source_title, field.title),
    evidence: definedValue(field.evidence, field.evidence_type, field.evidenceType),
    evidenceType: stringValue(field.evidenceType, field.evidence_type),
    observedAt: typeof field.observedAt === 'string' ? field.observedAt : observedAt,
    confidence: numericConfidence(field.confidence),
    status: typeof field.status === 'string' ? field.status : 'extracted',
  };
}

export function normalizeCareLocationResolution(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid care location response');
  const observedAt = new Date().toISOString();
  const enrichment = data.enrichment?.fields ? data.enrichment : data;
  const parsed = enrichment.parsed || data.parsed || data;
  const grounding = normalizeGrounding(
    enrichment.grounding || enrichment.groundedResult || enrichment.groundingMetadata ||
    data.grounding || data.groundedResult || data.groundingMetadata,
  );
  const attribution = normalizeGrounding(enrichment.attribution || data.attribution);
  const legacyCoordinates = Number.isFinite(data.lat) && Number.isFinite(data.lng)
    ? { lat: data.lat, lng: data.lng }
    : null;
  const fallbacks = {
    name: legacyField(data.name, data.confidence?.name, observedAt),
    address: legacyField(data.address, data.confidence?.address, observedAt),
    coordinates: legacyField(legacyCoordinates, data.confidence?.coordinates, observedAt),
    phone: legacyField(data.phone, data.confidence?.phone, observedAt),
    website: legacyField(data.website, data.confidence?.website, observedAt),
    categories: legacyField(data.categories || [], data.confidence?.categories, observedAt),
  };
  const responseFields = enrichment.fields || data.fields || data.fieldProvenance || {};
  const fields = Object.fromEntries(
    FIELD_NAMES.map((name) => [name, normalizeField(responseFields[name], fallbacks[name], observedAt)]),
  );
  const coordinates = fields.coordinates.value;

  return {
    provider: parsed.provider || data.provider || null,
    sourceUrl: data.originalUrl || parsed.originalUrl || parsed.sourceUrl || data.sourceUrl || null,
    originalUrl: parsed.originalUrl || data.originalUrl || parsed.sourceUrl || data.sourceUrl || null,
    providerPlaceId: parsed.providerPlaceId || data.providerPlaceId || null,
    name: typeof fields.name.value === 'string' ? fields.name.value : '',
    address: typeof fields.address.value === 'string' ? fields.address.value : '',
    lat: Number.isFinite(coordinates?.lat) ? coordinates.lat : null,
    lng: Number.isFinite(coordinates?.lng) ? coordinates.lng : null,
    phone: typeof fields.phone.value === 'string' ? fields.phone.value : '',
    website: typeof fields.website.value === 'string' ? fields.website.value : '',
    categories: Array.isArray(fields.categories.value) ? fields.categories.value : [],
    geoapifyPlaceId: enrichment.candidate?.geoapifyPlaceId || data.geoapifyPlaceId || null,
    identityConfidence: numericConfidence(enrichment.candidate?.identityConfidence ?? data.identityConfidence),
    decision: enrichment.candidate?.decision || data.decision || null,
    reasons: Array.isArray(enrichment.candidate?.reasons) ? enrichment.candidate.reasons : [],
    warnings: Array.isArray(enrichment.warnings) ? enrichment.warnings : [],
    lookupStages: Array.isArray(enrichment.lookupStages) ? enrichment.lookupStages : [],
    grounding,
    attribution,
    fields,
  };
}

function comparable(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value ?? null;
}

export function mergeCareLocationEnrichment(current, resolution) {
  const hasCurrentCoordinates = Number.isFinite(current?.lat) && Number.isFinite(current?.lng);
  return {
    name: current?.name?.trim() ? current.name : (resolution?.name || ''),
    address: current?.address?.trim() ? current.address : (resolution?.address || ''),
    phone: current?.phone?.trim() ? current.phone : (resolution?.phone || ''),
    website: current?.website?.trim() ? current.website : (resolution?.website || ''),
    lat: hasCurrentCoordinates ? current.lat : (resolution?.lat ?? null),
    lng: hasCurrentCoordinates ? current.lng : (resolution?.lng ?? null),
  };
}

export function buildCareLocationProvenance(resolution, finalValues) {
  if (!resolution?.fields) return null;
  const finalByField = {
    name: finalValues.name?.trim() || null,
    address: finalValues.address?.trim() || null,
    coordinates: Number.isFinite(finalValues.lat) && Number.isFinite(finalValues.lng)
      ? { lat: finalValues.lat, lng: finalValues.lng }
      : null,
    phone: finalValues.phone?.trim() || null,
    website: finalValues.website?.trim() || null,
    categories: resolution.categories || [],
  };
  const fields = {};
  for (const name of FIELD_NAMES) {
    const suggested = resolution.fields[name];
    const finalValue = finalByField[name];
    const changed = comparable(suggested?.value) !== comparable(finalValue);
    fields[name] = {
      suggested: {
        source: suggested?.source || 'maps_url',
        sourceId: suggested?.sourceId || null,
        sourceUrl: suggested?.sourceUrl || null,
        sourceTitle: suggested?.sourceTitle || null,
        evidence: suggested?.evidence || null,
        evidenceType: suggested?.evidenceType || null,
        observedAt: suggested?.observedAt || null,
        confidence: numericConfidence(suggested?.confidence),
        status: suggested?.status || 'extracted',
        value: suggested?.value ?? null,
      },
      final: {
        source: changed ? 'user' : (suggested?.source || 'user'),
        confidence: changed ? null : numericConfidence(suggested?.confidence),
        status: 'user_confirmed',
      },
      correctedByUser: changed,
    };
  }
  return {
    version: 1,
    candidate: {
      geoapifyPlaceId: resolution.geoapifyPlaceId || null,
      identityConfidence: numericConfidence(resolution.identityConfidence),
      decision: resolution.decision || null,
      reasons: resolution.reasons || [],
    },
    fields,
    warnings: resolution.warnings || [],
    confirmedAt: new Date().toISOString(),
  };
}

export function enrichmentSourceLabel(field, currentValue) {
  if (!field?.value) return null;
  if (arguments.length > 1 && comparable(field.value) !== comparable(currentValue)) return 'Saved value';
  if (field.source?.startsWith('geoapify')) return 'Suggested by Geoapify';
  if (field.source === 'gemini_search') return 'Suggested by Google Search · official web source';
  if (field.source === 'maps_url') return 'From the shared Maps link';
  if (field.source === 'user') return 'Entered by you';
  return null;
}
