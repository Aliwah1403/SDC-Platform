import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import NetInfo from '@react-native-community/netinfo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ClipboardPaste, ExternalLink, Keyboard, Link2, Trash2 } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSavedFacilitiesQuery } from '@/hooks/queries/useSavedFacilitiesQuery';
import { useCareLocationMutations } from '@/hooks/mutations/useCareLocationMutations';
import {
  CARE_LOCATION_ROLE_LABELS,
  CARE_LOCATION_ROLES,
  resolveCareLocationLink,
} from '@/services/supabase/facilities';
import { fonts } from '@/utils/fonts';

const ROLES = Object.values(CARE_LOCATION_ROLES);
const PROVIDER_LABELS = { google_maps: 'Google Maps', apple_maps: 'Apple Maps' };

function careLocationSaveErrorMessage(error) {
  if (__DEV__ && error?.code === 'PGRST204') {
    return 'This Supabase environment is missing the Care Locations migrations. Apply migrations 20260825190000 and 20260826110000, reload the PostgREST schema, then try again.';
  }
  return 'Your changes were not saved. Please try again.';
}

function mapsProviderHint(value) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return 'unsupported';
    const host = url.hostname.toLowerCase();
    if (host === 'maps.apple.com') return 'apple_maps';
    if (host === 'maps.app.goo.gl' || host === 'goo.gl' || /^(www\.|maps\.)?google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host)) return 'google_maps';
  } catch {}
  return 'unsupported';
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, required = false }) {
  const t = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text }}>{label}{required ? ' *' : ''}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.textSecondary} keyboardType={keyboardType} multiline={multiline} accessibilityLabel={label} style={{ minHeight: multiline ? 84 : 50, padding: 14, textAlignVertical: multiline ? 'top' : 'center', borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, color: t.text, fontFamily: fonts.regular, fontSize: 15 }} />
    </View>
  );
}

