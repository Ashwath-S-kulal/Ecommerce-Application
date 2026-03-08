import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    amount: {
      type: Number,
      required: true,
    },

    subtotal:{
      type:Number,
      required:true,
    },

    tax: {
      type: Number,
      required: true,
    },

    shipping: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    expectedDeliveryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
