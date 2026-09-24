import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useIncomingShare } from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/utils/fonts';
import { selectCareLocationMapsUrl } from '@/utils/careLocationShare';

export default function HandleShareScreen() {
  const router = useRouter();
  const t = useTheme();
  const { sharedPayloads, resolvedSharedPayloads, isResolving, error, clearSharedPayloads, refreshSharePayloads } = useIncomingShare();
  const [unsupported, setUnsupported] = useState(false);
  const [emptyPayloadChecked, setEmptyPayloadChecked] = useState(false);
  const handledSignature = useRef(null);

  const values = useMemo(() => [
    ...(sharedPayloads || []).flatMap((payload) => [payload?.value]),
    ...(resolvedSharedPayloads || []).flatMap((payload) => [payload?.value, payload?.contentUri]),
  ], [sharedPayloads, resolvedSharedPayloads]);
  const signature = values.filter(Boolean).join('\u0000');

  useEffect(() => {
    if (isResolving || !signature || handledSignature.current === signature) return;
    handledSignature.current = signature;
    const url = selectCareLocationMapsUrl(...values);
    clearSharedPayloads();
    if (url) {
      router.replace({ pathname: '/(tabs)/care/care-location-form', params: { shareUrl: url } });
    } else {
      setUnsupported(true);
    }
  }, [clearSharedPayloads, isResolving, router, signature, values]);

  useEffect(() => {
    if (isResolving || signature || error || unsupported) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      await refreshSharePayloads();
      if (!cancelled) setEmptyPayloadChecked(true);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [error, isResolving, refreshSharePayloads, signature, unsupported]);

  useEffect(() => {
    if (!emptyPayloadChecked || isResolving || signature || error || unsupported) return;
    clearSharedPayloads();
    router.replace('/');
  }, [clearSharedPayloads, emptyPayloadChecked, error, isResolving, router, signature, unsupported]);

  if (isResolving || (!error && !unsupported)) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}><ActivityIndicator color={t.accent} accessibilityLabel="Reading shared link" /></View>;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: t.background }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 22, color: t.text }}>Maps link not recognised</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: t.textSecondary }}>{error ? 'We couldn’t read this shared item.' : 'Share a single Google Maps or Apple Maps HTTPS link, or copy it and use Paste a Maps link in Care.'}</Text>
      <Pressable onPress={() => router.replace('/(tabs)/care/care-location-form')} accessibilityRole="button" style={{ minHeight: 52, borderRadius: 16, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>Open care locations</Text></Pressable>
    </View>
  );
}
