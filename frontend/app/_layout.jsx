import { Stack, usePathname } from "expo-router";
import { Provider } from "react-redux";
import { store, persistor } from "../redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BackHandler, ToastAndroid } from "react-native";
import { useEffect, useRef } from "react";

export default function RootLayout() {
  const pathname = usePathname();
  const backPressCount = useRef(0);

  useEffect(() => {
    const onBackPress = () => {
      if (pathname !== "/") {
        return false;
      }

      if (backPressCount.current === 1) {
        BackHandler.exitApp();
        return true;
      }

      backPressCount.current = 1;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);

      setTimeout(() => {
        backPressCount.current = 0;
      }, 2000);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => subscription.remove();
  }, [pathname]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "white" },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(pages)" />
            <Stack.Screen name="(admin)" />
          </Stack>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}