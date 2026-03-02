import React, { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import "../../global.css";

export default function TabsLayout() {
  const { user } = useSelector((state) => state.user);
  const { cart, wishlist } = useSelector((state) => state.product);
  const pathname = usePathname();

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true; 
      }
      return false;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [pathname]); 

  const protectTab = (e) => {
    if (!user) {
      e.preventDefault();
      router.push("/(auth)/login");
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        backBehavior: "history", 
        tabBarActiveTintColor: "#db2777",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        listeners={{ tabPress: protectTab }}
        options={{
          title: "Cart",
          tabBarBadge: cart?.items?.length > 0 ? cart.items.length : null,
          tabBarBadgeStyle: { backgroundColor: "black" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-handle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        listeners={{ tabPress: protectTab }}
        options={{
          title: "Wish",
          tabBarBadge: wishlist?.items?.length > 0 ? wishlist.items.length : null,
          tabBarBadgeStyle: { backgroundColor: "black" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: protectTab }}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="(auth)" options={{ href: null }} />
    </Tabs>
  );
}