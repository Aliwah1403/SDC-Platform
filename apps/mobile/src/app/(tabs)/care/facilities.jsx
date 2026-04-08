import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Heart,
  Star,
  X,
  List,
  Map,
  Search,
  Check,
  Plus,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { mockFacilities, FACILITY_TYPES } from "@/data/mockFacilities";

// ── Haversine distance in miles ──────────────────────────────────────────────
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  [FACILITY_TYPES.HOSPITAL]: { color: "#DC2626", bg: "#FEE2E2" },
  [FACILITY_TYPES.URGENT_CARE]: { color: "#A9334D", bg: "#F8E9E7" },
  [FACILITY_TYPES.CLINIC]: { color: "#059669", bg: "#D1FAE5" },
  [FACILITY_TYPES.SCD_SPECIALIST]: { color: "#09332C", bg: "#F8E9E7" },
};

const FILTERS = [
  "All",
  FACILITY_TYPES.HOSPITAL,
  FACILITY_TYPES.URGENT_CARE,
  FACILITY_TYPES.CLINIC,
  FACILITY_TYPES.SCD_SPECIALIST,
];

// ── Search result card ────────────────────────────────────────────────────────
function SearchResultCard({ facility, userLocation, isSaved, onAdd, onPress }) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const distance = userLocation
    ? distanceMiles(userLocation.lat, userLocation.lng, facility.lat, facility.lng).toFixed(1)
    : null;

  return (
    <TouchableOpacity style={styles.searchCard} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>
          {facility.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{facility.type}</Text>
          </View>
          {distance && (
            <View style={styles.metaChip}>
              <Navigation size={11} color="#A9334D" />
              <Text style={styles.metaChipText}>{distance} mi</Text>
            </View>
          )}
        </View>
        <Text style={styles.detailText} numberOfLines={1}>
          {facility.address}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => !isSaved && onAdd(facility.id)}
        style={[styles.addBtn, isSaved && styles.addBtnSaved]}
        activeOpacity={isSaved ? 1 : 0.7}
      >
        {isSaved ? (
          <>
            <Check size={14} color="#059669" strokeWidth={2.5} />
            <Text style={[styles.addBtnText, { color: "#059669" }]}>Saved</Text>
          </>
        ) : (
          <>
            <Plus size={14} color="#A9334D" strokeWidth={2.5} />
            <Text style={[styles.addBtnText, { color: "#A9334D" }]}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Facility card (list view) ─────────────────────────────────────────────────
function FacilityCard({ facility, userLocation, isFavourite, onToggleFavourite, onPress }) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const distance = userLocation
    ? distanceMiles(userLocation.lat, userLocation.lng, facility.lat, facility.lng).toFixed(1)
    : null;

  const handleCall = () => Linking.openURL(`tel:${facility.phone}`);
  const handleDirections = () => {
    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const query = encodeURIComponent(facility.address);
    Linking.openURL(`${scheme}?q=${query}&daddr=${facility.lat},${facility.lng}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{facility.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
              {facility.scdSpecialist && facility.type !== FACILITY_TYPES.SCD_SPECIALIST
                ? `${facility.type} · SCD`
                : facility.type}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggleFavourite(facility.id)}
          style={styles.heartBtn}
          hitSlop={10}
        >
          <Heart
            size={22}
            color={isFavourite ? "#A9334D" : "#C4C4C4"}
            fill={isFavourite ? "#A9334D" : "transparent"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MapPin size={15} color="rgba(9,51,44,0.4)" />
          <Text style={styles.detailText}>{facility.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Phone size={15} color="rgba(9,51,44,0.4)" />
          <Text style={styles.detailText}>{facility.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={15} color="rgba(9,51,44,0.4)" />
          <Text style={styles.detailText}>{facility.hours}</Text>
        </View>
      </View>

      {/* Distance + rating */}
      {(distance || facility.rating) && (
        <View style={styles.metaRow}>
          {distance && (
            <View style={styles.metaChip}>
              <Navigation size={12} color="#A9334D" />
              <Text style={styles.metaChipText}>{distance} mi away</Text>
            </View>
          )}
          {facility.rating && (
            <View style={styles.metaChip}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.metaChipText}>{facility.rating}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutlined]}
          onPress={handleDirections}
        >
          <Navigation size={16} color="#A9334D" />
          <Text style={[styles.actionBtnText, { color: "#A9334D" }]}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnFilled]}
          onPress={handleCall}
        >
          <Phone size={16} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FacilitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onboardingData, favouriteHospitalIds, toggleFavouriteHospital } = useAppStore();

  const [view, setView] = useState("list"); // "map" | "list"
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const mapRef = useRef(null);

  const isSearchMode = searchQuery.trim().length > 0;

  // Fetch location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationDenied(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setLocationDenied(true);
      }
    })();
  }, []);

  // Search results — match against name, address, type across all facilities
  const searchResults = isSearchMode
    ? mockFacilities.filter((f) => {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q)
        );
      })
    : [];

  // Nearby filtered + sorted facilities (used when not in search mode)
  const filtered = mockFacilities
    .filter((f) => {
      if (activeFilter === "All") return true;
      if (activeFilter === FACILITY_TYPES.SCD_SPECIALIST) return f.scdSpecialist;
      return f.type === activeFilter;
    })
    .sort((a, b) => {
      if (!userLocation) return 0;
      return (
        distanceMiles(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceMiles(userLocation.lat, userLocation.lng, b.lat, b.lng)
      );
    });

  const navigateToDetail = useCallback(
    (facility) => {
      router.push({
        pathname: "/facility-detail",
        params: {
          id: facility.id,
          ...(userLocation && {
            userLat: String(userLocation.lat),
            userLng: String(userLocation.lng),
          }),
        },
      });
    },
    [router, userLocation]
  );

  const handleClearSearch = () => {
    setSearchQuery("");
    searchRef.current?.blur();
  };

  const mapRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : { latitude: 25.2048, longitude: 55.2708, latitudeDelta: 0.12, longitudeDelta: 0.12 };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Title row */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#09332C" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Clinics & Hospitals</Text>

          {/* Map / List toggle — hidden in search mode */}
          {!isSearchMode && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, view === "list" && styles.toggleBtnActive]}
                onPress={() => setView("list")}
              >
                <List size={16} color={view === "list" ? "#FFFFFF" : "rgba(9,51,44,0.5)"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, view === "map" && styles.toggleBtnActive]}
                onPress={() => setView("map")}
              >
                <Map size={16} color={view === "map" ? "#FFFFFF" : "rgba(9,51,44,0.5)"} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search size={17} color="rgba(9,51,44,0.4)" style={{ marginRight: 8 }} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search hospitals, clinics..."
            placeholderTextColor="rgba(9,51,44,0.35)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {isSearchMode && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={10}>
              <X size={16} color="rgba(9,51,44,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips — only shown when not searching */}
        {!isSearchMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Location denied banner */}
        {locationDenied && !isSearchMode && (
          <View style={styles.locationBanner}>
            <MapPin size={14} color="#A9334D" />
            <Text style={styles.locationBannerText}>
              Location unavailable — showing all facilities
            </Text>
          </View>
        )}
      </View>

      {/* ── Search results ── */}
      {isSearchMode ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SearchResultCard
              facility={item}
              userLocation={userLocation}
              isSaved={favouriteHospitalIds.includes(item.id)}
              onAdd={toggleFavouriteHospital}
              onPress={() => navigateToDetail(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Search size={40} color="rgba(9,51,44,0.2)" />
              <Text style={styles.emptyStateText}>
                No results for "{searchQuery}"
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Try a hospital name, area, or type
              </Text>
            </View>
          }
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.searchResultsLabel}>
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
        />
      ) : view === "list" ? (
        /* ── List view ── */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FacilityCard
              facility={item}
              userLocation={userLocation}
              isFavourite={favouriteHospitalIds.includes(item.id)}
              onToggleFavourite={toggleFavouriteHospital}
              onPress={() => navigateToDetail(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MapPin size={40} color="rgba(9,51,44,0.2)" />
              <Text style={styles.emptyStateText}>No facilities match this filter.</Text>
            </View>
          }
        />
      ) : (
        /* ── Map view ── */
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            showsUserLocation={!locationDenied}
            showsMyLocationButton={false}
          >
            {filtered.map((facility) => {
              const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
              return (
                <Marker
                  key={facility.id}
                  coordinate={{ latitude: facility.lat, longitude: facility.lng }}
                  onPress={() => navigateToDetail(facility)}
                >
                  <View style={[styles.mapMarker, { backgroundColor: cfg.color }]}>
                    {facility.scdSpecialist ? (
                      <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <MapPin size={12} color="#FFFFFF" fill="#FFFFFF" />
                    )}
                  </View>
                </Marker>
              );
            })}
          </MapView>

        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F4F0" },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(9,51,44,0.07)",
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F4F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Geist_700Bold",
    fontSize: 20,
    color: "#09332C",
    letterSpacing: -0.4,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: { backgroundColor: "#A9334D" },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4F0",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(9,51,44,0.08)",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#09332C",
    padding: 0,
  },

  // Filters
  filterRow: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F8F4F0",
    borderWidth: 1,
    borderColor: "rgba(9,51,44,0.1)",
  },
  filterChipActive: { backgroundColor: "#A9334D", borderColor: "#A9334D" },
  filterChipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "rgba(9,51,44,0.6)",
  },
  filterChipTextActive: { color: "#FFFFFF" },

  // Location banner
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBannerText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    color: "#A9334D",
  },

  // Search result card
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#09332C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#A9334D",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnSaved: { borderColor: "#059669", backgroundColor: "#F0FDF4" },
  addBtnText: { fontFamily: "Geist_600SemiBold", fontSize: 13 },

  searchResultsLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "rgba(9,51,44,0.45)",
    marginBottom: 12,
  },

  // Facility card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#09332C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardName: {
    fontFamily: "Geist_700Bold",
    fontSize: 17,
    color: "#09332C",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  heartBtn: { marginLeft: 10, paddingTop: 2 },
  cardDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.6)",
    flex: 1,
  },

  // Meta row
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8F4F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 12,
    color: "#09332C",
  },

  // Action buttons
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnOutlined: { borderWidth: 1.5, borderColor: "#A9334D" },
  actionBtnFilled: { backgroundColor: "#A9334D" },
  actionBtnText: { fontFamily: "Geist_600SemiBold", fontSize: 14 },

  // Map marker
  mapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyStateText: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    color: "rgba(9,51,44,0.5)",
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.35)",
  },
});
