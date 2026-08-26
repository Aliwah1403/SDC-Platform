import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';
import { ChevronLeft, ChevronRight, ExternalLink, Map, MapPin, Navigation, Phone, Plus } from 'lucide-react-native';
import CareLocationsMap from '@/components/CareLocations/CareLocationsMap';
import { useSavedFacilitiesQuery } from '@/hooks/queries/useSavedFacilitiesQuery';
import { useCareLocationMutations } from '@/hooks/mutations/useCareLocationMutations';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/utils/fonts';
import {
  CARE_LOCATION_ROLE_LABELS,
  CARE_LOCATION_ROLES,
  selectPreferredEmergencyDepartment,
  selectRegularClinic,
} from '@/services/supabase/facilities';
import { callCareLocation, careLocationMapActionLabel, openDirections, openExternalMapSearch } from '@/utils/careLocationActions';

const ROLE_TONES = {
  preferred_ed: { color: '#DC2626', background: '#FEE2E2' },
  regular_scd_clinic: { color: '#A9334D', background: '#F8E9E7' },
  pharmacy: { color: '#059669', background: '#D1FAE5' },
  transfusion_centre: { color: '#7C3AED', background: '#EDE9FE' },
  other: { color: '#6B7280', background: '#F3F4F6' },
};

function QuietAction({ icon: Icon, label, onPress, disabled = false, tint }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 7, opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon size={16} color={disabled ? tint.muted : tint.action} />
      <Text style={{ color: disabled ? tint.muted : tint.action, fontFamily: fonts.semibold, fontSize: 13.5 }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryLocationCard({ t, title, emptyText, location, tone, onAdd, onEdit, onCall, onDirections }) {
  const canCall = !!(location?.phone || location?.careTeamPhone);
  const mapActionLabel = careLocationMapActionLabel(location);
  const tint = { action: t.text, muted: t.textTertiary };

  return (
    <View style={{ backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
      <Pressable
        onPress={location ? onEdit : onAdd}
        accessibilityRole="button"
        accessibilityLabel={location ? `${title}, ${location.name}` : `${title}, ${emptyText}`}
        style={({ pressed }) => ({ padding: 16, gap: 7, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone.color }} />
          <Text selectable style={{ flex: 1, color: tone.color, fontFamily: fonts.semibold, fontSize: 12.5 }}>{title}</Text>
          {location ? <ChevronRight size={18} color={t.textSecondary} /> : <Plus size={18} color={t.textSecondary} />}
        </View>
        <Text
          selectable
          numberOfLines={2}
          style={{
            color: location ? t.text : t.textSecondary,
            fontFamily: location ? fonts.semibold : fonts.regular,
            fontSize: 16, lineHeight: 21,
          }}
        >
          {location?.name || emptyText}
        </Text>
        {location?.address ? (
          <Text selectable numberOfLines={1} style={{ color: t.textSecondary, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 }}>
            {location.address}
          </Text>
        ) : null}
      </Pressable>

      {location ? (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.divider }}>
          <QuietAction icon={Phone} label="Call" onPress={onCall} disabled={!canCall} tint={tint} />
          <View style={{ width: 1, backgroundColor: t.divider }} />
          <QuietAction icon={Navigation} label={mapActionLabel || 'Directions unavailable'} onPress={onDirections} disabled={!mapActionLabel} tint={tint} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.divider }}>
          <QuietAction icon={Plus} label="Set location" onPress={onAdd} tint={{ action: tone.color, muted: t.textTertiary }} />
        </View>
      )}
    </View>
  );
}

export default function CareLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const posthog = usePostHog();
  const { data: locations = [], isLoading, isError, refetch } = useSavedFacilitiesQuery();
  const { deleteMutation } = useCareLocationMutations();
  const preferredED = selectPreferredEmergencyDepartment(locations);
  const regularClinic = selectRegularClinic(locations);
  const others = locations.filter((item) => ![CARE_LOCATION_ROLES.PREFERRED_ED, CARE_LOCATION_ROLES.REGULAR_CLINIC].includes(item.role));
  const pins = locations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const hasCapturedOpen = useRef(false);

  useEffect(() => {
    if (isLoading || hasCapturedOpen.current) return;
    hasCapturedOpen.current = true;
    posthog?.capture('care_locations_opened', {
      entry_point: 'care', has_preferred_ed: !!preferredED, has_regular_clinic: !!regularClinic, saved_count: locations.length,
    });
  }, [isLoading, locations.length, !!preferredED, !!regularClinic]);

  const openForm = (role, location) => {
    posthog?.capture('care_location_add_started', { entry_point: 'care', selected_role: role });
    router.push({ pathname: '/(tabs)/care/care-location-form', params: { role, id: location?.id || '' } });
  };

  const directions = (location) => {
    posthog?.capture('care_location_directions_tapped', { role: location.role, source_kind: location.sourceKind, entry_point: 'care' });
    openDirections(location);
  };
  const call = (location) => {
    posthog?.capture('care_location_call_tapped', { role: location.role, source_kind: location.sourceKind, entry_point: 'care' });
    callCareLocation(location.careTeamPhone || location.phone);
  };
  const confirmDelete = (location) => Alert.alert('Delete care location?', location.name, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(location.id) },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}><ChevronLeft color={t.text} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ fontFamily: fonts.semibold, fontSize: 23, color: t.text }}>Care locations</Text>
          <Text selectable style={{ fontFamily: fonts.regular, fontSize: 13, color: t.textSecondary }}>Your hospitals, clinics and support</Text>
        </View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: insets.bottom + 36, gap: 22 }}>
        {isLoading ? <ActivityIndicator color={t.accent} /> : null}
        {isError ? (
          <Pressable onPress={refetch} style={{ padding: 16, backgroundColor: t.surface, borderRadius: 16 }}>
            <Text selectable style={{ color: t.text, fontFamily: fonts.semibold }}>Couldn’t load your care locations</Text>
            <Text selectable style={{ color: t.accent, fontFamily: fonts.regular, marginTop: 4 }}>Tap to try again. No sample healthcare data will be shown.</Text>
          </Pressable>
        ) : null}

        <View style={{ gap: 10 }}>
          <PrimaryLocationCard t={t} title="Emergency care" emptyText="Add your preferred emergency department" location={preferredED} tone={ROLE_TONES.preferred_ed}
            onAdd={() => openForm(CARE_LOCATION_ROLES.PREFERRED_ED)} onEdit={() => openForm(preferredED.role, preferredED)} onCall={() => call(preferredED)} onDirections={() => directions(preferredED)} />
          <PrimaryLocationCard t={t} title="Regular care" emptyText="Add your regular SCD clinic" location={regularClinic} tone={ROLE_TONES.regular_scd_clinic}
            onAdd={() => openForm(CARE_LOCATION_ROLES.REGULAR_CLINIC)} onEdit={() => openForm(regularClinic.role, regularClinic)} onCall={() => call(regularClinic)} onDirections={() => directions(regularClinic)} />
        </View>

        <View style={{ gap: 10 }}>
          <Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 17 }}>Other saved locations</Text>
          {others.length === 0 ? <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary }}>Pharmacies, transfusion centres and other places you add will appear here.</Text> : others.map((location) => {
            const tone = ROLE_TONES[location.role] || ROLE_TONES.other;
            return (
              <Pressable key={location.id} onPress={() => openForm(location.role, location)} onLongPress={() => confirmDelete(location)} accessibilityLabel={`${location.name}, ${CARE_LOCATION_ROLE_LABELS[location.role]}`} style={({ pressed }) => ({ backgroundColor: t.surface, borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.75 : 1, borderWidth: 1, borderColor: t.border })}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tone.background, alignItems: 'center', justifyContent: 'center' }}><MapPin size={19} color={tone.color} /></View>
                <View style={{ flex: 1 }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 15 }}>{location.name}</Text><Text selectable numberOfLines={1} style={{ fontFamily: fonts.regular, color: t.textSecondary, fontSize: 12 }}>{CARE_LOCATION_ROLE_LABELS[location.role]} · Added by you</Text></View>
                <ChevronRight size={18} color={t.textSecondary} />
              </Pressable>
            );
          })}
        </View>

        {pins.length > 0 ? (
          <Pressable onPress={() => { posthog?.capture('care_locations_map_opened', { pin_count: pins.length, filter: 'saved' }); router.push('/(tabs)/care/care-locations-map'); }} accessibilityRole="button" style={{ backgroundColor: t.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: t.border }}>
            <View pointerEvents="none"><CareLocationsMap locations={pins} preview /></View>
            <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 9 }}><Map size={19} color={t.accent} /><Text style={{ flex: 1, fontFamily: fonts.semibold, color: t.text }}>View your saved locations map</Text><ChevronRight size={19} color={t.textSecondary} /></View>
          </Pressable>
        ) : null}

        <Pressable onPress={() => openForm(CARE_LOCATION_ROLES.OTHER)} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 54, backgroundColor: t.accent, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: pressed ? 0.8 : 1 })}><Plus size={20} color="#FFFFFF" /><Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 15 }}>Add a care location</Text></Pressable>

        <View style={{ gap: 10 }}>
          <Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 17 }}>Need somewhere nearby?</Text>
          <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>These searches open your maps app. Results are external and are not verified by Hemo for SCD care.</Text>
          {[['Emergency departments', 'emergency department'], ['Pharmacies', 'pharmacy']].map(([label, query]) => (
            <Pressable key={query} onPress={() => { posthog?.capture('external_unverified_search_opened', { query_type: query, entry_point: 'care' }); openExternalMapSearch(query); }} accessibilityRole="link" style={{ minHeight: 50, borderRadius: 15, paddingHorizontal: 15, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: t.border }}><ExternalLink size={18} color={t.accent} /><Text style={{ flex: 1, fontFamily: fonts.semibold, color: t.text }}>Search {label} in Maps</Text><ChevronRight size={18} color={t.textSecondary} /></Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
