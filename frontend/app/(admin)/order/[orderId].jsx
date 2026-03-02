import React, { useEffect, useState } from "react";
import {
    View, Text, ScrollView, Image, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import {
    ArrowLeft, Package, MapPin, Phone, Mail,
    CreditCard, Truck, CheckCircle2, AlertTriangle,
    XCircle, Receipt
} from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URI = process.env.EXPO_PUBLIC_BASE_URL

export default function OrderDetailsPage() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const statuses = ["Pending", "Confirmed", "Shipped", "Delivered"];

    const fetchOrderDetails = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const { data } = await axios.get(`${BASE_URI}/api/order/getorder/${orderId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (data.success) setOrder(data.order);
        } catch (err) {
            console.error("Error fetching order:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { if (orderId) fetchOrderDetails(); }, [orderId]);


    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const handleUpdateStatus = async (newStatus) => {
        if (updating || !isMounted) return;
        Alert.alert(
            "Confirm Update",
            `Are you sure you want to change this order status to ${newStatus.toUpperCase()}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Update",
                    style: "default",
                    onPress: async () => {
                        setUpdating(true);
                        try {
                            const accessToken = await AsyncStorage.getItem('accessToken');
                            const response = await axios.post(
                                `${BASE_URI}/api/order/updateorderstatusadmin/${orderId}`,
                                { status: newStatus },
                                { headers: { Authorization: `Bearer ${accessToken}` } }
                            );

                            if (response.data.success && isMounted) {
                                Alert.alert(
                                    "Success",
                                    `Order is now ${newStatus}`,
                                    [
                                        {
                                            text: "Done",
                                            onPress: () => router.push("/(admin)/Orders")
                                        }
                                    ]
                                );
                            }
                        } catch (err) {
                            console.error("Update failed:", err);
                            if (isMounted) Alert.alert("Error", "Update failed. Please try again.");
                        } finally {
                            if (isMounted) setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-[#FBFBFE]">
            <ActivityIndicator size="large" color="#ec4899" />
        </View>
    );

    if (!order) return (
        <View className="flex-1 justify-center items-center">
            <Text className="font-black text-slate-500 italic">Manifest not found.</Text>
        </View>
    );

    const statusThemes = {
        Pending: "bg-orange-500",
        Confirmed: "bg-blue-600",
        Shipped: "bg-purple-600",
        Delivered: "bg-emerald-500",
        Cancelled: "bg-red-500",
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FBFBFE]">
            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrderDetails} />}
            >
                <View className="mb-8">
                    <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
                        <ArrowLeft size={18} color="#94a3b8" />
                        <Text className="ml-2 text-slate-400 font-black uppercase text-xs tracking-widest">Back</Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-between items-center">
                        <Text className="text-4xl font-black  text-slate-900 tracking-tighter">
                            Order <Text className="text-slate-300 not-italic">#{order._id.slice(-8).toUpperCase()}</Text>
                        </Text>
                        <View className={`${statusThemes[order.status]} px-4 py-2 rounded-2xl`}>
                            <Text className="text-white font-black uppercase text-[10px] tracking-widest">{order.status}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-md border border-slate-100 p-6 mb-6 shadow-sm">
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <Package size={18} color="#ec4899" />
                            <Text className="ml-2 font-black uppercase text-xs tracking-widest text-slate-800">Shipment Contents</Text>
                        </View>
                        <Text className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{order.products.length} Units</Text>
                    </View>

                    <View className="gap-y-6">
                        {order.products.map((item, idx) => (
                            <View key={idx} className="flex-row items-center">
                                <TouchableOpacity onPress={() => router.push(`/product/${item?.productId._id}`)}>
                                    <Image
                                        source={{ uri: item.productId?.productImg?.[0]?.url }}
                                        className="w-20 h-20 rounded-2xl bg-slate-100"
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>

                                <View className="flex-1 ml-4">
                                    <Text className="text-pink-500 text-[8px] font-black uppercase tracking-widest mb-1">{item.productId?.category}</Text>
                                    <Text className="text-slate-900 font-black italic text-base" >{item.productId?.productName}</Text>
                                    <Text className="text-slate-400 text-[10px] font-bold mt-1 italic">Qty: {item.quantity}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="font-black italic text-slate-900 text-base">₹{(item.productId?.productPrice * item.quantity).toLocaleString()}</Text>
                                    <Text className="text-slate-300 text-[9px] font-bold tracking-tighter">₹{item.productId?.productPrice}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="bg-white rounded-md border border-slate-100 p-6 mb-6 shadow-sm">
                    <View className="flex-row items-center mb-6">
                        <Receipt size={18} color="#ec4899" />
                        <Text className="ml-2 font-black uppercase text-xs tracking-widest text-slate-400">Calculation</Text>
                    </View>
                    <View className="gap-y-3 mb-4">
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-sm font-bold italic">Subtotal</Text>
                            <Text className="text-slate-800 text-sm font-bold italic">₹{order.subtotal?.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-sm font-bold italic">Shipping</Text>
                            <Text className="text-emerald-500 text-sm font-bold italic">{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-sm font-bold italic">Tax Est.</Text>
                            <Text className="text-slate-800 text-sm font-bold italic">₹{order.tax?.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View className="bg-slate-900 rounded-2xl p-6 flex-row justify-between items-center">
                        <View>
                            <Text className="text-pink-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Final Settlement</Text>
                            <Text className="text-white text-3xl font-black italic tracking-tighter">
                                ₹{order.amount?.toLocaleString()}
                            </Text>
                        </View>
                        <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
                            <CreditCard size={20} color="rgba(255,255,255,0.4)" />
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-md border border-slate-100 p-6 mb-6 shadow-sm">
                    <View className="flex-row items-center mb-6">
                        <MapPin size={18} color="#ec4899" />
                        <Text className="ml-2 font-black uppercase text-xs tracking-widest text-slate-400">Destination</Text>
                    </View>
                    <View className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <Text className="font-black text-lg italic text-slate-900 mb-1">{order.address?.fullName}</Text>
                        <Text className="text-slate-500 text-xs font-bold leading-5 opacity-80">
                            {order.address?.street}, {order.address?.city}{"\n"}
                            {order.address?.state} - {order.address?.zip}
                        </Text>
                        <View className="mt-4 pt-4 border-t border-slate-200/50 gap-y-2">
                            <View className="flex-row items-center">
                                <Phone size={12} color="#ec4899" />
                                <Text className="ml-2 text-slate-600 text-[10px] font-black">{order.address?.phone}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Mail size={12} color="#ec4899" />
                                <Text className="ml-2 text-slate-600 text-[10px] font-black">{order.user?.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="bg-white rounded-md border border-slate-100 p-8 mb-6 shadow-sm">
                    <View className="flex-row items-center mb-10">
                        <Truck size={18} color="#ec4899" />
                        <Text className="ml-2 font-black uppercase text-xs tracking-widest text-slate-400">Live Progress Manifest</Text>
                    </View>

                    {statuses.map((step, index) => {
                        const currentIdx = statuses.indexOf(order.status);
                        const isCompleted = currentIdx >= index && order.status !== "Cancelled";
                        const isActive = order.status === step;
                        const isLineCompleted = currentIdx > index && order.status !== "Cancelled";

                        return (
                            <View key={step} className="flex-row pb-10 last:pb-0">
                                <View className="items-center mr-6">
                                    <View className={`w-6 h-6 rounded-full border-4 items-center justify-center ${isCompleted ? 'bg-emerald-500 border-emerald-100 scale-110' : 'bg-white border-slate-100'
                                        }`}>
                                        {isCompleted && <CheckCircle2 size={10} color="white" />}
                                    </View>

                                    {index !== statuses.length - 1 && (
                                        <View className={`w-[2px] h-20 ${isLineCompleted ? 'bg-emerald-500' : 'bg-slate-100'
                                            }`} />
                                    )}
                                </View>

                                <View className="flex-1 -mt-1">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 mr-4">
                                            <Text className={`font-black uppercase italic text-xl tracking-tighter ${isCompleted ? 'text-slate-900' : 'text-slate-200'
                                                }`}>
                                                {step}
                                            </Text>
                                            <Text className={`text-[10px] font-bold mt-1 ${isCompleted ? 'text-slate-400' : 'text-slate-200'
                                                }`}>
                                                {isActive ? "Currently in this phase." : isCompleted ? "Phase logistics completed." : "Pending logistics."}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleUpdateStatus(step)}
                                            disabled={updating || isActive}
                                            className={`px-4 py-2 w-24 items-center rounded-xl border-2 ${isActive
                                                ? 'bg-slate-100 border-slate-200'
                                                : 'bg-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none'
                                                }`}
                                        >
                                            <Text className={`text-[9px] font-black uppercase ${isActive ? 'text-slate-400' : 'text-slate-900'}`}>
                                                {isActive ? "ACTIVE" : `SET ${step.toUpperCase()}`}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View className="bg-red-50/50 rounded-[32px] p-8 mb-12 border-2 border-dashed border-red-200">
                    <View className="flex-row items-center mb-6">
                        <AlertTriangle size={18} color="#ef4444" />
                        <Text className="ml-2 text-red-600 font-black uppercase text-[10px] tracking-widest italic">Abort Logistics</Text>
                    </View>
                    <TouchableOpacity
                        disabled={updating || order.status === "Cancelled"}
                        onPress={() => handleUpdateStatus("Cancelled")}
                        className={`flex-row items-center justify-center py-5 rounded-2xl ${order.status === "Cancelled" ? 'bg-slate-100' : 'bg-red-600 shadow-[6px_6px_0px_0px_rgba(153,27,27,1)] active:shadow-none'}`}
                    >
                        <XCircle size={20} color={order.status === "Cancelled" ? "#94a3b8" : "white"} />
                        <Text numberOfLines={1} className={`ml-3 font-black uppercase text-sm tracking-widest ${order.status === "Cancelled" ? 'text-slate-400' : 'text-white'}`}>
                            Cancel Order
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}