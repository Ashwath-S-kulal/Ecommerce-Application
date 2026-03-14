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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCart, setWishlist } from "../../redux/productSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
const { width } = Dimensions.get("window");
import Constants from "expo-constants";
import ImageViewing from "react-native-image-viewing";
import { ShoppingBag, ShoppingCart } from "lucide-react-native";


const BASE_URL = Constants.expoConfig.extra.apiUrl;
// const BASE_URL = "http://10.168.21.102:8000"

export default function ProductPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { products, wishlist } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.user);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const [visible, setIsVisible] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [product, setProduct] = useState(products?.find((item) => item._id === id));
  const [loadingProduct, setLoadingProduct] = useState(!product);
  const [recLoading, setRecLoading] = useState(true);

  const params = useLocalSearchParams();
  const productId = params.id;
  const images = product?.productImg?.map((img) => ({
    uri: img.url,
  })) || [];

  const [similarProducts, setSimilarProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [randomProducts, setRandomProducts] = useState([])

  useEffect(() => {
    if (!product) return;

    const fetchRecommendations = async () => {
      try {
        setRecLoading(true);
        const catRes = await axios.get(`${BASE_URL}/api/product/getallproducts?category=${product.category}&limit=6`);
        const brandRes = await axios.get(`${BASE_URL}/api/product/getallproducts?brand=${product.brand}&limit=6`);
        const randRes = await axios.get(`${BASE_URL}/api/product/getallproducts?limit=20`);

        setSimilarProducts(catRes.data.products.filter(p => p._id !== product._id));
        setSuggestedProducts(brandRes.data.products.filter(p => p._id !== product._id));
        const shuffled = randRes.data.products
          .filter(p => p._id !== product._id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);

        setRandomProducts(shuffled);
      } catch (err) {
        console.error("Error fetching recommendations", err);
      }
      finally {
        setRecLoading(false);
      }
    };
    fetchRecommendations();
  }, [product]);


  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setActiveImg(0);
  }, [id]);



  useEffect(() => {
    if (product) return;
    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/product/getproduct/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
        }
      } catch (err) {
        showLocalToast("Product details unavailable");
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);



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
        showLocalToast("Item added to Cart");
        dispatch(setCart(res.data.cart));
      }
    } catch (error) {
      showLocalToast("Failed to add to Cart");
    } finally {
      setLoading(false);
    }
  };



  const toggleWishlist = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return showLocalToast("Please login first");

    const isInWishlist = wishlist?.items?.some(item => item.productId?._id === product?._id);
    const endpoint = isInWishlist ? `${BASE_URL}/api/wishlist/remove` : `${BASE_URL}/api/wishlist/add`;
    setWishlistLoading(true);
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
    } finally {
      setWishlistLoading(false);
    }
  };





  const handlePlaceOrder = () => {
    if (!user) {
      return showLocalToast("Please login to place an order");
    }
    router.push({
      pathname: "/components/AddressFormSingle",
      params: { productId: product._id, buyNow: true }
    });
  };


  if (!product) {
    return <ProductSkeleton />;
  }

  const isInWishlist = wishlist?.items?.some((item) => item.productId?._id === product?._id);
  const originalPrice = Math.round(product.productPrice * 1.25);


  const date = new Date();
  date.setDate(date.getDate() + 5);

  const expectedDelivery = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });


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
            <View className="absolute bottom-2 flex-row bg-white/80 p-2 rounded-xl border border-white/40 shadow-xl gap-2 ">
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
            <TouchableOpacity
              onPress={toggleWishlist}
              disabled={wishlistLoading}
              className="w-10 h-10 items-center justify-center"
            >
              {wishlistLoading ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <FontAwesome
                  name={isInWishlist ? "heart" : "heart-o"}
                  size={25}
                  color={isInWishlist ? "#f43f5e" : "#cbd5e1"}
                />
              )}
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
          <View className="bg-green-50 border border-green-100 px-4 py-3 rounded-md mb-6 flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#16a34a" />
            <Text className="ml-2 text-green-700 text-[12px] font-bold">
              Expected Delivery: {expectedDelivery}
            </Text>
          </View>
          <Text className="text-gray-500 italic leading-6 text-[14px] mb-10 border-l-2 border-pink-100 pl-4">
            {product.productDesc || "Handcrafted with premium materials..."}
          </Text>
          <Section title="Similar" highlight="in Category" data={similarProducts} router={router} />
          <Section title="More from" highlight={product.brand} data={suggestedProducts} loading={recLoading} router={router} />
          <Section title="You Might" highlight="Also Like" data={randomProducts} loading={recLoading} router={router} />
        </View>
      </ScrollView>

      {toastMsg ? (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]} className="bg-black/90 px-6 py-3 rounded-full">
          <Text className="text-white font-bold text-xs tracking-widest" numberOfLines={1}>{toastMsg}</Text>
        </Animated.View>
      ) : null}

      <View className="px-6 pt-4 pb-8 border-t border-gray-100 bg-white shadow-2xl">
        <View className="flex-row gap-3 ">
          <TouchableOpacity
            onPress={addToCart}
            disabled={loading}
            activeOpacity={0.8}
            className="flex-1 bg-white border-2 border-[#0F172A] py-4 rounded-2xl flex-row justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <ShoppingCart size={19} color="#0F172A" strokeWidth={2.5} />

              </>
            )}
            <Text className="text-[#0F172A] font-[900] uppercase tracking-tighter ml-2 text-[13px]">
              Add to Cart
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlaceOrder}
            activeOpacity={0.9}
            className="flex-1 bg-[#0F172A] py-4 rounded-2xl flex-row justify-center items-center shadow-md shadow-slate-400"
          >
            <ShoppingBag size={19} color="white" strokeWidth={2.5} />
            <Text className="text-white font-[900] uppercase tracking-tighter ml-2 text-[13px]" numberOfLines={1}>
              Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}




