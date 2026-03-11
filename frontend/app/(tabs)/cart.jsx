import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Trash2, Minus, Plus, ArrowLeft, Truck, ShoppingCart, ChevronRight } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart } from '../../redux/productSlice';
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";


export default function Cart() {
  const { cart } = useSelector(store => store.product);
  const subTotal = cart?.totalPrice || 0;
  const freeShippingThreshold = 5000;
  const shipping = subTotal > freeShippingThreshold || subTotal === 0 ? 0 : 50;
  const total = subTotal + shipping;
  const tax = 0;
  const dispatch = useDispatch();
  const router = useRouter();

  const progressToFreeShipping = Math.min((subTotal / freeShippingThreshold) * 100, 100);

  const API = `${Constants.expoConfig.extra.apiUrl}/api/cart`;

  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const showToast = (text) => {
    setToastMsg(text);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(""));
  };

  const loadCart = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const res = await axios.get(`${API}/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data.success) {
        dispatch(setCart(res.data.cart));
      }
    } catch (error) {
      console.log("Cart load error:", error);
    } finally {
      setLoading(false); // ✅ important
    }
  };

  const handleUpdateQuantity = async (productId, type) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const res = await axios.put(`${API}/update`, { productId, type }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        showToast('Quantity updated');
      }
    } catch (error) {
      console.error("Update qty error:", error);
      showToast('Failed to update quantity');
    }
  };

  const handleRemove = async (productId) => {
    setIsDeletingId(productId); // Start loading for this ID
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const res = await axios.delete(`${API}/remove`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { productId }
      });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        showToast('Item removed from cart');
      }
    } catch (error) {
      console.log(error);
      showToast('Failed to remove item');

    } finally {
      setIsDeletingId(null); // Stop loading
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (!cart?.items?.length) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8 border border-slate-100">
            <ShoppingCart size={40} color="#0f172a" strokeWidth={1} />
          </View>
          <Text className="text-3xl font-black text-slate-900 tracking-tighter mb-3" numberOfLines={1}>
            Cart is empty
          </Text>
          <Text className="text-slate-500 text-center text-sm leading-6 mb-12 max-w-[200px]">
            You havent added any items to your bag yet. Lets start exploring.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/shop')}
            className="bg-pink-600 px-10 py-4 rounded-full shadow-lg shadow-pink-200"
          >
            <Text className="text-white font-bold text-xs uppercase tracking-[0.2em]">Browse Collection</Text>
          </TouchableOpacity>
          <View className="mt-8 flex-row items-center">
            <View className="h-[1px] w-8 bg-slate-200" />
            <Text className="text-slate-300 font-medium text-[10px] uppercase mx-4">or</Text>
            <View className="h-[1px] w-8 bg-slate-200" />
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wishlist')}>
            <Text className="text-slate-900 font-bold text-xs mt-6 underline underline-offset-4" numberOfLines={1}>View My Wishlist</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fa] px-6 pt-6">
        <View className="h-8 w-32 bg-slate-200 rounded-md mb-6" />
        <View className="bg-white p-4 rounded-md mb-4">
          <View className="h-3 w-40 bg-slate-200 rounded mb-3" />
          <View className="h-2 w-full bg-slate-200 rounded-full" />
        </View>

        {[1, 2].map((_, index) => (
          <View key={index} className="bg-white rounded-md p-3 mb-3 flex-row">
            <View className="bg-white rounded-md p-3 mb-3 flex-row items-center border border-gray-50">
              <View className="w-20 h-24 rounded-xl bg-gray-100 opacity-50" />
              <View className="flex-1 ml-4">
                <View className="flex-row justify-between mb-2">
                  <View className="h-4 w-32 bg-gray-200 rounded-md" />
                  <View className="h-4 w-16 bg-gray-200 rounded-md" />
                </View>
                <View className="h-3 w-20 bg-gray-100 rounded-md mb-4" />
                <View className="flex-row justify-between items-center">
                  <View className="h-8 w-24 bg-gray-50 rounded-lg" />
                  <View className="h-8 w-20 bg-gray-50 rounded-lg" />
                </View>
              </View>
            </View>
          </View>
        ))}

        <View className="mt-4 bg-white rounded-md p-6 shadow-sm">
          <View className="h-3 w-20 bg-slate-200 rounded mb-6" />
          <View className="flex-row justify-between mb-4">
            <View className="h-3 w-16 bg-slate-200 rounded" />
            <View className="h-3 w-20 bg-slate-200 rounded" />
          </View>
          <View className="flex-row justify-between mb-4">
            <View className="h-3 w-16 bg-slate-200 rounded" />
            <View className="h-3 w-16 bg-slate-200 rounded" />
          </View>
          <View className="h-[1px] bg-slate-100 w-full my-3" />
          <View className="flex-row justify-between items-center mb-6">
            <View className="h-3 w-14 bg-slate-200 rounded" />
            <View className="h-6 w-24 bg-slate-200 rounded" />
          </View>
          <View className="flex-row items-center bg-slate-50 p-4 rounded-md border border-slate-100 mb-6">
            <View className="w-8 h-8 bg-slate-200 rounded-lg" />
            <View className="ml-3 flex-1">
              <View className="h-3 w-28 bg-slate-200 rounded mb-2" />
              <View className="h-2 w-36 bg-slate-200 rounded" />
            </View>
          </View>
          <View className="h-16 bg-slate-200 rounded-full" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <View>
            <View className="flex-row items-center">
              <Text numberOfLines={1} className="text-3xl font-black text-gray-900 tracking-tight">My Cart Items</Text>
              <View className="ml-2 bg-rose-50 px-2 py-0.5 rounded-full">
                <Text className="text-rose-500 text-xs font-bold">{cart?.items?.length || 0}</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs mt-1">Review your selections and proceed to checkout.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('../(tabs)/shop')} className="flex flex-row items-center mb-1">
            <ArrowLeft size={12} color="#db2777" />
            <Text className="text-[13px] font-black uppercase text-pink-600 ml-1">Add More</Text>
          </TouchableOpacity>
        </View>


        <View className="px-4 mt-6">
          <View className="bg-white p-4 rounded-md border border-pink-50 shadow-sm mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Truck size={14} color="black" />
                <Text className="text-[10px] font-black text-black-600 ml-2">
                  {subTotal >= freeShippingThreshold ? "Free Delivery Unlocked" : "Delivery Progress"}
                </Text>
              </View>
              <Text className="text-[9px] font-bold text-slate-400">Target: ₹{freeShippingThreshold}</Text>
            </View>
            <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </View>
          </View>

          {cart.items.map((item, index) => (
            <View key={index} className="bg-white rounded-md p-3 mb-3 flex-row items-center">
              <TouchableOpacity onPress={() => router.push(`/product/${item.productId?._id}`)}>
                <Image
                  source={{ uri: item.productId?.productImg?.[0]?.url }}
                  className="w-20 h-24 rounded-xl bg-slate-50"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View className="flex-1 ml-4">
                <View className="flex-row justify-between">
                  <Text numberOfLines={1} className="text-sm font-bold text-slate-800 flex-1">{item.productId?.productName}</Text>
                  <Text className="text-sm font-black text-slate-900 ml-2">₹{(item.productId?.productPrice * item.quantity).toLocaleString()}</Text>
                </View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3">{item.productId?.category}</Text>

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.productId?._id, 'decrease')} disabled={item.quantity <= 1} className="p-1">
                      <Minus size={16} color={item.quantity <= 1 ? "#cbd5e1" : "#000"} />
                    </TouchableOpacity>
                    <Text className="px-3 font-bold text-md">{item.quantity}</Text>
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.productId?._id, 'increase')} className="p-1">
                      <Plus size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.productId?._id)}
                    disabled={isDeletingId === item.productId?._id} // Disable while deleting
                    className="flex-row items-center gap-2 border border-red-400 rounded-lg px-3 py-1.5 h-10 min-w-[80px] justify-center"
                  >
                    {isDeletingId === item.productId?._id ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <>
                        <Trash2 size={16} color="#ef4444" />
                      </>
                    )}
                    <Text className="text-red-500 font-bold text-xs">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="mx-4 mt-4 bg-white rounded-md p-6 shadow-sm">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Summary</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-slate-500 text-xs">Subtotal</Text>
              <Text className="font-bold text-slate-900 text-xs">₹{subTotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between my-2">
              <Text className="text-slate-500 text-xs">Shipping</Text>
              <Text className={`font-bold text-xs ${shipping === 0 ? "text-green-500" : "text-slate-900"}`}>
                {shipping === 0 ? "FREE" : `₹${shipping}`}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500 text-xs">Tax</Text>
              <Text className="font-bold text-slate-900 text-xs">₹{tax.toLocaleString()}</Text>
            </View>
            <View className="h-[1px] bg-slate-100 w-full my-2" />
            <View className="flex-row justify-between items-center">
              <Text className="text-slate-900 font-black text-xs uppercase">Total</Text>
              <Text className="text-2xl font-black text-pink-600">₹{total.toLocaleString()}</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-slate-50 p-4 rounded-md mt-6 border border-slate-100">
            <View className="bg-pink-100 p-2 rounded-lg">
              <Truck size={18} color="#db2777" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-slate-900 text-[11px]">Cash on Delivery</Text>
              <Text className="text-[9px] text-slate-400">Available for your location</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/components/AddressForm')}
            className="bg-black h-16 rounded-xl items-center justify-center flex-row mt-6 shadow-lg"
          >
            <Text className="text-white font-black tracking-widest uppercase text-xs mr-2">Place Order</Text>
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toastMsg ? (
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
          className="absolute bottom-10 self-center bg-black/80 px-6 py-3 rounded-full shadow-lg"
        >
          <Text className="text-white font-bold text-xs  tracking-widest">{toastMsg}</Text>
        </Animated.View>
      ) : null}

    </SafeAreaView>
  );
}