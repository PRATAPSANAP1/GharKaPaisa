# OitStack Mobile App

A comprehensive React Native mobile application for the OitStack (formerly GharKaPaisa) financial services platform, supporting both iOS and Android devices.

## 🚀 Features

### Core Modules
- **Authentication System**
  - OTP-based login with MSG91 integration
  - Biometric authentication (Face ID / Touch ID / Fingerprint)
  - Role-based access (Partner, Super Admin)
  - Secure token management with AsyncStorage

- **Dashboard**
  - Real-time KPI cards (Balance, Applications, Team, Earnings)
  - Interactive charts (Earnings trend, Application status)
  - Quick action shortcuts
  - Recent activity feed
  - Pull-to-refresh functionality

- **Wallet & Payouts**
  - Available balance with hold balance display
  - Instant withdrawal requests
  - TDS calculation (2%)
  - Transaction history with filters
  - Balance trend visualization
  - Transaction detail modal

- **Applications Tracker**
  - My applications vs Team applications
  - Status-based filtering
  - Search functionality
  - Application detail modal
  - Real-time status updates

- **Reports & Analytics**
  - Performance metrics
  - Earnings breakdown
  - Team performance analysis
  - Product category distribution
  - Top performers leaderboard
  - Export functionality (PDF/Excel)

- **Profile & Settings**
  - Profile photo upload
  - Personal information management
  - Address information
  - Notification preferences
  - Security settings (Biometric, 2FA)
  - Account management

## 📱 Platform Support

### iOS
- **Minimum Version**: iOS 13.0+
- **Supported Devices**: iPhone 6s and later
- **Dependencies**: CocoaPods, Xcode 14+

### Android
- **Minimum Version**: Android 6.0 (API Level 23)
- **Target Version**: Android 13 (API Level 33)
- **Supported Architectures**: arm64-v8a, armeabi-v7a, x86, x86_64

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- React Native CLI
- For iOS: Xcode 14+, CocoaPods
- For Android: Android Studio, Android SDK

### Setup Steps

1. **Clone the repository**
```bash
cd mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **iOS Setup**
```bash
cd ios
pod install
cd ..
```

4. **Environment Variables**
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=https://api.gharkapaisa.in/api/v1
EXPO_PUBLIC_MSG91_WIDGET_ID=your_widget_id
EXPO_PUBLIC_MSG91_TOKEN_AUTH=your_token_auth
```

5. **Run the app**

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web (for testing):**
```bash
npm run web
```

## 📦 Dependencies

### Core
- react: 19.1.0
- react-native: 0.81.5
- expo: ~54.0.33

### Navigation
- @react-navigation/native: ^7.2.4
- @react-navigation/native-stack: ^7.15.1
- @react-navigation/bottom-tabs: ^7.0.0

### Authentication & Security
- @react-native-async-storage/async-storage: ^2.0.0
- expo-local-authentication: ~14.0.1
- @msg91comm/sendotp-react-native: ^2.1.0

### API & Networking
- axios: ^1.16.1
- @react-native-community/netinfo: ^11.3.0

### Firebase (Push Notifications)
- @react-native-firebase/app: ^18.7.3
- @react-native-firebase/auth: ^18.7.3
- @react-native-firebase/messaging: ^18.7.3

### Charts & Visualization
- react-native-chart-kit: ^6.12.0
- react-native-svg: ^15.2.0
- victory-native: ^36.9.2

### UI Components
- react-native-circular-progress: ^1.3.9
- react-native-webview: ^14.0.1
- expo-image-picker: ~16.0.6

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.js          # Authentication state management
│   ├── screens/
│   │   ├── EnhancedLoginScreen.js  # Biometric login
│   │   ├── EnhancedDashboardScreen.js  # KPI dashboard
│   │   ├── EnhancedWalletScreen.js     # Wallet with charts
│   │   ├── ReportsScreen.js        # Analytics & reports
│   │   └── ProfileScreen.js        # Profile & settings
│   ├── components/
│   │   └── LogoLoader.js           # Loading component
│   └── config/
│       └── api.js                  # API configuration
├── screens/                        # Legacy screens (to be migrated)
├── ios/                            # iOS configuration
│   ├── OitStack/
│   │   └── Info.plist
│   └── Podfile
├── android/                        # Android configuration
│   └── app/
│       └── src/
│           └── main/
│               └── AndroidManifest.xml
├── assets/                         # Images and resources
├── App.js                          # Main app entry
├── package.json
└── README.md
```

## 🔐 Security Features

- **Secure Storage**: AsyncStorage for tokens
- **Biometric Auth**: Face ID, Touch ID, Fingerprint
- **Token Refresh**: Automatic token refresh
- **Network Security**: HTTPS enforcement
- **Permission Management**: Granular app permissions

## 📊 API Integration

The app integrates with the OitStack backend API:

- **Base URL**: `https://api.gharkapaisa.in/api/v1`
- **Authentication**: Bearer token-based
- **Endpoints**:
  - `/auth/login` - User login
  - `/auth/send-otp` - Send OTP
  - `/auth/me` - Get user profile
  - `/wallet` - Wallet details
  - `/wallet/transactions` - Transaction history
  - `/applications/my-leads` - User applications
  - `/applications/team-leads` - Team applications
  - `/reports/performance` - Performance reports

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with OTP
- [ ] Biometric authentication
- [ ] Dashboard KPI cards
- [ ] Wallet withdrawal
- [ ] Application tracking
- [ ] Report generation
- [ ] Profile updates
- [ ] Push notifications
- [ ] Offline handling
- [ ] Permission requests

## 📱 Build & Release

### iOS Release
```bash
# Build for simulator
npm run ios

# Build for device
cd ios
pod install
# Open in Xcode and build archive
```

### Android Release
```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

## 🔧 Configuration

### iOS Configuration (Info.plist)
- App permissions (Camera, Location, Biometric)
- Network security settings
- App display name and version

### Android Configuration (AndroidManifest.xml)
- App permissions
- Network security configuration
- Firebase service configuration
- App theme and icons

## 🐛 Troubleshooting

### Common Issues

**CocoaPods installation fails**
```bash
cd ios
pod deintegrate
pod install
```

**Android build fails**
```bash
cd android
./gradlew clean
./gradlew build
```

**Metro bundler issues**
```bash
npm start -- --reset-cache
```

## 📝 Environment Variables

Required environment variables:

- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_MSG91_WIDGET_ID` - MSG91 widget ID
- `EXPO_PUBLIC_MSG91_TOKEN_AUTH` - MSG91 auth token

## 🚀 Deployment

### App Store (iOS)
1. Build archive in Xcode
2. Upload to App Store Connect
3. Submit for review

### Play Store (Android)
1. Build signed AAB
2. Upload to Play Console
3. Submit for review

## 📄 License

Proprietary - All rights reserved © 2026 OitStack

## 👥 Support

For support and issues, contact the development team at support@oitstack.com
