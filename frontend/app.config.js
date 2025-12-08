// app.config.js
export default ({ config }) => ({
    expo: {
        name: "FactSnap",
        slug: "factsnap",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "factsnap",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.factsnap.app",
            infoPlist: {
                UIBackgroundModes: ["location", "fetch"],
                ITSAppUsesNonExemptEncryption: false,
                // These strings are shown in iOS permission prompts / Settings
                NSLocationWhenInUseUsageDescription:
                    "Allow FactSnap to access your location to show nearby questions.",
                NSLocationAlwaysAndWhenInUseUsageDescription:
                    "Allow FactSnap to access your location in the background so we can alert you about nearby questions even if the app isn't open.",
                NSLocationAlwaysUsageDescription:
                    "Allow FactSnap to access your location in the background so we can alert you about nearby questions even if the app isn't open.",
            },
            config: {
                // Don't hardcode in git. Use env. This is used for Apple Maps replacement.
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            },
        },

        android: {
            package: "com.factsnap.app",
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            googleServicesFile: "./google-services.json",

            // ---- OPTION A: minimal perms (foreground only) ----
            // permissions: [
            //   "ACCESS_COARSE_LOCATION",
            //   "ACCESS_FINE_LOCATION",
            //   "FOREGROUND_SERVICE",
            //   "FOREGROUND_SERVICE_LOCATION"
            // ],

            // ---- OPTION B: full background tracking perms ----
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION",
            ],
            config: {
                // Don't hardcode in git. Use env. This is used for Google Maps replacement.
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        },

        extra: {
            // Expo automatically injects EXPO_PUBLIC_* into your JS bundle.
            // DO NOT put secrets here unless the key is locked down in Google Cloud.
            EXPO_PUBLIC_GOOGLE_PLACES_API_KEY:
                process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
            eas: {
                projectId: "0a1d39cd-3065-41e6-93dc-a94f7ecb9fc5",
            }
        },
        owner: "factsnap",
        web: {
            output: "single",
            bundler: "metro",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-router",

            [
                "expo-location",
                {
                    // These are for the native Info.plist / AndroidManifest
                    locationAlwaysAndWhenInUsePermission:
                        "Allow FactSnap to use your location in the background so we can alert you about nearby questions even if the app isn't open.",
                    locationAlwaysPermission:
                        "Allow FactSnap to use your location in the background so we can alert you about nearby questions even if the app isn't open.",
                    locationWhenInUsePermission:
                        "Allow FactSnap to access your location to show nearby questions.",
                    isAndroidBackgroundLocationEnabled: true,
                    isAndroidForegroundServiceEnabled: true,
                },
            ],

            [
                "expo-notifications",
                {
                    icon: "./assets/images/icon.png",
                    color: "#ffffff",
                },
            ],

            [
                "expo-image-picker",
                {
                    "photosPermission": "Allow FactSnap to access your photos so you can share them in your questions.",
                    "cameraPermission": "Allow FactSnap to access your camera.",
                }
            ],

            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000",
                    },
                },
            ],

            "expo-font",
        ],

        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
    },
});
