import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Animated } from 'react-native';
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
  const dispatch = useDispatch();
  const router = useRouter();

  const progressToFreeShipping = Math.min((subTotal / freeShippingThreshold) * 100, 100);

  const API = `${Constants.expoConfig.extra.apiUrl}/api/cart`;

console.log("BASE URL:", process.env.EXPO_PUBLIC_BASE_URL);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;


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

    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (!cart?.items?.length) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-20 h-20 bg-rose-50 rounded-full items-center justify-center mb-6">
          <ShoppingCart size={32} color="#fb7185" />
        </View>
        <Text className="text-xl font-black text-slate-900 tracking-tight" numberOfLines={1}>Your cart is empty</Text>
        <Text className="text-slate-400 text-center mt-2 mb-8 text-sm">Looks like you have not added anything yet.</Text>
        <TouchableOpacity
          onPress={() => router.push('/products')}
          className="bg-black px-8 py-4 rounded-full w-full items-center"
        >
          <Text className="text-white font-bold uppercase tracking-widest text-xs">Start Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-3 pb-4 flex-row justify-between items-end">
          <View>
            <Text numberOfLines={1} className="text-3xl font-black text-slate-900 tracking-tighter">My Cart</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.items.length} Items</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('../(tabs)/shop')} className="flex flex-row items-center mb-1">
            <ArrowLeft size={12} color="#db2777" />
            <Text className="text-[10px] font-black uppercase text-pink-600 ml-1">Add More</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4">
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
                  <TouchableOpacity onPress={() => handleRemove(item.productId?._id)} className="flex-row items-center gap-2 border border-red-400 rounded-lg px-2 py-1">
                    <Text className="text-red-500"> Delete</Text><Trash2 size={16} color="#ef4444" />
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
            className="bg-black h-16 rounded-full items-center justify-center flex-row mt-6 shadow-lg"
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