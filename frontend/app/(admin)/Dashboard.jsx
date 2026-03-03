import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Dimensions,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import {
  Users, ShoppingBag, PackageSearch, ArrowRight,
  IndianRupee, Package, PlusCircle, TrendingUp
} from 'lucide-react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";


const { width } = Dimensions.get('window');

const AdminDashboard = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ users: 0, products: 0, revenue: 0, totalOrders: 0  });
  
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);

  const BASE_URL = Constants.expoConfig.extra.apiUrl;

  const fetchDashboardData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      const [userRes, productRes, orderRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/user/alluser`, { 
          headers: { Authorization: `Bearer ${accessToken}` } 
        }),
        axios.get(`${BASE_URL}/api/product/getallproducts`),
        axios.get(`${BASE_URL}/api/order/getallorders`, { 
          headers: { Authorization: `Bearer ${accessToken}` } 
        })
      ]);

      const orders = orderRes.data.orders || orderRes.data || [];
      const users = userRes.data.users || userRes.data || [];
      const products = productRes.data.products || productRes.data || [];

      setStats({
        users: Array.isArray(users) ? users.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        totalOrders: orders.length,
        revenue: orders
          .filter(o => o.status === 'Delivered')
          .reduce((acc, o) => acc + (Number(o.totalAmount) || Number(o.amount) || 0), 0)
      });

      processAllAnalytics(orders);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processAllAnalytics = (orders) => {
    const now = new Date();
    const safeOrders = Array.isArray(orders) ? orders : [];

    const wLabels = [];
    const wData = Array(7).fill(0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      wLabels.push(i === 0 ? "Today" : dayNames[d.getDay()]);
    }

    safeOrders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      if (!isNaN(orderDate)) {
        const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const d2 = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 7) {
          wData[6 - diffDays] += Number(o.amount || o.totalAmount || 0);
        }
      }
    });
    setWeeklyData({ labels: wLabels, datasets: [{ data: wData }] });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let mLabels = [];
    let mData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();
      
      mLabels.push(monthNames[targetMonth]);
      const sum = safeOrders
        .filter(o => {
          const oDate = new Date(o.createdAt);
          return oDate.getMonth() === targetMonth && oDate.getFullYear() === targetYear;
        })
        .reduce((acc, o) => acc + Number(o.amount || o.totalAmount || 0), 0);
      mData.push(sum);
    }
    setMonthlyData({ labels: mLabels, datasets: [{ data: mData }] });
    const curYear = now.getFullYear();
    const yLabels = [(curYear - 2).toString(), (curYear - 1).toString(), curYear.toString()];
    const yData = yLabels.map(year => 
      safeOrders
        .filter(o => new Date(o.createdAt).getFullYear().toString() === year)
        .reduce((acc, o) => acc + Number(o.amount || o.totalAmount || 0), 0)
    );
    setYearlyData({ labels: yLabels, datasets: [{ data: yData }] });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mt-6 mb-6">
          <Text className="text-xl font-bold text-slate-900">Admin Dashboard</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sanjeevini Command</Text>
        </View>

        <View className="flex-row flex-wrap justify-between mb-4">
          {navItems.map((item) => (
            <TouchableOpacity 
              key={item.to} 
              onPress={() => router.push(item.to)} 
              style={{ width: width * 0.44 }}
              className="bg-white border border-slate-100 rounded-md p-4 mb-4 shadow-sm flex-row items-center gap-3"
            >
              <View className={`w-10 h-10 rounded-full ${item.color} items-center justify-center`}>
                {item.icon}
              </View>
              <Text className="text-[12px] font-bold text-slate-900">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row flex-wrap justify-between mb-2">
          <KpiCard title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<IndianRupee size={16} color="white" />} color="bg-emerald-500" />
          <KpiCard title="Orders" value={stats.totalOrders} icon={<ShoppingBag size={16} color="white" />} color="bg-orange-500" />
          <KpiCard title="Users" value={stats.users} icon={<Users size={16} color="white" />} color="bg-indigo-500" />
          <KpiCard title="Products" value={stats.products} icon={<Package size={16} color="white" />} color="bg-blue-500" />
        </View>
        <Text className="text-lg font-bold text-slate-900 mb-4 mt-4">Performance Insights</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" className="my-10" />
        ) : (
          <View className="gap-y-6 pb-10">
            <ChartSection title="Weekly Sales (Last 7 Days)" data={weeklyData} />
            <ChartSection title="Monthly Growth (Last 6 Months)" data={monthlyData} />
            <ChartSection title="Yearly Revenue" data={yearlyData} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


const ChartSection = ({ title, data }) => (
  <View className="bg-white p-5 rounded-none border border-slate-100">
    <View className="flex-row items-center gap-2 mb-4">
      <TrendingUp size={14} color="#64748b" />
      <Text className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</Text>
    </View>
    {data ? (
      <LineChart
        data={data}
        width={width - 70}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={{ borderRadius: 16, marginLeft: -15 }}
        fromZero={true}
      />
    ) : (
      <Text className="text-slate-400 text-xs italic">No data available for this period.</Text>
    )}
  </View>
);

const KpiCard = ({ title, value, hasRightBorder, hasBottomBorder }) => (
  <View 
    style={{ width: '50%' }} 
    className={`p-5 bg-white 
      ${hasRightBorder ? 'border-r border-slate-100' : ''} 
      ${hasBottomBorder ? 'border-b border-slate-100' : ''}`}
  >
    <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
      {title}
    </Text>
    <Text className="text-lg font-black text-slate-900">
      {value}
    </Text>
  </View>
);


const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#6366f1" },
  fillShadowGradientFrom: "#6366f1",
  fillShadowGradientOpacity: 0.1,
};

const navItems = [
  { label: "Products", to: "/(admin)/Products", icon: <PackageSearch size={20} color="white" />, color: "bg-blue-500" },
  { label: "Add Product", to: "/(admin)/AddProducts", icon: <PlusCircle size={20} color="white" />, color: "bg-pink-500" },
  { label: "Orders", to: "/(admin)/Orders", icon: <ShoppingBag size={20} color="white" />, color: "bg-orange-500" },
  { label: "Users", to: "/(admin)/Users", icon: <Users size={20} color="white" />, color: "bg-indigo-500" },
];

export default AdminDashboard;