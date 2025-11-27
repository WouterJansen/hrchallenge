# Heart Rate Challenge - Secret Message Unlock 🫀

A web application that uses the Web Bluetooth API to connect to heart rate monitors and unlock a secret audio message when the user reaches a target heart rate zone.

## Features

- 📱 Connect to Bluetooth heart rate monitors (chest straps, watches, etc.)
- 💓 Real-time heart rate display
- 🎯 Customizable target heart rate zone
- ⏱️ Zone timer - stay in zone for 5 seconds to unlock
- 🎵 Secret audio message revealed upon success
- 📤 Upload your own custom audio message
- 📊 Progress tracking with visual feedback
- 📱 Responsive design for mobile and desktop

## How It Works

1. **Connect**: Click "Connect Heart Rate Monitor" and select your Bluetooth device
2. **Set Target**: Adjust the min/max BPM for your target zone (default: 120-150 BPM)
3. **Exercise**: Get your heart rate up to reach the target zone
4. **Unlock**: Stay in the zone for 5 seconds to unlock the secret message
5. **Listen**: The secret audio message will automatically play!

## Browser Compatibility

This app requires the Web Bluetooth API, which is supported on:
- ✅ Chrome (desktop & Android)
- ✅ Edge (desktop & Android)
- ✅ Opera (desktop & Android)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)
- ❌ iOS devices (Web Bluetooth not available)

**Note**: Web Bluetooth requires HTTPS (or localhost for testing).

## Compatible Heart Rate Monitors

Any Bluetooth Low Energy (BLE) heart rate monitor that follows the standard Heart Rate Service specification will work, including:
- Polar H10, H9, H7
- Wahoo TICKR
- Garmin HRM-Dual
- Most Bluetooth-enabled fitness watches (Garmin, Fitbit, etc.)

## Deployment to GitHub Pages

Follow these steps to host your app on GitHub Pages:

### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., `heart-rate-challenge`)
4. Make it **Public**
5. Click "Create repository"

### 2. Upload Your Files

You have two options:

#### Option A: Using GitHub Web Interface (Easiest)

1. In your new repository, click "uploading an existing file"
2. Drag and drop these files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Click "Commit changes"

#### Option B: Using Git Command Line

```bash
# Navigate to your project folder
cd d:\BigProjects\hraudio

# Initialize git repository
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit - Heart Rate Challenge app"

# Add your GitHub repository as remote (replace USERNAME and REPO)
git remote add origin https://github.com/USERNAME/REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar under "Code and automation")
4. Under "Source", select **Deploy from a branch**
5. Under "Branch", select **main** and **/ (root)**
6. Click **Save**

### 4. Access Your App

After a few minutes, your app will be live at:
```
https://USERNAME.github.io/REPO/
```

For example: `https://johnsmith.github.io/heart-rate-challenge/`

## Customization Tips

### Change the Target Time
Edit `app.js` line 13:
```javascript
this.requiredTime = 5; // Change to any number of seconds
```

### Change Default Heart Rate Zone
Edit `index.html` lines 41-42:
```html
<input type="number" id="minHR" value="120" min="60" max="200">
<input type="number" id="maxHR" value="150" min="60" max="200">
```

### Add Your Own Audio Message

1. **Option 1**: Upload directly in the app using the file input
2. **Option 2**: Replace the default synthesized audio by modifying the `createDefaultAudio()` function in `app.js`
3. **Option 3**: Add an audio file to your repository and load it automatically:

```javascript
// In app.js, replace the createDefaultAudio function:
async createDefaultAudio() {
    const response = await fetch('your-message.mp3');
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
}
```

### Change Colors/Theme
Edit `styles.css` to customize:
- Background gradient (line 7)
- Button colors (lines 83-95)
- Heart rate display colors (line 98)

## Security Notes

- The Web Bluetooth API requires HTTPS for security (GitHub Pages provides this automatically)
- No heart rate data is stored or transmitted - everything happens locally in the browser
- Users must explicitly grant permission to connect to their Bluetooth device

## Troubleshooting

**Can't connect to device?**
- Make sure Bluetooth is enabled on your computer/phone
- Ensure your heart rate monitor is in pairing mode
- Try refreshing the page and connecting again
- Check that your browser supports Web Bluetooth

**Audio won't play?**
- Some browsers block autoplay - try clicking the Play button manually
- Make sure your device volume is turned up
- Check browser console for any errors

**Heart rate not updating?**
- Ensure your heart rate monitor is properly worn
- Check that the device is still connected (green status dot)
- Try disconnecting and reconnecting

## License

Free to use for personal projects. Have fun with your challenge!

## Credits

Built with:
- Web Bluetooth API
- Web Audio API
- Vanilla JavaScript (no frameworks needed!)
