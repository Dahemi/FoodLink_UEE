# FoodLink - Food Donation Platform

FoodLink is a React Native mobile application built with Expo that connects food donors, NGOs, volunteers, and community members to fight hunger and reduce food waste in local communities.

## 🚀 Features

- **Multi-Role System**: Support for Donors, NGO Partners, Volunteers, and Community Members
- **Professional UI**: Clean, modern interface with smooth animations
- **Cross-Platform**: Works on iOS, Android, and Web
- **TypeScript**: Fully typed for better development experience
- **Context Management**: Persistent role selection using AsyncStorage

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **UI Components**: React Native Paper
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Icons**: Lucide React Native
- **Animations**: React Native Animated API

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn** (npm comes with Node.js)
   - Verify npm: `npm --version`
   - Or install yarn: `npm install -g yarn`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

4. **Visual Studio Code** (recommended)
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

5. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

6. **Expo Go App** (for testing on physical devices)
   - Download from App Store (iOS) or Google Play Store (Android)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/foodlink-app.git

# Navigate to the project directory
cd foodlink-app
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# Or if you prefer yarn
yarn install
```

### 3. Environment Setup

The project uses legacy peer dependencies for compatibility:

```bash
# If you encounter peer dependency warnings, use:
npm install --legacy-peer-deps
```

### 4. Start the Development Server

```bash
# Start the Expo development server
npm run dev

# Or with yarn
yarn dev
```

This will start the Metro bundler and open the Expo DevTools in your browser.

### 5. Run on Different Platforms

#### Option A: Physical Device (Recommended for beginners)

1. Install **Expo Go** app on your phone
2. Make sure your phone and computer are on the same WiFi network
3. Scan the QR code shown in the terminal or browser with:
   - **iOS**: Camera app or Expo Go app
   - **Android**: Expo Go app

#### Option B: iOS Simulator (Mac only)

```bash
# Install iOS Simulator via Xcode from App Store
# Then press 'i' in the terminal where Expo is running
```

#### Option C: Android Emulator

```bash
# Install Android Studio and set up an Android Virtual Device (AVD)
# Then press 'a' in the terminal where Expo is running
```

#### Option D: Web Browser

```bash
# Press 'w' in the terminal where Expo is running
# Or visit http://localhost:8081 in your browser
```

## 📁 Project Structure

```
foodlink-app/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Splash screen route
│   ├── role-selection.tsx # Role selection route
│   ├── welcome.tsx        # Welcome screen route
│   └── +not-found.tsx     # 404 page
├── assets/                # Static assets
│   └── images/
├── components/            # Reusable components
│   ├── ErrorBoundary.tsx
│   └── LoadingSpinner.tsx
├── context/               # React Context providers
│   └── RoleContext.tsx
├── screens/               # Screen components
│   ├── SplashScreen.tsx
│   ├── RoleSelectionScreen.tsx
│   └── WelcomeScreen.tsx
├── types/                 # TypeScript type definitions
│   └── index.ts
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Run linting
npm run lint

# Clear Expo cache (if you encounter issues)
npx expo start --clear
```

## 📱 Testing on Different Devices

### Physical Device (Easiest)
1. Download Expo Go app
2. Scan QR code from terminal
3. App will load automatically

### Connection Issues?
If you can't connect your device, try:

```bash
# Use tunnel mode (slower but works with any network)
npx expo start --tunnel

# Use LAN mode (faster, requires same WiFi)
npx expo start --lan

# Use localhost (simulators only)
npx expo start --localhost
```

## 🛠️ Recommended VS Code Extensions

Install these extensions for the best development experience:

1. **ES7+ React/Redux/React-Native snippets**
2. **TypeScript Hero**
3. **Prettier - Code formatter**
4. **Auto Rename Tag**
5. **Bracket Pair Colorizer**
6. **React Native Tools**
7. **Expo Tools**

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

#### 2. "Network response timed out"
```bash
# Try tunnel mode
npx expo start --tunnel
```

#### 3. "Unable to resolve module"
```bash
# Reset Metro bundler cache
npx expo start --clear
```

#### 4. TypeScript errors
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

#### 5. Expo Go not loading
- Ensure both devices are on the same WiFi
- Try using tunnel mode: `npx expo start --tunnel`
- Restart the Expo development server


## 🚀 Building for Production

### Development Build
```bash
# Create development build for testing
npx expo build:android
npx expo build:ios
```

### Production Build
```bash
# Build for app stores
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---


Happy coding! 🎉
