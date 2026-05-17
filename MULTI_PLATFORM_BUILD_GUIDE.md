# Multi-Platform Build Guide

Build IT can now be deployed as:
- 📱 **Android APK** - for Android devices
- 🖥️ **Windows EXE** - for desktop Windows

## Prerequisites

### For All Platforms
- Node.js 18+ and npm
- Git

### For Android APK
- Java Development Kit (JDK) 11+
- Android SDK
- Android Studio (recommended)
- Set `ANDROID_HOME` environment variable

### For Windows EXE
- Windows 10+
- No additional dependencies (bundled with Electron)

## Project Structure

```
frontend-vue/
├── src/                    # Vue source code (shared across all platforms)
├── electron/              # Electron configuration for Windows EXE
│   ├── main.js           # Electron main process
│   └── preload.js        # Electron security preload
├── capacitor.config.json  # Capacitor config for Android APK
├── electron-builder.json  # Electron builder config for Windows EXE
└── package.json          # Build scripts and dependencies
```

## Installation

1. Navigate to `frontend-vue` directory:
   ```bash
   cd frontend-vue
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Building for Windows EXE

### Option 1: Portable EXE (No installation required)
```bash
npm run build:exe
```
Output: `dist-electron/Build-IT-x.x.x.exe`

### Option 2: Installer EXE (NSIS installer)
```bash
npm run build:electron
```
Output: `dist-electron/Build IT Setup x.x.x.exe`

### Development Mode (Hot reload)
```bash
npm run start:electron
```
This runs both the Vite dev server and Electron in parallel.

## Building for Android APK

### Prerequisites Setup
1. Install Android SDK:
   ```bash
   # Using Android Studio or sdkmanager
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

2. Set environment variable (Windows):
   ```bash
   setx ANDROID_HOME "C:\Users\YourUsername\AppData\Local\Android\Sdk"
   ```

### Step 1: Initialize Android (one-time)
```bash
npm run cap:add
```

### Step 2: Sync web assets to Android project
```bash
npm run cap:sync
```

### Step 3: Build APK
```bash
npm run build:apk
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

### Signing the APK
Before distribution, sign your APK:
```bash
# Create keystore (one-time)
keytool -genkey -v -keystore android/app/build-keystore.jks -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK
npm run build:apk
```

## Environment Configuration

### API Endpoints

**Development (Web/Local):**
```
VITE_API_BASE_URL=http://localhost:3000
```

**Android Emulator:**
```
# Use 10.0.2.2 to access host localhost
VITE_API_BASE_URL=http://10.0.2.2:3000
```

**Android Physical Device:**
```
# Use your computer's IP address
VITE_API_BASE_URL=http://192.168.x.x:3000
```

**Electron Desktop:**
```
VITE_API_BASE_URL=http://localhost:3000
```

### Platform Detection in Code

In your Vue components, detect the platform:

```typescript
// In your Vue components
const platform = import.meta.env.VITE_PLATFORM;

if (platform === 'android') {
  // Android-specific code
} else if (platform === 'electron') {
  // Desktop-specific code
} else {
  // Web-specific code
}
```

## Available Build Scripts

| Command | Platform | Output |
|---------|----------|--------|
| `npm run build:web` | Web | `dist/` |
| `npm run build:exe` | Windows Portable | `dist-electron/Build-IT-*.exe` |
| `npm run build:electron` | Windows Installer | `dist-electron/Build IT Setup *.exe` |
| `npm run build:apk` | Android | `android/app/build/outputs/apk/release/app-release.apk` |
| `npm run start:electron` | Electron Dev | Running app with hot reload |
| `npm run cap:add` | Android Setup | Initialize Android project |
| `npm run cap:sync` | Android Sync | Update Android with web build |

## Troubleshooting

### Android Build Issues

**Error: Gradle not found**
- Install Android SDK Platform Tools and build tools

**Error: Capacitor not found**
```bash
npm install @capacitor/cli @capacitor/android --save-dev
npx cap add android
```

### Electron Build Issues

**Error: Icon not found**
- Ensure icon files exist in `electron/assets/` directory

**Error: NSIS not found** (for installer)
- Install NSIS from: https://nsis.sourceforge.io/Download

### Networking Issues

**APK can't connect to backend**
- Check API URL in `.env.android`
- For emulator: use `10.0.2.2` instead of `localhost`
- For device: use your computer's local IP address

**Electron can't connect to backend**
- Ensure backend is running on `http://localhost:3000`
- Check CORS settings in backend

## File Structure Maintained

Your original structure remains unchanged:
```
backend/          # ✓ Unchanged
frontend-vue/     # ✓ Enhanced with new build configs
├── src/          # ✓ Original Vue code
├── electron/     # ✨ New: Electron configs
├── android/      # ✨ Generated: Android project
render.yaml       # ✓ Unchanged
```

## Next Steps

1. Build the web version first:
   ```bash
   npm run build:web
   ```

2. Test locally in browser:
   ```bash
   npm run preview
   ```

3. Build for your target platform:
   - For Windows: `npm run build:exe`
   - For Android: `npm run build:apk`

4. Deploy or distribute the binaries

## Support

For platform-specific issues:
- **Android**: Check Capacitor docs at capacitor.ionicframework.com
- **Electron**: Check Electron docs at electronjs.org
