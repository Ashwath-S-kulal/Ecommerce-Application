import { Stack, router } from "expo-router";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export default function AdminLayout() {
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    if (user !== undefined && (!user || user.role !== "admin")) {
      router.replace("/"); 
    }
  }, [user]);

  // If user is not admin, prevent rendering anything while redirect happens
  if (!user || user.role !== "admin") return null;

  return (
    <Stack screenOptions={{ headerShown: false }}> 
      <Stack.Screen name="Dashboard" />
      <Stack.Screen name="Products" />
      <Stack.Screen name="AddProducts" />
      <Stack.Screen name="Orders" />
      <Stack.Screen name="Users" />
      <Stack.Screen name="order" />
    </Stack>
  );
}