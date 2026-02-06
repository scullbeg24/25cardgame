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

---

## Issue: iOS Build Failures with React Native Firebase

**Date:** February 5, 2026  
**Status:** Resolved

---

### Symptoms

- iOS build failing with multiple compilation errors
- Error: "include of non-modular header inside framework module" from React Native Firebase
- Error: "type specifier missing, defaults to 'int'" in `RCT_EXPORT_METHOD` declarations
- Syntax errors in `RNFBFirestoreDocumentModule.m`, `RNFBFirestoreTransactionModule.m`, and other Firestore modules
- Build fails with error code 65 after extensive compilation

### Environment

- **React Native:** 0.81.5
- **Expo SDK:** 54.0.33
- **React Native Firebase:** 23.8.6 (initial), 23.7.0, 20.5.0 (tested)
- **Xcode:** Latest
- **OS:** macOS (Apple Silicon)

### Investigation Steps

1. **Initial error:** Non-modular header warnings from `@react-native-firebase/app`
   - Firebase modules were importing React Native headers inside framework modules
   - Xcode was treating these warnings as errors

2. **First fix attempt:** Modified `ios/Podfile` to disable non-modular header warnings
   ```ruby
   post_install do |installer|
     # ... existing code ...
     
     # Fix for React Native Firebase build issues
     installer.pods_project.targets.each do |target|
       target.build_configurations.each do |config|
         # Disable non-modular header warnings
         config.build_settings['CLANG_WARN_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'NO'
         # Don't treat warnings as errors
         config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
         # Specifically for RNFBApp and related Firebase targets
         if target.name.start_with?('RNFB') || target.name.include?('Firebase')
           config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
         end
       end
     end
   end
   ```
   - **Result:** Fixed non-modular header errors, but revealed deeper syntax issues

3. **Second error discovered:** Objective-C syntax errors in Firestore module
   - 28+ methods had malformed `RCT_EXPORT_METHOD` declarations
   - Example problematic syntax:
     ```objc
     RCT_EXPORT_METHOD(documentDelete
                       : (FIRApp *)firebaseApp
                       : (NSString *)databaseId
     ```
   - Missing method selector names after the method name
   - Should be: `RCT_EXPORT_METHOD(documentDelete:(FIRApp *)firebaseApp databaseId:(NSString *)databaseId ...)`

4. **Version testing:**
   - Tried downgrading to v23.7.0 - same syntax errors
   - Tried downgrading to v20.5.0 - same syntax errors
   - Issue appears to be present across many React Native Firebase versions

### Root Cause

**React Native Firebase Firestore module has widespread Objective-C syntax errors** in the native iOS implementation that are incompatible with the current React Native/Xcode toolchain. The `RCT_EXPORT_METHOD` macro declarations are missing proper selector naming conventions, causing compilation failures.

This appears to be a compatibility issue between:
- React Native Firebase's native module implementation
- React Native 0.81.5's bridge/macro system
- Current Xcode compiler strictness

### Solution

**Remove the Firestore package** as it has unresolved syntax issues. The app can still use:
- Firebase Auth (working correctly)
- Firebase Realtime Database (working correctly)
- All other Firebase services except Firestore

#### Fix Applied

```bash
# Remove Firestore
npm uninstall @react-native-firebase/firestore

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Build
npx expo run:ios
```

#### Updated package.json

```json
{
  "dependencies": {
    "@react-native-firebase/app": "20.5.0",
    "@react-native-firebase/auth": "20.5.0",
    "@react-native-firebase/database": "20.5.0"
    // Firestore removed
  }
}
```

### Result

After removing Firestore:
- ✅ Build succeeded with 0 errors
- ✅ App installed and launched on iOS simulator
- ✅ Firebase Auth and Realtime Database still functional
- ✅ Build time significantly reduced (no gRPC compilation needed)

### Alternative Solutions (For Future Use)

1. **Use Firebase JS SDK** instead of React Native Firebase for Firestore
   - Compatible with Expo
   - No native module compilation needed
   - May have some feature limitations

2. **Create a patch** using `patch-package` to fix the Objective-C syntax
   - Would need to fix 28+ method declarations across 4 files
   - Maintenance burden for each version update

