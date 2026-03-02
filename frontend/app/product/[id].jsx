import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart, setWishlist } from "../../redux/productSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ImageViewing from "react-native-image-viewing";

const { width } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function ProductPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { products, wishlist } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.user);
  const product = products?.find((item) => item._id === id);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [visible, setIsVisible] = useState(false);

  const images = product.productImg?.map((img) => ({
    uri: img.url,
  }));

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setActiveImg(0);
  }, [id]);

  const showLocalToast = (text) => {
    setToastMsg(text);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(""));
  };

  const addToCart = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return showLocalToast("Please login to add items");

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/cart/add`,
        { productId: product._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showLocalToast("Item added to bag");
        dispatch(setCart(res.data.cart));
      }
    } catch (error) {
      showLocalToast("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return showLocalToast("Please login first");

    const isInWishlist = wishlist?.items?.some(item => item.productId?._id === product?._id);
    const endpoint = isInWishlist ? `${BASE_URL}/api/wishlist/remove` : `${BASE_URL}/api/wishlist/add`;

    try {
      const res = await axios({
        method: isInWishlist ? "delete" : "post",
        url: endpoint,
        data: { productId: product._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        showLocalToast(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
        dispatch(setWishlist(res.data.wishlist));
      }
    } catch (error) {
      showLocalToast("Wishlist update failed");
    }
  };

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p._id !== id)
      .slice(0, 12);
  }, [products, product, id]);

  const suggestedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category !== product.category && p._id !== id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);
  }, [products, product, id]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  const isInWishlist = wishlist?.items?.some((item) => item.productId?._id === product?._id);
  const originalPrice = Math.round(product.productPrice * 1.25);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-2 bg-white flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={22} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(tabs)`)}>
          <Text className="text-gray-400 text-[14px] font-black  tracking-tighter">Home</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={10} color="#9ca3af" className="mx-1" />
        <Text numberOfLines={1} className="text-black text-[10px] font-black uppercase flex-1">
          {product.productName}
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} ref={scrollRef}>
        <View className="px-4 pt-4 bg-white">
          <View style={{ height: width * 1.15 }} className="bg-[#F9FAFB] rounded-xl relative items-center justify-center overflow-hidden border border-gray-100">
            <TouchableOpacity onPress={() => setIsVisible(true)}>
              <Image
                source={{ uri: product.productImg?.[activeImg]?.url }}
                style={{ width: width * 0.75, height: width * 0.8 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <ImageViewing
              images={images}
              imageIndex={activeImg}
              visible={visible}
              onRequestClose={() => setIsVisible(false)}
            />

            <View className="absolute bottom-6 flex-row bg-white/80 p-2 rounded-xl border border-white/40 shadow-xl gap-2">
              {product.productImg?.slice(0, 5).map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveImg(index)}
                  style={{
                    borderColor: activeImg === index ? "#0F172A" : "transparent",
                    borderWidth: 2,
                    transform: [{ scale: activeImg === index ? 1.05 : 1 }]
                  }}
                  className="bg-white rounded-md overflow-hidden"
                >
                  <Image source={{ uri: img.url }} className="w-12 h-12" resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View className="px-8 py-8">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              {product.category}
            </Text>
            <TouchableOpacity onPress={toggleWishlist}>
              <FontAwesome name={isInWishlist ? "heart" : "heart-o"} size={22} color={isInWishlist ? "#f43f5e" : "#cbd5e1"} />
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-gray-900 uppercase leading-tight mt-2">{product.productName}</Text>

          <View className="flex-row items-center gap-4 my-6">
            <Text className="text-4xl font-black text-gray-900">₹{product.productPrice.toLocaleString()}</Text>
            <View>
              <Text className="text-sm text-gray-400 line-through font-bold">₹{originalPrice.toLocaleString()}</Text>
              <Text className="text-[10px] font-black text-green-600 uppercase">Save 25%</Text>
            </View>
          </View>

          <Text className="text-gray-500 italic leading-6 text-[14px] mb-10 border-l-2 border-pink-100 pl-4">
            {product.productDesc || "Handcrafted with premium materials..."}
          </Text>

          <Section title="Similar" highlight={product.category} data={similarProducts} router={router} />
          <Section title="You Might" highlight="Like These" data={suggestedProducts} router={router} />
        </View>
      </ScrollView>

      {toastMsg ? (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]} className="bg-black/90 px-6 py-3 rounded-full">
          <Text className="text-white font-bold text-xs uppercase tracking-widest">{toastMsg}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.footer} className="px-6 py-6 border-t border-gray-50 bg-white flex-row gap-3">
        <TouchableOpacity
          onPress={addToCart}
          disabled={loading}
          className="flex-[2] bg-[#0F172A] py-5 rounded-2xl flex-row justify-center items-center shadow-xl"
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <>
              <Feather name="shopping-bag" size={18} color="white" />
              <Text className="text-white font-black uppercase tracking-widest ml-3">Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (user ? router.push("/cart") : router.push("/login"))}
          activeOpacity={0.7}
          className="flex-row items-center justify-center border-2 border-zinc-900 py-4 px-6 rounded-2xl bg-white shadow-sm"
        >
          <Text numberOfLines={1} className="text-zinc-900 font-bold text-sm mr-2">
            {user ? "Go to Cart" : "Login to View Cart"}
          </Text>

          <Feather
            name={user ? "arrow-right" : "lock"}
            size={18}
            color="#18181b"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Section = ({ title, highlight, data, router }) => {
  if (data.length === 0) return null;
  return (
    <View className="mb-10">
      <Text className="text-xl font-black text-slate-900 tracking-tighter mb-4">
        {title} <Text className="font-serif text-pink-500">{highlight}</Text>
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data.map((p) => (
          <TouchableOpacity key={p._id} onPress={() => router.push(`/product/${p._id}`)} className="mr-4 w-36">
            <View className="bg-[#F9FAFB] rounded-md p-3 mb-2 border border-gray-100 h-36 items-center justify-center">
              <Image source={{ uri: p.productImg?.[0]?.url }} className="w-24 h-24" resizeMode="contain" />
            </View>
            <Text numberOfLines={1} className="text-[12px] font-bold uppercase">{p.productName}</Text>
            <Text className="text-sm font-black">₹{p.productPrice?.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    zIndex: 1000
  }
});