# Audio Files Directory

This directory should contain the audio files for interactive sound effects on the Athlos Forge website.

## Required Files:

### welcome.mp3 & welcome.ogg
- Format: MP3 and OGG (for cross-browser compatibility)
- Duration: 2-5 seconds
- Content: Pleasant welcome sound, chime, or short musical phrase
- Volume: Medium (will be adjusted in code to 30% volume)
- Quality: 128kbps MP3, suitable for web

### action.mp3 & action.ogg
- Format: MP3 and OGG (for cross-browser compatibility)
- Duration: 0.5-2 seconds
- Content: Subtle click, swoosh, or action confirmation sound
- Volume: Low (will be adjusted in code to 20% for hovers, 30% for clicks)
- Quality: 128kbps MP3, suitable for web

## Audio Specifications:
- Sample rate: 44.1kHz
- Bitrate: 128kbps (MP3), VBR (OGG)
- Channels: Stereo
- No compression artifacts
- Clean, professional sound design

## Implementation Notes:
- Audio plays on user interactions (button clicks, hovers)
- No autoplay - only triggered by user actions
- Volume levels are controlled in JavaScript
- Graceful fallback if audio files are missing
- Cross-browser compatibility with multiple formats

## Usage in Code:
- Welcome sound: Plays on page load or specific interactions
- Action sound: Plays on button clicks and navigation hovers
- Volume levels: Adjusted programmatically for appropriate loudness