function RolePicker({ role, onChange }) {
  const t = useTheme();
  return (
    <View style={{ gap: 9 }}>
      <Text selectable style={{ fontFamily: fonts.semibold, fontSize: 17, color: t.text }}>How do you use this location?</Text>
      {ROLES.map((value) => (
        <Pressable key={value} onPress={() => onChange(value)} accessibilityRole="radio" accessibilityState={{ selected: role === value }} style={{ minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: role === value ? t.accent : t.border, backgroundColor: role === value ? `${t.accent}12` : t.surface, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: role === value ? t.accent : t.textSecondary, alignItems: 'center', justifyContent: 'center' }}>{role === value ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent }} /> : null}</View>
          <Text style={{ fontFamily: role === value ? fonts.semibold : fonts.regular, color: t.text, flex: 1 }}>{CARE_LOCATION_ROLE_LABELS[value]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MethodCard({ icon: Icon, title, subtitle, badge, onPress }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 88, borderRadius: 18, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, opacity: pressed ? 0.72 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${t.accent}12`, alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={t.accent} /></View>
      <View style={{ flex: 1, gap: 3 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}><Text style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 16 }}>{title}</Text>{badge ? <Text style={{ color: t.accent, fontFamily: fonts.semibold, fontSize: 11 }}>{badge}</Text> : null}</View><Text style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 18 }}>{subtitle}</Text></View>
      <ChevronRight size={19} color={t.textSecondary} />
    </Pressable>
  );
}

export default function CareLocationFormScreen() {
  const { id, role: initialRole } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const posthog = usePostHog();
  const { data: locations = [], isLoading } = useSavedFacilitiesQuery();
  const existing = useMemo(() => locations.find((item) => item.id === id), [locations, id]);
  const { saveMutation, deleteMutation } = useCareLocationMutations();
  const [mode, setMode] = useState(id ? 'details' : 'method');
  const [role, setRole] = useState(existing?.role || initialRole || CARE_LOCATION_ROLES.OTHER);
  const [name, setName] = useState(existing?.name || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [careTeamPhone, setCareTeamPhone] = useState(existing?.careTeamPhone || '');
  const [website, setWebsite] = useState(existing?.website || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [lat, setLat] = useState(existing?.lat ?? null);
  const [lng, setLng] = useState(existing?.lng ?? null);
  const [sourceProvider, setSourceProvider] = useState(existing?.sourceProvider || null);
  const [sourceUrl, setSourceUrl] = useState(existing?.sourceUrl || null);
  const [providerPlaceId, setProviderPlaceId] = useState(existing?.providerPlaceId || null);
  const [mapsLink, setMapsLink] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [resolveError, setResolveError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const hydratedId = useRef(existing?.id || null);

  useEffect(() => {
    if (!existing || hydratedId.current === existing.id) return;
    hydratedId.current = existing.id;
    setRole(existing.role); setName(existing.name); setAddress(existing.address); setPhone(existing.phone);
    setCareTeamPhone(existing.careTeamPhone); setWebsite(existing.website); setNotes(existing.notes);
    setLat(existing.lat); setLng(existing.lng); setSourceProvider(existing.sourceProvider);
    setSourceUrl(existing.sourceUrl); setProviderPlaceId(existing.providerPlaceId); setMode('details');
  }, [existing]);

  const chooseMethod = (method) => {
    posthog?.capture('care_location_add_method_selected', { method, entry_point: 'care' });
    setMode(method === 'maps_link' ? 'link' : 'details');
  };

  const pasteLink = async () => {
    try {
      const value = await Clipboard.getStringAsync();
      setMapsLink(value.trim());
      setResolveError('');
      posthog?.capture('care_location_link_pasted', { provider_hint: mapsProviderHint(value) });
    } catch {
      Alert.alert('Couldn’t paste', 'Paste the copied Maps link into the field instead.');
    }
  };

  const resolveLink = async () => {
    if (!mapsLink.trim()) return setResolveError('Paste a Google Maps or Apple Maps link first.');
    setResolveError('');
    setIsResolving(true);
    try {
      const network = await NetInfo.fetch().catch(() => null);
      if (network?.isConnected === false) {
        setResolveError('You appear to be offline. Reconnect, then try this link again.');
        posthog?.capture('care_location_link_resolved', { outcome: 'offline', provider: mapsProviderHint(mapsLink) });
        return;
      }
      const result = await resolveCareLocationLink(mapsLink.trim());
      setCandidate(result);
      setName(result.name || ''); setAddress(result.address || ''); setLat(result.lat); setLng(result.lng);
      setSourceProvider(result.provider); setSourceUrl(result.sourceUrl || result.originalUrl); setProviderPlaceId(result.providerPlaceId);
      posthog?.capture('care_location_link_resolved', {
        outcome: result.name && (result.address || Number.isFinite(result.lat)) ? 'complete' : 'partial',
        provider: result.provider,
        has_name: !!result.name, has_address: !!result.address,
        has_coordinates: Number.isFinite(result.lat) && Number.isFinite(result.lng), has_place_id: !!result.providerPlaceId,
      });
      setMode('confirm');
    } catch {
      setResolveError('We couldn’t read that link. Check that it is a Google Maps or Apple Maps share link, then try again.');
      posthog?.capture('care_location_link_resolved', { outcome: 'failed', provider: mapsProviderHint(mapsLink) });
    } finally {
      setIsResolving(false);
    }
  };

  const switchToManual = (reason) => {
    posthog?.capture('care_location_manual_fallback', { reason });
    setMode('details');
  };

  const save = () => {
    if (!name.trim()) return Alert.alert('Name required', 'Enter the name of this care location.');
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
    if (!address.trim() && !hasCoordinates && !sourceUrl) return Alert.alert('Location required', 'Add an address or import a supported Maps link.');
    const replacement = locations.find((item) => item.id !== existing?.id && item.role === role);
    const proceed = () => saveMutation.mutate({
      ...existing, id: existing?.id, role, name, address, phone, careTeamPhone, website, notes,
      lat, lng, sourceKind: existing?.sourceKind || 'user', sourceProvider, sourceUrl, providerPlaceId,
    }, {
      onSuccess: (saved) => {
        posthog?.capture('care_location_saved', { role: saved.role, source_kind: saved.sourceKind, has_coordinates: Number.isFinite(saved.lat), add_method: sourceProvider ? 'maps_link' : 'manual' });
        if (mode === 'confirm') posthog?.capture('care_location_link_confirmed', { provider: sourceProvider, role, was_partial: !candidate?.name || (!candidate?.address && !Number.isFinite(candidate?.lat)) });
        if (existing && existing.role !== role) posthog?.capture('care_location_role_changed', { from_role: existing.role, to_role: role, replaced_existing: !!replacement });
        router.back();
      },
      onError: (error) => Alert.alert('Couldn’t save location', careLocationSaveErrorMessage(error)),
    });
    if (replacement && [CARE_LOCATION_ROLES.PREFERRED_ED, CARE_LOCATION_ROLES.REGULAR_CLINIC].includes(role)) {
      Alert.alert(`Replace ${CARE_LOCATION_ROLE_LABELS[role]}?`, `${replacement.name} will move to Other saved locations.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Replace', onPress: proceed }]);
    } else proceed();
  };

  const remove = () => Alert.alert('Delete care location?', existing.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(existing.id, { onSuccess: () => router.back(), onError: () => Alert.alert('Couldn’t delete location', 'Please try again.') }) }]);
  const title = existing ? 'Edit care location' : mode === 'method' ? 'Add care location' : mode === 'link' ? 'Paste a Maps link' : mode === 'confirm' ? 'Confirm location' : 'Enter details';

  if (id && isLoading && !existing) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}><ActivityIndicator color={t.accent} accessibilityLabel="Loading care location" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Pressable onPress={() => mode === 'method' || existing ? router.back() : setMode('method')} accessibilityLabel="Back" style={{ width: 44, height: 44, justifyContent: 'center' }}><ChevronLeft color={t.text} /></Pressable><Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 21, color: t.text }}>{title}</Text></View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: insets.bottom + 32, gap: 18 }}>
        {mode === 'method' ? (
          <><Text selectable style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: t.textSecondary }}>Choose the easiest way to add a hospital, clinic, pharmacy or other care location.</Text><MethodCard icon={Link2} title="Paste a Maps link" badge="RECOMMENDED" subtitle="Copy a facility link from Google Maps or Apple Maps." onPress={() => chooseMethod('maps_link')} /><MethodCard icon={Keyboard} title="Enter details manually" subtitle="Add the name, address and contact details yourself." onPress={() => chooseMethod('manual')} /></>
        ) : null}

        {mode === 'link' ? (
          <>
            <View style={{ gap: 10, padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 16 }}>Copy the facility’s Maps link</Text>{['Find the facility in Google Maps or Apple Maps.', 'Tap Share, then Copy Link.', 'Return here and tap Paste from clipboard.'].map((step, index) => <View key={step} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>{index + 1}</Text><Text selectable style={{ flex: 1, fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>{step}</Text></View>)}</View>
            <TextInput value={mapsLink} onChangeText={(value) => { setMapsLink(value); setResolveError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://maps.app.goo.gl/…" placeholderTextColor={t.textSecondary} accessibilityLabel="Google Maps or Apple Maps link" style={{ minHeight: 54, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: resolveError ? t.destructive : t.border, backgroundColor: t.surface, color: t.text, fontFamily: fonts.regular }} />
            <Pressable onPress={pasteLink} accessibilityRole="button" style={{ minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><ClipboardPaste size={18} color={t.accent} /><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Paste from clipboard</Text></Pressable>
            {resolveError ? <View accessibilityRole="alert" style={{ gap: 7, padding: 14, borderRadius: 14, backgroundColor: `${t.destructive}10` }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.destructive }}>Link not recognised</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 19 }}>{resolveError}</Text><Pressable onPress={() => switchToManual('resolve_failed')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Enter details manually</Text></Pressable></View> : null}
            <Pressable onPress={resolveLink} disabled={isResolving} accessibilityRole="button" accessibilityState={{ disabled: isResolving }} style={{ minHeight: 55, borderRadius: 17, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>{isResolving ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Reading Maps link" /> : <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Continue</Text>}</Pressable>
          </>
        ) : null}

        {mode === 'confirm' ? (
          <>
            <View style={{ gap: 7, padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 17 }}>We found this location</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary }}>Source: {PROVIDER_LABELS[sourceProvider] || 'Maps link'} · Review before saving</Text>{(!candidate?.address || !Number.isFinite(candidate?.lat)) ? <Text selectable accessibilityRole="alert" style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 19, marginTop: 5 }}>Some details were not included in the link. Add what you know below; Hemo will not guess missing information.</Text> : null}</View>
            <Field label="Name" required value={name} onChangeText={setName} placeholder="Hospital, clinic or pharmacy name" />
            <Field label="Address (if known)" value={address} onChangeText={setAddress} placeholder="Street, city and postcode" multiline />
            {sourceUrl ? <Pressable onPress={() => Linking.openURL(sourceUrl).catch(() => Alert.alert('Couldn’t open Maps', 'Try again or enter the details manually.'))} accessibilityRole="link" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}><ExternalLink size={17} color={t.accent} /><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Open original Maps link</Text></Pressable> : null}
            <RolePicker role={role} onChange={setRole} />
            <Pressable onPress={() => switchToManual('add_optional_details')} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Add phone, website or notes</Text></Pressable>
            <Pressable onPress={save} disabled={saveMutation.isPending} accessibilityRole="button" style={{ minHeight: 55, borderRadius: 17, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>{saveMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Confirm and save</Text>}</Pressable>
          </>
        ) : null}

        {mode === 'details' ? (
          <>
            <RolePicker role={role} onChange={setRole} />
            <Field label="Name" required value={name} onChangeText={setName} placeholder="Hospital, clinic or pharmacy name" />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street, city and postcode" multiline />
            {sourceUrl ? <View style={{ padding: 13, borderRadius: 14, backgroundColor: t.surface }}><Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary }}>Map pin imported from {PROVIDER_LABELS[sourceProvider] || 'Maps'}. Coordinates are stored securely and are not shown for manual editing.</Text></View> : <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>You can save an address without map coordinates. To add a pin, go back and paste a Maps link.</Text>}
            <Field label="Main phone (optional)" value={phone} onChangeText={setPhone} placeholder="Switchboard or emergency department" keyboardType="phone-pad" />
            {role === CARE_LOCATION_ROLES.REGULAR_CLINIC ? <Field label="Care-team phone (optional)" value={careTeamPhone} onChangeText={setCareTeamPhone} placeholder="Your clinic team’s direct number" keyboardType="phone-pad" /> : null}
            <Field label="Website (optional)" value={website} onChangeText={setWebsite} placeholder="https://" keyboardType="url" />
            <Field label="Private notes (optional)" value={notes} onChangeText={setNotes} placeholder="Entrance, ward, care-team details…" multiline />
            <Pressable onPress={save} disabled={saveMutation.isPending} accessibilityRole="button" style={{ minHeight: 55, borderRadius: 17, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>{saveMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Save care location</Text>}</Pressable>
            {existing ? <Pressable onPress={remove} disabled={deleteMutation.isPending} accessibilityRole="button" style={{ minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Trash2 size={18} color={t.destructive} /><Text style={{ fontFamily: fonts.semibold, color: t.destructive }}>Delete care location</Text></Pressable> : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
