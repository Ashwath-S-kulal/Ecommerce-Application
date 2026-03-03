import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Image, 
  TextInput, ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { 
  Search, Package, ArrowUpDown, X, 
  ChevronRight, LayoutGrid, Clock, Filter, ChevronDown
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import Constants from "expo-constants";


const BASE_URL = Constants.expoConfig.extra.apiUrl;
const ShowUserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("recent");
  const router = useRouter();

  // Dropdown Data Sources
  const statusOptions = [
    { label: 'All Status', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'recent' },
    { label: 'Oldest First', value: 'oldest' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const { data } = await axios.get(`${BASE_URL}/api/order/getallorders`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const processedOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = 
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = 
          statusFilter === "All" || order.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
      });
  }, [orders, searchTerm, statusFilter, sortOrder]);

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/(admin)/order/${item._id}`)}
      className="bg-white border border-slate-100 rounded-xl p-5 mb-4 shadow-sm shadow-slate-200/50"
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-mono text-[10px] text-slate-400 uppercase tracking-tighter">
          #{item._id.slice(-8).toUpperCase()}
        </Text>
        <View className={`px-3 py-1 rounded-full border ${getStatusStyles(item.status).container}`}>
          <Text className={`text-[10px] font-black uppercase ${getStatusStyles(item.status).text}`}>
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[2px] mb-1">Customer</Text>
          <Text className="text-slate-900 text-lg font-black tracking-tight">{item.user?.firstName || "Guest User"}</Text>
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="#94a3b8" />
            <Text className="text-slate-400 text-xs ml-1 font-bold">
              {new Date(item.createdAt).toLocaleDateString('en-GB')}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-[15px] font-black mb-1">Total</Text>
          <Text className="text-slate-900 text-xl font-black">₹{item.amount?.toLocaleString()}</Text>
        </View>
      </View>

      <View className="h-[1px] bg-slate-50 mb-4" />

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            {item.products.slice(0, 3).map((prod, i) => (
              <View key={i} className="bg-white rounded-full p-0.5 border border-slate-100 shadow-sm" style={{ marginLeft: i === 0 ? 0 : -14 }}>
                <Image 
                  source={{ uri: prod.productId?.productImg?.[0]?.url }} 
                  className="w-9 h-9 rounded-full bg-slate-50"
                />
              </View>
            ))}
            {item.products.length > 3 && (
              <View className="w-9 h-9 rounded-full bg-slate-900 items-center justify-center border-2 border-white -ml-3">
                <Text className="text-[9px] font-bold text-white">+{item.products.length - 3}</Text>
              </View>
            )}
          </View>
          <Text className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">
            {item.products.length} {item.products.length === 1 ? 'Item' : 'Items'}
          </Text>
        </View>
        
        <View className=" w-10 h-10 items-center justify-center rounded-full border border-slate-100 shadow-sm">
          <ChevronRight size={18} color="black" strokeWidth={3} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const dropdownStyles = {
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  };

  const dropdownTextStyles = {
    fontSize: 10, 
    fontWeight: '900', 
    color: '#0f172a', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 pt-4 pb-6 bg-white border-b border-slate-100 shadow-sm shadow-slate-100">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-black text-slate-900 tracking-tighter uppercase " numberOfLines={1}>
              ALL ORDERS
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{processedOrders.length} RESULTS</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-100 rounded-full px-4 h-12 mb-5">
          <Search size={18} color="#64748b" />
          <TextInput 
            className="flex-1 ml-3 text-slate-900 text-sm font-bold"
            placeholder="Search Reference..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm !== "" && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Action Bar */}
        <View className="flex-row gap-3 ">
          {/* Status Dropdown */}
          <View className="flex-1">
            <Dropdown
              style={dropdownStyles}
              selectedTextStyle={dropdownTextStyles}
              data={statusOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={statusFilter}
              onChange={item => setStatusFilter(item.value)}
              renderLeftIcon={() => <Filter size={14} color="#64748b" style={{ marginRight: 6 }} />}
              renderRightIcon={() => <ChevronDown size={14} color="#94a3b8" />}
              containerStyle={{ borderRadius: 10, overflow: 'hidden', borderBottomWidth: 0 }}
              itemTextStyle={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}
            />
          </View>

          {/* Sort Dropdown */}
          <View className="flex-1">
            <Dropdown
              style={dropdownStyles}
              selectedTextStyle={dropdownTextStyles}
              data={sortOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={sortOrder}
              onChange={item => setSortOrder(item.value)}
              renderLeftIcon={() => <ArrowUpDown size={14} color="#64748b" style={{ marginRight: 6 }} />}
              renderRightIcon={() => <ChevronDown size={14} color="#94a3b8" />}
              containerStyle={{ borderRadius: 20, overflow: 'hidden', borderBottomWidth: 0 }}
              itemTextStyle={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      ) : (
        <FlatList
          data={processedOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20 opacity-40">
              <Package size={60} color="#cbd5e1" strokeWidth={1} />
              <Text className="text-slate-900 font-black mt-4 uppercase tracking-[4px] text-[10px]">No matches</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStatusStyles = (status) => {
  switch(status) {
    case 'Delivered': return { container: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' };
    case 'Cancelled': return { container: 'bg-red-50 border-red-100', text: 'text-red-600' };
    case 'Pending': return { container: 'bg-orange-50 border-orange-100', text: 'text-orange-600' };
    default: return { container: 'bg-pink-50 border-pink-100', text: 'text-pink-600' };
  }
};

export default ShowUserOrders;