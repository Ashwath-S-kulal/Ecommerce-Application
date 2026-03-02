import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, BackHandler, Dimensions } from "react-native";
import { Check, Package, ShoppingBag, ArrowRight, ClipboardList } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

export default function OrderSuccess() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = params.id || "UNKNOWN_ID";

    useEffect(() => {
        const backAction = () => {
            router.replace("/(tabs)/shop"); // Redirect to shop on back press
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ConfettiCannon
                count={150}
                origin={{ x: width / 2, y: -20 }}
                fadeOut={true}
                explosionSpeed={400}
                fallSpeed={2500}
                colors={['#ec4899', '#10b981', '#3b82f6', '#f59e0b']}
            />
            <View className="flex-1 px-8 items-center justify-center">
                <View className="mb-5 items-center justify-center">
                    <View className="w-28 h-28 bg-emerald-50 rounded-full items-center justify-center">
                        <View className="w-20 h-20 bg-emerald-500 rounded-full items-center justify-center shadow-xl shadow-emerald-400">
                            <Check size={40} color="white" strokeWidth={3} />
                        </View>
                    </View>
                </View>

                <View className="items-center mb-5">
                    <Text className="text-3xl font-[900] text-slate-900 tracking-tight text-center" numberOfLines={1}>
                        Payment <Text className="text-emerald-500 ">Success!</Text>
                    </Text>
                    <Text className="text-slate-500 font-medium text-center mt-3 text-base px-2">
                        Your order has been placed successfully and is being processed.
                    </Text>
                </View>

                <View className="w-full bg-slate-50 rounded-[24px] p-5 border border-slate-100 mb-4 flex-row items-center">
                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-100 shadow-sm">
                        <ClipboardList size={20} color="#64748b" />
                    </View>
                    <View className="ml-4">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</Text>
                        <Text className="text-slate-900 font-bold text-base mt-0.5">
                            #{id.toString().slice(-8).toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View className="w-full bg-slate-50 rounded-[24px] p-5 border border-slate-100 flex-row items-center mb-12">
                    <View className="w-12 h-12 bg-emerald-100 rounded-2xl items-center justify-center border border-emerald-200">
                        <Package color="#059669" size={20} />
                    </View>
                    <View className="ml-4">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</Text>
                        <Text className="text-slate-900 font-bold text-base mt-0.5" numberOfLines={1}>Processing items...</Text>
                    </View>
                </View>

                <View className="w-full flex-row items-center gap-x-3 px-2">
                    <TouchableOpacity
                        onPress={() => router.push("../(pages)/orders")}
                        activeOpacity={0.9}
                        className="flex-1 h-14 bg-slate-900 rounded-2xl flex-row items-center justify-center shadow-lg shadow-slate-300"
                    >
                        <Text className="text-white font-black text-[14px] mr-2">Track Order</Text>
                        <ArrowRight size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push("../(tabs)/shop")}
                        activeOpacity={0.7}
                        className="flex-1 h-14 bg-white border border-slate-200 rounded-2xl flex-row items-center justify-center"
                    >
                        <ShoppingBag size={16} color="#64748b" />
                        <Text className="text-slate-500 font-bold text-[14px] ml-2">Shop More</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}