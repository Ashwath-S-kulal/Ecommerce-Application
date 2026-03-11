import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart, setNotifications, setWishlist, setProducts } from '@/redux/productSlice';
import { Bell, ArrowRight, Crown, LogIn ,Users} from 'lucide-react-native';
import Constants from "expo-constants";
import Carousel from 'react-native-reanimated-carousel';

import { LinearGradient } from 'expo-linear-gradient';
import TodayDeliveriesPage from '../(admin)/TodaysDelivery';

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
  const { user } = useSelector((store) => store.user);
  const { unreadCount, products } = useSelector((store) => store.product);

  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === 'admin';

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
      className="mr-4 w-40 pb-3"
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
    <View className="flex-1 bg-[#FCFAFA]">
      <StatusBar barStyle="dark-content" />


      <View className="px-6 pt-16 pb-4 bg-[#FEE6F6] border-b border-slate-50 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 gap-4">
          <TouchableOpacity className="w-16 h-16 items-center justify-center">
            <Image
              source={require("../../assets/logo_bg_rmv.png")}
              className="w-full h-full bg-[#FEE6F6]"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View className="flex-1 justify-center">
            <Text className="text-[10px] font-black text-pink-700 uppercase tracking-[0.25em]">
              Sanjeevini Group Avarse
            </Text>
            <View className="flex-row items-center">
              <Text className="text-2xl font-black text-slate-900 leading-tight mr-2" numberOfLines={1}>
                {user?.firstName ? `Hi, ${user.firstName.split(' ')[0]}` : "Hello, Guest"}
              </Text>
            </View>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push("../components/Notification")}
            className={`w-11 h-11 items-center justify-center relative`}
          >
            <Bell size={20} color={unreadCount > 0 ? "#2563eb" : "#0f172a"} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-600 rounded-full border-2 border-white items-center justify-center">
                <Text className="text-white text-[9px] font-black">{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {!user && (
          <TouchableOpacity
            onPress={() => router.push("/components/new")}
            activeOpacity={0.8}
            className="overflow-hidden rounded-full shadow-lg shadow-pink-300"
          >
            <LinearGradient
              colors={['#db2777', '#f43f5e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-5 py-2.5 flex-row items-center justify-center gap-2"
            >
              <LogIn size={14} color="white" strokeWidth={3} />
              <Text className="text-white text-[11px] font-black uppercase tracking-[0.2em]">
                Login
              </Text>
            </LinearGradient>
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

        {isAdmin && (
          <TodayDeliveriesPage />
        )}

        <View className="mt-3 px-6">
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
        <MembersList data={membersData} />

      </ScrollView>
    </View>
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





const SanjeeviniSection = () => (
  <View className="bg-white pb-10">
    <View className="p-6">
      <View className="bg-slate-50 p-6 rounded-md mb-4 border border-slate-100">
        <Text className="text-slate-900 font-black text-lg mb-2">Our History</Text>
        <Text className="text-slate-800/80 leading-6">
          Sanjeevini – Karnataka State Rural Livelihood Promotion Society (KSRLPS) was officially launched on 02/12/2011 to implement the National Rural Livelihood Mission (NRLM).
        </Text>
      </View>

      <View className="bg-pink-50 p-6 rounded-md mb-4 border border-pink-100">
        <Text className="text-pink-900 font-black text-lg mb-2">Our Vision</Text>
        <Text className="text-pink-800/80 leading-6 ">
          To establish a self-reliant rural ecosystem where every woman is an empowered entrepreneur and a pillar of the local economy.
        </Text>
      </View>

      <View className="bg-slate-50 p-6 rounded-md border border-slate-100">
        <Text className="text-slate-900 font-black text-lg mb-2">Our Mission</Text>
        <Text className="text-slate-600 leading-6">
          To facilitate sustainable livelihoods through financial inclusion, skill-based training, and the formation of strong, transparent community cooperatives.
        </Text>
      </View>
    </View>


    <View className="px-6">
      <Text className="text-slate-900 font-black text-2xl mb-6">Structure of Impact</Text>
      <View className="space-y-4">
        <View className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
          <Text className="text-pink-600 font-bold text-[10px] uppercase tracking-widest mb-1">Program Overview</Text>
          <Text className="text-slate-900 font-bold text-base mb-2">Sanjeevini - KSRLPS</Text>
          <Text className="text-slate-500 text-xs leading-5">
            Started on 02/12/2011 under the National Rural Livelihood Mission (NRLM) to improve the livelihoods of rural women through Self Help Groups and community institutions.
          </Text>
        </View>

        <View className="flex-row gap-4 mt-5">
          <View className="flex-1 bg-white border border-slate-100 rounded-md p-5 shadow-sm">
            <Text className="text-slate-400 text-[10px] uppercase font-bold">State Impact</Text>
            <Text className="text-slate-900 font-black text-lg mt-1">28 Lakh+</Text>
            <Text className="text-slate-500 text-[10px] mt-1">Rural women supported across Karnataka.</Text>
          </View>
          <View className="flex-1 bg-white border border-slate-100 rounded-md p-5 shadow-sm">
            <Text className="text-slate-400 text-[10px] uppercase font-bold">Local Units</Text>
            <Text className="text-slate-900 font-black text-lg mt-1">61 Groups</Text>
            <Text className="text-slate-500 text-[10px] mt-1">Active SHGs in Avarse.</Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-md p-6 mt-5">
          <Text className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1">Village Level Structure</Text>
          <Text className="text-white font-bold text-base mb-2">Siddhivinayaka </Text>
          <Text className="text-slate-400 text-xs leading-5">
            Formed on 23/09/2020. The federation currently manages 6 ward-level organizations and 61 active Self Help Groups.
          </Text>
        </View>

        <View className="bg-white border border-slate-100 rounded-md p-6 shadow-sm mt-5">
          <Text className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">Financial & Livelihood</Text>

          <Text className="text-slate-900 font-bold text-xs mb-1">Financial Support</Text>
          <Text className="text-slate-500 text-xs leading-5 mb-4">
            Members receive assistance through CIF and VRF funds to help start and expand small businesses.
          </Text>

          <Text className="text-slate-900 font-bold text-xs mb-1">Livelihood Activities</Text>
          <Text className="text-slate-500 text-xs leading-5">
            Papad/sandige, candles, dairy, poultry, jasmine cultivation, areca nursery, hotel business, and retail.
          </Text>

          <View className="mt-4 pt-4 border-t border-slate-100">
            <Text className="text-slate-900 font-black text-sm">18 Women Entrepreneurs</Text>
            <Text className="text-slate-500 text-[10px]">Successfully running enterprises under the federation.</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);





const membersData = [
  { id: 1, name: 'ರೇಣುಕಾ ಕಾಮತ್', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ಹಪ್ಪಳ ಸಂಡಿಗೆ' },
  { id: 2, name: 'ಗೀತಾ ಕಾಮತ್', group: 'ತೀರ್ಥವಿನಾಯಕ ಸಂಜೀವಿನಿ', product: 'ಹಪ್ಪಳ ಸಂಡಿಗೆ' },
  { id: 3, name: 'ಮಾಂಗಲ್ಯ', group: 'ಓಂ ಶಕ್ತಿ ಸಂಜೀವಿನಿ', product: 'ಕ್ಯಾಂಡಲ್' },
  { id: 4, name: 'ಸುಗಂಧಿ', group: 'ಓಂ ಶಕ್ತಿ ಸಂಜೀವಿನಿ', product: 'ಫ್ಯಾನ್ಸಿ ಸ್ಟೋರ್' },
  { id: 5, name: 'ಯಶೋಧಾ', group: 'ಭುವನೇಶ್ವರಿ ಸಂಜೀವಿನಿ', product: 'ಹಾಳೆ ತಟ್ಟೆ' },
  { id: 6, name: 'ಹೇಮಾ', group: 'ಭುವನೇಶ್ವರಿ ಸಂಜೀವಿನಿ', product: 'ಬಟ್ಟೆ ಮತ್ತು ಫುಟ್‌ವೇರ್ ಅಂಗಡಿ' },
  { id: 7, name: 'ಶಕುಂತಲಾ', group: 'ಲಕ್ಷ್ಮೀನಾರಾಯಣ ಸ್ತ್ರೀಶಕ್ತಿ', product: 'ಹೋಟೆಲ್' },
  { id: 8, name: 'ಪೂರ್ಣಿಮಾ', group: 'ಶ್ರೀಲಕ್ಷ್ಮಿ ಸಂಜೀವಿನಿ', product: 'ಬತ್ತಿಕಟ್ಟು' },
  { id: 9, name: 'ಚಂದ್ರಕಲಾ', group: 'ಶ್ರೀರಕ್ಷಾ ಸಂಜೀವಿನಿ', product: 'ಕೋಳಿ ಫಾರಂ' },
  { id: 10, name: 'ಶ್ಯಾಮಲಾ', group: 'ಶ್ರೀರಕ್ಷಾ ಸಂಜೀವಿನಿ', product: 'ಹೈನುಗಾರಿಕೆ' },
  { id: 11, name: 'ಶೈಲಜಾ', group: 'ಜನನಿ ಸಂಜೀವಿನಿ', product: 'ಮಲ್ಲಿಗೆ ಕೃಷಿ' },
  { id: 12, name: 'ಪಾರ್ವತಿ', group: 'ಬ್ರಹ್ಮಲಿಂಗೇಶ್ವರ ಸಂಜೀವಿನಿ', product: 'ಮಲ್ಲಿಗೆ ಕೃಷಿ' },
  { id: 13, name: 'ಬೇಬಿ', group: 'ಶ್ರೀನಿಧಿ ಸ್ತ್ರೀಶಕ್ತಿ', product: 'ಪರೋಟ ತಯಾರಿಕೆ' },
  { id: 14, name: 'ಪ್ರೇಮಾ', group: 'ಶ್ರೀಲಕ್ಷ್ಮಿ ಸಂಜೀವಿನಿ', product: 'ಕೋಳಿ ಫಾರಂ' },
  { id: 15, name: 'ಚಂದ್ರಾವತಿ', group: 'ಮಹಾಲಿಂಗೇಶ್ವರ ಸ್ತ್ರೀಶಕ್ತಿ', product: 'ಬತ್ತಿಕಟ್ಟು' },
  { id: 16, name: 'ಪ್ರೇಮಲತಾ', group: 'ಶ್ರೀಲಕ್ಷ್ಮಿ ಸ್ತ್ರೀಶಕ್ತಿ', product: 'ಫ್ಯಾನ್ಸಿ ಸ್ಟೋರ್' },
  { id: 17, name: 'ಜ್ಯೋತಿ', group: 'ಸ್ನೇಹ ಸಂಜೀವಿನಿ', product: 'ನಾಟಿಕೋಳಿ, ಅಡಿಕೆ ನರ್ಸರಿ' },
  { id: 18, name: 'ಪ್ರಭಾವತಿ', group: 'ಗಣಪತಿ ಸ್ತ್ರೀಶಕ್ತಿ', product: 'ಕೋಳಿ ಫಾರಂ' },
];

const MembersList = ({ data }) => {
  return (
    <View className="px-6 py-6">
      <View className="mb-8">
        <Text className="text-2xl font-black text-slate-900 mb-6">Leadership</Text>

        <View className="bg-white border border-slate-200 p-6 rounded-md shadow-sm flex-row items-center mb-4">
          <View className="w-16 h-16 bg-pink-100 rounded-full items-center justify-center mr-4">
            <Crown size={28} color="#db2777" />
          </View>
          <View>
            <Text className="text-sm text-slate-400 font-bold uppercase tracking-widest">President</Text>
            <Text className="text-xl font-black text-slate-900">Smt. Yashodha</Text>
          </View>
        </View>
      </View>
      <Text className="text-xl font-black text-slate-900 mb-4">Member Registry (ಸದಸ್ಯರ ವಿವರ)</Text>

      {data.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center bg-white p-4 mb-2 rounded-md border border-slate-100 shadow-sm"
        >
          <View className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center mr-4">
            <Users size={18} color="#db2777" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
            <Text className="text-[10px] text-slate-400 font-medium uppercase">
              {item.group !== '-' ? item.group : 'ಸ್ವತಂತ್ರ ಗುಂಪು'}
            </Text>
          </View>
          <View className="bg-slate-100 px-4 py-2 rounded-md">
            <Text className="text-slate-900 text-[10px] font-black uppercase tracking-wider">
              {item.product}
            </Text>
          </View>
        </View>
      ))}

    </View>
  );
};