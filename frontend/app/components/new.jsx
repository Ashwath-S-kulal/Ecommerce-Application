import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { UserPlus, LogIn } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomePage() {
  return (
    <View className="flex-1 bg-white">
      <View className="absolute -top-20 -right-20 w-80 h-80 bg-pink-200 rounded-full blur-[80px] opacity-40" />

      <SafeAreaView className="flex-1 px-8 justify-center">
        <View className="items-center mb-12">
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-pink-50 p-6 rounded-full border border-pink-100 mb-6">
            <Image
              source={require('../../assets/logo_bg_rmv.png')}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="text-4xl font-black text-slate-900 text-center tracking-tighter">
            Sanjeevini
          </Text>
          <Text className="text-4xl font-black text-pink-600" numberOfLines={1}>Group Avarse</Text>
          <Text className="text-slate-500 text-center mt-6 leading-6 max-w-[300px]">
            Building financial resilience for rural communities. Join the movement today.
          </Text>
        </View>

        <View className="gap-y-4">
          <TouchableOpacity
            onPress={() => router.push("/login")}
            className="bg-slate-900 h-16 rounded-2xl flex-row items-center justify-center shadow-xl shadow-slate-300 active:scale-[0.98]"
          >
            <LogIn size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-3" numberOfLines={1}>Login to Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            className="h-16 rounded-2xl flex-row items-center justify-center border-2 border-slate-100 active:bg-slate-50"
          >
            <UserPlus size={20} color="#db2777" />
            <Text className="text-pink-600 font-bold text-lg ml-3" numberOfLines={1}>Create New Account</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-12 items-center">
          <View className="flex-row items-center gap-2">
            <View className="h-[1px] w-8 bg-slate-200" />
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">
              KSRLPS Certified
            </Text>
            <View className="h-[1px] w-8 bg-slate-200" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}