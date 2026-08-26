import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { ChevronLeft, Navigation, Pencil, Phone, X } from 'lucide-react-native';
import CareLocationsMap from '@/components/CareLocations/CareLocationsMap';
import { useSavedFacilitiesQuery } from '@/hooks/queries/useSavedFacilitiesQuery';
import { CARE_LOCATION_ROLE_LABELS } from '@/services/supabase/facilities';
import { callCareLocation, openDirections } from '@/utils/careLocationActions';
import { fonts } from '@/utils/fonts';
import { useTheme } from '@/hooks/useTheme';

export default function CareLocationsMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const t = useTheme();
  const { data: locations = [] } = useSavedFacilitiesQuery();
  const pins = locations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const [selected, setSelected] = useState(null);

  const callSelected = () => {
    posthog?.capture('care_location_call_tapped', {
      role: selected.role,
      source_kind: selected.sourceKind,
      entry_point: 'map',
    });
    callCareLocation(selected.careTeamPhone || selected.phone);
  };

  const directSelected = () => {
    posthog?.capture('care_location_directions_tapped', {
      role: selected.role,
      source_kind: selected.sourceKind,
      entry_point: 'map',
    });
    openDirections(selected);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.surface }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}><ChevronLeft color={t.text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={{ fontFamily: fonts.semibold, fontSize: 21, color: t.text }}>Saved locations map</Text><Text style={{ fontFamily: fonts.regular, color: t.textSecondary, fontSize: 12 }}>{pins.length} saved {pins.length === 1 ? 'pin' : 'pins'}</Text></View>
      </View>
      {pins.length ? (
        <CareLocationsMap
          locations={pins}
          onSelect={setSelected}
          onPermissionResult={(result) => {
            posthog?.capture('care_locations_locate_me_tapped');
            posthog?.capture('care_locations_location_permission_result', { result });
          }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}><Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: t.text }}>No map pins yet</Text><Text style={{ fontFamily: fonts.regular, color: t.textSecondary, textAlign: 'center', marginTop: 8 }}>Locations without coordinates remain available from the Care locations list.</Text></View>
      )}
      {selected ? (
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: insets.bottom + 14, padding: 18, gap: 13, borderRadius: 22, backgroundColor: t.surface, boxShadow: '0 5px 24px rgba(0,0,0,0.18)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}><View style={{ flex: 1 }}><Text selectable style={{ fontFamily: fonts.semibold, fontSize: 18, color: t.text }}>{selected.name}</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, marginTop: 3 }}>{CARE_LOCATION_ROLE_LABELS[selected.role]}</Text>{selected.address ? <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, marginTop: 5 }}>{selected.address}</Text> : null}</View><Pressable onPress={() => setSelected(null)} accessibilityLabel="Close location details" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><X size={20} color={t.text} /></Pressable></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(selected.careTeamPhone || selected.phone) ? <Pressable onPress={callSelected} accessibilityRole="button" style={{ minHeight: 48, flex: 1, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}><Phone size={17} color="#A9334D" /><Text style={{ fontFamily: fonts.semibold, color: '#A9334D' }}>Call</Text></Pressable> : null}
            <Pressable onPress={directSelected} accessibilityRole="button" style={{ minHeight: 48, flex: 1, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}><Navigation size={17} color="#FFFFFF" /><Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>Directions</Text></Pressable>
            <Pressable onPress={() => router.push({ pathname: '/(tabs)/care/care-location-form', params: { id: selected.id, role: selected.role } })} accessibilityLabel="Edit care location" style={{ minWidth: 48, minHeight: 48, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}><Pencil size={17} color="#1A1A1A" /></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
