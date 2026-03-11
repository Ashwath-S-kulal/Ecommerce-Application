import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../redux/userSlice';
import axios from 'axios';
import { Camera, User, MapPin, Phone, Mail, Save, X, LogOut, Box, Heart, Ticket, Headphones, AmpersandIcon, LayoutDashboard, MailCheckIcon, ChevronRight, Edit3, Hash, Navigation, ImageUp } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Constants from "expo-constants";
import ImageViewing from "react-native-image-viewing";
import { setCart, setNotifications, setSelectedAddress, setWishlist } from '../../redux/productSlice';


const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function Profile() {
  const { user } = useSelector(store => store.user);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isEditing, setIsEditing] = useState(false);
  const [updateUser, setUpdateUser] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNo: user?.phoneNo || "",
    address: user?.address || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    profilePic: user?.profilePic || "",
    role: user?.role || "Member"
  });

  const [file, setFile] = useState(null);

  const [visible, setIsVisible] = useState(false);

  const images = [
    { uri: file ? file.uri : updateUser.profilePic }
  ];


  const fetchUserProfile = useCallback(async () => {
    if (!user?._id) return;
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${BASE_URL}/api/user/getuserbyid/${user._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        dispatch(setUser(res.data.user));
      }
    } catch (e) {
      console.error("Failed to fetch fresh user profile", e);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );



  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("accessToken");
              dispatch(setUser(null));
              dispatch(setCart({ items: [], totalPrice: 0 }));
              dispatch(setWishlist({ items: [] }));
              dispatch(setNotifications([]));
              dispatch(setSelectedAddress(null));
              router.replace("/(auth)/login");
            } catch (e) {
              console.error("Logout Error", e);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (toastMsg) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => setToastMsg(""));
    }
  }, [toastMsg]);


  const handleFileChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera roll access is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setFile({
        uri: selectedAsset.uri,
        name: `profile_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setUpdateUser({ ...updateUser, profilePic: selectedAsset.uri });
    }
  };

  const removeImage = () => {
    setFile(null);
    setUpdateUser({ ...updateUser, profilePic: user?.profilePic || "" });
  };

  const handleSubmit = async () => {
    if (!updateUser.firstName || !updateUser.lastName) {
      return Toast.show({ type: 'error', text1: 'Name is required' });
    }

    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("firstName", updateUser.firstName);
      formData.append("lastName", updateUser.lastName);
      formData.append("address", updateUser.address);
      formData.append("city", updateUser.city);
      formData.append("zipCode", updateUser.zipCode);
      formData.append("phoneNo", updateUser.phoneNo);
      formData.append("role", updateUser.role);

      if (file) {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: 'image/jpeg',
        });
      }

      const res = await axios.put(`${BASE_URL}/api/user/updateuser/${user._id}`, formData, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        setFile(null);
        setIsVisible(false);
        setToastMsg("PROFILE UPDATED");
      }
    } catch (error) {
      console.log("Upload Error:", error.response?.data || error.message);
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setLoading(false);
      setIsEditing(false)
    }
  };


  const ProfileViewerFooter = ({ file, handleFileChange, handleSubmit, loading, removeImage }) => (
    <View className="absolute bottom-10 left-6 right-6">
      <View className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-3xl shadow-2xl">
        {file ? (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={removeImage}
              className="flex-1 bg-white/20 py-4 rounded-2xl items-center active:opacity-70"
            >
              <Text className="text-white font-bold tracking-wide">Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30 active:opacity-90"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold tracking-wide">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleFileChange}
            className="bg-white py-4 rounded-2xl items-center shadow-lg active:scale-[0.98] transition-transform"
          >
            <Text className="text-slate-900 font-bold tracking-wide uppercase text-xs" numberOfLines={1}>Update Profile Picture</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );


  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" || "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <ScrollView className="px-4">
            <View className=" rounded-md p-5 mt-6">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center flex-1">
                  <View className="relative">
                    <View className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-100 shadow-xl">
                      <TouchableOpacity onPress={() => setIsVisible(true)}>
                        <Image
                          source={{ uri: updateUser.profilePic || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png" }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>

                      <ImageViewing
                        images={[{ uri: file ? file.uri : updateUser.profilePic }]}
                        visible={visible}
                        onRequestClose={() => {
                          setIsVisible(false);
                          if (!loading) {
                            removeImage();
                          }
                        }}
                        FooterComponent={() => (
                          <ProfileViewerFooter
                            file={file}
                            handleFileChange={handleFileChange}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            removeImage={removeImage}
                          />
                        )}
                      />
                    </View>
                  </View>


                  <View className="ml-4 flex-shrink">
                    <Text className="text-xl font-black text-slate-900 leading-tight" numberOfLines={1}>
                      {updateUser.firstName || 'User'}{" "}{updateUser.lastName || ' '}
                    </Text>
                    <Text className="text-pink-500  font-medium">Manage Your Profile</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleLogout}
                  className="p-2.5 bg-rose-50 rounded-md border border-red-600 flex-row gap-2 items-center justify-center active:opacity-80"
                >
                  <Text className="text-red-600 font-semibold">Logout</Text><LogOut size={16} color="#F43F5E" className="font-semibold" />
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap justify-between gap-y-3">
                <TouchableOpacity
                  onPress={() => router.push('/orders')}
                  className="w-[48%] flex-row items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm"
                >
                  <Box size={20} color="#2563eb" />
                  <Text className="ml-3 font-bold text-slate-800">Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/help')}
                  className="w-[48%] flex-row items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm"
                >
                  <Headphones size={20} color="#2563eb" />
                  <Text className="ml-3 font-bold text-slate-800">Help Center</Text>
                </TouchableOpacity>

                {user?.role === "admin" && (
                  <TouchableOpacity
                    className="w-full flex-row items-center justify-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm"
                    onPress={() => router.push("/(admin)/Dashboard")}
                  >
                    <LayoutDashboard size={20} color="#2563eb" />
                    <Text className="text-black font-bold text-center ml-3">Go to Admin Panel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>


            <View className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10">
              <View className="flex-row justify-between items-center mb-8">
                <Text className="text-lg font-black text-slate-900">Profile Details</Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(!isEditing)}
                  activeOpacity={0.7}
                  className={`flex-row items-center px-4 py-2.5 rounded-md border ${isEditing
                    ? 'bg-rose-50 border-rose-100'
                    : 'bg-indigo-50 border-indigo-100'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <X size={16} color="#ef4444" />
                      <Text className="ml-2 font-black text-[12px] text-rose-600 uppercase tracking-tight">
                        Cancel
                      </Text>
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} color="#4f46e5" />
                      <Text className="ml-2 font-black text-[12px] text-indigo-600 uppercase tracking-tight">
                        Edit Profile
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View className="gap-y-4">
                  <View className="bg-white p-3 rounded-xl border-t border-slate-100 mb-5">

                    <View className="flex-row gap-x-3 mb-4">
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1.5">First Name</Text>
                        <TextInput
                          value={updateUser.firstName}
                          onChangeText={(val) => setUpdateUser({ ...updateUser, firstName: val })}
                          className="bg-slate-50 p-4 rounded-xl font-semibold text-slate-900"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 mb-1.5">Last Name</Text>
                        <TextInput
                          value={updateUser.lastName}
                          onChangeText={(val) => setUpdateUser({ ...updateUser, lastName: val })}
                          className="bg-slate-50 p-4 rounded-xl font-semibold text-slate-900"
                        />
                      </View>
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold text-slate-400 mb-1.5">Phone</Text>
                      <View className="bg-slate-50 p-4 py-2 rounded-xl flex-row items-center">
                        <Phone size={16} color="#cbd5e1" />
                        <TextInput
                          placeholder="phone number"
                          placeholderTextColor="#bacae0"
                          value={updateUser.phoneNo}
                          keyboardType="phone-pad"
                          onChangeText={(val) => setUpdateUser({ ...updateUser, phoneNo: val })}
                          className="ml-3 flex-1 font-semibold text-slate-900"
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-[10px] font-bold text-slate-400 mb-1.5 mt-3">Email</Text>
                      <View className="bg-slate-50 p-4 py-2 rounded-xl flex-row items-center">
                        <MailCheckIcon size={16} color="#cbd5e1" />
                        <TextInput
                          value={updateUser.email}
                          className="ml-3 flex-1 font-semibold text-slate-400"
                          editable={false}
                        />
                      </View>
                    </View>

                    <View className="flex-row items-center mb-5 mt-10 border-b border-slate-50 pb-3">
                      <MapPin size={16} color="#94a3b8" />
                      <Text className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Location</Text>
                    </View>
                    <TextInput
                      placeholder="Street Address"
                      placeholderTextColor="#bacae0"
                      value={updateUser.address}
                      onChangeText={(val) => setUpdateUser({ ...updateUser, address: val })}
                      className="bg-slate-50 p-4 rounded-xl font-semibold text-slate-900 mb-4"
                    />
                    <View className="flex-row gap-x-3">
                      <TextInput
                        placeholder="City"
                        placeholderTextColor="#bacae0"
                        value={updateUser.city}
                        onChangeText={(val) => setUpdateUser({ ...updateUser, city: val })}
                        className="flex-1 bg-slate-50 p-4 rounded-xl font-semibold text-slate-900"
                      />
                      <TextInput
                        placeholder="Zip Code"
                        placeholderTextColor="#bacae0"
                        value={updateUser.zipCode}
                        onChangeText={(val) => setUpdateUser({ ...updateUser, zipCode: val })}
                        keyboardType="numeric"
                        className="flex-1 bg-slate-50 p-4 rounded-xl font-semibold text-slate-900"
                      />
                    </View>

                    <TouchableOpacity
                      disabled={loading}
                      onPress={handleSubmit}
                      className="flex-[2] bg-slate-900 py-4 px-8 rounded-xl flex-row items-center justify-center mt-10 w-40 self-end active:opacity-80"
                    >
                      {loading ? <ActivityIndicator size="small" color="white" /> : <Save size={16} color="white" />}
                      <Text className="text-white font-bold ml-2">{loading ? "Updating..." : "Save Changes"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              ) : (
                <View>
                  <DisplayField label="First Name" value={user?.firstName} icon={User} />
                  <DisplayField label="Last Name" value={user?.lastName} icon={User} />
                  <DisplayField label="Contact Number" value={user?.phoneNo} icon={Phone} />
                  <DisplayField label="Email Address" value={user?.email} icon={MailCheckIcon} />
                  <DisplayField label="Residential Address" value={user?.address} icon={MapPin} />
                  <DisplayField label="City" value={`${user?.city || ''}`} icon={Navigation} />
                  <DisplayField label="Zip" value={`${user?.zipCode || ''}`} icon={Hash} />
                </View>
              )}
            </View>

            {toastMsg ? (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                }}
                className="absolute bottom-24 self-center bg-black/80 px-6 py-3 rounded-full shadow-lg"
              >
                <Text className="text-white font-bold text-xs tracking-widest">{toastMsg}</Text>
              </Animated.View>
            ) : null}
          </ScrollView>

        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const DisplayField = ({ label, value, icon: Icon }) => (
  <View className="flex-row items-center p-4 py-3 bg-white rounded-2xl border border-slate-100 mb-3 shadow-sm shadow-slate-200">
    <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center">
      <Icon size={18} color="#4f46e5" />
    </View>
    <View className="ml-4 flex-1">
      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </Text>
      <Text
        className={`text-[15px] ${value ? 'font-bold text-slate-800' : 'font-normal text-[9.9px] text-slate-400 italic'}`}
      >
        {value || "Not provided"}
      </Text>
    </View>
  </View>
);


