# SickleCell Compass - Features Documentation

> Last Updated: February 15, 2026 | Version: 1.0.0 • Build 100

## Overview

SickleCell Compass is a comprehensive mobile health management app designed specifically for
individuals with Sickle Cell Disease (SCD). The app empowers users to track symptoms, manage
medications, connect with healthcare providers, and stay informed about their condition.

---

## ✅ Implemented Features

### 🏠 Dashboard (Home Screen)
- **Health Streak Tracking** - Daily tracking streak with visual counter
- **Today's Health Snapshot** - Quick view of pain level, hydration, and mood metrics
- **Weekly Averages** - Automatic calculation of weekly averages for key health metrics
- **Quick Actions** - Shortcuts to log symptoms, check medications, and view health trends
- **Health Articles** - Curated educational content with categories
- **Recent Achievements** - Display of unlocked badges and milestones
- **Personalized Greeting** - Welcome message with user's name
- **Color Scheme** - Custom cream (#F7DFBA), dark teal (#09332C), and orange (#F0531C) theme

### 📊 Symptom Tracking
- **Pain Level Tracking** - 0-10 scale with color-coded intensity indicators
- **Mood Assessment** - 5-level mood selector with emoji indicators (terrible, poor, fair, good, excellent)
- **Body Location Mapping** - Multi-select pain location tracker (Head, Neck, Chest, Back, Abdomen, Arms, Hands, Legs, Feet, Joints)
- **Additional Notes** - Free-text field for triggers, activities, and detailed symptom descriptions
- **Data Persistence** - Logs saved to local state management (Zustand)
- **Reset Functionality** - Clear current symptom log with confirmation
- **Visual Feedback** - Color-coded pain levels with descriptive labels

### 💊 Care & Schedule Management
- **Medication Tracking**
  - List of current medications with dosage and frequency
  - Prescribing physician information
  - Next dose reminders
  - Mark as taken functionality

- **Appointment Management**
  - Upcoming appointments list
  - Doctor and facility information
  - Appointment type categorization (urgent, routine, follow-up)
  - Date and time display

- **Healthcare Facilities**
  - Nearby facility directory
  - Facility type (hospital, urgent-care, clinic)
  - Contact information (phone numbers)
  - Addresses
  - Distance calculation (mock data)

- **Calendar Strip** - 7-day quick view calendar with today highlight
- **Tab Navigation** - Switch between Medications, Appointments, and Facilities
- **Add New Functionality** - Buttons to add medications, appointments, or facilities

### 🎓 Learn & AI Assistant
- **AI Chatbot Interface**
  - Conversational AI for health guidance
  - Message history with timestamps
  - User and assistant message bubbles
  - Typing indicator during AI response
  - Auto-scroll to latest messages

- **Quick Questions** - Pre-defined health topics for quick access
- **Educational Articles** - Recommended reading with categories and read times
- **Chat Management** - Clear conversation history
- **Empty State** - Welcome screen with introduction to AI features

### 🏆 Rewards & Gamification
- **Points System**
  - Total points tracking
  - Points earned per activity (15 points per streak day + base 120)

- **Challenges**
  - Daily, weekly, and monthly challenges
  - Progress tracking with visual progress bars
  - Point rewards per challenge
  - Completion status
  - Expiration countdowns

- **Achievement Badges**
  - Badge collection system
  - Locked/unlocked states
  - Recently unlocked badge showcase
  - Badge descriptions and icons

- **Community Leaderboard**
  - Weekly rankings
  - User position highlighting
  - Streak and points comparison
  - Community statistics (active users, average streak, total logs)

### 👤 Profile & Health Records
- **User Profile**
  - Name, age, and SCD type display
  - Member since date
  - Profile statistics (streak, total logs, badges, days active)
  - Profile editing capability (UI only)

- **Quick Actions**
  - Export health data to PDF
  - Share health summary
  - Emergency contacts management (UI only)

- **Health Records** (Expandable sections)
  - Diagnosis Information (diagnosis, date, physician, status)
  - Current Medications (medication list, dosages, review dates)
  - Allergies & Reactions (drug, environmental, food allergies)
  - Vaccination History (vaccination records and status)

- **Achievements Display** - Horizontal scrollable badge collection
- **Settings & Support** - App settings, help, and sign out options
- **App Information** - Version and build number display

### 🚨 Emergency SOS System
- **Emergency SOS Button**
  - Floating action button accessible from all screens
  - Positioned above tab bar (right side)
  - Visual SOS badge indicator

- **Emergency Modal**
  - Warning and confirmation screen
  - 5-second countdown before call
  - Visual pulse and shake animations
  - Haptic feedback
  - Cancel option during countdown

- **Emergency Contact Integration**
  - Primary contact calling
  - Emergency services fallback (911)
  - Contact name and number display

- **Emergency Mode State** - App-wide emergency mode tracking

### 🎨 UI/UX Features
- **Tab Navigation** - 6 main tabs (Dashboard, Symptoms, Care, Learn, Rewards, Profile)
- **Safe Area Handling** - Proper insets for notches and device variations
- **Responsive Design** - Adaptive layouts for different screen sizes
- **Icon System** - Lucide React Native icons throughout
- **Color-Coded Sections** - Consistent color scheme for different features
- **Shadow Effects** - Depth and elevation for cards and buttons
- **Loading States** - Visual feedback during AI responses
- **Empty States** - Helpful messaging when no data exists
- **Animations** - Smooth transitions and micro-interactions

### 💾 State Management
- **Zustand Store** - Centralized app state management
- **User State** - Current user data and authentication status
- **Health Data** - Historical health tracking data
- **Symptom Logs** - Current and submitted symptom logs
- **Emergency Contacts** - Emergency contact list management
- **Chat History** - AI conversation persistence
- **Streak Tracking** - Health streak calculation and updates

### 📱 Navigation
- **Tab-based Navigation** - Bottom tab bar with 6 tabs
- **Expo Router** - File-based routing system
- **Redirect Logic** - Index page redirects to main tabs
- **Deep Linking Ready** - Structure supports deep linking

---

## 🔧 Technical Stack

### Frontend
- **Framework:** React Native with Expo
- **Routing:** Expo Router (file-based)
- **State Management:** Zustand
- **Icons:** Lucide React Native
- **Animations:** React Native Animated API
- **Safe Areas:** react-native-safe-area-context

### Backend Integration
- **Authentication:** Email/password via NextAuth.js
- **Database:** PostgreSQL (auth tables configured)

### Design System
- **Primary Colors:**
  - Cream: #F7DFBA
  - Dark Teal: #09332C
  - Orange: #F0531C
  - Red: #DC2626
  - Green: #059669
  - Purple: #7C3AED

---

## 📊 Mock Data

The following features use mock/static data (not connected to backend):

- Health metrics and historical data
- Medication list
- Appointment list
- Healthcare facilities
- Educational articles
- AI chat responses (simulated, not real AI)
- Badges and achievements
- Challenges
- Leaderboard rankings
- Emergency contacts
- User profile data
- Health records

---

## 🚧 UI-Only Features (Not Fully Functional)

- **Add New Items** - Buttons exist but don't open forms
- **Emergency Contact Management** - Shows alert, no actual management
- **Export Health Data** - Shows alert, no actual PDF generation
- **App Settings** - Shows alert, no settings page
- **Help & Support** - Shows alert, no support system
- **Sign Out** - Shows alert, no actual sign out implementation
- **Article Reading** - Cards exist but don't open articles
- **Edit Profile** - Button exists but doesn't open editor

---

## 🎯 User Journey

1. **Onboarding** - User opens app and is redirected to dashboard (onboarding skipped)
2. **Daily Check-in** - User navigates to Symptoms tab to log current state
3. **View Progress** - Dashboard shows streak, averages, and achievements
4. **Manage Care** - Care tab allows tracking of medications and appointments
5. **Learn** - Learn tab provides AI guidance and educational content
6. **Earn Rewards** - Rewards tab shows challenges, badges, and leaderboard
7. **Emergency Access** - SOS button available from any screen
8. **Profile Management** - Profile tab shows health records and settings

---

## 💡 Key Differentiators

- **SCD-Specific Design** - Tailored specifically for Sickle Cell Disease management
- **Gamification** - Points, badges, challenges, and leaderboard for motivation
- **Emergency SOS** - Quick access to emergency services from anywhere
- **Comprehensive Tracking** - Pain, mood, hydration, location, and notes all in one place
- **AI Guidance** - Conversational assistant for health questions
- **Community Features** - Leaderboard and community statistics

---

## 📝 Notes

- All backend integrations are prepared but use local/mock data
- Database schema includes auth tables only
- No actual API calls are made (except authentication)
- App is fully functional as a prototype with static data
- Ready for backend integration
- This is a mobile-only app (no web interface)
