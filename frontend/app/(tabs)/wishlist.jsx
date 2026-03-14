import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Trash, Trash2, X } from 'lucide-react-native';
import axios from 'axios';
import { setWishlist, setCart } from '@/redux/productSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import ProductDetail from '../product/[id]';
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

export default function Wishlist() {
  const { wishlist } = useSelector(store => store.product);
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRemovingId, setIsRemovingId] = useState(null);
  const [isAddingId, setIsAddingId] = useState(null);

  const API = `${Constants.expoConfig.extra.apiUrl}/api/wishlist`;
  const CART_API = `${Constants.expoConfig.extra.apiUrl}/api/cart`;

  useEffect(() => {
    if (toastMsg) {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => setToastMsg(""));
    }
  }, [toastMsg]);



  const loadWishlist = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API}/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        dispatch(setWishlist(res.data.wishlist || { items: [] }));
      }
    } catch (error) {
      console.error("Wishlist Load Error:", error.message);
    } finally {
      setLoading(false);
    }
  };



  const handleRemove = async (productId) => {
    setIsRemovingId(productId);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.delete(`${API}/remove`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId },
      });
      if (res.data.success) {
        dispatch(setWishlist(res.data.wishlist));
        setToastMsg("Removed from Whishlist");
      }
    } catch (error) {
      setToastMsg("Failed to remove item");
    } finally {
      setIsRemovingId(null);
    }
  };


  const handleMoveToCart = async (productId) => {
    setIsAddingId(productId);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.post(`${CART_API}/add`, { productId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        setToastMsg("Added to cart");
      }
    } catch (error) {
      setToastMsg("Failed to add to cart");
    } finally {
      setIsAddingId(null);
    }
  };


useEffect(() => {
  if (!wishlist?.items?.length) {
    loadWishlist();
  } else {
    setLoading(false);
  }
}, []);

  const WishlistSkeleton = () => (
    <View className="bg-white p-4 mb-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200">
      <View className="flex-row">
        <View className="w-24 h-24 rounded-[20px] bg-gray-100" />
        <View className="flex-1 px-4 justify-center">
          <View className="h-4 w-3/4 bg-gray-100 rounded-md mb-2" />
          <View className="h-3 w-1/2 bg-gray-100 rounded-md mb-3" />
          <View className="h-5 w-1/3 bg-gray-100 rounded-md" />
        </View>
      </View>
      <View className="mt-4 h-12 bg-gray-50 rounded-xl" />
    </View>
  );


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB]">
        <ScrollView>
          <View className="px-6 pt-3 pb-6 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="h-8 w-40 bg-gray-200 rounded-lg" />
              <View className="ml-2 h-5 w-8 bg-rose-100 rounded-full" />
            </View>
            <View className="h-3 w-48 bg-gray-100 rounded-md mt-2" />
          </View>
          <View className="px-5 mt-4">
            {[1, 2, 3].map((key) => (
              <WishlistSkeleton key={key} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!wishlist?.items?.length) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-8 border border-slate-100">
            <Heart size={40} color="#0f172a" strokeWidth={1} />
          </View>
          <Text className="text-3xl font-black text-slate-900 tracking-tighter mb-3" numberOfLines={1}>
            Whishlist is empty
          </Text>
          <Text className="text-slate-500 text-center text-sm leading-6 mb-12 max-w-[200px]">
            You havent added any items to your wishlist yet. Lets start exploring.
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
          <TouchableOpacity onPress={() => router.push('/(tabs)/cart')}>
            <Text className="text-slate-900 font-bold text-xs mt-6 underline underline-offset-4" numberOfLines={1}>View My Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF9]">
      <View className="px-6 pt-3 pb-6 border-b border-gray-100">
        <View className="flex-row items-center">
          <Text numberOfLines={1} className="text-3xl font-black text-gray-900 tracking-tight">My Wishlist</Text>
          <View className="ml-2 bg-rose-50 px-2 py-0.5 rounded-full">
            <Text className="text-rose-500 text-xs font-bold">{wishlist?.items?.length || 0}</Text>
          </View>
        </View>
        <Text className="text-gray-400 text-xs mt-1">Saved items for your aesthetic upgrade.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {wishlist.items.map((item) => (
          <View
            key={item.productId?._id}
            className="relative bg-white p-4 mb-3 rounded-xl border-2 border-slate-100 shadow-2xl mt-3"
          >
            <TouchableOpacity
              onPress={() => handleRemove(item.productId?._id)}
              disabled={isRemovingId === item.productId?._id}
              className="absolute top-4 right-4 z-10 w-8 h-8 items-center justify-center active:scale-95"
            >
              {isRemovingId === item.productId?._id ? (
                <ActivityIndicator size="small" color="#cf0213" />
              ) : (
                <Trash2 size={20} color="#cf0213" />
              )}
            </TouchableOpacity>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => router.push(`/product/${item.productId?._id}`)}
                className="w-24 h-24 rounded-[20px] overflow-hidden bg-slate-100">
                <Image
                  source={{ uri: item.productId?.productImg?.[0]?.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <View className="flex-1 px-4 justify-center">
                <Text className="text-base font-bold text-slate-900 pr-8" numberOfLines={1}>
                  {item.productId?.productName}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {item.productId?.category || "Style and elegance"}
                </Text>
                <Text className="text-lg font-black text-slate-900 mt-1">
                  ₹{item.productId?.productPrice?.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleMoveToCart(item.productId?._id)}
              disabled={isAddingId === item.productId?._id}
              className={`mt-3 py-3 rounded-xl flex-row items-center justify-center active:scale-[0.99] ${isAddingId === item.productId?._id ? "bg-slate-100" : "bg-pink-50"
                }`}
            >
              {isAddingId === item.productId?._id ? (
                <ActivityIndicator size="small" color="#d11990" />
              ) : (
                <>
                  <ShoppingCart size={18} color="#d11990" />
                </>
              )}
              <Text className="text-pink-500 font-bold ml-2 text-sm uppercase tracking-wider" numberOfLines={1}>
                Add to cart
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {toastMsg && (
        <Animated.View style={{ opacity: fadeAnim }} className="absolute bottom-10 self-center bg-black/90 px-6 py-3 rounded-full z-[100]">
          <Text className="text-white font-bold text-[10px] tracking-widest">{toastMsg}</Text>
        </Animated.View>
      )}

      <Modal
        visible={!!selectedProductId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProductId(null)}
      >
        <ProductDetail id={selectedProductId} onBack={() => setSelectedProductId(null)} />
      </Modal>
    </SafeAreaView>
  );
}
