jest.mock('@/utils/auth/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

const { supabase } = require('@/utils/auth/supabase');
const { resolveCareLocationLink } = require('@/services/supabase/facilities');

describe('care location link resolver service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns the resolver candidate without transforming private fields', async () => {
    const candidate = { provider: 'apple_maps', name: 'Example Clinic', address: null, lat: 1, lng: 2 };
    supabase.functions.invoke.mockResolvedValue({ data: { data: candidate }, error: null });
    await expect(resolveCareLocationLink('https://maps.apple.com/?q=Example')).resolves.toEqual(candidate);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('resolve-care-location-link', {
      body: { url: 'https://maps.apple.com/?q=Example' },
    });
  });

  test('surfaces resolver failures', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: new Error('offline') });
    await expect(resolveCareLocationLink('https://maps.app.goo.gl/FAKE')).rejects.toThrow('offline');
  });
});
