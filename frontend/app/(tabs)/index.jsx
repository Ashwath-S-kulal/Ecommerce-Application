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
          <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center border border-slate-200 overflow-hidden" onPress={() => router.push("/profile")}>
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
          </TouchableOpacity>

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
        <SanjeeviniSection />

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

const membersData = [
  { id: 1, name: 'ರೇಣುಕಾ ಕಾಮತ್', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ಹಪ್ಪಳ ಸಂಡಿಗೆ' },
  { id: 2, name: 'ಗೀತಾ ಕಾಮತ್', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ಮಿಕ್ಸರ್ ಖಾರ' },
  { id: 3, name: 'ಮಾಂಗಲ್ಯ', group: 'ಓಂ ಶಕ್ತಿ ಸಂಜೀವಿನಿ', product: 'ಕ್ಯಾನ್ಡಲ್' },
  { id: 4, name: 'ಗೀತಾ', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ಕ್ಯಾನ್ಡಲ್' },
  { id: 5, name: 'ಯಶೋಧ', group: 'ಭುವನೇಶ್ವರಿ ಸಂಜೀವಿನಿ', product: 'ಹಾಳೆ ತಟ್ಟೆ ತಯಾರಕರು' },
  { id: 6, name: 'ಹೇಮಾ', group: 'ಭುವನೇಶ್ವರಿ ಸಂಜೀವಿನಿ', product: 'ಬಟ್ಟೆ ಮತ್ತು ಫುಟ್‌ವೇರ್ ಅಂಗಡಿ' },
  { id: 7, name: 'ನಾಗರತ್ನ', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ನೈಟಿ ಸೇಲ್' },
  { id: 8, name: 'ಪೂರ್ಣಿಮಾ, ಶ್ರೀಲಕ್ಷ್ಮಿ', group: '-', product: 'ಬತ್ತಿಕಟ್ಟು' },
  { id: 9, name: 'ಚಂದ್ರಕಲಾ', group: 'ಶ್ರೀರಕ್ಷಾ', product: 'ಕೋಳಿ ಮಾಂಸದ ಅಂಗಡಿ' },
  { id: 10, name: 'ಶ್ಯಾಮಲ', group: 'ಶ್ರೀರಕ್ಷಾ', product: 'ಹೈನುಗಾರಿಕೆ' },
  { id: 11, name: 'ಶೈಲಜಾ', group: 'ಜನನಿ ಸಂಜೀವಿನಿ', product: 'ಮಲ್ಲಿಗೆ ಕೃಷಿ' },
  { id: 12, name: 'ಪಾರ್ವತಿ', group: '-', product: 'ಮಲ್ಲಿಗೆ ಕೃಷಿ' },
];

const SanjeeviniSection = () => (
  <View className="mt-10 px-6 py-10 bg-white">
    {/* Section Header */}
    <Text className="text-pink-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2 text-center">
      About Our Mission
    </Text>
    <Text className="text-2xl font-black text-slate-900 mb-8 text-center">
      ಸಂಜೀವಿನಿ (KSRLPS)
    </Text>

    {/* Main Content Card */}
    <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
      <Text className="text-slate-800 text-[14px] leading-7 font-bold mb-4">
        ಸಂಜೀವಿನಿ - ಕರ್ನಾಟಕ ರಾಜ್ಯ ಗ್ರಾಮೀಣ ಜೀವನೋಪಾಯ ಸಂವರ್ಧನೆ ಸಂಸ್ಥೆ (KSRLPS)
      </Text>
      <Text className="text-slate-600 text-[13px] leading-6 mb-4">
        ಸಂಜೀವಿನಿ (KSRLPS) ಅಧಿಕೃತವಾಗಿ ರಾಜ್ಯದಲ್ಲಿ ದಿನಾಂಕ: 02/12/2011 ರಂದು ಪ್ರಾರಂಭಗೊಂಡಿದ್ದು, ರಾಷ್ಟ್ರೀಯ ಗ್ರಾಮೀಣ ಜೀವನೋಪಾಯ ಅಭಿಯಾನ (NRLM) ಕಾರ್ಯಕ್ರಮವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅನುಷ್ಠಾನ ಮಾಡುವ ಗುರಿಯನ್ನು ಹೊಂದಿದೆ.
      </Text>
      <Text className="text-slate-600 text-[13px] leading-6 mb-4">
        “ಲಾಭದಾಯಕ ಆದಾಯವನ್ನು ಒದಗಿಸುವುದರ ಮೂಲಕ ಬಡತನದ ತೀವ್ರತೆಯನ್ನು ಕಡಿಮೆಗೊಳಿಸುವುದು ಮತ್ತು ಸಮುದಾಯ ಸಂಸ್ಥೆಗಳ ಮೂಲಕ ಸ್ವ ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ಕಲ್ಪಿಸುವುದರಿಂದ ಗ್ರಾಮೀಣ ಜನರ ಜೀವನ ಮಟ್ಟದಲ್ಲಿ ಸಮರ್ಥನೀಯವಾದ ಅಭಿವೃದ್ಧಿಯನ್ನು ಕಾಣುವ” ಧ್ಯೇಯವನ್ನು ಹೊಂದಿರುವ ಎನ್.ಆರ್.ಎಲ್.ಎಂ ಕಾರ್ಯಕ್ರಮದಡಿ 28 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಗ್ರಾಮೀಣ ಮಹಿಳೆಯರನ್ನು ರಾಷ್ಟ್ರೀಯ ಜೀವನೋಪಾಯ ಅಭಿಯಾನದ ವ್ಯಾಪ್ತಿಗೆ ಒಳಪಡಿಸಿ ಅವರ ಸಮಗ್ರ ಏಳಿಗೆಗೆ ಶ್ರಮಿಸುತ್ತಿದೆ.
      </Text>
    </View>

    {/* Local Unit Info */}
    <View className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
      <Text className="text-slate-900 font-black text-sm mb-3 underline">ಸ್ಥಳೀಯ ಒಕ್ಕೂಟದ ಮಾಹಿತಿ:</Text>
      <Text className="text-slate-600 text-[13px] leading-6 mb-3">
        ಕರ್ನಾಟಕ ರಾಜ್ಯ ಗ್ರಾಮೀಣ ಜೀವನೋಪಾಯ ಅಭಿಯಾನ (KSRLPS) ಅಡಿಯಲ್ಲಿ ಉಡುಪಿ ಜಿಲ್ಲೆ, ಬ್ರಹ್ಮಾವರ ತಾಲೂಕಿನ 11ನೇ ಆವಸೆರೆ ಗ್ರಾಮ ಪಂಚಾಯತ್‌ನ ಸಿದ್ಧಿವಿನಾಯಕ ಸಂಜೀವಿನಿ ಗ್ರಾಮ ಮಟ್ಟದ ಒಕ್ಕೂಟ “ಆವಸೆರೆ” ಎಂದು ನಾಮಾಂಕಿತಗೊಂಡು 23/09/2020 ರಂದು ರಚನೆಯಾಯಿತು.
      </Text>
      <Text className="text-slate-600 text-[13px] leading-6 mb-3">
        16/09/2020 ರಂದು ಗ್ರಾ.ಪಂ. ಅಧ್ಯಕ್ಷರು, ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿಗಳು ಮತ್ತು ಒಕ್ಕೂಟದ ಅಧ್ಯಕ್ಷರ ಸಮ್ಮುಖದಲ್ಲಿ ಉಡುಪಿ ಜಿಲ್ಲೆಯ ಕೆಪೆ ವ್ಯಕ್ತಿ ಸಮಾಜಲೋಕಪರರಾದ ಶ್ರೀಯುತ ಪಾಂಡು ರಂಗ ಸರ್ ಅವರು ಉದ್ಘಾಟಿಸಿದರು. ಆವಸೆರೆ ಗ್ರಾ.ಪಂ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 6 ವಾರ್ಡ್ ಮಟ್ಟದ ಒಕ್ಕೂಟಗಳನ್ನು ರಚಿಸಲಾಗಿದ್ದು, 61 ಸ್ವಸಹಾಯ ಗುಂಪುಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.
      </Text>
    </View>

    {/* Support and Operations */}
    <View className="bg-slate-900 p-6 rounded-3xl mb-6">
      <Text className="text-white font-black text-sm mb-3">ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಮಾರ್ಗದರ್ಶನ:</Text>
      <Text className="text-slate-300 text-[13px] leading-6 mb-3">
        ಗ್ರಾಮೀಣ ಭಾಗದ ಮಹಿಳೆಯರಿಗೆ ಸ್ವ ಉದ್ಯೋಗ ಆರಂಭಿಸಿ ಬದುಕು ಕಟ್ಟಿಕೊಳ್ಳಲು ಸಮುದಾಯ ಬಂಡವಾಳ ನಿಧಿ (CIF) ಮೂಲಕ ಸಾಲ ಸೌಲಭ್ಯ ಮತ್ತು ಕಡು ಬಡತನದಲ್ಲಿರುವ ಸಂಜೀವಿನಿ ಮಹಿಳೆಯರಿಗೆ ದುರ್ಬಲ ವರ್ಗ ನಿಧಿ (VRF) ಮೂಲಕ ತುರ್ತು ಸಾಲ ಒದಗಿಸಲಾಗುತ್ತದೆ.
      </Text>
      <Text className="text-slate-300 text-[13px] leading-6">
        ಸಂಘದ ವ್ಯವಹಾರಗಳನ್ನು ನಿರ್ವಹಿಸಲು ನಿಯೋಜನೆಗೊಂಡ ಎಂಬಿಕೆ, ಎಲ್‌ಸಿಆರ್‌ಪಿ, ಕೃಷಿ ಸಖಿ, ಪಶು ಸಖಿ, ಕೃಷಿ ಉದ್ಯೋಗ ಸಖಿ, ಬಿಸಿ ಸಖಿ ಮೂಲಕ ಮಾರ್ಗದರ್ಶನ ನೀಡಲಾಗುತ್ತಿದೆ.
      </Text>
    </View>

    {/* Livelihood Activities */}
    <View className="bg-pink-50 p-6 rounded-3xl border border-pink-100">
      <Text className="text-pink-900 font-black text-sm mb-4">ಸ್ವಾವಲಂಬಿ ಜೀವನದ ಹಾದಿ:</Text>
      <Text className="text-pink-800 text-[13px] leading-6 mb-4">
        ಮಹಿಳೆಯರು ಜೀವನೋಪಾಯಕ್ಕಾಗಿ ಹೈನುಗಾರಿಕೆ, ಕೋಳಿ ಸಾಕಾಣಿಕೆ, ಹಪ್ಪಳ–ಸಂಡಿಗೆ ತಯಾರಿಕೆ, ಬಟ್ಟೆ ವ್ಯಾಪಾರ, ಮಲ್ಲಿಗೆ ಕೃಷಿ, ಬತ್ತಿ ಕಟ್ಟು ತಯಾರಿಕೆ, ಕ್ಯಾನ್ಡಲ್ ತಯಾರಿಕೆ, ಹಾಳೆ ತಟ್ಟೆ ತಯಾರಿಕೆ ಮುಂತಾದ ವಿವಿಧ ಕೆಲಸಗಳಲ್ಲಿ ತೊಡಗಿಸಿಕೊಂಡು ಸ್ವಾವಲಂಬಿ ಜೀವನ ನಡೆಸುವಲ್ಲಿ ದೃಢ ಹೆಜ್ಜೆ ಇಟ್ಟಿದ್ದಾರೆ.
      </Text>


      <View className="bg-pink-50 p-6 rounded-3xl border border-pink-100 mt-6">
        <Text className="text-pink-900 font-black text-sm mb-4">ಸದಸ್ಯರ ವಿವರಗಳು:</Text>

        {/* Table Header */}
        <View className="flex-row border-b border-pink-200 pb-2 mb-2">
          <Text className="flex-1 text-[10px] font-black text-pink-900">ಹೆಸರು</Text>
          <Text className="flex-1 text-[10px] font-black text-pink-900">ಸಂಘ</Text>
          <Text className="flex-1 text-[10px] font-black text-pink-900">ಉತ್ಪನ್ನ</Text>
        </View>

        {/* Table Rows */}
        {membersData.map((member) => (
          <View key={member.id} className="flex-row py-2 border-b border-pink-100 last:border-0">
            <Text className="flex-1 text-[10px] text-pink-800 font-bold">{member.name}</Text>
            <Text className="flex-1 text-[10px] text-pink-800">{member.group}</Text>
            <Text className="flex-1 text-[10px] text-pink-800 font-black">{member.product}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);