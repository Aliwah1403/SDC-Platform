jest.mock('@/utils/auth/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const { supabase: mockSupabase } = require('@/utils/auth/supabase');
const { saveCareLocation } = require('@/services/supabase/facilities');

describe('care location role replacement', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updates ordinary fields before assigning a unique role through the atomic RPC', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'location-2', user_id: 'user-1', name: 'New ED', role: 'other', source_kind: 'user' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eqUser = jest.fn(() => ({ select }));
    const eqId = jest.fn(() => ({ eq: eqUser }));
    const update = jest.fn(() => ({ eq: eqId }));
    mockSupabase.from.mockReturnValue({ update });
    mockSupabase.rpc.mockResolvedValue({
      data: { id: 'location-2', user_id: 'user-1', name: 'New ED', role: 'preferred_ed', source_kind: 'user' },
      error: null,
    });

    const result = await saveCareLocation('user-1', {
      id: 'location-2', name: 'New ED', role: 'preferred_ed', address: '1 Care St', sourceKind: 'user',
      sourceProvider: 'google_maps', sourceUrl: 'https://maps.app.goo.gl/FAKE', providerPlaceId: 'FAKE_PLACE_ID',
    });

    expect(update).toHaveBeenCalledWith(expect.not.objectContaining({ role: expect.anything() }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      source_provider: 'google_maps', source_url: 'https://maps.app.goo.gl/FAKE', provider_place_id: 'FAKE_PLACE_ID',
    }));
    expect(mockSupabase.rpc).toHaveBeenCalledWith('set_care_location_role', {
      p_location_id: 'location-2', p_role: 'preferred_ed',
    });
    expect(result.role).toBe('preferred_ed');
  });
});
