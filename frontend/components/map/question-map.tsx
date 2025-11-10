import React from "react"
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps"
import { View, Text } from "tamagui"
import { StyleSheet, Platform } from "react-native"
import {Location} from "@/models/location";

type Props = {
    location: Location
    height?: number
}

export default function QuestionMap({ location, height = 250 }: Props) {
    const region: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    }

    return (
        <View borderRadius="$4" overflow="hidden" height={height}>
            <MapView
                style={styles.map}
                provider={
                    Platform.OS === "android" || Platform.OS === "ios"
                        ? PROVIDER_GOOGLE
                        : undefined
                }
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton
                scrollEnabled
                zoomEnabled
                pitchEnabled
                rotateEnabled
            >
                <Marker
                    coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }}
                    title={location.name}
                    description={location.address}
                />
            </MapView>

            {(location.name || location.address) && (
                <View padding="$2">
                    <Text fontWeight="600">{location.name}</Text>
                    {location.address && (
                        <Text fontSize="$2" color="$gray10">
                            {location.address}
                        </Text>
                    )}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    map: {
        width: "100%",
        height: "100%",
    },
})