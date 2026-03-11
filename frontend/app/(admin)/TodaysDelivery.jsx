import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { useRouter } from 'expo-router';
import FallbackImage from '../../assets/Product Doesnt Exist.webp';

const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function TodayDeliveriesPage() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const router = useRouter();

    const fetchOrders = async () => {
        try {
            const accessToken = await AsyncStorage.getItem("accessToken");
            const { data } = await axios.get(`${BASE_URL}/api/order/getallorders`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const today = new Date().toISOString().split('T')[0];
            const allowedStatuses = ['Pending', 'Confirmed', 'Shipped'];
            const filtered = (data.orders || []).filter(o => {
                const orderDate = (o.expectedDeliveryDate || "").split('T')[0];
                return (
                    allowedStatuses.includes(o.status) &&
                    orderDate === today
                );
            });

            setPendingOrders(filtered);
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    return (
        <View className="mt-5">
            {pendingOrders.length > 0 && (
                <View className="mb-8">
                    <Text className="px-6 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">
                        Todays delivery ({pendingOrders.length})
                    </Text>
                    <FlatList
                        horizontal
                        data={pendingOrders}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                        keyExtractor={(item) => `pending-${item._id}`}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => router.push(`/(admin)/order/${item._id}`)}
                                className="bg-white border border-amber-100 p-4 rounded-md w-64 shadow-md shadow-amber-100 flex-row items-center"
                            >
                                <View className="w-14 h-14 rounded-md bg-amber-50 border border-amber-100 items-center justify-center overflow-hidden mr-3">
                                    <Image
                                        source={
                                            item.products?.[0]?.productId?.productImg?.[0]?.url
                                                ? { uri: item.products?.[0]?.productId?.productImg?.[0].url }
                                                : FallbackImage
                                        }
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <View className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                                        <Text className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{item?.status}</Text>
                                    </View>
                                    <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>
                                        {item.user?.firstName || "Customer"}
                                    </Text>
                                    <Text className="text-slate-500 font-bold text-xs mt-0.5">
                                        ₹{item.amount?.toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
}