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
import { Package, CreditCard, Clock, ChevronDown, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from "expo-constants";
import FallbackImage from "../../assets/Product Doesnt Exist.webp";

export default function ShowUserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  // const BASE_URL = Constants.expoConfig.extra.apiUrl;
  const BASE_URL = "http://10.44.217.102:8000"

  useEffect(() => {
    fetchOrders();
    const backAction = () => {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
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

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this order?",
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
      <View className="flex-1 bg-white">
        <View className="px-6 pt-14 pb-6">
          <View className="h-9 w-48 bg-slate-200 rounded-lg mb-2" />
          <View className="h-3 w-24 bg-slate-100 rounded" />
        </View>
        <ScrollView className="flex-1">
          {[1, 2, 3].map((i) => (
            <OrderSkeleton key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-14 pb-6">
        <Text className="text-3xl font-black text-slate-900 tracking-tighter">My Purchases</Text>
        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-1">Order History</Text>
      </View>

      {orders.length === 0 ? (
        <View className="items-center justify-center py-20 px-10">
          <Package size={48} color="#f1f5f9" />
          <Text className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-[10px]">No orders found</Text>
        </View>
      ) : (
        <View className="px-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders[order._id];
            const currentStepIdx = getStatusStep(order.status);
            const activeSteps = order.status === "Cancelled" ? cancelledSteps : steps;

            return (
              <View key={order._id} className="bg-white border border-slate-300 rounded-md mb-6 overflow-hidden shadow-sm">
                <View className="px-6 py-5 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ordered on</Text>
                    <Text className="text-sm font-bold text-slate-800">{new Date(order.createdAt).toLocaleDateString('en-GB')}</Text>
                  </View>
                  <View className={`px-3 py-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-50' :
                    order.status === 'Cancelled' ? 'bg-slate-50' : 'bg-pink-50'
                    }`}>
                    <Text className={`text-[10px] font-black uppercase ${order.status === 'Delivered' ? 'text-emerald-600' :
                      order.status === 'Cancelled' ? 'text-slate-400' : 'text-pink-500'
                      }`}>{order.status}</Text>
                  </View>
                </View>

                <View className="px-6 pb-2">
                  {order.products.map((item, idx) => (
                    <View key={idx} className="flex-row items-center mb-4 gap-4">
                      <TouchableOpacity
                        onPress={() => {
                          if (item?.productId?._id) {
                            router.push(`/product/${item.productId._id}`);
                          } else {
                            Alert.alert("Product not available", "This product no longer exists.");
                          }
                        }}
                      >
                        <Image
                          source={
                            item?.productId?.productImg?.[0]?.url
                              ? { uri: item.productId.productImg[0].url }
                              : FallbackImage
                          }
                          className="w-14 h-14 rounded-md bg-slate-50 border border-slate-100"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>

                      <View className="flex-1">
                        <Text numberOfLines={1} className="text-sm font-bold text-slate-900">{item.productId?.productName}</Text>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Quantity: {item.quantity}</Text>
                      </View>
                      <Text className="text-sm font-black text-slate-900">₹{(item.productId?.productPrice * item.quantity).toLocaleString()}</Text>

                    </View>
                  ))}

                  {order.status !== "Cancelled" && (
                    <View className="mt-2 mb-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex-row items-center">

                      <View className="flex-1">
                        <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.15em] mb-1">
                          {order.status === "Delivered" ? "Success" : "Delivery Information"}
                        </Text>

                        <View className="flex-row items-baseline">
                          <Text className="text-slate-900 font-black text-lg">
                            {order.status === "Delivered" ? "Delivered on " : "Arriving by "}
                          </Text>
                          <Text className="text-emerald-600 font-black text-lg">
                            {new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>

                        {order.status !== "Delivered" && (
                          <Text className="text-slate-500 text-[10px] font-medium mt-1">
                            Your order is being processed and will reach you within 5 days of the purchase date.
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {!isExpanded && (
                  <TouchableOpacity
                    onPress={() => toggleOrderDetails(order._id)}
                    className="mx-6 mb-6 py-4 bg-slate-100 rounded-md flex-row justify-center items-center"
                  >
                    <Text className="text-slate-600 font-bold text-xs uppercase tracking-widest mr-2" numberOfLines={1}>View Details</Text>
                    <ChevronDown size={14} color="#64748b" />
                  </TouchableOpacity>
                )}

                {isExpanded && (
                  <View className="px-6 pb-6">
                    <View className="pt-4 border-t border-slate-50">

                      <View className="bg-slate-900 p-6 rounded-md mb-6 shadow-2xl border border-slate-800">
                        <View className="mb-4">
                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-slate-400 text-xs font-semibold tracking-wide" numberOfLines={1}>Subtotal</Text>
                            <Text className="text-slate-200 font-bold text-sm" numberOfLines={1}>
                              ₹ {order.subtotal?.toLocaleString() || "0"}
                            </Text>
                          </View>

                          <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-slate-400 text-xs font-semibold tracking-wide" numberOfLines={1}>Tax </Text>
                            <Text className="text-slate-200 font-bold text-sm" numberOfLines={1}>
                              ₹ {order.tax?.toLocaleString() || "0"}
                            </Text>
                          </View>

                          <View className="flex-row justify-between items-center">
                            <Text className="text-slate-400 text-xs font-semibold tracking-wide" numberOfLines={1}>Shipping</Text>
                            {order.shipping === 0 || !order.shipping ? (
                              <View className="bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                <Text className="text-emerald-400 font-black uppercase text-[10px]" numberOfLines={1}>Free</Text>
                              </View>
                            ) : (
                              <Text className="text-slate-200 font-bold text-sm" numberOfLines={1}>₹ {order.shipping.toLocaleString()}</Text>
                            )}
                          </View>
                        </View>
                        <View className="h-[1px] bg-slate-800/60 w-full mb-5" />
                        <View className="flex-row justify-between items-center">
                          <Text className="text-[10px] font-black text-indigo-400 uppercase tracking-[2px] mb-1">
                            Grand Total
                          </Text>
                          <Text className="text-3xl font-black text-white tracking-tighter">
                            ₹ {order.amount?.toLocaleString() || "0"}
                          </Text>
                        </View>
                      </View>


                      <View className="py-4 px-2">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Progress</Text>
                        {activeSteps.map((step, index) => {
                          const isCompleted = index < currentStepIdx;
                          const isCurrent = index === currentStepIdx;
                          const isLast = index === activeSteps.length - 1;
                          const isCancelled = order.status === "Cancelled";
                          const activeColor = isCancelled ? "#ef4444" : "#10b981";
                          const inactiveColor = "#f1f5f9";

                          return (
                            <View key={index} className="flex-row items-start">
                              <View className="items-center mr-4">
                                <View className={`w-[2px] h-3 ${index === 0 ? 'bg-transparent' : (index <= currentStepIdx ? (isCancelled ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-100')}`} />
                                <View
                                  style={{ borderColor: index <= currentStepIdx ? activeColor : '#e2e8f0' }}
                                  className={`w-5 h-5 rounded-full border-2 bg-white items-center justify-center z-10`}
                                >
                                  {(isCompleted || (isCurrent && !isCancelled)) && (
                                    <View style={{ backgroundColor: activeColor }} className="w-2 h-2 rounded-full" />
                                  )}
                                  {isCurrent && isCancelled && (
                                    <View className="bg-red-500 w-2.5 h-[2px] rotate-45 absolute" />
                                  )}
                                </View>
                                {!isLast && (
                                  <View className={`w-[2px] h-10 ${index < currentStepIdx ? (isCancelled ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-100'}`} />
                                )}
                              </View>

                              <View className="pt-0.5">
                                <Text className={`text-[11px] font-black uppercase tracking-tight ${index <= currentStepIdx ? 'text-slate-900' : 'text-slate-300'}`}>
                                  {step}
                                </Text>
                                {isCurrent && (
                                  <Text className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    {isCancelled ? "Order was stopped" : "Current Status"}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                      <View className="gap-y-3 mt-4">
                        {(order.status !== "Cancelled" && order.status !== "Delivered") && (
                          <View className="flex-row items-center gap-2 px-1 mb-1">
                            <Clock size={14} color="#ec4899" />
                            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider leading-tight flex-1">
                              {canCancel(order.createdAt)
                                ? "Cancellation valid up to 48 hours"
                                : "Cancellation window has expired"}
                            </Text>
                          </View>
                        )}

                        {order.status !== "Cancelled" && order.status !== "Delivered" && canCancel(order.createdAt) ? (
                          <TouchableOpacity
                            onPress={() => handleCancelOrder(order._id)}
                            className="w-full bg-red-50 py-4 rounded-2xl items-center"
                          >
                            <Text className="text-red-500 font-black uppercase text-[10px] tracking-widest">
                              Cancel Order
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                          onPress={() => toggleOrderDetails(order._id)}
                          className="w-full bg-slate-100 py-4 rounded-2xl items-center"
                        >
                          <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            Show Less
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}


const OrderSkeleton = () => (
  <View className="bg-white border border-slate-200 rounded-md mb-6 overflow-hidden shadow-sm mx-4">
    <View className="px-6 py-5 flex-row justify-between items-center">
      <View>
        <View className="h-2 w-16 bg-slate-100 rounded mb-2" />
        <View className="h-4 w-24 bg-slate-200 rounded" />
      </View>
      <View className="h-7 w-20 bg-slate-100 rounded-full" />
    </View>

    <View className="px-6 pb-2">
      <View className="flex-row items-center mb-4 gap-4">
        <View className="w-14 h-14 rounded-md bg-slate-100 border border-slate-50" />
        <View className="flex-1">
          <View className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
          <View className="h-2 w-20 bg-slate-100 rounded" />
        </View>
        <View className="h-4 w-12 bg-slate-200 rounded" />
      </View>
    </View>

    <View className="mx-6 mb-6 py-4 bg-slate-50 rounded-md items-center justify-center">
      <View className="h-3 w-24 bg-slate-200 rounded" />
    </View>
  </View>
);
