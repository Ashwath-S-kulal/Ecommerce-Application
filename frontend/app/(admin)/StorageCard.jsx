import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, RefreshControl, Dimensions, Linking, TouchableOpacity } from 'react-native';
import { Database, Cloud, AlertTriangle, CheckCircle2, Image as ImageIcon, ExternalLink } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from "expo-constants";
import { useFocusEffect } from '@react-navigation/native'; 

const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function AdminSystemStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/api/status/storage-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Stats Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  useEffect(() => { fetchStats(); }, []);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafc]">
        <ActivityIndicator size="large" color="black" />
        <Text className="mt-[10px] text-[#64748b] font-bold uppercase text-[10px] tracking-widest">
          Syncing Server Stats...
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />
        }
      >
        <View className="px-5 py-6">
          <View className="flex-row items-center mb-6">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest">System Architecture Health</Text>
          </View>

          <View className="flex-row justify-between mb-6">
            <StorageCard title="MongoDB" icon={Database} color="#059669" data={stats?.database} />
            <StorageCard title="Cloudinary" icon={Cloud} color="#2563eb" data={stats?.media?.storage} />
          </View>

          <View className="bg-zinc-900 p-6 rounded-xl mb-4 shadow-xl" >
            <View className="flex-row items-center mb-4" >
              <Database size={14} color="#059669" />
              <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-widest ml-2">Database Engine (MongoDB Atlas)</Text>
            </View>

            <DetailRow2 label="Storage Used" value={stats?.database?.usedMB} />
            <DetailRow2 label="Storage Limit" value={stats?.database?.limitMB} />
            <DetailRow label="Total Collections" value={stats?.database?.collections} />
            <DetailRow label="Document Count" value={stats?.database?.objects} />
            <DetailRow label="Capacity" value={`${stats?.database?.percentUsed}%`} color="text-emerald-400" />
          </View>

          <View className="bg-zinc-900 p-6 rounded-xl shadow-xl">
            <View className="flex-row items-center mb-4">
              <ImageIcon size={14} color="#2563eb" />
              <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest ml-2">Media & CDN (Cloudinary)</Text>
            </View>

            <DetailRow2 label="Media Storage" value={stats?.media?.storage?.used} />
            <DetailRow2 label="Storage Limit" value={stats?.media?.storage?.limit} />
            <DetailRow label="Monthly Credits" value={`${stats?.media?.credits?.percentUsed}%`} color="text-blue-400" />

            {stats?.media?.error && (
              <Text className="text-red-400 text-[10px] italic mt-2">⚠️ {stats?.media?.error}</Text>
            )}
          </View>


          <View className="mt-8 mb-10 gap-y-3">
            <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px] ml-1 mb-1">
              External Cloud consoles
            </Text>

            {/* MongoDB Atlas Button */}
            <TouchableOpacity
              onPress={() => Linking.openURL('https://cloud.mongodb.com/')}
              activeOpacity={0.7}
              className="bg-white border border-zinc-200 p-4 rounded-md flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                  <Database size={20} color="#059669" />
                </View>
                <View className="ml-4">
                  <Text className="text-zinc-900 font-bold text-sm">MongoDB Atlas</Text>
                  <Text className="text-zinc-500 text-[10px]">Manage Clusters & Collections</Text>
                </View>
              </View>
              <ExternalLink size={16} color="#a1a1aa" />
            </TouchableOpacity>

            {/* Cloudinary Button */}
            <TouchableOpacity
              onPress={() => Linking.openURL('https://cloudinary.com/console')}
              activeOpacity={0.7}
              className="bg-white border border-zinc-200 p-4 rounded-md flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                  <Cloud size={20} color="#2563eb" />
                </View>
                <View className="ml-4">
                  <Text className="text-zinc-900 font-bold text-sm">Cloudinary Console</Text>
                  <Text className="text-zinc-500 text-[10px]">Media Assets & Transformations</Text>
                </View>
              </View>
              <ExternalLink size={16} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <Text className="text-center text-zinc-400 text-[9px] font-bold uppercase tracking-widest mb-10">
            Sanjeevini Group Avarse
          </Text>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}


const DetailRow = ({ label, value, color = "text-white" }) => (
  <View className="flex-row justify-between items-center py-3 border-b border-zinc-800/50" >
    <Text className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider flex-1" numberOfLines={1}>{label}</Text>
    <Text className={`${color} font-mono text-xs font-bold ml-2`} numberOfLines={1}>{value}</Text>
  </View>
);



const DetailRow2 = ({ label, value, color = "text-white" }) => {
  const mbValue = parseFloat(value) || 0;
  const gbValue = (mbValue / 1024).toFixed(3);
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-zinc-800/50">
      <Text
        className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider flex-1 mr-2"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className="text-right" numberOfLines={1}>
        <Text className={`${color} font-mono text-xs font-bold`}>
          {mbValue.toLocaleString()}
          <Text className="text-[9px] opacity-60 font-medium"> MB</Text>
        </Text>
        <Text className="text-zinc-500 font-mono text-[10px]">
          {"  "}[ {gbValue} <Text className="text-[8px]">GB</Text> ]
        </Text>
      </Text>
    </View>
  );
};


const StorageCard = ({ title, icon: Icon, data, color }) => {
  const percent = parseFloat(data?.percentUsed || 0);
  return (
    <View className="bg-white p-5 rounded-md border border-zinc-100 shadow-sm flex-1 m-1">
      <View className="flex-row justify-between items-center mb-4">
        <View style={{ backgroundColor: color + '20' }} className="p-2 rounded-xl">
          <Icon size={18} color={color} />
        </View>
        {percent > 90 ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#10b981" />}
      </View>

      <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{title}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit className="text-lg font-black text-zinc-900 mt-1">
        {data?.usedMB || data?.used}
        <Text className="text-[10px] text-zinc-400"> / {data?.limitMB || data?.limit} </Text>
      </Text>

      <View className="h-1.5 w-full bg-zinc-100 rounded-full mt-4 overflow-hidden">
        <View
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: percent > 90 ? '#ef4444' : color }}
          className="h-full rounded-full"
        />
      </View>
      <Text className="text-[9px] font-bold text-zinc-400 mt-2">{percent}% Capacity</Text>
    </View>
  );
};