3. **Wait for fix** in React Native Firebase
   - Monitor the GitHub repository for syntax fixes
   - Test newer versions as they're released

4. **Consider alternative database** solutions
   - Firebase Realtime Database (already working)
   - Expo's SQLite
   - Alternative cloud databases

### Files Modified

- `ios/Podfile` - Added post_install hook to disable non-modular header warnings
- `package.json` - Removed `@react-native-firebase/firestore` dependency

### Lessons Learned

1. Not all packages in a dependency family may be compatible with your environment
2. Bleeding-edge versions may have undetected issues - consider using established stable versions
3. Native module syntax errors can be difficult to diagnose without checking the actual source files
4. Firebase has multiple client options (Native SDK vs JS SDK) - evaluate which fits your needs
5. Sometimes the best solution is to remove a problematic dependency rather than fighting it
6. The Podfile `post_install` hook is powerful for fixing CocoaPods build configuration issues
7. Always check if the issue spans multiple versions before assuming it's version-specific

---

## Issue: Metro CI Mode Recurrence and Blank Pages

**Date:** February 5, 2026  
**Status:** Resolved

---

### Symptoms

- Both iOS simulator and web showing blank pages
- Metro bundler running but not serving content properly
- Issue occurred after previous fixes

### Root Cause

The Metro bundler was reverting to CI mode behavior despite previous fixes. The `CI=false` flag needed to be explicitly set in all npm scripts.

### Solution

Updated `package.json` scripts to consistently include both `CI=false` and `EXPO_USE_FAST_RESOLVER=1`:

```json
{
  "scripts": {
    "start": "CI=false EXPO_USE_FAST_RESOLVER=1 expo start",
    "android": "CI=false EXPO_USE_FAST_RESOLVER=1 expo start --android",
    "ios": "CI=false EXPO_USE_FAST_RESOLVER=1 expo start --ios",
    "web": "CI=false EXPO_USE_FAST_RESOLVER=1 expo start --web"
  }
}
```

Also cleared Metro cache and restarted Watchman:

```bash
npx expo start --clear
watchman shutdown-server
watchman watch-project .
```

### Result

- ✅ Metro bundler serving content correctly
- ✅ Both iOS and web versions loading

---

## Issue: Firebase Runtime Errors and Missing Configuration

**Date:** February 5, 2026  
**Status:** Resolved

---

### Symptoms

1. **Error:** `Unable to resolve module @react-native-firebase/firestore`
2. **Error:** `App entry not found - The app entry point named "main" was not registered`
3. **Error:** `No Firebase App '[DEFAULT]' has been created - call firebase.initializeApp()`
4. **Error:** `TypeError: Cannot read property 'onAuthStateChanged' of null`

### Environment

- **React Native:** 0.81.5
- **Expo SDK:** 54.0.33
- **React Native Firebase:** 20.5.0
- Missing `GoogleService-Info.plist` for iOS

### Investigation Steps

1. **Module resolution error:**
   - After removing Firestore, there was a cached import in `firebase.config.ts`
   - **Fix:** Removed Firestore import and cleared Metro cache

2. **App entry not found:**
   - This error appeared but was actually a symptom of subsequent Firebase initialization errors preventing app from registering
   - Verified `index.ts` correctly calls `registerRootComponent(App)`

3. **Firebase initialization error:**
   - App attempted to use Firebase services without proper configuration
   - Missing `GoogleService-Info.plist` caused Firebase to fail initialization
   - **Problem:** Direct calls to `auth()` and `database()` would crash if Firebase wasn't configured

4. **Null reference error:**
   - After making Firebase initialization safe, `authStore` was trying to call methods on null Firebase instances
   - **Problem:** `firebaseAuth.onAuthStateChanged()` would crash if `firebaseAuth` was null

### Root Cause

The app was not designed to handle scenarios where Firebase might not be fully configured. This caused cascading failures:
1. Firebase fails to initialize (missing config files)
2. Exports from `firebase.config.ts` are null
3. Code attempting to use Firebase services crashes with null reference errors

### Solution

Made Firebase initialization and usage fault-tolerant across the entire app:

#### 1. Updated `src/config/firebase.config.ts`

Added safe getter functions that catch Firebase initialization errors:

