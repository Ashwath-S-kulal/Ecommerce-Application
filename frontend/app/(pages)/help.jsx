import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import {
  Shield,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Navigation,
  User,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Globe
} from 'lucide-react-native';


const TechBlock = ({ title, icon: Icon, color, specs, instructions, troubleshooting }) => (
  <View className="mb-10">
    <View className="flex-row items-center mb-4">
      <View style={{ backgroundColor: color }} className="p-2.5 rounded-xl shadow-sm">
        <Icon size={18} color="white" />
      </View>
      <Text className="ml-3 text-2xl font-black text-zinc-900 tracking-tighter" numberOfLines={1}>{title}</Text>
    </View>


    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Standard Operating Procedure</Text>
    {instructions.map((step, i) => (
      <View key={i} className="flex-row mb-4 bg-white border border-zinc-100 p-4 rounded-2xl">
        <Text className="text-zinc-300 font-black text-lg mr-4">0{i + 1}</Text>
        <View className="flex-1">
          <Text className="text-zinc-900 font-bold text-sm mb-1">{step.task}</Text>
          <Text className="text-zinc-500 text-xs leading-5">{step.desc}</Text>
        </View>
      </View>
    ))}

    <View className="bg-red-50/50 border border-red-100 p-4 rounded-2xl">
      <Text className="text-red-600 font-black text-[10px] uppercase mb-2">Troubleshooting & Edge Cases</Text>
      {troubleshooting.map((item, i) => (
        <Text key={i} className="text-zinc-600 text-[11px] mb-1 leading-4">• {item}</Text>
      ))}
    </View>
  </View>
);



