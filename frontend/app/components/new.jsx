import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, LogIn, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomePage() {
  const { height } = useWindowDimensions();
  const isSmallDevice = height < 700;

  return (
    <View className="flex-1 bg-white">
      {/* Dynamic Background Blur */}
      <View className="absolute -top-20 -right-20 w-80 h-80 bg-pink-200 rounded-full blur-[80px] opacity-40" />
      
      <SafeAreaView className="flex-1 px-8 justify-center">
        
        {/* Responsive Hero Section */}
        <View className="items-center mb-12">
          <View className="bg-pink-50 p-6 rounded-full border border-pink-100 mb-6">
            <Sparkles size={isSmallDevice ? 32 : 48} color="#db2777" />
          </View>
          <Text className="text-4xl font-black text-slate-900 text-center tracking-tighter">
            Sanjeevini{"\n"}
            <Text className="text-pink-600" numberOfLines={1}>Group Avarse</Text>
          </Text>
          <Text className="text-slate-500 text-center mt-6 leading-6 max-w-[300px]">
            Building financial resilience for rural communities. Join the movement today.
          </Text>
        </View>

        {/* Action Buttons with Responsive Height */}
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
        
        {/* Footer with Minimalist Branding */}
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