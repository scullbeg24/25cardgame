# Build Issues

## Issue: Metro Bundler Hanging on Web Build

**Date:** February 4, 2026  
**Status:** Resolved

---

### Symptoms

- Running `npm start` or `expo start --web` would start the server but the page at `localhost:8080` would not display
- The terminal showed "Starting Metro Bundler" and "Waiting on http://localhost:8080" but no bundling progress
- HTTP requests to the bundle endpoint would hang indefinitely
- Metro process showed 0% CPU usage (completely idle)
- No Metro cache files were being created

### Environment

- **Node.js:** v22.17.0
- **Expo SDK:** 54.0.33
- **Metro:** 0.83.3
- **OS:** macOS

### Investigation Steps

1. **Initial diagnosis:** Server was running on wrong port (8081 instead of 8080) - fixed with `--port 8080` flag

2. **CI mode issue:** Background processes were setting `CI=1` which put Metro in CI mode with limited functionality - fixed with `CI=false`

3. **Expo Router conflict:** Debug logs showed "Using app as the root directory for Expo Router" even though the project uses React Navigation. Added explicit configuration to `app.json`:
   ```json
   {
     "expo": {
       "entryPoint": "./index.ts",
       "experiments": {
         "typedRoutes": false
       }
     }
   }
   ```

4. **Dependency reinstall:** Cleared `node_modules` and reinstalled - did not fix the issue

5. **NativeWind isolation:** Temporarily disabled NativeWind in `metro.config.js` - did not fix the issue

6. **Watchman check:** Verified watchman was installed but had no active watches. Manually added watch - did not fix the issue

7. **Process analysis:** Found Metro process was idle (0% CPU) with no temp/cache files being created, indicating the bundler was never actually starting

### Root Cause

**Metro's default resolver was hanging during module resolution.** This is a compatibility issue between:
- Node.js v22 (which is very recent)
- Metro 0.83.3's default resolver implementation

The default resolver appears to have issues with certain async operations or file system interactions in Node.js v22, causing it to hang indefinitely when trying to resolve modules.

### Solution

Use the **fast resolver** by setting the `EXPO_USE_FAST_RESOLVER=1` environment variable.

#### Fix Applied

Updated `package.json` scripts to include the fast resolver flag:

```json
{
  "scripts": {
    "start": "EXPO_USE_FAST_RESOLVER=1 expo start",
    "android": "EXPO_USE_FAST_RESOLVER=1 expo start --android",
    "ios": "EXPO_USE_FAST_RESOLVER=1 expo start --ios",
    "web": "EXPO_USE_FAST_RESOLVER=1 expo start --web",
    "test": "jest --watchman=false"
  }
}
```

### Result

After applying the fix:
- Bundle compiled successfully: `Web Bundled 5865ms index.ts (997 modules)`
- Page displays correctly at `http://localhost:8080`
- Hot reloading works as expected

### Alternative Solutions (Not Used)

1. **Downgrade Node.js** to v20 LTS (may resolve the resolver compatibility issue)
2. **Use webpack bundler** instead of Metro for web (set `"bundler": "webpack"` in app.json)

### Lessons Learned

1. Very recent Node.js versions may have compatibility issues with React Native/Expo tooling
2. The `EXPO_USE_FAST_RESOLVER` flag can bypass resolver issues
3. When Metro appears to hang with 0% CPU, the issue is likely in the resolver, not the bundler itself
4. Debug mode (`EXPO_DEBUG=1`) provides valuable insight into what Expo/Metro is doing internally
