# GitHub Releases - Free APK Distribution Guide

Distribute your Build IT app for free using GitHub Releases!

## ✅ Complete Setup

### Step 1: Build Your APK

Before building locally, ensure you have:
- Java JDK 17+ installed
- `JAVA_HOME` set to your JDK install path
- `JAVA_HOME\bin` on your `PATH`
- Android SDK installed

Then run:

```bash
cd frontend-vue
npm install
npm run build:apk
```

Output will be at: `android/app/build/outputs/apk/release/app-release.apk`

If the build fails with `JAVA_HOME is not set`, install the JDK and set `JAVA_HOME`, then reopen the terminal.

### GitHub Actions APK Build

This repo already includes a GitHub Actions workflow at `.github/workflows/android-apk.yml`.

#### Add GitHub secrets
1. Open your repo on GitHub.
2. Go to `Settings` → `Secrets and variables` → `Actions`.
3. Click **New repository secret**.
4. Add these secrets:
   - `ANDROID_KEYSTORE_BASE64` — base64-encoded contents of `android/app/build-keystore.jks`
   - `ANDROID_KEYSTORE_PASSWORD` — keystore password
   - `ANDROID_KEY_ALIAS` — key alias (for example: `builditutor`)
   - `ANDROID_KEY_PASSWORD` — key password for the alias

Tip: You can generate `ANDROID_KEYSTORE_BASE64` locally with:

```bash
cd frontend-vue
./scripts/encode-keystore.sh
cat keystore.b64
```
Copy the output and paste into the `ANDROID_KEYSTORE_BASE64` secret.

CI: A GitHub Actions workflow has been added at `.github/workflows/android-apk.yml` that will build the app and upload artifacts. To enable signing in CI add the `ANDROID_KEYSTORE_BASE64` secret and the password/alias secrets above.

#### Generate the base64 keystore secret
From the repo root in PowerShell:

```powershell
cd frontend-vue
keytool -genkeypair -v -keystore android/app/build-keystore.jks -alias builditutor -keyalg RSA -keysize 2048 -validity 10000
certutil -encode android\app\build-keystore.jks keystore.b64
```

Open `keystore.b64`, copy everything, and paste it into `ANDROID_KEYSTORE_BASE64`.

#### Run the workflow
Push a commit to `main` or run the workflow manually under the GitHub Actions tab.

When the build completes, download the APK artifact:
1. Open your repo on GitHub.
2. Go to `Actions`.
3. Select the latest `Build Android APK` run.
4. Expand `Artifacts` and download `build-it-apk`.

### Step 2: Initialize Git Repository (If Not Already Done)

```bash
cd ..  # Go to root directory

# Check if git is initialized
git status

# If not, initialize
git init
git add .
git commit -m "Initial commit - Build IT app"
```

### Step 3: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `build-it` (or your choice)
3. Description: "Build IT - Student Academic Management App"
4. Choose: Public (for easy sharing)
5. Click "Create repository"

### Step 4: Connect Local Repository to GitHub

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/build-it.git
git branch -M main
git push -u origin main
```

### Step 5: Create GitHub Release

1. Go to your repository: `github.com/YOUR_USERNAME/build-it`
2. Click on **"Releases"** (right sidebar)
3. Click **"Create a new release"**

**Fill in the details:**

| Field | Value |
|-------|-------|
| **Tag version** | `v1.0.0` |
| **Release title** | `Build IT v1.0.0` |
| **Description** | See below |
| **Attach APK** | `android/app/build/outputs/apk/release/app-release.apk` |

**Sample Release Description:**

```markdown
# Build IT v1.0.0

Welcome to Build IT - Your Complete Academic Management Solution!

## Features
- 📊 Comprehensive student performance tracking
- 👨‍🏫 Teacher score management
- 👨‍👩‍👧 Parent access to student reports
- 🔐 Secure authentication
- 📈 Real-time analytics

## Installation Instructions

1. **Download APK**: Click the APK file below
2. **Enable Unknown Sources**: 
   - Settings → Security → Unknown Sources (Enable)
