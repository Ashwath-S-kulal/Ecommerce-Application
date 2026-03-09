import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    Alert,
    Dimensions,
    Animated,
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
    MapPin,
    Trash2,
    Plus,
    ArrowRight,
    Home,
    ShoppingBag,
    Edit2,
    Package,
    Minus,
} from "lucide-react-native";
import { deleteAddress, setSelectedAddress, setAddresses } from "@/redux/productSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

export default function AddressForm() {
    const { productId, buyNow } = useLocalSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();
    const BASE_URL = Constants.expoConfig.extra.apiUrl;
    const { cart, addresses, selectedAddress, products } = useSelector((store) => store.product);
    const { user } = useSelector((store) => store.user);
    const [formData, setFormData] = useState({
        fullName: "", phone: "", email: "", street: "",
        city: "", state: "", zip: "", country: "",
    });
    const [quantities, setQuantities] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [token, setToken] = useState(null);
    const [toastMsg, setToastMsg] = useState("");
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [deletingId, setDeletingId] = useState(null);



    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const updateQty = (id, delta) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };



    // 1. DETERMINE CHECKOUT ITEMS
    const checkoutItems = useMemo(() => {
        let baseItems = [];
        if (buyNow === "true" && productId) {
            const singleProduct = products?.find((p) => p._id === productId);
            if (singleProduct) baseItems = [{ productId: singleProduct }];
        } else {
            baseItems = cart?.items || [];
        }

        return baseItems.map(item => ({
            ...item,
            quantity: quantities[item.productId._id] || item.quantity || 1
        }));
    }, [buyNow, productId, cart, products, quantities]);






    // 2. CALCULATE PRICING
    const subTotal = useMemo(() => {
        return checkoutItems.reduce((acc, item) => {
            return acc + (item.productId?.productPrice * item.quantity);
        }, 0);
    }, [checkoutItems]);

    const shipping = subTotal > 5000 || subTotal === 0 ? 0 : 50;
    const total = subTotal + shipping;
    const tax = 0;


    const handleEditClick = (addr) => {
        setEditingId(addr._id);
        setFormData(addr);
        setShowForm(true);
    };


    // 3. TOAST & INITIAL LOAD
    const showToast = (text) => {
        setToastMsg(text);
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(1500),
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToastMsg(""));
    };




    useEffect(() => {
        const loadData = async () => {
            const storedToken = await AsyncStorage.getItem("accessToken");
            if (storedToken) {
                setToken(storedToken);
                fetchAddresses(storedToken);
            } else {
                setFetching(false);
            }
        };
        loadData();
    }, []);




    const fetchAddresses = async (authToken) => {
        try {
            setFetching(true);
            const res = await axios.get(`${BASE_URL}/api/address/get`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.data.success) {
                dispatch(setAddresses(res.data.addresses));
                if (res.data.addresses.length === 0) setShowForm(true);
            }
        } catch (error) {
            console.error("Fetch Error:", error.message);
        } finally {
            setFetching(false);
        }
    };



    // 4. ADDRESS ACTIONS
    const handleSave = async () => {
        if (!token) return Alert.alert("Error", "Please login again.");
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingId) {
                const res = await axios.put(`${BASE_URL}/api/address/update/${editingId}`, formData, config);
                if (res.data.success) showToast("Address updated");
            } else {
                const res = await axios.post(`${BASE_URL}/api/address/add`, formData, config);
                if (res.data.success) showToast("Address saved");
            }
            fetchAddresses(token);
            resetForm();
        } catch (error) {
            showToast("Failed to save address");
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async (addressId) => {
        setDeletingId(addressId); // Set the specific ID being deleted
        try {
            const res = await axios.delete(`${BASE_URL}/api/address/remove/${addressId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                dispatch(deleteAddress(addressId));
                showToast("Address removed");
                fetchAddresses(token);
            }
        } catch (error) {
            showToast("Delete failed");
        } finally {
            setDeletingId(null); // Reset
        }
    };



    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ fullName: "", phone: "", email: "", street: "", city: "", state: "", zip: "", country: "" });
    };


    // 5. CHECKOUT ACTIONS
    const handleCheckoutTrigger = () => {
        if (!selectedAddress) return showToast("Please select an address");
        setIsConfirmOpen(true);
    };



    const handleFinalCheckout = async () => {
        setLoading(true);
        const selectedObj = addresses.find(a => a._id === selectedAddress);
        const orderData = {
            products: checkoutItems.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
            })),
            address: selectedObj,
            totalAmount: total,
        };

        try {
            const res = await axios.post(`${BASE_URL}/api/order/create`, orderData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
                setIsConfirmOpen(false);
                router.replace({ pathname: "./OrderSuccess", params: { id: res.data.order._id } });
            }
        } catch (error) {
            Alert.alert("Order Failed", error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };


    if (fetching) {
        return (
            <View className="flex-1 justify-center items-center bg-[#f8fafc]">
                <ActivityIndicator size="large" color="#0f172a" />
            </View>
        );
    }


    return (
        <SafeAreaView className="flex-1 bg-[#f8fafc]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "android" || "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 5}}>

                        {/* Header */}
                        <View className="mb-6 items-center">
                            <Text className="text-2xl font-[900] text-[#0f172a]" numberOfLines={1}>
                                Checkout <Text className="text-[#ec4899] italic font-serif">Process</Text>
                            </Text>
                            <Text className="text-[12px] text-[#64748b] mt-1">Complete your order by providing delivery details</Text>
                        </View>

                        {/* PRODUCT SUMMARY SECTION */}
                        <View className="bg-white rounded-md border border-[#e2e8f0] mb-5 overflow-hidden">
                            <View className="bg-[#f8fafc] p-4 border-b border-[#f1f5f9] flex-row justify-between items-center">
                                <Text className="text-[12px] font-[900] text-[#64748b] tracking-[1px]">Your Selected Item</Text>
                                <Package size={14} color="#64748b" />
                            </View>
                            <View className="p-4">
                                {checkoutItems.map((item, index) => (
                                    <View key={index} className="flex-row items-center mb-6 last:mb-0">
                                        <View className="w-16 h-16 bg-gray-50 rounded-md border border-gray-100 items-center justify-center">
                                            <Image source={{ uri: item.productId?.productImg?.[0]?.url }} className="w-12 h-12" resizeMode="contain" />
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-sm font-bold text-[#0f172a]" numberOfLines={1}>{item.productId?.productName}</Text>
                                            <Text className="text-xs text-[#64748b] mb-2">₹{item.productId?.productPrice?.toLocaleString()}</Text>

                                            {/* Quantity Selector */}
                                            <View className="flex-row items-center bg-gray-50 self-start rounded-md border border-gray-200">
                                                <TouchableOpacity onPress={() => updateQty(item.productId._id, -1)} className="p-2">
                                                    <Minus size={16} color="#0f172a" />
                                                </TouchableOpacity>
                                                <Text className="px-3 font-bold text-md">{item.quantity}</Text>
                                                <TouchableOpacity onPress={() => updateQty(item.productId._id, 1)} className="p-2 ">
                                                    <Plus size={16} color="#0f172a" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <Text className="font-bold text-[#0f172a]">₹{(item.productId?.productPrice * item.quantity).toLocaleString()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* ORDER TOTALS */}
                        <View className="bg-white rounded-md border border-[#e2e8f0] mb-5 p-5">
                            <SummaryRow label="Subtotal" value={`₹${subTotal.toLocaleString()}`} />
                            <SummaryRow label="Shipping Fee" value={shipping === 0 ? "FREE" : `₹${shipping}`} valueStyle={shipping === 0 ? "text-green-600" : "text-[#0f172a]"} />
                            <SummaryRow label="Tax" value={`₹${tax.toLocaleString()}`} valueStyle="text-[#0f172a]" />
                            <View className="h-[1px] bg-[#f1f5f9] my-3" />
                            <View className="flex-row justify-between items-center">
                                <Text className="text-base font-bold" numberOfLines={1}>Total Amount</Text>
                                <Text className="text-2xl font-[900] text-[#0f172a]">₹{total.toLocaleString()}</Text>
                            </View>
                        </View>

                        {/* ADDRESS SECTION */}
                        <View>
                            {showForm ? (
                                <View className="bg-white p-5 rounded-md border border-[#e2e8f0]">
                                    <Text className="text-[18px] font-bold mb-5 text-[#1e293b]">
                                        {editingId ? "Edit Address" : "New Delivery Address"}
                                    </Text>

                                    <CustomInput label="Full Name" value={formData.fullName} onChangeText={(v) => handleChange("fullName", v)} placeholder="Ex: John Doe" />
                                    <CustomInput label="Phone" value={formData.phone} onChangeText={(v) => handleChange("phone", v)} placeholder="Ex: +91 98765..." keyboardType="phone-pad" />
                                    <CustomInput label="Email" value={formData.email} onChangeText={(v) => handleChange("email", v)} placeholder="Ex: john@example.com" keyboardType="email-address" autoCapitalize="none" />
                                    <CustomInput label="Street Address" value={formData.street} onChangeText={(v) => handleChange("street", v)} placeholder="Apartment, suite, unit, etc." />

                                    <View className="flex-row items-center">
                                        <View className="flex-1 mr-2"><CustomInput label="City" value={formData.city} onChangeText={(v) => handleChange("city", v)} placeholder="City" /></View>
                                        <View className="flex-1"><CustomInput label="State" value={formData.state} onChangeText={(v) => handleChange("state", v)} placeholder="State" /></View>
                                    </View>

                                    <View className="flex-row items-center">
                                        <View className="flex-1 mr-2"><CustomInput label="Zip Code" value={formData.zip} onChangeText={(v) => handleChange("zip", v)} placeholder="Zip" keyboardType="numeric" /></View>
                                        <View className="flex-1"><CustomInput label="Country" value={formData.country} onChangeText={(v) => handleChange("country", v)} placeholder="Country" /></View>
                                    </View>

                                    <View className="mt-2.5">
                                        <TouchableOpacity className="bg-[#0f172a] h-[50px] rounded-[15px] justify-center items-center mb-2.5" onPress={handleSave} disabled={loading}>
                                            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">{editingId ? "Update Address" : "Save Address"}</Text>}
                                        </TouchableOpacity>
                                        <TouchableOpacity className="h-[50px] rounded-[15px] justify-center items-center" onPress={resetForm}>
                                            <Text className="text-[#475569] font-bold">Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    <View className="flex-row justify-between items-center mb-[15px]">
                                        <View className="flex-row items-center">
                                            <Home size={18} color="#ec4899" />
                                            <Text className="text-[18px] font-bold ml-2">Saved Addresses</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowForm(true)} className="flex-row items-center bg-[#fdf2f8] px-3 py-1.5 rounded-full">
                                            <Plus size={16} color="#db2777" />
                                            <Text className="text-[#db2777] font-bold text-[12px] ml-1">Add New</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {addresses.length === 0 ? (
                                        <View className="items-center p-10 border-2 border-dashed border-[#f1f5f9] rounded-[24px]">
                                            <MapPin size={32} color="#cbd5e1" />
                                            <Text className="text-[#94a3b8] mt-2.5">No addresses saved yet</Text>
                                        </View>
                                    ) : (
                                        addresses.map((addr) => (
                                            <TouchableOpacity
                                                key={addr._id}
                                                onPress={() => dispatch(setSelectedAddress(addr._id))}
                                                className={`p-[15px] rounded-xl border-2 mb-4 ${selectedAddress === addr._id
                                                    ? "border-[#ec4899] bg-[#fff1f2]"
                                                    : "border-[#f1f5f9] bg-white"
                                                    }`}
                                            >
                                                <View className="flex-row items-start">
                                                    <View className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center mt-1 ${selectedAddress === addr._id ? "border-[#ec4899] bg-[#ec4899]" : "border-[#cbd5e1]"
                                                        }`}>
                                                        {selectedAddress === addr._id && <View className="w-2 h-2 rounded-full bg-white" />}
                                                    </View>

                                                    <View className="flex-1">
                                                        <Text className={`font-bold text-[16px] ${selectedAddress === addr._id ? "text-[#be185d]" : "text-[#0f172a]"}`}>
                                                            {addr.fullName}
                                                        </Text>
                                                        <Text className="text-[#64748b] text-[12px] mt-0.5">
                                                            {addr.street}, {addr.city}, {addr.state} {addr.zip}
                                                        </Text>
                                                        <Text className="text-[#94a3b8] text-[11px] font-bold mt-1">
                                                            {addr.phone}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100/50 space-x-2">
                                                    <TouchableOpacity
                                                        onPress={() => handleEditClick(addr)}
                                                        className="flex-row items-center bg-white border border-slate-200 px-4 py-2 rounded-sm"
                                                    >
                                                        <Edit2 size={14} color="#64748b" />
                                                        <Text className="text-[#64748b] text-base font-bold ml-2">Edit</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => handleDelete(addr._id)}
                                                        disabled={deletingId !== null}
                                                        className={`flex-row items-center px-4 py-2 rounded-sm ${deletingId === addr._id ? "bg-gray-100" : "bg-red-50"
                                                            }`}
                                                    >
                                                        {deletingId === addr._id ? (
                                                            <ActivityIndicator size="small" color="#ef4444" />
                                                        ) : (
                                                            <>
                                                                <Trash2 size={14} color="#ef4444" />
                                                            </>
                                                        )}
                                                        <Text className="text-red-500 text-base font-bold ml-2">Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    )}

                                    <TouchableOpacity
                                        className={`bg-[#0f172a] h-[55px] rounded-[20px] flex-row justify-center items-center mt-2.5 ${(!selectedAddress || addresses.length === 0) ? "opacity-50" : ""}`}
                                        onPress={handleCheckoutTrigger}
                                        disabled={!selectedAddress || addresses.length === 0}
                                    >
                                        <Text className="text-white font-[900] text-[16px] mr-2.5">Complete Purchase</Text>
                                        <ArrowRight size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* CONFIRMATION MODAL */}
            <Modal visible={isConfirmOpen} transparent animationType="fade">
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View className="w-[90%] bg-white rounded-2xl p-[25px] items-center">
                        <Text className="text-[22px] font-[900] text-[#0f172a]">Confirm Order</Text>
                        <Text className="text-[#64748b] text-center my-2.5 text-[14px] font-bold">
                            Order total:{" "} ₹ <Text className="text-4xl text-[#0f172a] font-bold">{total.toLocaleString()}</Text>
                        </Text>

                        {selectedAddress && (
                            <View className="flex-row bg-[#f8fafc] p-3 rounded-[15px] w-full my-[15px]">
                                <MapPin size={16} color="#94a3b8" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-[10px] text-[#94a3b8] font-bold uppercase">Delivering To:</Text>
                                    <Text className="text-[14px] font-bold">{addresses.find(a => a._id === selectedAddress)?.fullName}</Text>
                                    <Text numberOfLines={1} className="text-[12px] text-[#64748b]">
                                        {addresses.find(a => a._id === selectedAddress)?.street}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View className="flex-row w-full gap-2.5">
                            <TouchableOpacity className="flex-1 h-[50px] justify-center items-center" onPress={() => setIsConfirmOpen(false)}>
                                <Text className="font-bold text-[#64748b]">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-[#ec4899] h-[50px] rounded-[15px] justify-center items-center" onPress={handleFinalCheckout} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Confirm & Buy</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* TOAST */}
            {toastMsg ? (
                <Animated.View style={{ opacity: fadeAnim }} className="absolute bottom-10 self-center bg-black/90 px-6 py-3 rounded-full">
                    <Text className="text-white font-bold text-xs" numberOfLines={1}>{toastMsg}</Text>
                </Animated.View>
            ) : null}
        </SafeAreaView>
    );
}

// Sub-components
const SummaryRow = ({ label, value, valueStyle = "text-[#0f172a]" }) => (
    <View className="flex-row justify-between mb-2">
        <Text className="text-gray-500 text-sm">{label}</Text>
        <Text className={`font-bold ${valueStyle}`}>{value}</Text>
    </View>
);

const CustomInput = ({ label, ...props }) => (
    <View className="mb-4">
        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{label}</Text>
        <TextInput className="border border-gray-200 rounded-xl h-11 px-4 text-[#0f172a] bg-gray-50/50" {...props} />
    </View>
);