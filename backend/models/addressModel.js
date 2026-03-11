import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String},
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zip: { type: String, required: true },
  country: { type: String },
}, { timestamps: true });

export const Address = mongoose.model("Address", addressSchema);