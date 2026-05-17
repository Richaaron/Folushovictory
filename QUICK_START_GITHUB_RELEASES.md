# 🚀 GitHub Releases Quick Start

**Get your Build IT app on GitHub in 5 minutes!**

## Step 1: Build APK (3 minutes)

```bash
cd frontend-vue
npm install
npm run build:apk
```

✅ APK ready at: `frontend-vue/android/app/build/outputs/apk/release/app-release.apk`

---

## Step 2: Create GitHub Repository (2 minutes)

1. Go to https://github.com/new
2. **Repository name:** `build-it`
3. **Description:** Student Academic Management App
4. **Public** (so everyone can download)
5. Click **Create repository**

---

## Step 3: Connect Your Code (< 1 minute)

```bash
# In your project root
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/build-it.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 4: Create Release on GitHub (2 minutes)

1. Go to `github.com/YOUR_USERNAME/build-it`
2. Click **Releases** (right side)
3. Click **Create a new release**

**Fill in:**
- **Tag version:** `v1.0.0`
- **Release title:** `Build IT v1.0.0 - Initial Release`
- **Description:** 
  ```
  🎉 Welcome to Build IT!
  
  ### Features
  - Student performance tracking
  - Teacher score management
  - Parent reports
  - Secure authentication
  
  ### Installation
  1. Download the APK
  2. Enable Unknown Sources (Settings → Security)
  3. Open APK and install
  4. Login with your school credentials
  ```

4. **Attach binary:** Upload `app-release.apk`
5. Click **Publish release**

---

## Step 5: Share Your Download Link! 🎉

```
https://github.com/YOUR_USERNAME/build-it/releases/download/v1.0.0/app-release.apk
```

**Share via:**
- 📧 Email to users
- 📱 WhatsApp/Telegram groups
- 🌐 School website
- 📋 QR code: use https://qr.io/ to generate

---

## 📋 Pre-Release Checklist (Important!)

Before publishing, ensure:

- [ ] **API URL** in `.env.android` is production endpoint (not localhost)
- [ ] **Tested on actual Android device** - works without errors
- [ ] **No sensitive data** - no API keys or passwords in code
- [ ] **Release notes** - users understand what's new
- [ ] **Privacy policy** - link to your privacy policy

See `PRE_RELEASE_CHECKLIST.md` for full checklist.

---

## 🔄 Future Updates

When you have improvements:

```bash
# Build new version
cd frontend-vue
npm run build:apk

# Commit changes
cd ..
git add .
git commit -m "v1.1.0 - Bug fixes"
git push

# On GitHub: Create new release v1.1.0 with updated APK
```

Users will see the new version available and can download updated APK.

---

## 📱 For Your Users

**Share this installation guide:**

```
📥 How to Install Build IT

1. Click the download link from GitHub
2. Open Settings → Security → Enable "Unknown Sources"
3. Open the downloaded APK file
4. Tap "Install"
5. Open "Build IT" from your apps
6. Login with your school credentials

Need help? Contact your school's IT support.
```

---

## ✨ You're Done!

Your app is now available for free on GitHub Releases! 

Users can download and install without any app store reviews or $25 fees.

**Next steps:**
1. Share the download link with your users
2. Gather feedback
3. Fix bugs and create v1.1.0
4. Plan features for v2.0.0
5. (Optional) Later, submit to Google Play Store for $25

---

## 🆘 Troubleshooting

**"Can't push to GitHub?"**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git push
```

**"APK download fails?"**
- Try different browser
- Check GitHub releases page loads
- Ensure file was uploaded correctly

**"Users can't install APK?"**
- Send them the installation guide above
- Make sure they enable "Unknown Sources"
- Test with another Android device

---

**You're all set! 🚀 Go share your app!**
