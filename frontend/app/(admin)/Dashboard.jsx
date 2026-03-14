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
  IndianRupee, Package, PlusCircle, TrendingUp,
  Activity,
  ChevronRight
} from 'lucide-react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";


const width = Dimensions.get("window").width;

const AdminDashboard = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ users: 0, products: 0, revenue: 0, totalOrders: 0 });

  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

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

      const orders = orderRes.data.orders || [];
      const users = userRes.data.users || [];
      const products = productRes.data.products || [];

      setStats({
        users: users.length,
        products: products.length,
        totalOrders: orders.length,
        revenue: orders
          .filter(o => o.status === "Delivered")
          .reduce((acc, o) => acc + Number(o.totalAmount || o.amount || 0), 0)
      });
      setLoading(false);
      setTimeout(() => {
        processAllAnalytics(orders);
      }, 0);

    } catch (err) {
      console.log("Dashboard Error:", err);
    } finally {
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
    const timer = setTimeout(() => {
      setShowCharts(true);
    }, 600);

    return () => clearTimeout(timer);
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
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Sanjeevini Products</Text>
        </View>

        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={() => router.push("/(admin)/StorageCard")}
            activeOpacity={0.7}
            className="bg-zinc-900 p-4 rounded-xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 bg-emerald-500/10 rounded-lg items-center justify-center">
                <Activity size={20} color="#10b981" />
              </View>
              <View>
                <Text className="text-white font-bold text-sm">Database Storage</Text>
                <Text className="text-zinc-500 text-[10px] uppercase">Cloud & DB Status</Text>
              </View>
            </View>
            <ArrowRight size={16} color="#52525b" />
          </TouchableOpacity>

          {navItems.map((item) => (
            <TouchableOpacity
              key={item.to}
              onPress={() => router.push(item.to)}
              className="bg-white border border-slate-100 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-4">
                <View className={`w-10 h-10 rounded-lg ${item.color} items-center justify-center opacity-90`}>
                  {item.icon}
                </View>
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <StatsSkeleton />
        ) : (
          <View className="flex-row flex-wrap justify-between mb-2">
            <KpiCard title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} />
            <KpiCard title="Orders" value={stats.totalOrders} />
            <KpiCard title="Users" value={stats.users} />
            <KpiCard title="Products" value={stats.products} />
          </View>
        )}


        <Text className="text-lg font-bold text-slate-900 mb-4 mt-4">Performance Insights</Text>

        <View className="gap-y-6 pb-10">
          {loading ? (
            <ChartsSkeleton />
          ) : showCharts ? (
            <>
              <ChartSection title="Weekly Sales (Last 7 Days)" data={weeklyData} />
              <ChartSection title="Monthly Growth (Last 6 Months)" data={monthlyData} />
              <ChartSection title="Yearly Revenue" data={yearlyData} />


            </>
          ) : (
            <ActivityIndicator size="large" color="#6366f1" />
          )}
        </View>

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
        fromZero
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
  { label: "Sanjeevini Products", to: "/(admin)/Products", icon: <PackageSearch size={14} color="white" />, color: "bg-blue-500" },
  { label: "Add New Product", to: "/(admin)/AddProducts", icon: <PlusCircle size={14} color="white" />, color: "bg-pink-500" },
  { label: "All Orders", to: "/(admin)/Orders", icon: <ShoppingBag size={14} color="white" />, color: "bg-orange-500" },
  { label: "Sanjeevini Users", to: "/(admin)/Users", icon: <Users size={14} color="white" />, color: "bg-indigo-500" },
];

export default AdminDashboard;


const StatsSkeleton = () => (
  <View className="flex-row flex-wrap justify-between mb-2 bg-white border border-slate-100">
    {[1, 2, 3, 4].map(i => (
      <View key={i} style={{ width: '50%' }} className="p-5 border border-slate-50">
        <View className="h-2 w-12 bg-slate-100 rounded mb-2" />
        <View className="h-6 w-20 bg-slate-200 rounded" />
      </View>
    ))}
  </View>
);

const ChartsSkeleton = () => (
  <View className="gap-y-6">
    {[1, 2, 3].map(i => (
      <View key={i} className="bg-white p-5 border border-slate-100 h-52 items-center justify-center">
        <View className="w-full h-32 bg-slate-50 rounded-xl" />
        <View className="flex-row justify-between w-full mt-4 px-2">
          {[1, 2, 3, 4, 5].map(j => (
            <View key={j} className="h-2 w-8 bg-slate-100" />
          ))}
        </View>
      </View>
    ))}
  </View>
);
