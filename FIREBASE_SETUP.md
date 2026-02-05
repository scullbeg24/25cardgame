# Firebase Setup Guide for 25 Card Game

This guide will help you set up Firebase for the online multiplayer features.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name your project (e.g., "25-card-game")
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Add Firebase to Your Apps

### For iOS:

1. In Firebase Console, click the iOS icon to add an iOS app
2. Enter iOS bundle ID: `com.patrickscully.25cardgame` (or your bundle ID from app.json)
3. Download `GoogleService-Info.plist`
4. Place it in the root directory of this project (same level as package.json)

### For Android:

1. In Firebase Console, click the Android icon to add an Android app
2. Enter Android package name: `com.patrickscully.25cardgame` (or your package from app.json)
3. Download `google-services.json`
4. Place it in the root directory of this project (same level as package.json)

## Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Click "Save"

## Step 4: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in "production mode"
4. Choose a location (select one close to your users)
5. Click "Enable"

### Add Firestore Security Rules:

Go to the "Rules" tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Friendships
    match /friendships/{friendshipId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.users;
      allow create: if request.auth != null && 
                       request.auth.uid in request.resource.data.users;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.users;
      allow delete: if request.auth != null && 
                       request.auth.uid in resource.data.users;
    }
    
    // Game rooms
    match /gameRooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
                       resource.data.hostUserId == request.auth.uid;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

## Step 5: Create Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Start in "locked mode"
4. Choose same location as Firestore
5. Click "Enable"

### Add Realtime Database Security Rules:

Go to the "Rules" tab and replace with:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        "players": {
          "$userId": {
            "hand": {
              ".read": "auth.uid === $userId"
            }
          }
        },
        "state": {
          ".write": "auth != null"
        },
        "players": {
          "$userId": {
            ".write": "auth != null"
          }
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth.uid === $userId"
      }
    }
  }
}
```

## Step 6: Build and Run

After completing the setup:

1. **For iOS (Mac only):**
   ```bash
   npx expo run:ios
   ```

2. **For Android:**
   ```bash
   npx expo run:android
   ```

Note: You need to use `expo run:ios` or `expo run:android` (not `expo start`) because Firebase requires native modules that aren't available in Expo Go.

## Troubleshooting

### iOS Issues:
- Make sure `GoogleService-Info.plist` is in the project root
- Clean build: `rm -rf ios/build && npx expo run:ios`
- Check that bundle ID matches in Firebase Console and app.json

### Android Issues:
- Make sure `google-services.json` is in the project root
- Clean build: `cd android && ./gradlew clean && cd .. && npx expo run:android`
- Check that package name matches in Firebase Console and app.json

### General Issues:
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start -c`

## Testing Firebase Connection

Once the app is running, check the console/logs for:
- "Firebase initialized successfully" message
- No Firebase-related errors

You can also test by trying to create an account in the app.
