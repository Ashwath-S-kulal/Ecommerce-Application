import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
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
const PAGE_SIZE = 15;

export default function Notifications() {
    const { notifications } = useSelector((state) => state.product);
    const [loading, setLoading] = useState(notifications.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const router = useRouter();
    const dispatch = useDispatch();

    const fetchNotifications = async (pageNum, isRefresh = false) => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) return;

            const res = await axios.get(`${BASE_URI}/api/notification/get`, {
                params: { page: pageNum, limit: PAGE_SIZE },
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (res.data.success) {
                const fetchedData = res.data.notifications;
                setHasMore(fetchedData.length === PAGE_SIZE);

                if (isRefresh) {
                    dispatch(setNotifications(fetchedData));
                } else {
                    const existingIds = new Set(notifications.map(n => n._id));
                    const uniqueNewData = fetchedData.filter(n => !existingIds.has(n._id));

                    dispatch(setNotifications([...notifications, ...uniqueNewData]));
                }
            }
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!notifications?.length) {
            fetchNotifications(1, true);
        } else {
            setLoading(false);
        }
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        fetchNotifications(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, false);
        }
    };

    const handleRead = async (id, orderId) => {
        dispatch(markSingleRead(id));
        try {
            if (orderId) router.push(`/order/${orderId}`);
            const accessToken = await AsyncStorage.getItem('accessToken');
            await axios.post(`${BASE_URI}/api/notification/read/${id}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        } catch (err) {
            console.error("Backend update failed", err);
        }
    };

    const groupedData = useMemo(() => {
        const groups = [];
        const map = {};

        const today = new Date().toLocaleDateString("en-GB");
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-GB");

        notifications.forEach((n) => {
            const dateObj = new Date(n.createdAt);
            const current = dateObj.toLocaleDateString("en-GB");

            let label = dateObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            if (current === today) label = "Today";
            else if (current === yesterday) label = "Yesterday";

            if (!map[label]) {
                map[label] = [];
                groups.push({ title: label, data: map[label] });
            }

            map[label].push(n);
        });

        return groups;
    }, [notifications]);


    const renderNotificationItem = (n) => {
        const order = n.orderId;
        const product = order?.products?.[0]?.productId;

        return (
            <TouchableOpacity
                key={n._id}
                onPress={() => handleRead(n._id, order?._id)}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 mb-3 rounded-[24px] border ${n.isRead
                    ? "bg-transparent border-transparent opacity-60"
                    : "bg-white border-zinc-100 shadow-sm"
                    }`}
            >
                <View className="relative">
                    <Image
                        source={product?.productImg?.[0]?.url ? { uri: product.productImg[0].url } : FallbackImage}
                        className="w-14 h-14 rounded-2xl bg-zinc-50"
                    />
                    {!n.isRead && <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />}
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
                    <Text className="text-zinc-500 text-xs mb-2">Ordered {product?.productName || 'Product'}</Text>
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
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const NotificationSkeleton = () => (
        <View className="flex-row items-center p-4 mb-3 rounded-[24px] bg-white border border-zinc-100 opacity-50">
            <View className="w-14 h-14 rounded-2xl bg-zinc-200 animate-pulse" />

            <View className="flex-1 ml-4 mr-2">
                <View className="h-4 w-24 bg-zinc-200 rounded-md mb-2 animate-pulse" />
                <View className="h-3 w-40 bg-zinc-100 rounded-md mb-3 animate-pulse" />

                <View className="flex-row items-center">
                    <View className="h-2 w-10 bg-zinc-100 rounded-sm mr-3 animate-pulse" />
                    <View className="h-2 w-16 bg-zinc-100 rounded-sm animate-pulse" />
                </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-zinc-100 animate-pulse" />
        </View>
    );


    if (loading && page === 1) {
        return (
            <SafeAreaView className="flex-1 bg-[#FBFBFC] px-4">
                <View className="flex-row items-center justify-between mt-6 mb-8 px-2">
                    <View>
                        <View className="h-8 w-40 bg-zinc-200 rounded-lg mb-2 animate-pulse" />
                        <View className="h-3 w-20 bg-zinc-100 rounded-md animate-pulse" />
                    </View>
                    <View className="w-12 h-12 bg-white rounded-2xl border border-zinc-100 shadow-sm" />
                </View>

                <View>
                    <View className="flex-row items-center mb-6 px-2">
                        <View className="h-[1px] flex-1 bg-zinc-100" />
                        <View className="h-3 w-16 bg-zinc-100 mx-3 rounded animate-pulse" />
                        <View className="h-[1px] flex-1 bg-zinc-100" />
                    </View>

                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((key) => (
                        <NotificationSkeleton key={key} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FBFBFC]">
            <FlatList
                data={groupedData}
                keyExtractor={(item) => item.title}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={() => (
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
                )}
                renderItem={({ item }) => (
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4 px-2">
                            <View className="h-[1px] flex-1 bg-zinc-100" />
                            <View className="flex-row items-center px-3">
                                <Calendar size={12} color="#d4d4d8" />
                                <Text className="ml-2 text-[10px] font-black text-zinc-300 uppercase tracking-[0.15em]">{item.title}</Text>
                            </View>
                            <View className="h-[1px] flex-1 bg-zinc-100" />
                        </View>
                        {item.data.map(renderNotificationItem)}
                    </View>
                )}
                ListFooterComponent={() => (
                    hasMore ? (
                        <TouchableOpacity
                            onPress={handleLoadMore}
                            disabled={loadingMore}
                            className="py-4 items-center justify-center bg-white border border-zinc-100 rounded-2xl mt-2 shadow-sm"
                        >
                            {loadingMore ? (
                                <ActivityIndicator size="small" color="#2563eb" />
                            ) : (
                                <Text className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest">Load More Activity</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        notifications.length > 0 && (
                            <Text className="text-center text-zinc-400 text-[10px] uppercase mt-4">You have reached the end</Text>
                        )
                    )
                )}
                ListEmptyComponent={() => (
                    <View className="mt-20 items-center justify-center bg-white py-16 rounded-[40px] border border-dashed border-zinc-200">
                        <View className="w-16 h-16 bg-zinc-50 rounded-full items-center justify-center mb-4">
                            <ShoppingBag size={24} color="#e4e4e7" />
                        </View>
                        <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No Recent Activity</Text>
                        <Text className="text-zinc-300 text-[11px] mt-1">Orders will appear here as they come in.</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}