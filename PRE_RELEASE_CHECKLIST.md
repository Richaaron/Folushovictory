# Pre-Release Checklist - Build IT

Before publishing your app on GitHub Releases, complete this checklist:

## 🔒 Security & Configuration

- [ ] **API Endpoint**: Backend URL is production URL (not `http://localhost:3000`)
- [ ] **No Hardcoded Secrets**: No API keys, passwords, or tokens in source code
- [ ] **Environment Variables**: `.env.android` has correct production API endpoint
- [ ] **Firebase Config**: If using Firebase, keys are properly configured
- [ ] **CORS Settings**: Backend allows requests from your app domain
- [ ] **HTTPS**: API endpoint uses HTTPS (not HTTP)
- [ ] **Database**: Production database is configured and backed up

## 📱 App Testing

- [ ] **Test on Real Device**: Tested on actual Android phone/tablet
- [ ] **Test on Emulator**: Tested on Android emulator (minimum 2 versions)
- [ ] **Login Works**: User authentication functions correctly
- [ ] **Core Features**: All main features (Admin, Teacher, Parent) work
- [ ] **Data Loads**: Student data, classes, scores load correctly
- [ ] **No Crashes**: App doesn't crash during normal use
- [ ] **Permissions**: All required permissions work (camera, storage, etc.)
- [ ] **Offline**: App gracefully handles offline scenarios
- [ ] **Performance**: App loads quickly and responds smoothly

## 📋 Documentation & Legal

- [ ] **Privacy Policy**: Written and publicly available
- [ ] **Terms of Service**: If applicable
- [ ] **App Description**: Clear description of what the app does
- [ ] **Screenshots**: At least 2 high-quality screenshots (min 1080x1920)
- [ ] **Release Notes**: Written detailed release notes for v1.0.0
- [ ] **Support Contact**: Email or contact info for users to report issues
- [ ] **README**: GitHub README explains how to use the app

## 🔐 Build & Signing

- [ ] **APK Signed**: APK is signed with release keystore
- [ ] **Keystore Backed Up**: Release keystore file backed up securely
- [ ] **Build Size**: APK is reasonable size (< 100MB typical)
- [ ] **Version Code**: Incremented version code
- [ ] **Version Name**: Format is semantic (1.0.0, 1.1.0, etc.)
- [ ] **No Debug Mode**: Debug logging disabled
- [ ] **No Dev Tools**: Dev tools not accessible to end users

## 📊 GitHub Repository

- [ ] **Repository Created**: Public GitHub repo for your app
- [ ] **README.md**: Comprehensive README with setup instructions
- [ ] **License**: Added LICENSE file (MIT, Apache, etc.)
- [ ] **gitignore**: Properly configured `.gitignore`
- [ ] **Code Pushed**: All code committed and pushed to GitHub
- [ ] **No Secrets**: No `.env` files with real credentials committed
- [ ] **CHANGELOG.md**: Document changes in this version

## 👥 User Support

- [ ] **Contact Method**: Email address for support
- [ ] **Installation Guide**: Clear instructions for users
- [ ] **Troubleshooting**: Common issues and solutions documented
- [ ] **FAQ**: Answers to likely questions
- [ ] **Update Plan**: How users will get future updates

## ✅ Final Checks

- [ ] **Version Number**: Noted current version (e.g., 1.0.0)
- [ ] **Release Date**: Documented release date
- [ ] **Backup**: Full backup of code and database exists
- [ ] **Dependencies**: All dependencies up to date
- [ ] **Licenses**: Check licenses of all dependencies
- [ ] **Testing Report**: Test results documented

## 📦 Release Preparation

- [ ] **Download Link Tested**: Verified APK downloads correctly from link
- [ ] **Install Verified**: APK installs and runs on clean device
- [ ] **Fresh Install Test**: Tested app on device with no previous version
- [ ] **Permission Prompts**: All permission requests working correctly

## 🚀 Ready to Launch?

If all items are checked:

```bash
# In your project root:
./build-and-release.bat  # For Windows
# or
./build-and-release.sh   # For Mac/Linux

# Then on GitHub:
# 1. Create Release
# 2. Upload APK
# 3. Publish
# 4. Share link with users!
```

## 📱 First Time User Experience

Test this flow:
1. User downloads APK from GitHub link
2. User enables "Unknown Sources" if needed
3. User installs APK successfully
4. App launches without errors
5. Login screen appears
6. User logs in (test with sample credentials)
7. Dashboard loads correctly
8. At least 2-3 features work as expected

## 📝 Notes

Write down any issues found during testing:
- [ ] Issue 1: _____________________ → Fix: _____________________
- [ ] Issue 2: _____________________ → Fix: _____________________
- [ ] Issue 3: _____________________ → Fix: _____________________

---

**Once everything is checked, you're ready to go live! 🎉**

**Remember:** After release, monitor user feedback and prepare updates accordingly.
