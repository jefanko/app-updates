# Auto-Updater Setup Guide

This guide explains how to use the auto-updater feature for distributing updates to users.

## Overview

The app now includes Discord-style auto-updates that:
- ✅ Check for updates automatically on launch
- ✅ Download updates in background
- ✅ Show progress notification
- ✅ Install on app restart

## Quick Start

### 1. Build Initial Version

```powershell
# Build version 1.0.0
npm run build:publish
```

This creates files in the `dist/` folder:
- `INA AI Chart Setup 1.0.0.exe` - Installer
- `latest.yml` - Version manifest

### 2. Upload to OneDrive

1. Create OneDrive folder: `INA-App-Updates`
2. Upload both files to this folder
3. Right-click folder → Share → Get link
4. Choose "Anyone with the link can view"
5. Copy the share link

### 3. Convert OneDrive Link to Direct Download

OneDrive share links look like:
```
https://onedrive.live.com/embed?resid=ABC123&authkey=XYZ
```

Convert to direct download format:
```
https://onedrive.live.com/download?resid=ABC123&authkey=XYZ
```

Simply replace `/embed?` with `/download?`

### 4. Update package.json

Edit `package.json` and update the publish URL:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://onedrive.live.com/download?resid=YOUR_LINK_HERE"
    }
  }
}
```

### 5. Rebuild with Updated URL

```powershell
npm run build:publish
```

Upload the new files to OneDrive, replacing the old ones.

## Releasing Updates

### For Bug Fixes (Patch Update)

1. Fix the bugs in code
2. Update version in `package.json`:
   ```json
   "version": "1.0.1"  // Was 1.0.0
   ```
3. Build: `npm run build:publish`
4. Upload new files to OneDrive (replace old files)

### For New Features (Minor Update)

1. Add features
2. Update version: `"version": "1.1.0"`
3. Build and upload

### For Breaking Changes (Major Update)

1. Make changes
2. Update version: `"version": "2.0.0"`
3. Build and upload

## OneDrive Folder Structure

Your OneDrive folder should always contain:

```
INA-App-Updates/
├── INA AI Chart Setup 1.0.1.exe  (latest installer)
├── latest.yml                     (version manifest)
└── [older versions...]            (keep for rollback)
```

**Important:**
- Always keep `latest.yml` up to date
- Can keep old installer files for rollback
- Only the files referenced in `latest.yml` will be downloaded

## User Experience

When a user launches the app:

1. **Check** (3 seconds after launch)
   - Small notification: "Checking for updates..."

2. **No Update**
   - Notification: "You're up to date!"
   - Auto-hides after 3 seconds

3. **Update Available**
   - Notification: "Downloading update..."
   - Progress bar shows download percentage
   - Downloads in background

4. **Download Complete**
   - Notification: "Update downloaded!"
   - Button: "Restart Now"
   - Can also restart manually later

5. **After Restart**
   - Update installs automatically
   - App launches with new version

## Troubleshooting

### Update Check Fails

**Problem:** Update notification shows error

**Solutions:**
1. Check OneDrive link is correct in `package.json`
2. Verify OneDrive folder is shared publicly
3. Test link in browser - should download `latest.yml`
4. Check internet connection

### Update Downloads But Won't Install

**Problem:** Download completes but nothing happens

**Solutions:**
1. Make sure app has write permissions
2. Close all instances of the app
3. Try "Restart Now" button
4. Manually close and reopen app

### Wrong Version Downloads

**Problem:** Old version keeps downloading

**Solutions:**
1. Verify `latest.yml` points to correct version
2. Clear OneDrive cache
3. Re-upload files to OneDrive
4. Check version number in `package.json` matches uploaded file

## Testing Updates

### Test Locally

1. Build version 1.0.0: `npm run build:publish`
2. Install it: Run the installer from `dist/`
3. Update version to 1.0.1
4. Build again: `npm run build:publish`
5. Upload to OneDrive
6. Launch installed app → Should see update notification

### Test with Users

1. Send version 1.0.0 installer to 1-2 test users
2. Have them install
3. Upload version 1.0.1 to OneDrive
4. Ask test users to launch app
5. Verify they receive update automatically

## Advanced Configuration

### Change Update Check Frequency

Edit `electron.cjs`:

```javascript
// Check on launch (current)
setTimeout(() => {
  autoUpdater.checkForUpdates();
}, 3000);

// Or check periodically
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 30 * 60 * 1000); // Every 30 minutes
```

### Disable Auto-Install

Edit `electron.cjs`:

```javascript
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false; // Changed to false
```

Now updates download but don't install automatically.

### Force Update Check

Add to code:
```javascript
window.electron.updater.checkForUpdates();
```

## Alternative: GitHub Releases (Recommended)

If OneDrive is problematic, use GitHub Releases (free):

1. Create GitHub repository
2. Update `package.json`:
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "owner": "your-username",
         "repo": "ina-app"
       }
     }
   }
   ```
3. Generate GitHub token
4. Build with: `GH_TOKEN=your_token npm run build:publish`
5. Installers upload to GitHub Releases automatically

Benefits:
- ✅ Free
- ✅ Reliable
- ✅ Version history built-in
- ✅ Can be private repository

## Security Notes

### Code Signing (Optional)

Without code signing:
- Windows SmartScreen shows warning
- User must click "More info" → "Run anyway"
- Fine for internal company use

With code signing certificate:
- No warnings
- Professional appearance
- Costs ~$100-300/year
- Purchase from DigiCert, Sectigo, etc.

To add code signing:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

## Need Help?

Common issues:
1. **OneDrive link not working** → Use direct download format
2. **Update not found** → Check `latest.yml` is in same folder as .exe
3. **Permission denied** → Run app as administrator once
4. **Slow downloads** → OneDrive free tier may throttle, consider GitHub

For GitHub Releases setup, see: https://www.electron.build/configuration/publish#githuboptions
