import { isCareLocationShareImport, mapsProviderForUrl, selectCareLocationMapsUrl } from '@/utils/careLocationShare';

describe('care location share URL selection', () => {
  it('selects the first supported HTTPS URL embedded in text', () => {
    expect(selectCareLocationMapsUrl('Here is the clinic: https://example.com then https://maps.apple.com/?q=Clinic.')).toBe('https://maps.apple.com/?q=Clinic');
  });

  it('accepts Google short links and resolved payload values', () => {
    expect(selectCareLocationMapsUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(selectCareLocationMapsUrl('not supported', 'https://www.google.com/maps?q=Clinic')).toBe('https://www.google.com/maps?q=Clinic');
  });

  it('rejects non-HTTPS and unsupported URLs', () => {
    expect(mapsProviderForUrl('http://maps.apple.com/?q=Clinic')).toBeNull();
    expect(selectCareLocationMapsUrl('https://example.com/clinic')).toBeNull();
    expect(mapsProviderForUrl('https://www.google.com/search?q=Clinic')).toBeNull();
    expect(mapsProviderForUrl('https://goo.gl/not-maps')).toBeNull();
  });

  it('recognises a new location opened from the native share flow', () => {
    expect(isCareLocationShareImport('https://maps.apple.com/?q=Clinic')).toBe(true);
    expect(isCareLocationShareImport(['https://maps.apple.com/?q=Clinic'])).toBe(true);
    expect(isCareLocationShareImport(undefined)).toBe(false);
    expect(isCareLocationShareImport('https://maps.apple.com/?q=Clinic', 'existing-location')).toBe(false);
  });
});
