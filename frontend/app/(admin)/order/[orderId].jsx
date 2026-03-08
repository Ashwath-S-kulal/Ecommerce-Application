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
    XCircle, Receipt,
    Clock
} from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import FallbackImage from '../../../assets/Product Doesnt Exist.webp';
import { useRef } from 'react';
import { Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Add this import
import { Platform } from 'react-native';

const Skeleton = ({ className }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return <Animated.View style={{ opacity }} className={`bg-slate-200 rounded-md ${className}`} />;
};

const DetailsSkeleton = () => (
    <SafeAreaView className="flex-1 bg-[#FBFBFE]">
        <ScrollView contentContainerStyle={{ padding: 24 }}>
            {/* Back Button & Header */}
            <View className="mb-8">
                <Skeleton className="h-4 w-16 mb-6" />
                <View className="flex-row justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-8 w-20 rounded-2xl" />
                </View>
            </View>

            {/* Shipment Contents Card */}
            <View className="bg-white rounded-md border border-slate-100 p-6 mb-6">
                <View className="flex-row justify-between mb-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                </View>
                {[1, 2].map((i) => (
                    <View key={i} className="flex-row items-center mb-6">
                        <Skeleton className="w-20 h-20 rounded-2xl" />
                        <View className="flex-1 ml-4 gap-y-2">
                            <Skeleton className="h-2 w-12" />
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-16" />
                        </View>
                        <View className="items-end gap-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-3 w-10" />
                        </View>
                    </View>
                ))}
            </View>

            {/* Price Breakdown Card */}
            <View className="bg-white rounded-md border border-slate-100 p-6 mb-6">
                <Skeleton className="h-4 w-24 mb-6" />
                <View className="gap-y-4 mb-4">
                    <View className="flex-row justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></View>
                    <View className="flex-row justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></View>
                </View>
                <Skeleton className="h-24 w-full rounded-2xl" />
            </View>

            {/* Status Timeline Skeleton */}
            <View className="bg-white rounded-md border border-slate-100 p-8 mb-6">
                <Skeleton className="h-4 w-40 mb-10" />
                {[1, 2, 3].map((i) => (
                    <View key={i} className="flex-row pb-10">
                        <View className="items-center mr-6">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <Skeleton className="w-[2px] h-20" />
                        </View>
                        <View className="flex-1 flex-row justify-between">
                            <View className="gap-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-3 w-40" />
                            </View>
                            <Skeleton className="h-10 w-24 rounded-xl" />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    </SafeAreaView>
);

// const BASE_URI = Constants.expoConfig.extra.apiUrl;
const BASE_URI = "http://10.44.217.102:8000"


export default function OrderDetailsPage() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const statuses = ["Pending", "Confirmed", "Shipped", "Delivered"];
    const [newDate, setNewDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event, selectedDate) => {
        // Hide picker for Android immediately; iOS usually keeps it visible in a modal context
        if (Platform.OS === 'android') setShowDatePicker(false);

        if (event.type === "set" && selectedDate) {
            handleUpdateOrder({ date: selectedDate });
        }
    };

    useEffect(() => {
        if (orderId)
            fetchOrderDetails();
    }, [orderId]);


    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (order?.expectedDeliveryDate) {
            setNewDate(new Date(order.expectedDeliveryDate));
        }
    }, [order]);


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

                            fetchOrderDetails();

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

    const handleUpdateOrder = async (updatedFields) => {
        if (updating || !isMounted) return;

        setUpdating(true);
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const response = await axios.post(
                `${BASE_URI}/api/order/updateorderstatusadmin/${orderId}`,
                {
                    status: updatedFields.status || order.status,
                    expectedDeliveryDate: updatedFields.date || newDate
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.data.success) {
                Alert.alert("Success", "Order logistics updated.");
                fetchOrderDetails();
            }
        } catch (err) {
            console.error("Update failed:", err);
            Alert.alert("Error", "Could not update order details.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <DetailsSkeleton />;

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
                                <TouchableOpacity
                                    onPress={() => {
                                        if (item?.productId?._id) {
                                            router.push(`/product/${item.productId._id}`);
                                        } else {
                                            Alert.alert(
                                                "Product Not Available",
                                                "This product no longer exists."
                                            );
                                        }
                                    }}
                                >
                                    <Image
                                        source={
                                            item?.productId?.productImg?.[0]?.url
                                                ? { uri: item.productId.productImg[0].url }
                                                : FallbackImage
                                        }
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

                {/* Delivery Schedule Management */}
                <View className="bg-white rounded-md border border-slate-100 p-6 mb-6 shadow-sm">
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <Truck size={18} color="#ec4899" />
                            <Text className="ml-2 font-black uppercase text-xs tracking-widest text-slate-800">Delivery Schedule</Text>
                        </View>
                    </View>

                    <View className="items-center py-4 bg-slate-50 rounded-md border border-slate-100 mb-6">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Expected Delivery</Text>
                        <Text className="text-2xl font-black text-slate-900 italic">
                            {new Date(order.expectedDeliveryDate || new Date()).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric'
                            })}
                        </Text>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => {
                                const d = new Date(order.expectedDeliveryDate || new Date());
                                d.setDate(d.getDate() + 1);
                                handleUpdateOrder({ date: d });
                            }}
                            className="flex-1 h-12 bg-white border border-slate-200 rounded-xl items-center justify-center"
                        >
                            <Text className="text-slate-600 font-black text-[10px] uppercase">+1 Day</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const d = new Date(order.expectedDeliveryDate || new Date());
                                d.setDate(d.getDate() + 2);
                                handleUpdateOrder({ date: d });
                            }}
                            className="flex-1 h-12 bg-white border border-slate-200 rounded-xl items-center justify-center"
                        >
                            <Text className="text-slate-600 font-black text-[10px] uppercase">+2 Day</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const d = new Date(order.expectedDeliveryDate || new Date());
                                d.setDate(d.getDate() + 3);
                                handleUpdateOrder({ date: d });
                            }}
                            className="flex-1 h-12 bg-white border border-slate-200 rounded-xl items-center justify-center"
                        >
                            <Text className="text-slate-600 font-black text-[10px] uppercase">+3 Days</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="h-12 px-3 bg-slate-900 rounded-xl items-center justify-center flex-row gap-2 active:opacity-80"
                        >
                            <Clock size={16} color="white" />
                            <Text className="text-white font-black text-[9px] uppercase tracking-widest">Custom Change</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date(order.expectedDeliveryDate || Date.now())}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                minimumDate={new Date()} 
                            />
                        )}
                    </View>
                </View>

                <View className="bg-white rounded-md border border-slate-100 p-7 mb-6 shadow-sm overflow-hidden">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center">
                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                            <Text className="font-black uppercase text-[10px] tracking-widest text-slate-400">
                                Logistics Stepper
                            </Text>
                        </View>
                    </View>

                    <View className="relative">
                        <View className="absolute left-[12px] top-2 bottom-2 w-[2px] bg-slate-100" />

                        <View
                            style={{
                                height: `${(statuses.indexOf(order.status) / (statuses.length - 1)) * 100}%`,
                                maxHeight: '100%'
                            }}
                            className="absolute left-[12px] top-0 w-[2px] bg-emerald-500 z-10 "
                        />

                        <View className="gap-y-8">
                            {statuses.map((step, index) => {
                                const isActive = order.status === step;
                                const isPast = statuses.indexOf(order.status) > index;

                                return (
                                    <View key={step} className="flex-row items-center">
                                        <View className="z-20">
                                            <View className={`w-7 h-7 rounded-full items-center justify-center border-2 ${isActive
                                                ? 'bg-slate-900 border-slate-900'
                                                : isPast
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'bg-white border-slate-200'
                                                }`}>
                                                {isPast ? (
                                                    <CheckCircle2 size={12} color="white" />
                                                ) : (
                                                    <View className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-200'}`} />
                                                )}
                                            </View>
                                        </View>

                                        <View className="ml-4 flex-1">
                                            <Text className={`font-black uppercase text-[11px] tracking-widest ${isActive ? 'text-slate-900' : isPast ? 'text-emerald-600' : 'text-slate-300'
                                                }`}>
                                                {step}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleUpdateStatus(step)}
                                            disabled={!!updating || isActive}
                                            className={`px-4 py-2 rounded-md border flex-row items-center justify-center min-w-[85px] ${isActive
                                                ? 'bg-slate-50 border-slate-100'
                                                : 'bg-white border-slate-900'
                                                }`}
                                        >
                                            {updating === step ? (
                                                <ActivityIndicator size="small" color="#0f172a" />
                                            ) : (
                                                <Text className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-slate-400' : 'text-slate-900'
                                                    }`}>
                                                    {isActive ? 'Active' : `Set ${step}`}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>


                <View className="bg-red-50/50 rounded-full p-8 mb-12 border-2 border-dashed border-red-200">
                    <TouchableOpacity
                        disabled={updating || order.status === "Cancelled" || order.status === "Delivered"}
                        onPress={() => handleUpdateStatus("Cancelled")}
                        className={`flex-row items-center justify-center py-5 rounded-full ${order.status === "Cancelled" || order.status === "Delivered" ? 'bg-slate-100' : 'bg-red-600 shadow-[6px_6px_0px_0px_rgba(153,27,27,1)] active:shadow-none'}`}
                    >
                        <XCircle size={20} color={order.status === "Cancelled" || order.status === "Delivered" ? "#94a3b8" : "white"} />
                        <Text numberOfLines={1} className={`ml-3 font-black uppercase text-sm tracking-widest ${order.status === "Cancelled" || order.status === "Delivered" ? 'text-slate-400' : 'text-white'}`}>
                            Cancel Order
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