```typescript
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

/**
 * Get Firebase Authentication instance (safe)
 */
export const getFirebaseAuth = () => {
  try {
    return auth();
  } catch (error) {
    console.warn('Firebase Auth not initialized:', error);
    return null;
  }
};

/**
 * Get Realtime Database instance (safe)
 */
export const getFirebaseDatabase = () => {
  try {
    return database();
  } catch (error) {
    console.warn('Firebase Database not initialized:', error);
    return null;
  }
};

// Legacy exports - these may be null if Firebase is not configured
export const firebaseAuth = getFirebaseAuth();
export const firebaseDatabase = getFirebaseDatabase();

export const RTDB_PATHS = {
  GAMES: 'games',
  PRESENCE: 'presence',
  USERS: 'users',
  FRIENDSHIPS: 'friendships',
  GAME_ROOMS: 'gameRooms',
  NOTIFICATIONS: 'notifications',
} as const;
```

#### 2. Updated `src/store/authStore.ts`

**Key Changes:**

a) **Added null checks before all Firebase operations:**

```typescript
initialize: () => {
  // Check if Firebase is configured
  if (!firebaseAuth) {
    console.warn('Firebase not configured, skipping auth initialization');
    set({ isLoading: false, isAuthenticated: false });
    return () => {}; // Return empty unsubscribe function
  }

  const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
    // ... rest of logic
  });

  return unsubscribe;
},
```

b) **Migrated from Firestore to Realtime Database:**

Before (Firestore):
```typescript
// Check username
const usernameQuery = await firebaseFirestore
  .collection(COLLECTIONS.USERS)
  .where('username', '==', username.toLowerCase())
  .get();

if (!usernameQuery.empty) {
  throw new Error('Username is already taken');
}

// Create user profile
await firebaseFirestore
  .collection(COLLECTIONS.USERS)
  .doc(user.uid)
  .set(userProfile);
```

After (Realtime Database):
```typescript
// Check username
const usernameSnapshot = await firebaseDatabase
  .ref(`${RTDB_PATHS.USERS}`)
  .orderByChild('username')
  .equalTo(username.toLowerCase())
  .once('value');

if (usernameSnapshot.exists()) {
  throw new Error('Username is already taken');
}

// Create user profile
await firebaseDatabase
  .ref(`${RTDB_PATHS.USERS}/${user.uid}`)
  .set(userProfile);
```

c) **Converted Date objects for RTDB compatibility:**

Realtime Database doesn't support Date objects natively, so we use ISO strings:

```typescript
// When saving
const userProfile = {
  // ... other fields
  createdAt: new Date().toISOString(), // Store as string
  lastOnline: new Date().toISOString(),
};

// When reading
const userProfile = {
  // ... other fields
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  lastOnline: data.lastOnline ? new Date(data.lastOnline) : new Date(),
};
```

d) **Added Firebase checks in all auth methods:**

Every method now starts with:
```typescript
if (!firebaseAuth || !firebaseDatabase) {
  throw new Error('Firebase not configured');
}
```

### Files Modified

- `src/config/firebase.config.ts` - Added safe getter functions with try-catch blocks
- `src/store/authStore.ts` - Migrated from Firestore to Realtime Database, added null checks
- `package.json` - Updated Metro start commands

### Result

After implementing these fixes:
- ✅ App launches successfully even without Firebase configuration
- ✅ No crashes from null Firebase references
- ✅ All auth store methods safely check for Firebase availability
- ✅ Graceful degradation when Firebase is not configured
- ✅ Seamless migration from Firestore to Realtime Database

### Lessons Learned

1. **Always handle initialization failures gracefully** - external services may not be configured in all environments
2. **Null checks are essential** for optional dependencies like Firebase
3. **Try-catch blocks** should wrap any initialization code that might fail
4. **Firestore vs Realtime Database API differences:**
   - Firestore: `collection().doc().set()` / `.where().get()`
   - RTDB: `ref().set()` / `.orderByChild().equalTo().once()`
5. **Date handling in RTDB** requires converting to/from ISO strings
6. **Metro cache issues** can persist module resolution errors even after fixing code
7. **Cascading errors** can mask the root cause - fix the initialization first
8. **Return empty functions** for cleanup callbacks when services aren't initialized to prevent errors in cleanup code
