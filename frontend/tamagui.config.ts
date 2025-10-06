import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
import { createInterFont } from '@tamagui/font-inter'

// Keep sizes compact; tweak to taste
const inter = createInterFont()


export const tamaguiConfig = createTamagui({
    ...config,
    fonts: {
        ...config.fonts,
        body: inter,
        heading: inter,
    },
    defaultFont: 'body',
})

export default tamaguiConfig
export type Conf = typeof tamaguiConfig
declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf {}
}


// export const tamaguiConfig = createTamagui(config)
//
// export default tamaguiConfig
//
// export type Conf = typeof tamaguiConfig
//
// declare module 'tamagui' {
//     interface TamaguiCustomConfig extends Conf {}
// }