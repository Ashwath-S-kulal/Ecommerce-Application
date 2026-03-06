import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Shield, 
  MapPin, 
  CreditCard, 
  ExternalLink,
  Phone,
  Mail,
  Navigation
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DataRow = ({ label, value }) => (
  <View className="flex-row justify-between py-2 border-b border-zinc-50">
    <Text className="text-zinc-400 text-[10px] uppercase font-bold">{label}</Text>
    <Text className="text-zinc-900 text-[11px] font-medium">{value}</Text>
  </View>
);

const TechBlock = ({ title, icon: Icon, color, specs, instructions, troubleshooting }) => (
  <View className="mb-10">
    <View className="flex-row items-center mb-4">
      <View style={{ backgroundColor: color }} className="p-2.5 rounded-xl shadow-sm">
        <Icon size={18} color="white" />
      </View>
      <Text className="ml-3 text-2xl font-black text-zinc-900 tracking-tighter">{title}</Text>
    </View>


    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Standard Operating Procedure</Text>
    {instructions.map((step, i) => (
      <View key={i} className="flex-row mb-4 bg-white border border-zinc-100 p-4 rounded-2xl">
        <Text className="text-zinc-300 font-black text-lg mr-4">0{i+1}</Text>
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        
        {/* Terminal Style Header */}
        <View className="mt-10 mb-10 bg-zinc-900 p-6 rounded-xl">
          <Text className="text-emerald-400 font-mono text-xs mb-2">Sanjeevini Group Avarse</Text>
          <Text className="text-white text-3xl font-black tracking-tight">Support Hub</Text>
          <Text className="text-zinc-500 text-xs mt-2">Comprehensive system documentation for users and administrators.</Text>
        </View>

        {/* 1. AUTHENTICATION ENGINE */}
        <TechBlock 
          title="Security"
          icon={Shield}
          color="#4f46e5"
          specs={[
            { label: "Auth Protocol", value: "JWT + OAuth 2.0" },
            { label: "Encryption", value: "AES-256-GCM" },
            { label: "2FA Support", value: "SMS-OTP Gateway" }
          ]}
          instructions={[
            { task: "Identity Verification", desc: "The system triggers a unique 6-digit hash sent to your registered mobile number. This code remains valid for 10 minutes." },
            { task: "Credential Reset", desc: "Navigate to the Login page → Select 'Forgot Password' → Verify via OTP → Establish new credentials." }
          ]}
          troubleshooting={[
            "If state errors occur, please log out and re-authenticate to refresh the JWT session.",
            "Account registration requires a valid email address and mandatory OTP verification."
          ]}
        />

  

        {/* 3. LOGISTICS DATA */}
        <TechBlock 
          title="Logistics"
          icon={MapPin}
          color="#059669"
          specs={[
            { label: "Primary Zone", value: "Avarse, Vandaru Mavinakatte" },
            { label: "Fleet Provider", value: "Sanjeevini Internal Logistics" },
            { label: "Tracking Level", value: "End-to-End Encryption" }
          ]}
          instructions={[
            { task: "Cash On Delivery (COD)", desc: "Sanjeevini personnel will deliver your order directly to your doorstep and collect payment upon receipt." },
            { task: "Geographical Accuracy", desc: "Please ensure your delivery address is accurate to avoid delays. Pin drops are recommended for rural areas." }
          ]}
          troubleshooting={[
            "Deliveries outside the primary zone may require an additional 24-48 hours for processing.",
            "If a courier cannot locate the address, the order will be held at the Avarse Hub for 3 days."
          ]}
        />

        {/* 4. CONTACT INFORMATION */}
        <View className="mb-10 p-6 bg-zinc-900 rounded-[32px]">
          <Text className="text-white font-black text-lg mb-4">Contact Sanjeevini Group</Text>
          
          {/* Phone */}
          <TouchableOpacity 
            onPress={() => Linking.openURL('tel:+919876543210')} // Replace with actual number
            className="flex-row items-center mb-4 bg-zinc-800 p-4 rounded-2xl"
          >
            <Phone size={18} color="#10b981" />
            <View className="ml-4">
              <Text className="text-zinc-400 text-[10px] uppercase font-bold">Call Support</Text>
              <Text className="text-white font-medium">+91 98765 43210</Text>
            </View>
          </TouchableOpacity>

          {/* Email */}
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

          {/* Location */}
          <View className="flex-row items-center bg-zinc-800 p-4 rounded-2xl">
            <Navigation size={18} color="#f43f5e" />
            <View className="ml-4">
              <Text className="text-zinc-400 text-[10px] uppercase font-bold">Headquarters</Text>
              <Text className="text-white font-medium leading-5">Avarse, Vandaru Mavinakatte,{"\n"}Udupi District, Karnataka</Text>
            </View>
          </View>
        </View>

        {/* Footer Technical Link */}
        <View className="mb-12 p-6 bg-zinc-50 rounded-[32px] border border-zinc-100">
           <Text className="text-zinc-900 font-black text-sm mb-4">Developer Resources</Text>
           <View className="flex-row justify-between mb-6">
              <View>
                 <Text className="text-zinc-400 text-[10px] uppercase font-bold">API Gateway</Text>
                 <Text className="text-zinc-600 text-xs">api.sanjeevini.com</Text>
              </View>
           </View>
           <TouchableOpacity className="flex-row items-center justify-center bg-zinc-200 py-3 rounded-xl">
              <Text className="text-zinc-900 font-bold text-xs mr-2">Open Technical Wiki</Text>
              <ExternalLink size={14} color="#18181b" />
           </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}