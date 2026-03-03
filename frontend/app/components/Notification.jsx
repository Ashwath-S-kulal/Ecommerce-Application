import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import axios from 'axios';
import {
    Bell,
    Clock,
    MapPin,
    ArrowRight,
    Calendar,
    ShoppingBag
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSingleRead, setNotifications } from '@/redux/productSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import FallbackImage from "../../assets/Product Doesnt Exist.webp";
import Constants from "expo-constants";

const BASE_URI = Constants.expoConfig.extra.apiUrl;


export default function Notifications() {
    const { notifications } = useSelector((state) => state.product);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const dispatch = useDispatch();

    const fetchNotifications = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) return;

            const res = await axios.get(`${BASE_URI}/api/notification/get`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (res.data.success) {
                dispatch(setNotifications(res.data.notifications));
            }
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleRead = async (id, orderId) => {
        dispatch(markSingleRead(id));
        try {

            if (orderId) {
                router.push(`/order/${orderId}`);
            }

            const accessToken = await AsyncStorage.getItem('accessToken');
            await axios.post(`${BASE_URI}/api/notification/read/${id}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        } catch (err) {
            console.error("Backend update failed", err);
        }


    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const groupedNotifications = useMemo(() => {
        const groups = {};
        if (!notifications || !Array.isArray(notifications)) return groups;

        notifications.forEach((n) => {
            const dateObj = new Date(n.createdAt);
            const today = new Date().toLocaleDateString('en-GB');
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-GB');
            const current = dateObj.toLocaleDateString('en-GB');

            let label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            if (current === today) label = "Today";
            else if (current === yesterday) label = "Yesterday";

            if (!groups[label]) groups[label] = [];
            groups[label].push(n);
        });
        return groups;
    }, [notifications]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#FBFBFC]">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;

    return (
        <SafeAreaView className="flex-1 bg-[#FBFBFC]">
            <ScrollView
                className="px-4 md:px-6"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* HEADER AREA */}
                <View className="flex-row items-center justify-between mt-6 mb-8 px-2">
                    <View>
                        <Text className="text-2xl font-bold text-zinc-900 tracking-tight">Notifications</Text>
                        <View className="flex-row items-center mt-1">
                            <View className={`w-2 h-2 rounded-full mr-2 ${unreadCount > 0 ? 'bg-blue-600' : 'bg-zinc-300'}`} />
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                {unreadCount} New updates
                            </Text>
                        </View>
                    </View>
                    <View className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                        <Bell size={20} color="#a1a1aa" />
                    </View>
                </View>

                {/* NOTIFICATIONS LIST */}
                {Object.keys(groupedNotifications).length > 0 ? (
                    <View className="pb-10">
                        {Object.entries(groupedNotifications).map(([date, items]) => (
                            <View key={date} className="mb-8">
                                {/* DATE DIVIDER */}
                                <View className="flex-row items-center mb-4 px-2">
                                    <View className="h-[1px] flex-1 bg-zinc-100" />
                                    <View className="flex-row items-center px-3">
                                        <Calendar size={12} color="#d4d4d8" />
                                        <Text className="ml-2 text-[10px] font-black text-zinc-300 uppercase tracking-[0.15em]">{date}</Text>
                                    </View>
                                    <View className="h-[1px] flex-1 bg-zinc-100" />
                                </View>

                                {/* ITEMS */}
                                <View className="space-y-3">
                                    {items.map((n) => {
                                        const order = n.orderId;
                                        const product = order?.products?.[0]?.productId;

                                        return (
                                            <TouchableOpacity
                                                key={n._id}
                                                onPress={() => handleRead(n._id, order?._id)}
                                                activeOpacity={0.7}
                                                className={`flex-row items-center p-4 rounded-[24px] border ${n.isRead
                                                    ? "bg-transparent border-transparent opacity-60"
                                                    : "bg-white border-zinc-100 shadow-sm"
                                                    }`}
                                            >
                                                <View className="relative">
                                                    <Image
                                                        source={
                                                            product?.productImg?.[0]?.url
                                                                ? { uri: product.productImg[0].url }
                                                                : FallbackImage
                                                        }
                                                        className="w-14 h-14 rounded-2xl bg-zinc-50"
                                                    />
                                                    {!n.isRead && (
                                                        <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                                                    )}
                                                </View>

                                                <View className="flex-1 ml-4 mr-2">
                                                    <View className="flex-row items-center mb-1">
                                                        {!n.isRead && (
                                                            <View className="bg-blue-600 px-1.5 py-0.5 rounded-md mr-1.5">
                                                                <Text className="text-white text-[7px] font-black uppercase">New</Text>
                                                            </View>
                                                        )}
                                                        <Text className="text-zinc-900 text-sm font-bold" numberOfLines={1}>
                                                            {order?.address?.fullName || 'User'}
                                                        </Text>
                                                    </View>

                                                    <Text className="text-zinc-500 text-xs mb-2">
                                                        Ordered {product?.productName || 'Product'}
                                                    </Text>

                                                    <View className="flex-row items-center">
                                                        <Clock size={10} color="#a1a1aa" />
                                                        <Text className="text-[10px] text-zinc-400 font-bold uppercase ml-1 mr-3">
                                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                        <MapPin size={10} color="#a1a1aa" />
                                                        <Text className="text-[10px] text-zinc-400 font-bold uppercase ml-1">
                                                            {order?.address?.city || 'Location'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View className={`w-8 h-8 rounded-full items-center justify-center ${n.isRead ? 'bg-zinc-50' : 'bg-zinc-900'}`}>
                                                    <ArrowRight size={14} color={n.isRead ? "#d4d4d8" : "white"} />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    /* EMPTY STATE */
                    <View className="mt-20 items-center justify-center bg-white py-16 rounded-[40px] border border-dashed border-zinc-200">
                        <View className="w-16 h-16 bg-zinc-50 rounded-full items-center justify-center mb-4">
                            <ShoppingBag size={24} color="#e4e4e7" />
                        </View>
                        <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Recent Activity</Text>
                        <Text className="text-zinc-300 text-[11px] mt-1">Orders will appear here as they come in.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}