3. **Install**: Open the downloaded APK and tap Install
4. **Launch**: Open Build IT from your apps

## System Requirements
- Android 8.0 or higher
- 50MB free storage

## For First Time Users
- Contact your school for login credentials
- Admin users can manage students and classes
- Teachers can enter scores
- Parents can view reports

## Support
For issues or feedback, please open an issue on this repository.

---
**Release Date**: May 17, 2026
```

### Step 6: Upload APK File

1. In the "Attach binaries..." section, click to upload
2. Select: `frontend-vue/android/app/build/outputs/apk/release/app-release.apk`
3. Wait for upload to complete
4. Click **"Publish release"**

## 🔗 Share Your App

**Download Link:**
```
https://github.com/YOUR_USERNAME/build-it/releases/download/v1.0.0/app-release.apk
```

### Ways to Share:
- Email the link to students/teachers/parents
- Post on school website
- Include in WhatsApp/Telegram group
- QR code: https://qr.io/ (paste the download link)

## 🔄 Updating Your App

When you have a new version:

```bash
# In frontend-vue/
npm run build:apk

# Go to root
cd ..

# Commit changes
git add .
git commit -m "v1.1.0 - Bug fixes and improvements"
git push

# Create new release on GitHub
# Tag: v1.1.0
# Upload new APK file
```

## 📱 Installation Instructions for Users

Share this with your users:

---

### 📥 How to Install Build IT

**Prerequisites:**
- Android 8.0 or higher
- About 50MB free storage

**Steps:**

1. **Download**
   - Click this link: [Download Build IT](https://github.com/YOUR_USERNAME/build-it/releases/download/v1.0.0/app-release.apk)
   - Or scan QR code provided by your school

2. **Enable Installation from Unknown Sources**
   - Open Settings
   - Go to Security or Privacy
   - Find "Unknown Sources" or "Install from Unknown Sources"
   - Toggle it ON
   - (Don't worry, we're a trusted app!)

3. **Install the App**
   - Open the downloaded APK file (usually in Downloads folder)
   - Tap "Install"
   - Wait for installation to complete
   - Tap "Open"

4. **Login**
   - Use your school credentials
   - Contact your admin if you don't have login details

5. **Enjoy!**
   - Start managing academic records

**Troubleshooting:**
- Can't download? Try another browser or QR code
- Installation failed? Ensure you enabled Unknown Sources
- App crashes? Check you're on Android 8.0+
- Need help? Contact your school's IT support

---

## 🎯 GitHub Releases Advantages

✅ **Free** - No cost at all
✅ **Version Control** - Automatic version history
✅ **Version Downloads** - Users see release notes
✅ **Easy Updates** - Simple to create new releases
✅ **Public** - Anyone can access
✅ **No Review Process** - Launch instantly
✅ **Professional** - Looks legitimate

## 📊 Monitoring Downloads

View statistics:
1. Go to your repo: `github.com/YOUR_USERNAME/build-it`
2. Click **"Insights"** tab
3. View download counts and traffic

## 🔒 Security Tips

Before each release:
- ✅ Remove API keys/secrets from code
- ✅ Use production API URL (not localhost)
- ✅ Test thoroughly on Android device
- ✅ Sign APK with proper keystore
- ✅ Document privacy policy
- ✅ Add release notes

## 📝 Example Release Timeline

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | May 17 | Initial release |
| v1.0.1 | May 20 | Bug fixes |
| v1.1.0 | May 25 | New features |
| v2.0.0 | June 1 | Major update |

## 🚀 Ready to Release?

```bash
# Final checklist
npm run build:apk          # Build APK
git add .                  # Stage changes
git commit -m "v1.0.0"     # Commit
git push                   # Push to GitHub

# Then on GitHub.com:
# 1. Create Release
# 2. Upload APK
# 3. Publish
# 4. Share link!
```

---

**You're ready to go! 🎉**

Your app is now available for free distribution to all your users!
