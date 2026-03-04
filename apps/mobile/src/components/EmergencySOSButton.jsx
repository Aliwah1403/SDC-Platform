import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Linking,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Phone, X, AlertTriangle } from "lucide-react-native";
import { useAppStore } from "../store/appStore";

export default function EmergencySOSButton() {
  const insets = useSafeAreaInsets();
  const [isSOSModalVisible, setSOSModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isCountdownActive, setCountdownActive] = useState(false);

  const countdownInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const { emergencyContacts, setEmergencyMode } = useAppStore();

  const primaryContact =
    emergencyContacts.find((contact) => contact.isPrimary) ||
    emergencyContacts[0];

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEmergencyPress = () => {
    Vibration.vibrate(200);
    startShakeAnimation();
    setSOSModalVisible(true);
    setEmergencyMode(true);
  };

  const startCountdown = () => {
    setCountdownActive(true);
    setCountdown(5);
    startPulseAnimation();
    Vibration.vibrate([500, 500, 500, 500, 500]);

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Countdown finished - trigger emergency call
          clearInterval(countdownInterval.current);
          setCountdownActive(false);
          setSOSModalVisible(false);
          setEmergencyMode(false);
          triggerEmergencyCall();
          return 0;
        }
        Vibration.vibrate(100);
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownInterval.current);
    setCountdownActive(false);
    setCountdown(5);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    Vibration.cancel();
  };

  const closeModal = () => {
    cancelCountdown();
    setSOSModalVisible(false);
    setEmergencyMode(false);
  };

  const triggerEmergencyCall = async () => {
    try {
      // Call primary emergency contact
      const phoneNumber = primaryContact?.phone || "911";
      const telUrl = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;

      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
        Alert.alert(
          "Emergency Call Initiated",
          `Calling ${primaryContact ? primaryContact.name : "Emergency Services"}: ${phoneNumber}`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Cannot Make Call",
          `Unable to call ${phoneNumber}. Please dial manually.`,
          [{ text: "OK" }],
        );
      }

      // In a real app, you would also:
      // - Send SMS to emergency contacts
      // - Share location data
      // - Log the emergency event
      // - Notify healthcare providers
    } catch (error) {
      Alert.alert(
        "Emergency Call Failed",
        "Please dial emergency services manually.",
        [{ text: "OK" }],
      );
    }
  };

  const EmergencyModal = () => (
    <Modal visible={isSOSModalVisible} transparent={true} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: "#CCC2E9", // Cream background
            borderWidth: 2,
            borderColor: "#5D1DD4", // Dark teal border
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 300,
            alignItems: "center",
            transform: [
              { scale: isCountdownActive ? pulseAnim : 1 },
              { translateX: shakeAnim },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: "#7B3CF1", // Orange background
              borderRadius: 40,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={32} color="#CCC2E9" /> {/* Cream icon */}
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#7B3CF1", // Orange text
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Emergency SOS
          </Text>

          {!isCountdownActive ? (
            <>
              <Text
                style={{
                  fontSize: 16,
                  color: "#5D1DD4", // Dark teal text
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 22,
                }}
              >
                This will call emergency services and notify your emergency
                contacts.
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: "#5D1DD4", // Dark teal text
                  opacity: 0.7,
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 20,
                }}
              >
                Primary Contact:{" "}
                {primaryContact ? primaryContact.name : "Emergency Services"}
                {"\n"}
                {primaryContact ? primaryContact.phone : "911"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  width: "100%",
                }}
              >
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    flex: 1,
                    backgroundColor: "#5D1DD4", // Dark teal background
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#CCC2E9", // Cream text
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={startCountdown}
                  style={{
                    flex: 1,
                    backgroundColor: "#7B3CF1", // Orange background
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    shadowColor: "#7B3CF1",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#CCC2E9", // Cream text
                    }}
                  >
                    Start SOS
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 72,
                  fontWeight: "bold",
                  color: "#7B3CF1", // Orange text
                  marginBottom: 12,
                }}
              >
                {countdown}
              </Text>

              <Text
                style={{
                  fontSize: 18,
                  color: "#5D1DD4", // Dark teal text
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Calling emergency services...
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                style={{
                  backgroundColor: "#5D1DD4", // Dark teal background
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#CCC2E9", // Cream text
                  }}
                >
                  Cancel Emergency Call
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        onPress={handleEmergencyPress}
        style={{
          position: "absolute",
          bottom: insets.bottom + 100, // Above tab bar
          right: 20,
          backgroundColor: "#7B3CF1", // Orange background
          borderRadius: 30,
          width: 60,
          height: 60,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#7B3CF1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
          zIndex: 1000,
          borderWidth: 2,
          borderColor: "#5D1DD4", // Dark teal border
        }}
      >
        <Phone size={24} color="#CCC2E9" /> {/* Cream icon */}
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            backgroundColor: "#CCC2E9", // Cream background
            borderRadius: 8,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderWidth: 1,
            borderColor: "#5D1DD4", // Dark teal border
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontWeight: "bold",
              color: "#7B3CF1", // Orange text
            }}
          >
            SOS
          </Text>
        </View>
      </TouchableOpacity>

      <EmergencyModal />
    </>
  );
}
