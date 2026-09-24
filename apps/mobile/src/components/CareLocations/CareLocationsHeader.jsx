import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/utils/fonts';
import { getGradientColors } from '@/utils/homeHelpers';

export default function CareLocationsHeader({
  title,
  subtitle,
  onBack,
  actionIcon = null,
  onAction,
  actionLabel,
}) {
  const insets = useSafeAreaInsets();
  const t = useTheme();

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={getGradientColors(true, t.isDark)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' }}
      >
        <View pointerEvents="none" style={{ position: 'absolute', width: 180, height: 180, borderRadius: 999, backgroundColor: '#D09F9A', opacity: 0.15, top: -60, right: -40 }} />
        <View pointerEvents="none" style={{ position: 'absolute', width: 120, height: 120, borderRadius: 999, backgroundColor: '#781D11', opacity: 0.15, bottom: -20, left: -30 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={4}
            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}
          >
            <ChevronLeft size={24} color="#F8E9E7" />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 22, color: '#F8E9E7', textAlign: 'center' }}>{title}</Text>
            {subtitle ? <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(248,233,231,0.6)', marginTop: 2, textAlign: 'center' }}>{subtitle}</Text> : null}
          </View>

          {onAction ? (
            <Pressable
              onPress={onAction}
              accessibilityLabel={actionLabel}
              accessibilityRole="button"
              hitSlop={4}
              style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}
            >
              {actionIcon}
            </Pressable>
          ) : <View style={{ width: 40, height: 40 }} />}
        </View>
      </LinearGradient>
    </>
  );
}
