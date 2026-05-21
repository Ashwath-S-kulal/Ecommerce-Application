import React, { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { isTokenExpired } from "../utils/auth";

import "../../global.css";

export default function TabsLayout() {
  const { user } = useSelector((state) => state.user);
  const { cart } = useSelector((state) => state.product);

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


  const protectTab = async (e, route) => {
    e.preventDefault();

    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!user || !token) {
        router.push("/components/new");
        return;
      }

      if (isTokenExpired(token)) {
        await AsyncStorage.removeItem("accessToken");

        router.push("/components/new");
        return;
      }

      router.push(route);

    } catch (error) {
      router.push("/components/new");
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
        tabBarStyle: {
          height: 65,
          paddingTop: 10,
          paddingBottom: 15,
          backgroundColor: "#ffffff",
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
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        listeners={{
          tabPress: (e) => protectTab(e, "/cart"),
        }}
        options={{
          title: "Cart",
          tabBarBadge: cart?.items?.length > 0 ? cart.items.length : null,
          tabBarBadgeStyle: { backgroundColor: "black" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        listeners={{
          tabPress: (e) => protectTab(e, "/wishlist"),
        }}
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: (e) => protectTab(e, "/profile"),
        }}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


