import React, { useRef, useState, useEffect } from 'react';
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
import { Camera, User, MapPin, Phone, Mail, Save, X, LogOut, Box, Heart, Ticket, Headphones, AmpersandIcon, LayoutDashboard, MailCheckIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Constants from "expo-constants";
import ImageViewing from "react-native-image-viewing";


const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function Profile() {
  const { user } = useSelector(store => store.user);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const images = updateUser.profilePic
    ? [{ uri: updateUser.profilePic }]
    : [];

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
        setToastMsg("PROFILE UPDATED");
      }
    } catch (error) {
      console.log("Upload Error:", error.response?.data || error.message);
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" || "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <ScrollView className="px-4">
            <View className="bg-white rounded-md p-5 mt-6 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center flex-1">
                  <View className="relative">
                    <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-50 bg-slate-100">
                      <TouchableOpacity onPress={() => setIsVisible(true)}>
                        <Image
                          source={{ uri: updateUser.profilePic || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png" }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <ImageViewing
                        images={images}
                        visible={visible}
                        onRequestClose={() => setIsVisible(false)}
                      />

                    </View>
                    <TouchableOpacity
                      onPress={file ? removeImage : handleFileChange}
                      className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white shadow-sm ${file ? 'bg-red-500' : 'bg-slate-900'}`}
                    >
                      {file ? <X size={12} color="white" /> : <Camera size={14} color="white" />}
                    </TouchableOpacity>
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
            <View className="gap-y-4 mt-5">
              <View className="bg-white p-6 rounded-md border border-slate-100 shadow-sm mb-5">
                <View className="flex-row items-center mb-5 border-b border-slate-50 pb-3">
                  <User size={16} color="#94a3b8" />
                  <Text className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Info</Text>
                </View>
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
                  <View className="bg-slate-50 p-4 rounded-xl flex-row items-center">
                    <Phone size={16} color="#cbd5e1" />
                    <TextInput
                      value={updateUser.phoneNo}
                      keyboardType="phone-pad"
                      onChangeText={(val) => setUpdateUser({ ...updateUser, phoneNo: val })}
                      className="ml-3 flex-1 font-semibold text-slate-900"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[10px] font-bold text-slate-400 mb-1.5 mt-3">Email</Text>
                  <View className="bg-slate-50 p-4 rounded-xl flex-row items-center">
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
                  value={updateUser.address}
                  onChangeText={(val) => setUpdateUser({ ...updateUser, address: val })}
                  className="bg-slate-50 p-4 rounded-xl font-semibold text-slate-900 mb-4"
                />
                <View className="flex-row gap-x-3">
                  <TextInput
                    placeholder="City"
                    value={updateUser.city}
                    onChangeText={(val) => setUpdateUser({ ...updateUser, city: val })}
                    className="flex-1 bg-slate-50 p-4 rounded-xl font-semibold text-slate-900"
                  />
                  <TextInput
                    placeholder="Zip Code"
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
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Save size={18} color="white" />}
                  <Text className="text-white font-bold ml-2">{loading ? "Updating..." : "Save Changes"}</Text>
                </TouchableOpacity>
              </View>
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