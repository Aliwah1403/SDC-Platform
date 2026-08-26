import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LocateFixed } from 'lucide-react-native';
import { CARE_LOCATION_ROLE_LABELS } from '@/services/supabase/facilities';
import { fonts } from '@/utils/fonts';
import { useTheme } from '@/hooks/useTheme';

const ROLE_COLORS = {
  preferred_ed: '#DC2626',
  regular_scd_clinic: '#A9334D',
  pharmacy: '#059669',
  transfusion_centre: '#7C3AED',
  other: '#6B7280',
};

const ROLE_MARKS = {
  preferred_ed: 'ED',
  regular_scd_clinic: 'SCD',
  pharmacy: 'Rx',
  transfusion_centre: 'Tx',
  other: '•',
};

function coordinateLocations(locations) {
  return locations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

export default function CareLocationsMap({ locations, onSelect, preview = false, onPermissionResult }) {
  const mapRef = useRef(null);
  const t = useTheme();
  const pins = useMemo(() => coordinateLocations(locations), [locations]);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const initialRegion = pins.length
    ? { latitude: pins[0].lat, longitude: pins[0].lng, latitudeDelta: pins.length === 1 ? 0.12 : 0.5, longitudeDelta: pins.length === 1 ? 0.12 : 0.5 }
    : { latitude: 25.2048, longitude: 55.2708, latitudeDelta: 0.3, longitudeDelta: 0.3 };

  async function locateMe() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      onPermissionResult?.(permission.status);
      if (permission.status !== 'granted') {
        Alert.alert('Location not enabled', 'Your saved locations are still available. You can enable location later to show yourself on the map.');
        return;
      }
      setShowUserLocation(true);
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    } catch {
      onPermissionResult?.('error');
      Alert.alert('Couldn’t show your location', 'Your saved locations are still available. Please try again later.');
    }
  }

  return (
    <View style={{ flex: 1, minHeight: preview ? 190 : 400, overflow: 'hidden', borderRadius: preview ? 18 : 0 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        scrollEnabled={!preview}
        zoomEnabled={!preview}
        pitchEnabled={false}
        rotateEnabled={false}
        onMapReady={() => {
          if (pins.length > 1) {
            mapRef.current?.fitToCoordinates(
              pins.map((item) => ({ latitude: item.lat, longitude: item.lng })),
              { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: false },
            );
          }
        }}
        accessibilityLabel="Map of your saved care locations"
      >
        {pins.map((location) => (
          <Marker
            key={location.id}
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title={location.name}
            description={CARE_LOCATION_ROLE_LABELS[location.role]}
            onPress={() => onSelect?.(location)}
            accessibilityLabel={`${location.name}, ${CARE_LOCATION_ROLE_LABELS[location.role] || 'care location'}`}
          >
            <View
              style={{
                minWidth: 36,
                height: 36,
                paddingHorizontal: 6,
                borderRadius: location.role === 'preferred_ed' ? 9 : 18,
                backgroundColor: ROLE_COLORS[location.role] || ROLE_COLORS.other,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: location.role === 'other' ? 22 : 10 }}>
                {ROLE_MARKS[location.role] || ROLE_MARKS.other}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>
      {!preview && (
        <Pressable
          onPress={locateMe}
          accessibilityRole="button"
          accessibilityLabel="Locate me on the map"
          style={({ pressed }) => ({
            position: 'absolute', right: 16, bottom: 24, minHeight: 48, paddingHorizontal: 16,
            borderRadius: 24, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.16)', opacity: pressed ? 0.8 : 1,
          })}
        >
          <LocateFixed size={18} color="#A9334D" />
          <Text style={{ fontFamily: fonts.semibold, color: '#A9334D' }}>Locate me</Text>
        </Pressable>
      )}
    </View>
  );
}
