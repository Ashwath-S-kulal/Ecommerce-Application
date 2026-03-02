// models/notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // If sending to a specific user
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  
  // To target all admins (New field)
  receiverRole: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  message: { type: String, required: true },
  type: { type: String, enum: ['Order_Placed', 'Shipped', 'Delivered'], default: 'Order_Placed' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);