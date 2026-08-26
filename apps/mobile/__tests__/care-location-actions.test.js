import { Platform } from 'react-native';
import {
  buildDirectionsUrls,
  buildExternalSearchUrl,
  careLocationMapActionLabel,
  directionsDestination,
} from '@/utils/careLocationActions';

describe('care location actions', () => {
  test('builds route URLs from coordinates without an origin', () => {
    const urls = buildDirectionsUrls({ name: 'City Hospital', lat: 25.2, lng: 55.3, address: 'Ignored' });
    expect(urls.apple).toContain('daddr=25.2%2C55.3');
    expect(urls.google).toContain('destination=25.2%2C55.3');
    expect(urls.google).not.toContain('origin=');
    expect(urls.waze).toContain('ll=25.2%2C55.3');
  });

  test('falls back to an encoded address', () => {
    const location = { name: 'Clinic', address: '1 Care Street, Dubai' };
    expect(directionsDestination(location)).toBe(location.address);
    expect(buildDirectionsUrls(location).google).toContain('1%20Care%20Street%2C%20Dubai');
  });

  test('returns null when no destination is available', () => {
    expect(buildDirectionsUrls({ name: 'Unknown' })).toBeNull();
  });

  test('uses an honest map action label for partial imports', () => {
    expect(careLocationMapActionLabel({ address: '1 Care Street' })).toBe('Get directions');
    expect(careLocationMapActionLabel({ sourceUrl: 'https://maps.apple.com/?q=Example' })).toBe('Open in Maps');
    expect(careLocationMapActionLabel({ name: 'Unknown' })).toBeNull();
  });

  test('external search contains only the requested category', () => {
    expect(buildExternalSearchUrl('emergency department')).toContain('emergency%20department');
  });
});
