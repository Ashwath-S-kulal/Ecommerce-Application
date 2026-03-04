import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart, setNotifications, setWishlist } from '@/redux/productSlice';
import {
  ShieldCheck, Truck, Users, Heart, Bell,
  MapPin, Leaf, Zap, CheckCircle2
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from "expo-constants";

const { width } = Dimensions.get('window');
const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((store) => store.user);
  const { unreadCount } = useSelector((store) => store.product);

  const isAdmin = user?.role === 'admin';
  const isActive = pathname === '/notifications';

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const requests = [
          axios.get(`${BASE_URL}/api/cart/`, { headers }),
          axios.get(`${BASE_URL}/api/wishlist/get`, { headers })
        ];
        if (isAdmin) {
          requests.push(
            axios.get(`${BASE_URL}/api/notification/get`, {
              headers,
              params: {
                page: 1,
                limit: 15
              }
            })
          );
        }
        const responses = await Promise.all(requests);
        if (responses[0]?.data?.success) dispatch(setCart(responses[0].data.cart));
        if (responses[1]?.data?.success) dispatch(setWishlist(responses[1].data.wishlist));
        if (isAdmin && responses[2]?.data?.success) {
          dispatch(setNotifications(responses[2].data.notifications));
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      }
    };

    loadUserData();
  }, [dispatch, user, isAdmin]);

  return (
    <SafeAreaView className="flex-1 bg-[#FCFAFA]">
      <StatusBar barStyle="dark-content" />

      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-50 bg-[#FCFAFA]">
        <View>
          <Text className="text-[8px] font-black text-pink-600 uppercase tracking-[0.2em] mb-0.5">
            {isAdmin ? "Admin Console" : "Avarse Collective"}
          </Text>
          <Text className="text-xl font-black text-slate-900  leading-tight" numberOfLines={1}>
            Hello, {user?.firstName?.split(' ')[0] || "user"}{" "}{user?.lastName?.split(' ')[0] || " "}
          </Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => router.push("../components/Notification")}
            className={`w-12 h-12 rounded-2xl items-center justify-center border transition-all ${isActive ? "border-slate-900 bg-zinc-50" : "border-zinc-100 bg-white"
              } shadow-sm relative`}
          >
            <Bell
              size={20}
              color={unreadCount > 0 ? "#2563eb" : "#0f172a"}
              strokeWidth={2.5}
            />

            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 rounded-full border-2 border-white items-center justify-center px-1">
                <Text className="text-white text-[9px] font-black leading-none">
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-10 pb-10">
          <View className="flex-row items-center mb-4">

            <View className="h-[1px] w-8 bg-pink-600 mr-2" />
            <Text className="text-[10px] font-black tracking-[0.2em] text-pink-600 uppercase">
              Impact Platform
            </Text>
          </View>

          <Text className="text-4xl font-black tracking-tighter leading-tight text-slate-900">
            Every Purchase{"\n"}
            <Text className="italic font-serif text-pink-600">Ignites a Life.</Text>
          </Text>

          <View className="flex-row gap-3 mt-10 h-[350px]">
            <View className="flex-1 rounded-[30px] overflow-hidden border-4 border-white shadow-lg">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1 gap-3">
              <View className="flex-1 bg-pink-600 rounded-[30px] p-5 justify-between">
                <Heart size={24} color="white" fill="white" />
                <Text className="text-white font-bold text-lg leading-tight">Avarse heritage in every stitch</Text>
              </View>
              <View className="flex-1 rounded-[30px] overflow-hidden border-4 border-white shadow-lg">
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?q=80&w=800' }}
                  className="w-full h-full"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="bg-white py-10 border-y border-slate-100 flex-row flex-wrap justify-center">
          {[
            { label: "Women Employed", val: "50+", icon: <Users size={18} color="#db2777" /> },
            { label: "Families Supported", val: "200+", icon: <Heart size={18} color="#db2777" /> },
            { label: "Eco-Materials", val: "100%", icon: <Leaf size={18} color="#db2777" /> },
            { label: "Villages Impacted", val: "12", icon: <MapPin size={18} color="#db2777" /> }
          ].map((stat, i) => (
            <View key={i} style={{ width: width / 2 - 20 }} className="items-center text-center p-4">
              <View className="bg-pink-50 p-3 rounded-xl mb-2">{stat.icon}</View>
              <Text className="text-2xl font-black text-slate-900">{stat.val}</Text>
              <Text className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className="py-16 px-6">
          <Text className="text-3xl font-black tracking-tighter text-slate-900">The Pink Cycle</Text>
          <Text className="text-slate-500 text-xs mt-1 mb-8">How we ensure every rupee goes back to our women.</Text>

          {[
            { icon: <Zap color="#db2777" />, title: "Handcrafted by Her", desc: "No machines, no factories. Skilled hands working from village studios.", tags: ["Zero Carbon", "Fair Wages"] },
            { icon: <ShieldCheck color="#db2777" />, title: "Quality of Avarse", desc: "Senior artisans mentor and QC every product to meet global standards.", tags: ["3-Stage QC", "Heritage Tech"] },
            { icon: <Truck color="#db2777" />, title: "Pink Logistics", desc: "Our own women delivery partners handle the final mile to your door.", tags: ["Women Fleet", "Safe & Reliable"] }
          ].map((card, i) => (
            <View key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 mb-4 shadow-sm">
              <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center mb-6">
                {card.icon}
              </View>
              <Text className="text-lg font-bold mb-2">{card.title}</Text>
              <Text className="text-slate-500 text-xs leading-relaxed mb-4">{card.desc}</Text>
              <View className="flex-row flex-wrap gap-2">
                {card.tags.map(tag => (
                  <View key={tag} className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    <Text className="text-[8px] font-bold text-slate-400 uppercase">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}