#!/bin/bash
# GitHub Release Builder for Build IT (Mac/Linux)
# This script builds your APK and prepares it for GitHub release

set -e

cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "Build IT - GitHub Release Builder"
echo "========================================"
echo ""

# Get version from user
read -p "Enter version number (e.g., 1.0.0) [default: 1.0.0]: " VERSION
VERSION=${VERSION:-1.0.0}

echo ""
echo "Building APK for version v$VERSION..."
echo ""

# Build the APK
cd frontend-vue
npm run build:apk

echo ""
echo "========================================"
echo "Build Successful!"
echo "========================================"
echo ""
echo "Your APK is ready at:"
echo "frontend-vue/android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Next steps for GitHub Release:"
echo "1. Go to https://github.com/YOUR_USERNAME/build-it/releases"
echo "2. Click 'Create a new release'"
echo "3. Tag version: v$VERSION"
echo "4. Release title: Build IT v$VERSION"
echo "5. Upload the APK file"
echo "6. Add release notes"
echo "7. Click 'Publish release'"
echo ""
echo "Download link will be:"
echo "https://github.com/YOUR_USERNAME/build-it/releases/download/v$VERSION/app-release.apk"
echo ""

cd ..

read -p "Would you like to commit these changes to git? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Committing changes..."
    git add .
    git commit -m "v$VERSION - Build IT release" || echo "Note: Commit failed (no changes?)"
    
    read -p "Push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing to GitHub..."
        git push
    fi
fi

echo ""
echo "Build and preparation complete!"
echo "See GITHUB_RELEASES_GUIDE.md for detailed instructions."
echo ""
