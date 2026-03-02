// import express from "express";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import userRoute from "./routes/userRoute.js";
// import productRoute from "./routes/productRoute.js";
// import cartRoute from "./routes/cartRoute.js";
// import wishlistRoute from "./routes/wishlistRoute.js";
// import orderRoute from "./routes/orderRoute.js";
// import notificationRoutes from "./routes/notificationRoute.js";
// import addressRoutes from "./routes/addressRoute.js";
// import cors from "cors";

// dotenv.config();

// const app = express();

// app.use(express.json());

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URI,
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Backend running");
// });

// app.use("/api/user", userRoute);
// app.use("/api/product", productRoute);
// app.use("/api/cart", cartRoute);
// app.use("/api/wishlist", wishlistRoute);
// app.use("/api/order", orderRoute);
// app.use("/api/notification", notificationRoutes);
// app.use("/api/address", addressRoutes);


// export default app;


import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js"
import cartRoute from "./routes/cartRoute.js";
import wishlistRoute from "./routes/wishlistRoute.js";
import orderRoute from "./routes/orderRoute.js";
import notificationRoutes from "./routes/notificationRoute.js"
import addressRoutes from "./routes/addressRoute.js"
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use(cors({
  origin: true,
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/order", orderRoute);
app.use("/api/notification", notificationRoutes)
app.use("/api/address",addressRoutes)





app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

