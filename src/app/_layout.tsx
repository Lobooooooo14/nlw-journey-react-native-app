import { View, StatusBar } from "react-native"

import {
  useFonts,
  Inter_500Medium,
  Inter_400Regular,
  Inter_600SemiBold
} from "@expo-google-fonts/inter"
import { Slot } from "expo-router"

import { Loading } from "@/components/loading"

import "@/styles/global.css"
import "@/utils/dayjsLocaleConfig"

function Layout() {
  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_400Regular,
    Inter_600SemiBold
  })

  if (!fontsLoaded) {
    return <Loading />
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <Slot />
    </View>
  )
}

export default Layout