const Section = ({ title, highlight, data, loading, router }) => {
  if (loading) {
    return (
      <View className="mb-10">
        <View className="w-32 h-6 bg-gray-100 rounded-md mb-4" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <View key={i} className="mr-4 w-36">
              <View className="bg-gray-100 rounded-md mb-2 h-36" />
              <View className="w-20 h-3 bg-gray-100 rounded-md mb-2" />
              <View className="w-12 h-3 bg-gray-100 rounded-md" />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

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

  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    zIndex: 1000
  }
});


const ProductSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-2 flex-row items-center">
        <View className="w-6 h-6 bg-gray-200 rounded-full mr-3" />
        <View className="w-20 h-4 bg-gray-100 rounded-md" />
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <Animated.View
          style={{ height: width * 1.15, opacity: shimmerAnim }}
          className="bg-gray-100 rounded-xl border border-gray-200"
        />

        <View className="px-4 py-8">
          <View className="flex-row justify-between mb-4">
            <View className="w-24 h-6 bg-gray-100 rounded-full" />
            <View className="w-8 h-8 bg-gray-100 rounded-full" />
          </View>

          <Animated.View style={{ opacity: shimmerAnim }} className="w-3/4 h-8 bg-gray-200 rounded-md mb-4" />
          <Animated.View style={{ opacity: shimmerAnim }} className="w-1/2 h-10 bg-gray-200 rounded-md mb-8" />

          <View className="w-full h-4 bg-gray-50 rounded-md mb-2" />
          <View className="w-full h-4 bg-gray-50 rounded-md mb-2" />
          <View className="w-2/3 h-4 bg-gray-50 rounded-md mb-10" />
        </View>
      </ScrollView>

      <View className="px-6 pt-4 pb-8 border-t border-gray-100 flex-row gap-3">
        <View className="flex-1 h-14 bg-gray-100 rounded-2xl" />
        <View className="flex-1 h-14 bg-gray-200 rounded-2xl" />
      </View>
    </View>
  );
};