import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PackagePlus,
  Tag,
  Layers,
  FileText,
  Camera,
  IndianRupee,
  X,
  Plus
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setProducts } from '@/redux/productSlice';
import Constants from "expo-constants";
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_URL = Constants.expoConfig.extra.apiUrl;

const AddProduct = () => {
  const [productData, setProductData] = useState({
    productName: "",
    productPrice: "",
    productDesc: "",
    productImg: [],
    brand: "",
    category: ""
  });

  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { products } = useSelector(store => store.product);


  const resetForm = () => {
    setProductData({
      productName: "",
      productPrice: "",
      productDesc: "",
      productImg: [],
      brand: "",
      category: ""
    });
  };



  const pickImages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow gallery access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setLoading(true);

        const processedImages = await Promise.all(
          result.assets.map(async (asset) => {
            const manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 800 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );

            return {
              uri: manipResult.uri,
              name: asset.fileName || `product_${Date.now()}.jpg`,
              type: "image/jpeg",
            };
          })
        );
        setProductData(prev => ({
          ...prev,
          productImg: [...prev.productImg, ...processedImages].slice(0, 5)
        }));
      }

    } catch (error) {
      console.log("Image Picker Error:", error);
      Alert.alert("Error", "Image picker failed.");
    } finally {
      setLoading(false);
    }
  };
  const removeImage = (index) => {
    const updated = [...productData.productImg];
    updated.splice(index, 1);
    setProductData({ ...productData, productImg: updated });
  };



  const submitHandler = async () => {
    if (!productData.productName || !productData.productPrice || productData.productImg.length === 0) {
      Alert.alert("Error", "Please fill required fields and add at least one image.");
      return;
    }
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("productPrice", productData.productPrice);
    formData.append("productDesc", productData.productDesc);
    formData.append("category", productData.category);
    formData.append("brand", productData.brand);

    productData.productImg.forEach((img) => {
      formData.append("files", {
        uri: img.uri,
        name: img.name,
        type: img.type,
      });
    });

    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("accessToken");

      const res = await axios.post(`${BASE_URL}/api/product/add`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      if (res.data.success) {
        dispatch(setProducts([...products, res.data.product]));
        Alert.alert("Success", "Product published successfully!");
        resetForm();
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" || "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className=" pt-10 pb-20 px-6 rounded-b-[40px] flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <Text className="text-3xl font-black  tracking-tighter">Add Product</Text>
                <Text className=" mt-1 opacity-90 font-medium">
                  Fill the form below to publish a new product on Sanjeevini.
                </Text>
              </View>
              <View className="bg-white/20 p-4 rounded-2xl border border-white/30">
                <PackagePlus color="white" size={28} />
              </View>
            </View>

            <View className="mx-4 -mt-12 bg-white rounded-md p-6 shadow-xl shadow-black/5 border border-slate-100 mb-10">

              <Text className="text-xl font-black text-slate-800 mb-6 border-b border-slate-50 pb-2">
                General Information
              </Text>

              <View className="gap-y-5">
                {/* Product Name */}
                <LabelInput
                  label="Product Name"
                  placeholder="Handmade Silk Saree"
                  value={productData.productName}
                  onChangeText={(t) => setProductData({ ...productData, productName: t })}
                />

                {/* Price & Category Row */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <LabelInput
                      label="Price (INR)"
                      placeholder="0"
                      keyboardType="numeric"
                      icon={<IndianRupee size={12} color="#94a3b8" />}
                      value={productData.productPrice.toString()}
                      onChangeText={(t) => setProductData({ ...productData, productPrice: t })}
                    />
                  </View>
                  <View className="flex-1">
                    <LabelInput
                      label="Category"
                      placeholder="Handicrafts"
                      icon={<Layers size={12} color="#94a3b8" />}
                      value={productData.category}
                      onChangeText={(t) => setProductData({ ...productData, category: t })}
                    />
                  </View>
                </View>

                {/* Brand */}
                <LabelInput
                  label="Brand"
                  placeholder="Sanjeevini Group"
                  icon={<Tag size={12} color="#94a3b8" />}
                  value={productData.brand}
                  onChangeText={(t) => setProductData({ ...productData, brand: t })}
                />

                {/* Description */}
                <LabelInput
                  label="Description"
                  placeholder="Tell customers more..."
                  multiline
                  numberOfLines={4}
                  icon={<FileText size={12} color="#94a3b8" />}
                  value={productData.productDesc}
                  onChangeText={(t) => setProductData({ ...productData, productDesc: t })}
                />

                {/* IMAGE UPLOAD SECTION */}
                <View className="pt-4 border-t border-slate-50">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Camera size={16} color="#E91E63" />
                    <Text className="text-[#E91E63] font-black text-xs uppercase tracking-widest">
                      Add Images{"  "} <Text className='text-base font-semibold text-red-600'>{"["}ALLOWED ONLY 5 IMAGES{"]"}</Text>
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity
                      onPress={pickImages}
                      className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl items-center justify-center mr-3"
                    >
                      <Plus size={24} color="#94a3b8" />
                    </TouchableOpacity>

                    {productData.productImg.map((img, idx) => (
                      <View key={idx} className="relative mr-3">
                        <Image source={{ uri: img.uri }} className="w-24 h-24 rounded-3xl border border-slate-100" />
                        <TouchableOpacity
                          onPress={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white"
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                  onPress={submitHandler}
                  disabled={loading}
                  className="bg-[#E91E63] h-16 rounded-md items-center justify-center mt-6 shadow-lg shadow-pink-200"

                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-bold text-lg" numberOfLines={1}>Publish Product</Text>
                    </View>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          </ScrollView>

        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};



const LabelInput = ({ label, icon, ...props }) => (
  <View className="gap-y-2">
    <View className="flex-row items-center gap-2 ml-1">
      {icon}
      <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</Text>
    </View>
    <TextInput
      className={`bg-slate-50 border border-slate-100 rounded-2xl px-4 text-slate-900 font-medium ${props.multiline ? 'h-32 pt-4' : 'h-14'}`}
      placeholderTextColor="#cbd5e1"
      {...props}
    />
  </View>
);

export default AddProduct;
