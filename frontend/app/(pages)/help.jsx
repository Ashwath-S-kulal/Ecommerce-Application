import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  MessageCircle, 
  Book, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  ChevronRight,
  LifeBuoy
} from 'lucide-react-native';

const HelpCard = ({ icon: Icon, title, description }) => (
  <TouchableOpacity 
    activeOpacity={0.7}
    className="bg-white border border-zinc-100 p-4 rounded-3xl flex-1 m-1 shadow-sm"
  >
    <View className="bg-zinc-50 w-10 h-10 rounded-2xl items-center justify-center mb-3">
      <Icon size={20} color="#18181b" />
    </View>
    <Text className="text-zinc-900 font-bold text-[13px] mb-1">{title}</Text>
    <Text className="text-zinc-400 text-[10px] leading-4" numberOfLines={2}>
      {description}
    </Text>
  </TouchableOpacity>
);

export default function HelpCenter() {
  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFC]">
      <ScrollView showsVerticalScrollIndicator={false} className="px-5">
        
        {/* HEADER */}
        <View className="mt-8 mb-6">
          <Text className="text-3xl font-black text-zinc-900 tracking-tight">Help Center</Text>
          <Text className="text-zinc-400 text-xs mt-1">How can we assist you today?</Text>
        </View>

        {/* SEARCH BAR (Compact UI) */}
        <View className="flex-row items-center bg-white border border-zinc-100 rounded-2xl px-4 py-3 mb-8 shadow-sm">
          <Search size={18} color="#a1a1aa" />
          <TextInput 
            placeholder="Search for articles, topics..."
            className="flex-1 ml-3 text-sm text-zinc-900"
            placeholderTextColor="#d4d4d8"
          />
        </View>

        {/* BENTO GRID AREA */}
        <View className="mb-8">
          <Text className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-4 ml-1">Popular Topics</Text>
          
          <View className="flex-row justify-between">
            <HelpCard 
              icon={Truck} 
              title="Shipping" 
              description="Track orders and delivery timelines." 
            />
            <HelpCard 
              icon={CreditCard} 
              title="Payments" 
              description="Refunds, invoices, and secure checkout." 
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <HelpCard 
              icon={ShieldCheck} 
              title="Privacy" 
              description="Managing your data and security." 
            />
            <HelpCard 
              icon={Book} 
              title="Guide" 
              description="Learn how to use all features." 
            />
          </View>
        </View>

        {/* CONTACT SECTION (Sophisticated UI) */}
        <View className="bg-zinc-900 rounded-[32px] p-6 mb-10 flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-white font-bold text-lg">Still need help?</Text>
            <Text className="text-zinc-400 text-[11px] mt-1">Our support team is available 24/7 for you.</Text>
            
            <TouchableOpacity className="bg-white py-3 px-5 rounded-xl mt-4 self-start">
              <Text className="text-zinc-900 font-bold text-xs">Chat Now</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-zinc-800 p-4 rounded-full">
            <MessageCircle size={32} color="white" />
          </View>
        </View>

        {/* FAQ LIST (Miniaturized View) */}
        <View className="mb-10">
          <Text className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-4 ml-1">Frequently Asked</Text>
          {[
            "How do I change my password?",
            "Can I cancel my order?",
            "Where is my refund?",
            "Update billing information"
          ].map((item, index) => (
            <TouchableOpacity 
              key={index}
              className="flex-row items-center justify-between py-4 border-b border-zinc-100"
            >
              <Text className="text-zinc-700 text-xs font-medium">{item}</Text>
              <ChevronRight size={14} color="#d4d4d8" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}