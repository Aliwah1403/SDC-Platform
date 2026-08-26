import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { ChevronLeft, MapPin, Navigation, Pencil, Phone } from 'lucide-react-native';
import { useSavedFacilitiesQuery } from '@/hooks/queries/useSavedFacilitiesQuery';
import { CARE_LOCATION_ROLE_LABELS } from '@/services/supabase/facilities';
import { callCareLocation, careLocationMapActionLabel, openDirections } from '@/utils/careLocationActions';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/utils/fonts';

export default function CareLocationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const posthog = usePostHog();
  const { data: locations = [], isLoading } = useSavedFacilitiesQuery();
  const location = locations.find((item) => item.id === id || item.legacyPlaceId === id);
  const mapActionLabel = careLocationMapActionLabel(location);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}><Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}><ChevronLeft color={t.text} /></Pressable><Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 20, color: t.text }}>Care location</Text></View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28, gap: 18 }}>
        {!location ? <Text selectable style={{ fontFamily: fonts.regular, color: t.text }}>{isLoading ? 'Loading…' : 'This saved care location is no longer available.'}</Text> : (
          <>
            <View style={{ padding: 20, gap: 8, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 23 }}>{location.name}</Text><Text selectable style={{ fontFamily: fonts.semibold, color: t.accent }}>{CARE_LOCATION_ROLE_LABELS[location.role]}</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary }}>Added by you · Not verified by Hemo</Text>{location.address ? <Text selectable style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 21, marginTop: 8 }}>{location.address}</Text> : null}</View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(location.careTeamPhone || location.phone) ? <Pressable onPress={() => { posthog?.capture('care_location_call_tapped', { role: location.role, source_kind: location.sourceKind, entry_point: 'detail' }); callCareLocation(location.careTeamPhone || location.phone); }} accessibilityRole="button" style={{ minHeight: 52, flex: 1, borderRadius: 16, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Phone size={18} color={t.accent} /><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Call</Text></Pressable> : null}
              {mapActionLabel ? <Pressable onPress={() => { posthog?.capture('care_location_directions_tapped', { role: location.role, source_kind: location.sourceKind, entry_point: 'detail' }); openDirections(location); }} accessibilityRole="button" style={{ minHeight: 52, flex: 1, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Navigation size={18} color="#FFFFFF" /><Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>{mapActionLabel}</Text></Pressable> : null}
            </View>
            {location.notes ? <View style={{ padding: 17, borderRadius: 18, backgroundColor: t.surface }}><Text style={{ fontFamily: fonts.semibold, color: t.text, marginBottom: 7 }}>Private notes</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 20 }}>{location.notes}</Text></View> : null}
            <Pressable onPress={() => router.push({ pathname: '/(tabs)/care/care-location-form', params: { id: location.id, role: location.role } })} accessibilityRole="button" style={{ minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Pencil size={18} color={t.text} /><Text style={{ fontFamily: fonts.semibold, color: t.text }}>Edit care location</Text></Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
