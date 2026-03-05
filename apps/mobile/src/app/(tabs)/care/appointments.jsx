import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
} from "lucide-react-native";
import { mockAppointments } from "../../../types";

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get next 7 days for calendar strip
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString("en", { weekday: "short" }),
        dayNumber: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  const days = getNext7Days();

  const CalendarDay = ({ day }) => (
    <TouchableOpacity
      style={{
        backgroundColor: day.isToday ? "#2563EB" : "#ffffff",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        marginRight: 12,
        minWidth: 60,
        borderWidth: 1,
        borderColor: day.isToday ? "#2563EB" : "#E5E7EB",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: day.isToday ? "#ffffff" : "#6B7280",
          marginBottom: 4,
        }}
      >
        {day.dayName}
      </Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: day.isToday ? "#ffffff" : "#111827",
        }}
      >
        {day.dayNumber}
      </Text>
    </TouchableOpacity>
  );

  const AppointmentCard = ({ appointment }) => {
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const getTypeColor = (type) => {
      switch (type) {
        case "urgent":
          return "#EF4444";
        case "routine":
          return "#059669";
        case "follow-up":
          return "#A9334D";
        default:
          return "#6B7280";
      }
    };

    return (
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
              }}
            >
              {appointment.title}
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: "#666",
                marginBottom: 4,
              }}
            >
              Dr. {appointment.doctor}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: `${getTypeColor(appointment.type)}15`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: getTypeColor(appointment.type),
                textTransform: "capitalize",
              }}
            >
              {appointment.type}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Calendar size={16} color="#666" />
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginLeft: 8,
              }}
            >
              {formattedDate}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={16} color="#666" />
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginLeft: 8,
              }}
            >
              {appointment.time}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MapPin size={16} color="#666" />
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginLeft: 8,
                flex: 1,
              }}
            >
              {appointment.facility}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#1a1a1a",
              }}
            >
              Appointments
            </Text>
          </View>
        </View>

        {/* Calendar Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          style={{ flexGrow: 0 }}
        >
          {days.map((day, index) => (
            <CalendarDay key={index} day={day} />
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            shadowColor: "#2563EB",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#ffffff",
              marginLeft: 8,
            }}
          >
            Schedule Appointment
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: 16,
          }}
        >
          Upcoming Appointments
        </Text>

        {mockAppointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </ScrollView>
    </View>
  );
}