export default function TechHelpCenter() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        <View className="pt-20 mb-10 bg-white p-6 pb-4 shadow-sm shadow-slate-200 border-b border-slate-200">
          <Text className="text-rose-500 font-black text-xs mb-2 uppercase tracking-widest">
            Sanjeevini Group Avarse
          </Text>
          <Text className="text-slate-900 text-3xl font-black tracking-tight">
            Support Hub
          </Text>
          <Text className="text-slate-400 text-xs mt-2">
            Comprehensive system documentation for users 
          </Text>
        </View>

        <View className="px-6">
          <TechBlock
            title="Account Essentials"
            icon={User}
            color="#e11d48"
            instructions={[
              { task: "Signup", desc: "Navigate to the Signup page and enter your name, email, and password to register, Then verify with OTP" },
              { task: "Login", desc: "Access your account by entering your registered credentials on the Login screen." },
              { task: "Forgot Password", desc: "Tap 'Forgot?' on the login page, enter your email, verify the 6-digit OTP, and reset your password." }
            ]}
            troubleshooting={[
              "Ensure your email is correctly spelled during registration.",
              "If you don't receive the OTP within 10 minutes, check your spam folder or tap 'Resend OTP'."
            ]}
          />

          <TechBlock
            title="Shopping & Buying"
            icon={ShoppingBag}
            color="#f59e0b"
            instructions={[
              { task: "Direct Buy", desc: "Tap 'Buy Now' on any product card to proceed immediately to the checkout page." },
              { task: "Via Cart", desc: "Add items to your cart, navigate to the Cart tab, and tap 'Checkout' to review and finalize." }
            ]}
            troubleshooting={[
              "If the 'Buy Now' button is unresponsive, check your internet connection.",
              "Items in the cart are not reserved; complete your checkout promptly to ensure stock availability."
            ]}
          />

          <TechBlock
            title="Wishlist & Orders"
            icon={Heart}
            color="#8b5cf6"
            instructions={[
              { task: "Add to Wishlist", desc: "Tap the 'Heart' icon on any product to save it for future reference." },
              { task: "Tracking", desc: "Navigate to Profile > My Orders to view the real-time status of your active purchases." },
              { task: "Cancellation", desc: "Open your order in 'Orders page' and select 'Cancel Order' before 48 hours." }
            ]}
            troubleshooting={[
              "Order cancellations are only permitted within 48 hours of purchase.",
              "Orders that have already been shipped cannot be cancelled."
            ]}
          />

          <TechBlock
            title="Profile Management"
            icon={ShieldCheck}
            color="#06b6d4"
            instructions={[
              { task: "Update Profile", desc: "Go to Profile > Click Edit > then Edit Details to modify your name, phone number, or address." },
              { task: "Update Image", desc: "Tap your avatar in the 'profile page', click update profile picture button, upload a new photo from your device." }
            ]}
            troubleshooting={[
              "Changes made to your profile may take a few moments to sync across all devices.",
              "Ensure your profile image is in JPG or PNG format for best results."
            ]}
          />

          <TechBlock
            title="Logistics"
            icon={MapPin}
            color="#059669"
            instructions={[
              { task: "Cash On Delivery (COD)", desc: "Sanjeevini personnel will deliver your order directly to your doorstep and collect payment upon receipt." },
              { task: "Geographical Accuracy", desc: "Please ensure your delivery address is accurate to avoid delays. Pin drops are recommended for rural areas." }
            ]}
            troubleshooting={[
              "Deliveries outside the primary zone may require an additional 24-48 hours for processing.",
              "If a courier cannot locate the address, the order will be held at the Avarse Hub for 3 days."
            ]}
          />

          <TechBlock
            title="Security"
            icon={Shield}
            color="#4f46e5"
            instructions={[
              { task: "Identity Verification", desc: "The system triggers a unique 6-digit code sent to your registered email Id. This code remains valid for 10 minutes." },
              { task: "Credential Reset", desc: "Navigate to the Login page → Select 'Forgot Password' → Verify via OTP → Establish new credentials." }
            ]}
            troubleshooting={[
              "If state errors occur, please log out and re-authenticate to refresh the JWT session.",
              "Account registration requires a valid email address and mandatory OTP verification."
            ]}
          />


          {/* 4. CONTACT INFORMATION */}
          <View className="mb-6 p-6 bg-zinc-900 rounded-xl">
            <Text className="text-white font-black text-lg mb-4">Contact Sanjeevini Group</Text>

            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+919876543210')}
              className="flex-row items-center mb-4 bg-zinc-800 p-4 rounded-2xl"
            >
              <Phone size={18} color="#10b981" />
              <View className="ml-4">
                <Text className="text-zinc-400 text-[10px] uppercase font-bold">Call Support</Text>
                <Text className="text-white font-medium">+91 98765 43210</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:support@sanjeevini.com')}
              className="flex-row items-center mb-4 bg-zinc-800 p-4 rounded-2xl"
            >
              <Mail size={18} color="#3b82f6" />
              <View className="ml-4">
                <Text className="text-zinc-400 text-[10px] uppercase font-bold">Email Inquiry</Text>
                <Text className="text-white font-medium">support@sanjeevini.com</Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center bg-zinc-800 p-4 rounded-2xl">
              <Navigation size={18} color="#f43f5e" />
              <View className="ml-4">
                <Text className="text-zinc-400 text-[10px] uppercase font-bold">Headquarters</Text>
                <Text className="text-white font-medium leading-5">Avarse, Vandaru Mavinakatte,{"\n"}Udupi District, Karnataka</Text>
              </View>
            </View>
          </View>

          <View className="mb-12 p-6 bg-pink-50 rounded-xl border border-pink-100">
            <View className="flex-row items-center mb-4">
              <View className="bg-white p-2 rounded-xl mr-3 shadow-sm">
                <Globe size={20} color="#db2777" />
              </View>
              <View>
                <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>Visit Our Website</Text>
              </View>
            </View>

            <Text className="text-slate-600 text-xs mb-6 leading-5">
              Prefer browsing on a larger screen? {"  "} Explore our complete product collection,
              special offers, and community stories on our official website.
            </Text>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://sanjeevinigroupavarse.vercel.app/')}
              className="flex-row items-center justify-center bg-pink-600 py-3.5 rounded-xl active:opacity-90 shadow-md shadow-pink-200"
            >
              <Text className="text-white font-bold text-xs mr-2" numberOfLines={1}>Visit Official Shop</Text>
              <ExternalLink size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}