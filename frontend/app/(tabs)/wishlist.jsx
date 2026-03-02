import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, X } from 'lucide-react-native';
import axios from 'axios';
import { setWishlist, setCart } from '@/redux/productSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import ProductDetail from '../product/[id]';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Wishlist() {
  const { wishlist } = useSelector(store => store.product);
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const API = `${process.env.EXPO_PUBLIC_BASE_URL}/api/wishlist`;
  const CART_API = `${process.env.EXPO_PUBLIC_BASE_URL}/api/cart`;

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
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.delete(`${API}/remove`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId },
      });
      if (res.data.success) {
        dispatch(setWishlist(res.data.wishlist));
        setToastMsg("REMOVED FROM WISHLIST"); // Trigger custom toast
      }
    } catch (error) {
      setToastMsg("FAILED TO REMOVE");
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.post(`${CART_API}/add`, { productId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        setToastMsg("ADDED TO CART"); // Trigger custom toast
      }
    } catch (error) {
      setToastMsg("FAILED TO ADD TO CART");
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  if (loading) return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#F43F5E" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-6 pt-3 pb-6 border-b border-gray-100">
          <View className="flex-row items-center">
            <Text numberOfLines={1} className="text-3xl font-black text-gray-900 tracking-tight">My Wishlist</Text>
            <View className="ml-2 bg-rose-50 px-2 py-0.5 rounded-full">
              <Text className="text-rose-500 text-xs font-bold">{wishlist?.items?.length || 0}</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xs mt-1">Saved items for your aesthetic upgrade.</Text>
        </View>

        {wishlist?.items?.length > 0 ? (
          <View className="flex-row flex-wrap justify-between px-3 mt-4">
            {wishlist.items.map((item) => (
              <View key={item.productId?._id} className="w-[48%] bg-white p-2 rounded-xl mb-4 shadow-sm border border-gray-50">
                <View className="relative aspect-square bg-gray-50 rounded-md overflow-hidden items-center justify-center p-5">
                  <TouchableOpacity 
                    onPress={() => handleRemove(item.productId?._id)}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 rounded-full shadow-sm"
                  >
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="w-full h-full p-3"
                    onPress={() => router.push(`/product/${item.productId?._id}`)}
                  >
                    <Image 
                      source={{ uri: item.productId?.productImg?.[0]?.url }} 
                      className="w-full h-full object-contain"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>

                <View className="mt-2 px-1">
                  <Text numberOfLines={1} className="text-[13px] font-bold text-gray-800">
                    {item.productId?.productName}
                  </Text>
                  <Text className="text-sm font-black text-gray-900 mt-1">
                    ₹{item.productId?.productPrice?.toLocaleString()}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => handleMoveToCart(item.productId?._id)}
                    className="mt-3 flex-row items-center justify-center bg-gray-900 py-2.5 rounded-md active:opacity-80"
                  >
                    <ShoppingCart size={14} color="white" />
                    <Text className="text-white text-[10px] font-black ml-2  uppercase">
                      Add to Cart
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState router={router} />
        )}
      </ScrollView>

      {toastMsg ? (
        <Animated.View 
          pointerEvents="none"
          style={{ 
            opacity: fadeAnim, 
            transform: [{ 
              translateY: fadeAnim.interpolate({ 
                inputRange: [0, 1], 
                outputRange: [20, 0] 
              }) 
            }] 
          }}
          className="absolute bottom-10 self-center bg-black/90 px-6 py-3 rounded-full shadow-2xl z-[100]"
        >
          <Text className="text-white font-bold text-[10px] uppercase tracking-widest">{toastMsg}</Text>
        </Animated.View>
      ) : null}

      <Modal 
        visible={!!selectedProductId} 
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProductId(null)}
      >
        <ProductDetail 
          id={selectedProductId} 
          onBack={() => setSelectedProductId(null)} 
        />
      </Modal>
    </SafeAreaView>
  );
}

const EmptyState = ({ router }) => (
  <View className="mx-5 mt-20 items-center justify-center bg-white rounded-xl p-10 border border-gray-50 shadow-sm">
    <View className="w-16 h-16 bg-rose-50 rounded-full items-center justify-center mb-4">
      <Heart size={28} color="#FB7185" fill="#FFE4E6" />
    </View>
    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Your wishlist is empty</Text>
    <Text className="text-gray-400 text-xs text-center mt-2 mb-8">
      Items you save will appear here for your next aesthetic upgrade!
    </Text>
    <TouchableOpacity 
      onPress={() => router.push('/shop')}
      className="bg-black px-8 py-4 rounded-full"
    >
      <Text className="text-white font-bold text-xs tracking-widest uppercase">Shop Arrivals</Text>
    </TouchableOpacity>
  </View>
);