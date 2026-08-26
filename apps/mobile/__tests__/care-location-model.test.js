jest.mock('@/utils/auth/supabase', () => ({ supabase: {} }));

import {
  CARE_LOCATION_ROLES,
  formatVerificationState,
  normalizeCareLocation,
  selectPreferredEmergencyDepartment,
  selectRegularClinic,
} from '@/services/supabase/facilities';

describe('CareLocation model', () => {
  test('normalizes legacy rows without inferring a preferred role', () => {
    const location = normalizeCareLocation({
      id: 'row-1', place_id: 'google-1', name: 'Legacy hospital', role: 'other', source_kind: 'legacy_google',
      address: null, phone: null, lat: null, lng: null,
      source_provider: 'google_maps', source_url: 'https://maps.app.goo.gl/FAKE', provider_place_id: 'FAKE_PLACE_ID',
    });
    expect(location).toMatchObject({
      id: 'row-1', legacyPlaceId: 'google-1', role: 'other', sourceKind: 'legacy_google', address: '', phone: '',
      verification: { state: 'legacy' },
      sourceProvider: 'google_maps', sourceUrl: 'https://maps.app.goo.gl/FAKE', providerPlaceId: 'FAKE_PLACE_ID',
    });
    expect(selectPreferredEmergencyDepartment([location])).toBeNull();
  });

  test('selects unique care roles by role rather than array position', () => {
    const locations = [
      { id: 'other', role: CARE_LOCATION_ROLES.OTHER },
      { id: 'clinic', role: CARE_LOCATION_ROLES.REGULAR_CLINIC },
      { id: 'ed', role: CARE_LOCATION_ROLES.PREFERRED_ED },
    ];
    expect(selectPreferredEmergencyDepartment(locations).id).toBe('ed');
    expect(selectRegularClinic(locations).id).toBe('clinic');
  });

  test.each([
    ['verified_directory', 'verified'],
    ['legacy_google', 'legacy'],
    ['user', 'user_added'],
    [undefined, 'user_added'],
  ])('formats %s source as %s', (source_kind, expected) => {
    expect(formatVerificationState({ source_kind })).toBe(expected);
  });
});
