import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import {
  ChevronLeft,
  ChevronRight,
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
  ExternalLink,
} from "lucide-react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAppStore } from "@/store/appStore";
import { mockFacilities, FACILITY_TYPES } from "@/data/mockFacilities";
import {
  searchNearbyFacilities,
  searchFacilitiesByText,
} from "@/utils/hospitalSearch";
import { saveFacility, unsaveFacility } from "@/services/supabaseQueries";
import { useAuthStore } from "@/utils/auth/store";
import { useQueryClient } from "@tanstack/react-query";
import { useSavedFacilitiesQuery } from "@/hooks/queries/useSavedFacilitiesQuery";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
  "Saved",
  FACILITY_TYPES.HOSPITAL,
  FACILITY_TYPES.URGENT_CARE,
  FACILITY_TYPES.CLINIC,
  FACILITY_TYPES.SCD_SPECIALIST,
];

// ── Search result card ────────────────────────────────────────────────────────
function SearchResultCard({ facility, userLocation, isSaved, onAdd, onPress }) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const distance = userLocation
    ? distanceMiles(
        userLocation.lat,
        userLocation.lng,
        facility.lat,
        facility.lng,
      ).toFixed(1)
    : null;

  return (
    <TouchableOpacity
      style={styles.searchCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>
          {facility.name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
              {facility.type}
            </Text>
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
        onPress={() => !isSaved && onAdd(facility)}
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
function FacilityCard({
  facility,
  userLocation,
  isFavourite,
  onToggleFavourite,
  onPress,
}) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const distance = userLocation
    ? distanceMiles(
        userLocation.lat,
        userLocation.lng,
        facility.lat,
        facility.lng,
      ).toFixed(1)
    : null;

  const handleCall = () => Linking.openURL(`tel:${facility.phone}`);
  const handleDirections = () => {
    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const query = encodeURIComponent(facility.address);
    Linking.openURL(
      `${scheme}?q=${query}&daddr=${facility.lat},${facility.lng}`,
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{facility.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
              {facility.scdSpecialist &&
              facility.type !== FACILITY_TYPES.SCD_SPECIALIST
                ? `${facility.type} · SCD`
                : facility.type}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggleFavourite(facility)}
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
          <Text style={[styles.actionBtnText, { color: "#A9334D" }]}>
            Directions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnFilled]}
          onPress={handleCall}
        >
          <Phone size={16} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
            Call Now
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Facility map marker ───────────────────────────────────────────────────────
function FacilityMarker({ facility, isSelected, showLabel }) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    if (isSelected) {
      loopRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 2.4, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.6);
    }
    return () => loopRef.current?.stop();
  }, [isSelected]);

  const size = isSelected ? 38 : 30;
  const iconSize = isSelected ? 17 : 13;
  const Icon = facility.scdSpecialist ? Star : facility.type === FACILITY_TYPES.HOSPITAL ? Plus : Heart;

  return (
    <View style={{ alignItems: "center" }}>
      {/* Pulse ring */}
      {isSelected && (
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: cfg.color,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          }}
        />
      )}

      {/* Pin body */}
      <View
        style={[
          styles.markerPin,
          {
            backgroundColor: cfg.color,
            width: size,
            height: size,
            borderRadius: isSelected ? size / 2 : 10,
          },
          isSelected && styles.markerPinSelected,
        ]}
      >
        <Icon size={iconSize} color="#FFFFFF" fill={facility.scdSpecialist ? "#FFFFFF" : "none"} strokeWidth={2.5} />
      </View>

      {/* Bottom pointer */}
      <View style={[styles.markerPointer, { borderTopColor: cfg.color }]} />

      {/* Name label */}
      {(showLabel || isSelected) && (
        <View style={[styles.markerLabel, isSelected && { backgroundColor: cfg.color }]}>
          <Text
            style={[styles.markerLabelText, isSelected && { color: "#fff" }]}
            numberOfLines={1}
          >
            {facility.name}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────
const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function todayAbbr() {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
}

// ── Facility sheet content (map view bottom sheet) ───────────────────────────
function FacilitySheetContent({
  facility,
  userLocation,
  isFavourite,
  onToggleFavourite,
  onNavigateToDetail,
}) {
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };
  const distance = userLocation
    ? distanceMiles(
        userLocation.lat,
        userLocation.lng,
        facility.lat,
        facility.lng,
      ).toFixed(1)
    : null;
  const today = todayAbbr();
  const todayHours = facility.weeklyHours?.find((h) => h.day === today);
  const sortedHours = facility.weeklyHours
    ? [...facility.weeklyHours].sort(
        (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day),
      )
    : [];

  const handleCall = () => Linking.openURL(`tel:${facility.phone}`);
  const handleDirections = () => {
    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    Linking.openURL(
      `${scheme}?q=${encodeURIComponent(facility.address)}&daddr=${facility.lat},${facility.lng}`,
    );
  };

  const todayOpen = todayHours?.hours !== "Closed";
  const todayLabel =
    todayHours?.hours === "Open 24 hours"
      ? "Open 24h"
      : todayHours?.hours === "Closed"
        ? "Closed today"
        : todayHours
          ? `Today ${todayHours.hours}`
          : null;

  return (
    <View style={styles.sheetWrap}>
      {/* ── Always visible at small snap ── */}
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetName}>{facility.name}</Text>
          <View style={styles.sheetBadgesRow}>
            <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.typeBadgeText, { color: cfg.color }]}>
                {facility.type}
              </Text>
            </View>
            {facility.scdSpecialist &&
              facility.type !== FACILITY_TYPES.SCD_SPECIALIST && (
                <View
                  style={[styles.typeBadge, { backgroundColor: "#F8E9E7" }]}
                >
                  <Star size={10} color="#A9334D" fill="#A9334D" />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: "#A9334D", marginLeft: 3 },
                    ]}
                  >
                    SCD
                  </Text>
                </View>
              )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavourite(facility)}
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

      <View style={styles.sheetMetaRow}>
        {distance && (
          <View style={styles.metaChip}>
            <Navigation size={11} color="#A9334D" />
            <Text style={styles.metaChipText}>{distance} mi away</Text>
          </View>
        )}
        {facility.rating && (
          <View style={styles.metaChip}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.metaChipText}>{facility.rating}</Text>
          </View>
        )}
        {todayLabel && (
          <View
            style={[
              styles.metaChip,
              { backgroundColor: todayOpen ? "#F0FDF4" : "#FEF2F2" },
            ]}
          >
            <Clock size={11} color={todayOpen ? "#059669" : "#DC2626"} />
            <Text
              style={[
                styles.metaChipText,
                { color: todayOpen ? "#059669" : "#DC2626" },
              ]}
            >
              {todayLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sheetDivider} />

      {/* ── Visible at mid snap ── */}
      <TouchableOpacity style={styles.sheetRow} onPress={handleDirections}>
        <View style={styles.sheetRowIcon}>
          <MapPin size={16} color="#A9334D" />
        </View>
        <Text style={styles.sheetRowText} numberOfLines={2}>
          {facility.address}
        </Text>
        <Text style={styles.sheetRowAction}>Directions</Text>
      </TouchableOpacity>

      <View style={styles.sheetRowDivider} />

      <TouchableOpacity style={styles.sheetRow} onPress={handleCall}>
        <View style={styles.sheetRowIcon}>
          <Phone size={16} color="#A9334D" />
        </View>
        <Text style={styles.sheetRowText}>{facility.phone}</Text>
        <Text style={styles.sheetRowAction}>Call</Text>
      </TouchableOpacity>

      {facility.website && (
        <>
          <View style={styles.sheetRowDivider} />
          <TouchableOpacity
            style={styles.sheetRow}
            onPress={() => Linking.openURL(facility.website)}
          >
            <View style={styles.sheetRowIcon}>
              <ExternalLink size={16} color="#A9334D" />
            </View>
            <Text style={styles.sheetRowText} numberOfLines={1}>
              {facility.website.replace(/^https?:\/\//, "")}
            </Text>
            <Text style={styles.sheetRowAction}>Open</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={[styles.sheetDivider, { marginTop: 16 }]} />

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutlined]}
          onPress={handleDirections}
        >
          <Navigation size={16} color="#A9334D" />
          <Text style={[styles.actionBtnText, { color: "#A9334D" }]}>
            Directions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnFilled]}
          onPress={handleCall}
        >
          <Phone size={16} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
            Call Now
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sheetDivider, { marginVertical: 20 }]} />

      {/* ── Visible at full snap ── */}
      {facility.description && (
        <>
          <Text style={styles.sheetSectionLabel}>About</Text>
          <Text style={styles.sheetDescription}>{facility.description}</Text>
          <View style={[styles.sheetDivider, { marginVertical: 20 }]} />
        </>
      )}

      {sortedHours.length > 0 && (
        <>
          <Text style={styles.sheetSectionLabel}>Opening Hours</Text>
          <View style={styles.sheetHoursTable}>
            {sortedHours.map((h, i) => (
              <View key={h.day}>
                <View
                  style={[
                    styles.sheetHoursRow,
                    h.day === today && styles.sheetHoursRowToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.hoursDay,
                      h.day === today && styles.hoursDayToday,
                    ]}
                  >
                    {h.day}
                  </Text>
                  <Text
                    style={[
                      styles.hoursValue,
                      h.day === today && styles.hoursValueToday,
                      h.hours === "Closed" && styles.hoursValueClosed,
                    ]}
                  >
                    {h.hours}
                  </Text>
                  {h.day === today && <View style={styles.todayDot} />}
                </View>
                {i < sortedHours.length - 1 && (
                  <View style={styles.sheetRowDivider} />
                )}
              </View>
            ))}
          </View>
          <View style={[styles.sheetDivider, { marginVertical: 20 }]} />
        </>
      )}

      <TouchableOpacity
        style={styles.viewProfileBtn}
        onPress={onNavigateToDetail}
      >
        <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
        <ChevronRight size={16} color="#A9334D" />
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FacilitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    toggleSavedFacility,
    facilitiesCache,
    setFacilitiesCache,
    setPlaceDetails,
  } = useAppStore();
  const { auth } = useAuthStore();
  const userId = auth?.user?.id ?? null;
  const queryClient = useQueryClient();
  const { data: savedFacilities = [] } = useSavedFacilitiesQuery();

  const [view, setView] = useState("list"); // "map" | "list"
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState(null);

  // ── Real-data state ──────────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState([]); // current list (real or mock)
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Search state (driven by API when real data is available)
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);

  const [mapLatDelta, setMapLatDelta] = useState(0.08);

  const searchRef = useRef(null);
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["20%", "52%", "92%"], []);
  const hasApiKey = !!process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

  const showMarkerLabels = mapLatDelta < 0.04;

  // Close the sheet when user switches away from map view
  useEffect(() => {
    if (view !== "map") {
      bottomSheetRef.current?.close();
      setSelectedFacility(null);
    }
  }, [view]);

  // Toggle save — optimistic update + background Supabase sync
  const handleToggleSave = useCallback(
    (facility) => {
      const alreadySaved = savedFacilities.some((f) => f.placeId === facility.placeId);
      toggleSavedFacility(facility);
      if (!userId) return;
      if (alreadySaved) {
        unsaveFacility(userId, facility.placeId)
          .then(() => queryClient.invalidateQueries({ queryKey: ['savedFacilities', userId] }))
          .catch(() => toggleSavedFacility(facility));
      } else {
        saveFacility(userId, facility)
          .then(() => queryClient.invalidateQueries({ queryKey: ['savedFacilities', userId] }))
          .catch(() => toggleSavedFacility(facility));
      }
    },
    [userId, savedFacilities, toggleSavedFacility, queryClient]
  );

  const isSearchMode = searchQuery.trim().length > 0;

  // ── Location fetch + initial data load ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationDenied(true);
          if (!hasApiKey) setFacilities(mockFacilities);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        await loadNearby(loc);
      } catch {
        setLocationDenied(true);
        if (!hasApiKey) setFacilities(mockFacilities);
      }
    })();
  }, []);

  // Load nearby facilities — checks cache first (30 min TTL)
  const loadNearby = useCallback(
    async (loc) => {
      if (!hasApiKey) {
        setFacilities(mockFacilities);
        return;
      }
      const cacheKey = `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
      const cached = facilitiesCache[cacheKey];
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setFacilities(cached.facilities);
        setNextPageToken(cached.nextPageToken ?? null);
        return;
      }
      setLoadingFacilities(true);
      setApiError(null);
      try {
        const { facilities: results, nextPageToken: token } =
          await searchNearbyFacilities(loc.lat, loc.lng);
        setFacilities(results);
        setNextPageToken(token);
        setFacilitiesCache(cacheKey, {
          facilities: results,
          nextPageToken: token,
        });
        // Pre-populate individual detail cache
        results.forEach((f) => setPlaceDetails(f.id, f));
      } catch (err) {
        setApiError(err.message);
        console.log("Places API Error: ", err?.message, err);
        setFacilities(mockFacilities); // graceful fallback
      } finally {
        setLoadingFacilities(false);
      }
    },
    [facilitiesCache, setFacilitiesCache, setPlaceDetails, hasApiKey],
  );

  // Load more results (text search with nextPageToken)
  const loadMore = useCallback(async () => {
    if (!nextPageToken || loadingMore || !userLocation) return;
    setLoadingMore(true);
    try {
      const { facilities: more, nextPageToken: token } =
        await searchFacilitiesByText(
          searchQuery.trim() || null,
          userLocation.lat,
          userLocation.lng,
          nextPageToken,
        );
      setFacilities((prev) => {
        const ids = new Set(prev.map((f) => f.id));
        return [...prev, ...more.filter((f) => !ids.has(f.id))];
      });
      setNextPageToken(token);
      more.forEach((f) => setPlaceDetails(f.id, f));
    } catch {
      // silently ignore load-more errors
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, loadingMore, userLocation, searchQuery, setPlaceDetails]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    if (!hasApiKey || !userLocation) {
      // Local filter fallback
      const lower = q.toLowerCase();
      setSearchResults(
        facilities.filter(
          (f) =>
            f.name.toLowerCase().includes(lower) ||
            f.address.toLowerCase().includes(lower) ||
            f.type.toLowerCase().includes(lower),
        ),
      );
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { facilities: results } = await searchFacilitiesByText(
          q,
          userLocation.lat,
          userLocation.lng,
        );
        setSearchResults(results);
        results.forEach((f) => setPlaceDetails(f.id, f));
      } catch {
        // Fall back to local filter on search error
        const lower = q.toLowerCase();
        setSearchResults(
          facilities.filter(
            (f) =>
              f.name.toLowerCase().includes(lower) ||
              f.address.toLowerCase().includes(lower) ||
              f.type.toLowerCase().includes(lower),
          ),
        );
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, userLocation, hasApiKey, facilities, setPlaceDetails]);

  // Nearby filtered + sorted facilities (used when not in search mode)
  const filtered = (activeFilter === "Saved" ? savedFacilities : facilities)
    .filter((f) => {
      if (activeFilter === "All" || activeFilter === "Saved") return true;
      if (activeFilter === FACILITY_TYPES.SCD_SPECIALIST)
        return f.scdSpecialist;
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
    [router, userLocation],
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
    : {
        latitude: 25.2048,
        longitude: 55.2708,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Title row */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#09332C" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Clinics & Hospitals</Text>

          {/* Map / List toggle — hidden in search mode */}
          {!isSearchMode && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  view === "list" && styles.toggleBtnActive,
                ]}
                onPress={() => setView("list")}
              >
                <List
                  size={16}
                  color={view === "list" ? "#FFFFFF" : "rgba(9,51,44,0.5)"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  view === "map" && styles.toggleBtnActive,
                ]}
                onPress={() => setView("map")}
              >
                <Map
                  size={16}
                  color={view === "map" ? "#FFFFFF" : "rgba(9,51,44,0.5)"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search
            size={17}
            color="rgba(9,51,44,0.4)"
            style={{ marginRight: 8 }}
          />
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
                style={[
                  styles.filterChip,
                  activeFilter === f && styles.filterChipActive,
                ]}
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

        {/* Location denied / API error banners */}
        {locationDenied && !isSearchMode && (
          <View style={styles.locationBanner}>
            <MapPin size={14} color="#A9334D" />
            <Text style={styles.locationBannerText}>
              Location unavailable — showing all facilities
            </Text>
          </View>
        )}
        {apiError && !isSearchMode && (
          <View style={[styles.locationBanner, { backgroundColor: "#FEF2F2" }]}>
            <Text style={[styles.locationBannerText, { color: "#DC2626" }]}>
              Couldn't load live data — showing saved results
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
              isSaved={savedFacilities.some((f) => f.placeId === item.id)}
              onAdd={handleToggleSave}
              onPress={() => navigateToDetail(item)}
            />
          )}
          ListEmptyComponent={
            searchLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#A9334D" />
                <Text style={[styles.emptyStateSubtext, { marginTop: 12 }]}>
                  Searching…
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Search size={40} color="rgba(9,51,44,0.2)" />
                <Text style={styles.emptyStateText}>
                  No results for "{searchQuery}"
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Try a hospital name, area, or type
                </Text>
              </View>
            )
          }
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.searchResultsLabel}>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} found
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
              isFavourite={savedFacilities.some((f) => f.placeId === item.id)}
              onToggleFavourite={handleToggleSave}
              onPress={() => navigateToDetail(item)}
            />
          )}
          ListEmptyComponent={
            loadingFacilities ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#A9334D" />
                <Text style={[styles.emptyStateSubtext, { marginTop: 12 }]}>
                  Finding nearby facilities…
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MapPin size={40} color="rgba(9,51,44,0.2)" />
                <Text style={styles.emptyStateText}>
                  No facilities match this filter.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            nextPageToken ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#A9334D" />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </TouchableOpacity>
            ) : null
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
            onRegionChangeComplete={(region) => setMapLatDelta(region.latitudeDelta)}
          >
            {filtered.map((facility) => {
              const isSelected = selectedFacility?.id === facility.id;
              return (
                <Marker
                  key={facility.id}
                  coordinate={{ latitude: facility.lat, longitude: facility.lng }}
                  tracksViewChanges={isSelected}
                  onPress={() => {
                    setSelectedFacility(facility);
                    bottomSheetRef.current?.snapToIndex(1);
                  }}
                >
                  <FacilityMarker
                    facility={facility}
                    isSelected={isSelected}
                    showLabel={showMarkerLabels}
                  />
                </Marker>
              );
            })}
          </MapView>

          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={() => setSelectedFacility(null)}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.sheetHandleBar}
          >
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            >
              {selectedFacility && (
                <FacilitySheetContent
                  facility={selectedFacility}
                  userLocation={userLocation}
                  isFavourite={savedFacilities.some((f) => f.placeId === selectedFacility.id)}
                  onToggleFavourite={handleToggleSave}
                  onNavigateToDetail={() => navigateToDetail(selectedFacility)}
                />
              )}
            </BottomSheetScrollView>
          </BottomSheet>
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

  // Map marker (legacy — kept for reference)
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

  // FacilityMarker
  markerPin: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPinSelected: {
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  markerLabel: {
    marginTop: 3,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 10,
    color: "#09332C",
  },

  // Load more
  loadMoreBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(169,51,77,0.2)",
  },
  loadMoreText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#A9334D",
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

  // ── Bottom sheet ────────────────────────────────────────────────────────────
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#09332C",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(9,51,44,0.15)",
  },
  sheetWrap: { paddingHorizontal: 20, paddingTop: 8 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  sheetName: {
    fontFamily: "Geist_700Bold",
    fontSize: 19,
    color: "#09332C",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  sheetBadgesRow: { flexDirection: "row", gap: 6 },
  sheetMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  sheetDivider: { height: 1, backgroundColor: "rgba(9,51,44,0.07)" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  sheetRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#F8E9E7",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowText: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#09332C",
  },
  sheetRowAction: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
    color: "#A9334D",
  },
  sheetRowDivider: { height: 1, backgroundColor: "rgba(9,51,44,0.05)" },
  sheetSectionLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 12,
    color: "rgba(9,51,44,0.4)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sheetDescription: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "rgba(9,51,44,0.7)",
    lineHeight: 22,
    marginBottom: 4,
  },
  sheetHoursTable: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8F4F0",
  },
  sheetHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sheetHoursRowToday: { backgroundColor: "#FFF5F5" },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#A9334D",
  },
  viewProfileBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#A9334D",
  },
});
