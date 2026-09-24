import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ClipboardPaste, ExternalLink, Keyboard, Link2, Trash2 } from 'lucide-react-native';
import { usePostHog } from 'posthog-react-native';
import Animated, { cubicBezier, Easing, FadeInDown, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useSavedFacilitiesQuery } from '@/hooks/queries/useSavedFacilitiesQuery';
import { useCareLocationMutations } from '@/hooks/mutations/useCareLocationMutations';
import {
  CARE_LOCATION_ROLE_LABELS,
  CARE_LOCATION_ROLES,
  resolveCareLocationLink,
} from '@/services/supabase/facilities';
import { buildCareLocationProvenance, enrichmentSourceLabel } from '@/utils/careLocationEnrichment';
import { isCareLocationShareImport } from '@/utils/careLocationShare';
import { fonts } from '@/utils/fonts';
import { useToast } from '@/components/Toast/ToastProvider';
import CareLocationsHeader from '@/components/CareLocations/CareLocationsHeader';

const ROLES = Object.values(CARE_LOCATION_ROLES);
const PROVIDER_LABELS = { google_maps: 'Google Maps', apple_maps: 'Apple Maps' };
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1).factory();
const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const MODE_ENTER = FadeInDown.duration(220).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const MODE_EXIT = FadeOut.duration(120).reduceMotion(ReduceMotion.System);

function careLocationSaveErrorMessage(error) {
  if (__DEV__ && error?.code === 'PGRST204') {
    return 'This Supabase environment is missing the latest Care Locations migrations. Apply migrations through 20260920120000, reload the PostgREST schema, then try again.';
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

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, required = false, source = null }) {
  const t = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text }}>{label}{required ? ' *' : ''}</Text>
        {source ? <Text style={{ flexShrink: 1, fontFamily: fonts.regular, fontSize: 11, color: t.textSecondary, textAlign: 'right' }}>{source}</Text> : null}
      </View>
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

