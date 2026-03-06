import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart, setNotifications, setWishlist, setProducts } from '@/redux/productSlice';
import { Bell, ArrowRight, Hand } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from "expo-constants";
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');
const BASE_URL = Constants.expoConfig.extra.apiUrl;

const CAROUSEL_DATA = [
  { id: 1, title: "Avarse Heritage", subtitle: "Artistry in every stitch", image: 'https://media.istockphoto.com/id/1364905810/photo/traditional-indian-colourful-tea-pots-on-display-at-a-store.webp?a=1&b=1&s=612x612&w=0&k=20&c=b7R1lF13W1okrjSh-yt6Kg644LdvUKi6ZP4ssRkvLZ0=' },
  { id: 2, title: "Empowering Lives", subtitle: "Crafted by Village Studios", image: 'https://media.istockphoto.com/id/1372472192/photo/handmade-bamboo-mudda-chair-for-sale-on-roadside-bazaar-market-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=GtTb6BHMKjvsBZ5W_M-a9VKErBlNenM9kqkdyNEEhMo=' },
  { id: 3, title: "Eco-Conscious", subtitle: "100% Sustainable Materials", image: 'https://media.istockphoto.com/id/1446459501/photo/young-man-working-in-a-block-printing-factory-in-jaipur-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=6qpSGpvuscPEznjgTvwi1UcuFqIxmbKONsrxKncvVwM=' },
  { id: 4, title: "Creative Spirit", subtitle: "Hand-painted Masterpieces", image: 'https://media.istockphoto.com/id/1078456356/photo/indian-woman-painting-vases-in-her-workshop-rajasthan-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=Pbc3Y__1KbvsigQY2f2UdfC2X5AQ0KQJp6v2zx-e84M=' },
  { id: 5, title: "Loom Stories", subtitle: "Tradition on a thread", image: 'https://media.istockphoto.com/id/147631166/photo/indian-woman-weaving-by-hand-on-a-loom.webp?a=1&b=1&s=612x612&w=0&k=20&c=sRuiFfV9HSDhMGw0fq_VLLsN9C1yhY3sth1M8-6CtdE=' }
];

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((store) => store.user);
  const { unreadCount, products } = useSelector((store) => store.product);

  const [loading, setLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isAdmin = user?.role === 'admin';
  const isActive = pathname === '/notifications';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUserData(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, [dispatch, isAdmin]);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const requests = [
        axios.get(`${BASE_URL}/api/cart/`, { headers }),
        axios.get(`${BASE_URL}/api/wishlist/get`, { headers })
      ];
      if (isAdmin) requests.push(axios.get(`${BASE_URL}/api/notification/get`, { headers, params: { page: 1, limit: 15 } }));

      const responses = await Promise.all(requests);
      if (responses[0]?.data?.success) dispatch(setCart(responses[0].data.cart));
      if (responses[1]?.data?.success) dispatch(setWishlist(responses[1].data.wishlist));
      if (isAdmin && responses[2]?.data?.success) dispatch(setNotifications(responses[2].data.notifications));
    } catch (err) { console.log("User Data Error:", err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/product/getallproducts?page=1&limit=12`);
      if (res.data.success) {
        dispatch(setProducts(res.data.products));
      }
    } catch (err) { console.log("Product Fetch Error:", err); }
  };


  const ProductCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/product/${item._id}`)}
      className="mr-4 w-40"
      activeOpacity={0.7}
    >
      <View className="h-40 w-full rounded-2xl bg-slate-200 overflow-hidden relative shadow-sm">
        <Image
          source={{ uri: item?.productImg?.[0]?.url || 'https://via.placeholder.com/150' }}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      <View className="mt-2 px-1">
        <Text numberOfLines={1} className="text-[11px] font-bold text-slate-900">
          {item.productName}
        </Text>
        <Text className="text-[10px] text-pink-600 font-black mt-0.5">
          ₹{item.productPrice}
        </Text>
      </View>
    </TouchableOpacity>
  );



  return (
    <SafeAreaView className="flex-1 bg-[#FCFAFA]">
      <StatusBar barStyle="dark-content" />
      <View className="px-6 pt-6 pb-4 bg-white border-b border-slate-50 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 gap-4">
          <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center border border-slate-200 overflow-hidden">
            {user?.profilePic ? (
              <Image
                source={{ uri: user.profilePic }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-lg font-black text-slate-400">
                {user?.firstName?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[9px] font-black text-pink-600 uppercase tracking-[0.2em]">
              {isAdmin ? "Admin Console" : "Welcome Back"}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xl font-black text-slate-900 leading-tight mr-2" numberOfLines={1}>
                {user?.firstName ? `Hi, ${user.firstName.split(' ')[0]}` : "Hello, Guest"}
              </Text>
              <Hand size={18} color="#fb7185" className="rotate-[-20deg]" />
            </View>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push("../components/Notification")}
            className={`w-11 h-11 rounded-2xl items-center justify-center border shadow-sm relative ${isActive ? "border-slate-900 bg-zinc-50" : "border-zinc-100 bg-white"}`}
          >
            <Bell size={20} color={unreadCount > 0 ? "#2563eb" : "#0f172a"} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 rounded-full border-2 border-white items-center justify-center">
                <Text className="text-white text-[9px] font-black">{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-6 items-center">
          <Carousel
            loop
            width={width}
            height={240}
            autoPlay={true}
            data={CAROUSEL_DATA}
            scrollAnimationDuration={1000}
            renderItem={({ item }) => (
              <View style={{ width: width - 40, marginHorizontal: 20 }} className="h-[220px] rounded-xl overflow-hidden shadow-2xl bg-slate-200">
                <Image source={{ uri: item.image }} className="w-full h-full absolute" resizeMode="cover" />
                <View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 justify-end">
                  <Text className="text-white text-3xl font-black italic font-serif leading-none shadow-lg">{item.title}</Text>
                  <Text className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-2">{item.subtitle}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <View className="mt-10 px-6">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-xl font-black text-slate-900" numberOfLines={1}>New Arrivals</Text>
            <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/shop")}>
              <Text className="text-[10px] font-bold text-slate-400 mr-1 uppercase">View All</Text>
              <ArrowRight size={12} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products?.slice(0, 6).map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}



const ProductCardSkeleton = () => {
  const fade = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className="mr-4 w-40">
      <Animated.View style={{ opacity: fade }} className="h-40 w-full rounded-2xl bg-gray-200" />
      <View className="mt-2 px-1">
        <Animated.View style={{ opacity: fade }} className="h-3 w-3/4 bg-gray-200 rounded-md mb-2" />
        <Animated.View style={{ opacity: fade }} className="h-3 w-1/2 bg-gray-200 rounded-md" />
      </View>
    </View>
  );
};