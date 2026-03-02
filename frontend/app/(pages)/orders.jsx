import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler
} from "react-native";
import axios from "axios";
import { Package, CreditCard, Clock, ChevronDown, ChevronUp } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";


const OrderSkeleton = () => (
  <View className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white mb-6 p-4">
    <View className="h-4 w-32 bg-slate-100 rounded mb-4" />
    <View className="h-20 bg-slate-50 rounded-xl w-full mb-4" />
    <View className="flex-row justify-between">
      <View className="h-4 w-24 bg-slate-100 rounded" />
      <View className="h-8 w-20 bg-slate-100 rounded-lg" />
    </View>
  </View>
);

export default function ShowUserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL

  useEffect(() => {
    fetchOrders();
    
    const backAction = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);


  const fetchOrders = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${BASE_URL}/api/order/getuserorder`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) setOrders(res.data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, []);


  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };


  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this order? This process is irreversible.",
      [
        { text: "Back", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const res = await axios.post(`${BASE_URL}/api/order/cancelorder/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.data.success) {
                setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
              }
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Failed to cancel");
            }
          }
        }
      ]
    );
  };


  const canCancel = (createdAt) => {
    const diff = (new Date() - new Date(createdAt)) / (1000 * 60 * 60);
    return diff <= 48;
  };
  const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
  const cancelledSteps = ["Pending", "Cancelled"];

  const getStatusStep = (status) => {
    const statusMap = { "Pending": 0, "Confirmed": 1, "Shipped": 2, "Delivered": 3, "Cancelled": 1 };
    return statusMap[status] ?? 0;
  };

  if (loading) {
    return (
      <ScrollView className="flex-1 bg-white p-4 pt-12">
        {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-14 pb-6">
        <Text className="text-3xl font-black text-slate-900 tracking-tighter">My Purchases</Text>
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Order History</Text>
      </View>

      {orders.length === 0 ? (
        <View className="items-center justify-center py-20 px-10">
          <View className="bg-slate-50 p-10 rounded-full mb-4">
            <Package size={40} color="#cbd5e1" />
          </View>
          <Text className="text-slate-400 font-bold text-center uppercase tracking-widest text-xs">No orders found</Text>
        </View>
      ) : (
        <View className="px-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders[order._id];
            const currentStepIdx = getStatusStep(order.status);
            const activeSteps = order.status === "Cancelled" ? cancelledSteps : steps;

            return (
              <View key={order._id} className="bg-white border border-slate-100 rounded-3xl mb-6 overflow-hidden shadow-sm">
                {/* Header */}
                <View className="bg-slate-50/50 px-5 py-4 flex-row justify-between items-center border-b border-slate-100">
                  <View>
                    <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ordered on</Text>
                    <Text className="text-xs font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('en-GB')}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-3 py-1 rounded-full border flex-row items-center ${order.status === 'Delivered' ? 'bg-emerald-50 border-emerald-100' :
                        order.status === 'Cancelled' ? 'bg-slate-100 border-slate-200' : 'bg-pink-50 border-pink-100'
                      }`}>
                      <Text className={`text-[10px] font-black uppercase ${order.status === 'Delivered' ? 'text-emerald-700' :
                          order.status === 'Cancelled' ? 'text-slate-500' : 'text-pink-600'
                        }`}>{order.status}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleOrderDetails(order._id)}>
                      {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content */}
                <View className="p-5">
                  {order.products.map((item, idx) => (
                    <View key={idx} className="flex-row items-center mb-4 gap-4">
                      <Image
                        source={{ uri: item.productId?.productImg?.[0]?.url }}
                        className="w-12 h-12 rounded-xl bg-slate-50"
                        resizeMode="contain"
                      />
                      <View className="flex-1">
                        <Text numberOfLines={1} className="text-sm font-bold text-slate-900">{item.productId?.productName}</Text>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity}</Text>
                      </View>
                      <Text className="text-sm font-black text-slate-900">₹{(item.productId?.productPrice * item.quantity).toLocaleString()}</Text>
                    </View>
                  ))}

                  {/* Expanded View: Total and Stepper */}
                  {isExpanded && (
                    <View className="mt-4 pt-4 border-t border-slate-50">
                      <View className="bg-slate-50 p-4 rounded-2xl flex-row justify-between items-center mb-6">
                        <View>
                          <Text className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Total Amount</Text>
                          <Text className="text-xl font-black text-slate-900">₹ {order.amount?.toLocaleString()}</Text>
                        </View>
                        <CreditCard size={20} color="#0f172a" />
                      </View>

                      {/* Stepper Progress */}
                      <View className="py-6 px-2">
                        <View className="relative flex-row justify-between items-center">
                          {/* Progress Line Background */}
                          <View className="absolute top-[7px] left-0 right-0 h-[2px] bg-slate-100 rounded-full" />
                          {/* Active Progress Line */}
                          <View
                            style={{
                              width: `${(currentStepIdx / (activeSteps.length - 1)) * 100}%`,
                              backgroundColor: order.status === "Cancelled" ? "#ef4444" : "#10b981"
                            }}
                            className="absolute top-[7px] left-0 h-[2px] rounded-full"
                          />

                          {activeSteps.map((step, index) => (
                            <View key={index} className="items-center z-10">
                              <View className={`w-3.5 h-3.5 rounded-full border-2 bg-white ${index <= currentStepIdx ? (order.status === "Cancelled" ? "border-red-500" : "border-emerald-500") : "border-slate-200"
                                }`} />
                              <Text className={`text-[8px] font-black uppercase mt-2 ${index <= currentStepIdx ? "text-slate-900" : "text-slate-300"}`}>
                                {step}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Cancel Button */}
                      {order.status !== "Cancelled" && order.status !== "Delivered" && (
                        <View className="mt-6">
                          <View className="flex-row items-center gap-2 mb-3">
                            <Clock size={12} color="#f472b6" />
                            <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {canCancel(order.createdAt) ? "Cancellation window active" : "Window expired"}
                            </Text>
                          </View>
                          {canCancel(order.createdAt) && (
                            <TouchableOpacity
                              onPress={() => handleCancelOrder(order._id)}
                              className="w-full border-2 border-red-50 py-3 rounded-2xl items-center"
                            >
                              <Text className="text-red-500 font-black uppercase text-xs tracking-widest">Cancel Order</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}