function ResolveLinkButton({ isResolving, onPress, accent }) {
  const reducedMotion = useReducedMotion();
  const transition = {
    transitionProperty: reducedMotion ? 'opacity' : ['transform', 'opacity'],
    transitionDuration: reducedMotion ? 120 : 220,
    transitionTimingFunction: CSS_EASE_OUT,
  };
  const face = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isResolving}
      accessibilityRole="button"
      accessibilityLabel={isResolving ? 'Reading Maps link' : 'Continue'}
      accessibilityState={{ disabled: isResolving, busy: isResolving }}
      style={{ minHeight: 55, borderRadius: 17, backgroundColor: accent, overflow: 'hidden' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          face,
          transition,
          {
            opacity: isResolving ? 0 : 1,
            transform: reducedMotion
              ? []
              : [{ perspective: 800 }, { rotateX: isResolving ? '-180deg' : '0deg' }],
          },
        ]}
      >
        <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Continue</Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          face,
          transition,
          {
            opacity: isResolving ? 1 : 0,
            transform: reducedMotion
              ? []
              : [{ perspective: 800 }, { rotateX: isResolving ? '0deg' : '180deg' }],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <ActivityIndicator color="#FFFFFF" />
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Reading Maps Link</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function BackgroundEnrichmentCard({ location, pending, onRetry }) {
  const t = useTheme();
  const attributionLoaded = useRef(false);
  const background = location?.enrichmentProvenance?.backgroundEnrichment;
  const groundedResult = background?.groundedResult;
  const renderedContent = groundedResult?.searchEntryPoint?.renderedContent;
  if (!location?.sourceUrl) return null;
  const requestedAt = location.enrichmentRequestedAt ? Date.parse(location.enrichmentRequestedAt) : NaN;
  const isStale = ['pending', 'processing'].includes(location.enrichmentStatus) &&
    Number.isFinite(requestedAt) && Date.now() - requestedAt > 2 * 60 * 1000;
  const status = pending ? 'pending' : isStale ? 'failed' : location.enrichmentStatus;
  const isRunning = ['pending', 'processing'].includes(status);

  if (status === 'completed') {
    if (!renderedContent) return null;
    return (
      <View style={{ gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
        <Text selectable style={{ fontFamily: fonts.semibold, color: t.text }}>Contact details added automatically</Text>
        <Text selectable style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: t.textSecondary }}>Found with Google Search from official web sources.</Text>
        <View style={{ overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: t.border }}>
          <WebView
            source={{ html: renderedContent }}
            originWhitelist={['http://*', 'https://*']}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            automaticallyAdjustContentInsets={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onLoadStart={() => { attributionLoaded.current = false; }}
            onLoadEnd={() => { attributionLoaded.current = true; }}
            onShouldStartLoadWithRequest={(request) => {
              if (!attributionLoaded.current || !/^https?:\/\//i.test(request?.url || '')) return true;
              Linking.openURL(request.url).catch(() => {});
              return false;
            }}
            style={{ width: '100%', height: 88, maxHeight: 120, backgroundColor: 'transparent' }}
          />
        </View>
      </View>
    );
  }

  if (location.phone && location.website) return null;

  const message = isRunning
    ? 'Looking for missing phone and website details in the background…'
    : status === 'no_match'
      ? 'No additional contact details were found. Your saved information is unchanged.'
      : status === 'failed'
        ? `${isStale ? 'Enrichment took too long' : 'Enrichment could not be completed'}. Your saved information is unchanged.`
        : 'Look for missing contact details after saving. Verified details are added automatically.';
  return (
    <View style={{ gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        {isRunning ? <ActivityIndicator size="small" color={t.accent} /> : <Link2 size={18} color={t.accent} />}
        <Text accessibilityLiveRegion="polite" selectable style={{ flex: 1, fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>{message}</Text>
      </View>
      {!isRunning ? <Pressable onPress={onRetry} disabled={pending} accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>{status === 'no_match' || status === 'failed' ? 'Try enrichment again' : 'Enrich location'}</Text></Pressable> : null}
    </View>
  );
}

export default function CareLocationFormScreen() {
  const { id, role: initialRole, shareUrl } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const posthog = usePostHog();
  const { showToast } = useToast();
  const { data: locations = [], isLoading } = useSavedFacilitiesQuery();
  const existing = useMemo(() => locations.find((item) => item.id === id), [locations, id]);
  const { saveMutation, deleteMutation, enrichmentMutation } = useCareLocationMutations();
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
  const [geoapifyPlaceId, setGeoapifyPlaceId] = useState(existing?.geoapifyPlaceId || null);
  const [mapsLink, setMapsLink] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [resolveError, setResolveError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const hydratedId = useRef(existing?.id || null);
  const importedShareRef = useRef(null);
  const phoneEditedRef = useRef(false);
  const websiteEditedRef = useRef(false);
  const isShareImport = isCareLocationShareImport(shareUrl, id);

  useEffect(() => {
    if (!existing || hydratedId.current === existing.id) return;
    hydratedId.current = existing.id;
    phoneEditedRef.current = false;
    websiteEditedRef.current = false;
    setRole(existing.role); setName(existing.name); setAddress(existing.address); setPhone(existing.phone);
    setCareTeamPhone(existing.careTeamPhone); setWebsite(existing.website); setNotes(existing.notes);
    setLat(existing.lat); setLng(existing.lng); setSourceProvider(existing.sourceProvider);
    setSourceUrl(existing.sourceUrl); setProviderPlaceId(existing.providerPlaceId);
    setGeoapifyPlaceId(existing.geoapifyPlaceId); setMode('details');
  }, [existing]);

  useEffect(() => {
    if (!existing) return;
    if (!phoneEditedRef.current) setPhone(existing.phone || '');
    if (!websiteEditedRef.current) setWebsite(existing.website || '');
  }, [existing?.phone, existing?.website]);

  const setPhoneFromUser = (value) => {
    phoneEditedRef.current = true;
    setPhone(value);
  };

  const setWebsiteFromUser = (value) => {
    websiteEditedRef.current = true;
    setWebsite(value);
  };

  useEffect(() => {
    const incoming = Array.isArray(shareUrl) ? shareUrl[0] : shareUrl;
    if (!incoming || id || importedShareRef.current === incoming) return;
    importedShareRef.current = incoming;
    setMapsLink(incoming);
    setResolveError('');
    setMode('link');
  }, [id, shareUrl]);

  useEffect(() => {
    const incoming = Array.isArray(shareUrl) ? shareUrl[0] : shareUrl;
    if (!incoming || id || importedShareRef.current !== incoming || isResolving || mode !== 'link') return;
    resolveLink(incoming);
  }, [id, shareUrl, mode]);

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

  const resolveLinkForReview = async (value) => {
    const link = (typeof value === 'string' ? value : mapsLink).trim();
    if (!link) {
      setResolveError('Paste a Google Maps or Apple Maps link first.');
      return;
    }
    setResolveError('');
    setIsResolving(true);
    try {
      const network = await NetInfo.fetch().catch(() => null);
      if (network?.isConnected === false) {
        setResolveError('You appear to be offline. Reconnect, then try this link again.');
        posthog?.capture('care_location_link_resolved', { outcome: 'offline', provider: mapsProviderHint(link) });
        return;
      }
      const result = await resolveCareLocationLink(link);
      setCandidate(result);
      setName(result.name || ''); setAddress(result.address || ''); setPhone(result.phone || '');
      setWebsite(result.website || ''); setLat(result.lat); setLng(result.lng);
      setSourceProvider(result.provider); setSourceUrl(result.sourceUrl || result.originalUrl); setProviderPlaceId(result.providerPlaceId);
      setGeoapifyPlaceId(result.geoapifyPlaceId);
      posthog?.capture('care_location_link_resolved', {
        outcome: result.name && (result.address || Number.isFinite(result.lat)) ? 'complete' : 'partial',
        provider: result.provider,
        has_name: !!result.name, has_address: !!result.address,
        has_coordinates: Number.isFinite(result.lat) && Number.isFinite(result.lng), has_place_id: !!result.providerPlaceId,
        geoapify_used: !!result.geoapifyPlaceId,
        enrichment_decision: result.decision || 'parsed_only',
        entry_point: 'add_location',
      });
      setMode('confirm');
    } catch (error) {
      if (__DEV__) console.warn('[CareLocation] Maps link resolution failed', error?.code || 'resolve_failed');
      setResolveError('We couldn’t read that link. Check that it is a Google Maps or Apple Maps share link, then try again.');
      posthog?.capture('care_location_link_resolved', { outcome: 'failed', provider: mapsProviderHint(link) });
    } finally {
      setIsResolving(false);
    }
  };

  const resolveLink = (value = mapsLink) => resolveLinkForReview(
    typeof value === 'string' ? value : mapsLink,
  );

  const enrichExistingLocation = () => {
    if (!existing?.id) return;
    enrichmentMutation.mutate(existing.id, {
      onSuccess: (result) => {
        const message = result?.reason === 'no_missing_fields'
          ? 'This location already has contact details'
          : 'Enrichment started';
        showToast({ message });
      },
      onError: () => Alert.alert('Couldn’t start enrichment', 'Your saved details are unchanged. Please try again.'),
    });
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
    const proceed = () => {
      const enrichmentProvenance = candidate
        ? buildCareLocationProvenance(candidate, { name, address, lat, lng, phone, website })
        : existing?.enrichmentProvenance || null;
      saveMutation.mutate({
        ...existing, id: existing?.id, role, name, address, phone, careTeamPhone, website, notes,
        lat, lng, sourceKind: existing?.sourceKind || 'user', sourceProvider, sourceUrl, providerPlaceId,
        geoapifyPlaceId, enrichmentProvenance,
      }, {
        onSuccess: (saved) => {
          posthog?.capture('care_location_saved', { role: saved.role, source_kind: saved.sourceKind, has_coordinates: Number.isFinite(saved.lat), add_method: sourceProvider ? 'maps_link' : 'manual' });
          if (mode === 'confirm') posthog?.capture('care_location_link_confirmed', { provider: sourceProvider, role, was_partial: !candidate?.name || (!candidate?.address && !Number.isFinite(candidate?.lat)) });
          if (existing && existing.role !== role) posthog?.capture('care_location_role_changed', { from_role: existing.role, to_role: role, replaced_existing: !!replacement });
          if (isShareImport) {
            router.replace({
              pathname: '/(tabs)/care/facilities',
              params: { saveNotice: String(Date.now()) },
            });
          } else {
            router.back();
            requestAnimationFrame(() => showToast({ message: 'Care location saved' }));
          }
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          Alert.alert('Couldn’t save location', careLocationSaveErrorMessage(error));
        },
      });
    };
    if (replacement && [CARE_LOCATION_ROLES.PREFERRED_ED, CARE_LOCATION_ROLES.REGULAR_CLINIC].includes(role)) {
      Alert.alert(`Replace ${CARE_LOCATION_ROLE_LABELS[role]}?`, `${replacement.name} will move to Other saved locations.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Replace', onPress: proceed }]);
    } else proceed();
  };

  const remove = () => Alert.alert('Delete care location?', existing.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(existing.id, { onSuccess: () => router.back(), onError: () => Alert.alert('Couldn’t delete location', 'Please try again.') }) }]);
  const title = existing ? 'Edit care location' : mode === 'method' ? 'Add care location' : mode === 'link' ? 'Paste a Maps link' : mode === 'confirm' ? 'Confirm location' : 'Enter details';
  const usedGeoapify = !!candidate?.geoapifyPlaceId || Object.values(candidate?.fields || {}).some((field) => field?.source?.startsWith('geoapify'));

  if (id && isLoading && !existing) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}><ActivityIndicator color={t.accent} accessibilityLabel="Loading care location" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <CareLocationsHeader
        title={title}
        subtitle={mode === 'confirm' ? 'Review before saving' : existing ? 'Update your saved location' : 'Hospitals, clinics and support'}
        onBack={() => {
          if (existing && mode === 'confirm') setMode('details');
          else if (mode === 'method' || existing) router.back();
          else setMode('method');
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: insets.bottom + 32 }}>
        <Animated.View key={mode} entering={MODE_ENTER} exiting={MODE_EXIT} style={{ gap: 18 }}>
        {mode === 'method' ? (
          <><Text selectable style={{ fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: t.textSecondary }}>Choose the easiest way to add a hospital, clinic, pharmacy or other care location.</Text><MethodCard icon={Link2} title="Paste a Maps link" badge="RECOMMENDED" subtitle="Copy a facility link from Google Maps or Apple Maps." onPress={() => chooseMethod('maps_link')} /><MethodCard icon={Keyboard} title="Enter details manually" subtitle="Add the name, address and contact details yourself." onPress={() => chooseMethod('manual')} /></>
        ) : null}

        {mode === 'link' ? (
          <>
            <View style={{ gap: 10, padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 16 }}>Copy the facility’s Maps link</Text>{['Find the facility in Google Maps or Apple Maps.', 'Tap Share, then Copy Link.', 'Return here and tap Paste from clipboard.'].map((step, index) => <View key={step} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>{index + 1}</Text><Text selectable style={{ flex: 1, fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>{step}</Text></View>)}</View>
            <TextInput value={mapsLink} onChangeText={(value) => { setMapsLink(value); setResolveError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://maps.app.goo.gl/…" placeholderTextColor={t.textSecondary} accessibilityLabel="Google Maps or Apple Maps link" style={{ minHeight: 54, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: resolveError ? t.destructive : t.border, backgroundColor: t.surface, color: t.text, fontFamily: fonts.regular }} />
            <Pressable onPress={pasteLink} accessibilityRole="button" style={{ minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><ClipboardPaste size={18} color={t.accent} /><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Paste from clipboard</Text></Pressable>
            {resolveError ? <View accessibilityRole="alert" style={{ gap: 7, padding: 14, borderRadius: 14, backgroundColor: `${t.destructive}10` }}><Text selectable style={{ fontFamily: fonts.semibold, color: t.destructive }}>Link not recognised</Text><Text selectable style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 19 }}>{resolveError}</Text><Pressable onPress={() => switchToManual('resolve_failed')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Enter details manually</Text></Pressable></View> : null}
            <ResolveLinkButton isResolving={isResolving} onPress={resolveLink} accent={t.accent} />
          </>
        ) : null}

        {mode === 'confirm' ? (
          <>
            <View style={{ gap: 7, padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
              <Text selectable style={{ fontFamily: fonts.semibold, color: t.text, fontSize: 17 }}>{usedGeoapify ? 'Review this possible match' : 'We found this location'}</Text>
              <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>Source: {PROVIDER_LABELS[sourceProvider] || 'Maps link'}{usedGeoapify ? ' + Geoapify' : ''} · Check before saving</Text>
              {usedGeoapify ? <Text selectable style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 19, marginTop: 5 }}>This identifies the place only. It does not verify sickle-cell, haematology, emergency or transfusion services.</Text> : null}
              {usedGeoapify ? <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, fontSize: 11, lineHeight: 16 }}>Data: Geoapify · © OpenStreetMap contributors</Text> : null}
              {(!candidate?.address || !Number.isFinite(candidate?.lat)) ? <Text selectable accessibilityRole="alert" style={{ fontFamily: fonts.regular, color: t.text, lineHeight: 19, marginTop: 5 }}>Some details could not be found. Add what you know; Hemo will not guess missing information.</Text> : null}
            </View>
            <Field label="Name" required value={name} onChangeText={setName} placeholder="Hospital, clinic or pharmacy name" source={enrichmentSourceLabel(candidate?.fields?.name, name)} />
            <Field label="Address (if known)" value={address} onChangeText={setAddress} placeholder="Street, city and postcode" multiline source={enrichmentSourceLabel(candidate?.fields?.address, address)} />
            {phone ? <Field label="Main phone (optional)" value={phone} onChangeText={setPhoneFromUser} placeholder="Switchboard or emergency department" keyboardType="phone-pad" source={enrichmentSourceLabel(candidate?.fields?.phone, phone)} /> : null}
            {website ? <Field label="Website (optional)" value={website} onChangeText={setWebsiteFromUser} placeholder="https://" keyboardType="url" source={enrichmentSourceLabel(candidate?.fields?.website, website)} /> : null}
            {sourceUrl ? <Pressable onPress={() => Linking.openURL(sourceUrl).catch(() => Alert.alert('Couldn’t open Maps', 'Try again or enter the details manually.'))} accessibilityRole="link" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}><ExternalLink size={17} color={t.accent} /><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Open original Maps link</Text></Pressable> : null}
            <RolePicker role={role} onChange={setRole} />
            <Pressable onPress={() => switchToManual('add_optional_details')} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.semibold, color: t.accent }}>Add phone, website or notes</Text></Pressable>
            <Pressable onPress={save} disabled={saveMutation.isPending} accessibilityRole="button" accessibilityState={{ disabled: saveMutation.isPending, busy: saveMutation.isPending }} style={{ minHeight: 55, borderRadius: 17, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>{saveMutation.isPending ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><ActivityIndicator color="#FFFFFF" /><Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Saving…</Text></View> : <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Confirm and save</Text>}</Pressable>
          </>
        ) : null}

        {mode === 'details' ? (
          <>
            <RolePicker role={role} onChange={setRole} />
            <Field label="Name" required value={name} onChangeText={setName} placeholder="Hospital, clinic or pharmacy name" />
            <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street, city and postcode" multiline />
            {sourceUrl ? <View style={{ padding: 13, borderRadius: 14, backgroundColor: t.surface }}><Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>Map pin imported from {PROVIDER_LABELS[sourceProvider] || 'Maps'}. Coordinates are stored securely and are not shown for manual editing.</Text></View> : <Text selectable style={{ fontFamily: fonts.regular, color: t.textSecondary, lineHeight: 19 }}>You can save an address without map coordinates. To add a pin, go back and paste a Maps link.</Text>}
            {existing ? <BackgroundEnrichmentCard location={existing} pending={enrichmentMutation.isPending} onRetry={enrichExistingLocation} /> : null}
            <Field label="Main phone (optional)" value={phone} onChangeText={setPhoneFromUser} placeholder="Switchboard or emergency department" keyboardType="phone-pad" />
            {role === CARE_LOCATION_ROLES.REGULAR_CLINIC ? <Field label="Care-team phone (optional)" value={careTeamPhone} onChangeText={setCareTeamPhone} placeholder="Your clinic team’s direct number" keyboardType="phone-pad" /> : null}
            <Field label="Website (optional)" value={website} onChangeText={setWebsiteFromUser} placeholder="https://" keyboardType="url" />
            <Field label="Private notes (optional)" value={notes} onChangeText={setNotes} placeholder="Entrance, ward, care-team details…" multiline />
            <Pressable onPress={save} disabled={saveMutation.isPending} accessibilityRole="button" accessibilityState={{ disabled: saveMutation.isPending, busy: saveMutation.isPending }} style={{ minHeight: 55, borderRadius: 17, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>{saveMutation.isPending ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><ActivityIndicator color="#FFFFFF" /><Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Saving…</Text></View> : <Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF', fontSize: 16 }}>Save care location</Text>}</Pressable>
            {existing ? <Pressable onPress={remove} disabled={deleteMutation.isPending} accessibilityRole="button" style={{ minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Trash2 size={18} color={t.destructive} /><Text style={{ fontFamily: fonts.semibold, color: t.destructive }}>Delete care location</Text></Pressable> : null}
          </>
        ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
