import {
  buildCareLocationProvenance,
  enrichmentSourceLabel,
  mergeCareLocationEnrichment,
  normalizeCareLocationResolution,
} from '@/utils/careLocationEnrichment';

describe('care location enrichment contract', () => {
  it('keeps the parsed-only resolver response backward compatible', () => {
    const result = normalizeCareLocationResolution({
      provider: 'apple_maps',
      sourceUrl: 'https://maps.apple.com/?q=Clinic',
      name: 'Clinic',
      address: null,
      lat: 25.2,
      lng: 55.3,
      confidence: { name: 'high', coordinates: 'high', address: 'unavailable' },
    });

    expect(result.name).toBe('Clinic');
    expect(result.lat).toBe(25.2);
    expect(result.fields.name.source).toBe('maps_url');
    expect(result.fields.name.confidence).toBe(1);
  });

  it('normalizes the enriched field-level response', () => {
    const result = normalizeCareLocationResolution({
      provider: 'google_maps',
      sourceUrl: 'https://www.google.com/maps/place/x',
      originalUrl: 'https://maps.app.goo.gl/shared-link',
      enrichment: {
        parsed: { provider: 'google_maps', sourceUrl: 'https://www.google.com/maps/place/x' },
        candidate: { geoapifyPlaceId: 'geo-1', identityConfidence: 0.91, decision: 'strong_candidate', reasons: ['near_shared_pin'] },
        fields: {
          name: { value: 'Example Hospital', source: 'geoapify_places', sourceId: 'geo-1', confidence: 0.92, status: 'corroborated' },
          address: { value: '1 Example Road', source: 'geoapify_reverse', confidence: 0.8, status: 'normalized' },
          coordinates: { value: { lat: 51.5, lng: -0.1 }, source: 'maps_url', confidence: 1, status: 'extracted' },
          phone: { value: '+44 20 0000 0000', source: 'geoapify_details', confidence: 0.91, status: 'normalized' },
        },
        warnings: ['not_clinically_verified'],
      },
    });

    expect(result.geoapifyPlaceId).toBe('geo-1');
    expect(result.sourceUrl).toBe('https://maps.app.goo.gl/shared-link');
    expect(result.phone).toBe('+44 20 0000 0000');
    expect(result.decision).toBe('strong_candidate');
    expect(enrichmentSourceLabel(result.fields.phone)).toBe('Suggested by Geoapify');
  });

  it('records user corrections without overwriting the original suggestion', () => {
    const resolution = normalizeCareLocationResolution({
      provider: 'apple_maps',
      name: 'Suggested Clinic',
      address: '1 Old Road',
      lat: 1,
      lng: 2,
      fieldProvenance: {
        name: { value: 'Suggested Clinic', source: 'geoapify_places', confidence: 0.9 },
      },
    });
    const provenance = buildCareLocationProvenance(resolution, {
      name: 'Correct Clinic', address: '1 Old Road', lat: 1, lng: 2, phone: '', website: '',
    });

    expect(provenance.fields.name.suggested.value).toBe('Suggested Clinic');
    expect(provenance.fields.name.final.source).toBe('user');
    expect(provenance.fields.name.correctedByUser).toBe(true);
    expect(provenance.fields.coordinates.correctedByUser).toBe(false);
  });

  it('fills missing fields while preserving saved location details', () => {
    const merged = mergeCareLocationEnrichment({
      name: 'My hospital name', address: 'My confirmed address', phone: '', website: '', lat: 25.2, lng: 55.3,
    }, {
      name: 'Provider hospital name', address: 'Provider address', phone: '+971 4 000 0000', website: 'https://hospital.example', lat: 1, lng: 2,
    });

    expect(merged).toEqual({
      name: 'My hospital name', address: 'My confirmed address', phone: '+971 4 000 0000', website: 'https://hospital.example', lat: 25.2, lng: 55.3,
    });
  });

  it('labels preserved values separately from enrichment suggestions', () => {
    const field = { value: 'Provider hospital name', source: 'geoapify_places' };
    expect(enrichmentSourceLabel(field, 'My hospital name')).toBe('Saved value');
    expect(enrichmentSourceLabel(field, 'Provider hospital name')).toBe('Suggested by Geoapify');
  });

  it('normalizes Gemini provenance and grounded attribution aliases', () => {
    const result = normalizeCareLocationResolution({
      enrichment: {
        fields: {
          phone: {
            value: '+1 555 0100',
            source: 'gemini_search',
            source_url: 'https://hospital.example/contact',
            source_title: 'Hospital official contact page',
            evidence_type: 'official_facility',
          },
        },
        groundedResult: {
          grounded_summary: 'The official facility page lists this switchboard number.',
          source_list: [{ source_url: 'https://hospital.example/contact', source_title: 'Official contact page' }],
          search_entry_point: { rendered_content: '<a href="https://www.google.com">About this result</a>' },
        },
      },
    });

    expect(result.fields.phone.sourceId).toBe('https://hospital.example/contact');
    expect(result.fields.phone.sourceUrl).toBe('https://hospital.example/contact');
    expect(result.fields.phone.sourceTitle).toBe('Hospital official contact page');
    expect(result.fields.phone.evidence).toBe('official_facility');
    expect(result.grounding).toEqual(expect.objectContaining({
      summary: 'The official facility page lists this switchboard number.',
      sources: [{ url: 'https://hospital.example/contact', title: 'Official contact page' }],
      searchEntryPointHtml: '<a href="https://www.google.com">About this result</a>',
    }));
    expect(enrichmentSourceLabel(result.fields.phone)).toBe('Suggested by Google Search · official web source');
  });

  it('limits grounded sources to five for review UI', () => {
    const result = normalizeCareLocationResolution({
      fields: { website: { value: 'https://hospital.example', source: 'gemini_search', sourceId: 'https://hospital.example' } },
      grounding: {
        summary: 'Grounded summary',
        sources: [1, 2, 3, 4, 5, 6].map((index) => ({ url: `https://source-${index}.example`, title: `Source ${index}` })),
        searchEntryPointHtml: '<p>Google Search</p>',
      },
    });

    expect(result.grounding.sources).toHaveLength(5);
  });
});
