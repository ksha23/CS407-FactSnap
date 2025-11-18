// app.config.js
export default ({ config }) => ({
    expo: {
        name: "frontend",
        slug: "frontend",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "frontend",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        ios: {
            supportsTablet: true,
            infoPlist: {
                UIBackgroundModes: ["location", "fetch"],
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
                googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_API_KEY,
            },
        },

        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png",
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,

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
        },

        extra: {
            // Expo automatically injects EXPO_PUBLIC_* into your JS bundle.
            // DO NOT put secrets here unless the key is locked down in Google Cloud.
            EXPO_PUBLIC_GOOGLE_PLACES_API_KEY:
                process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
        },

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
