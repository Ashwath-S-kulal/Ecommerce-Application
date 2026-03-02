import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPMail } from "../emailVerify/sendOTPMail.js";
import cloudinary from "../utils/cloudinary.js";
import { Cart } from "../models/cartModel.js";
import { Wishlist } from "../models/wishlistModel.js";
import { Order } from "../models/orderModel.js";


// export const register = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password } = req.body;
//     if (!firstName || !lastName || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }
//     const user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists",
//       });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//     });
//     const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
//       expiresIn: "10m",
//     });
//     verifyEmail(token, email);
//     newUser.token = token;
//     await newUser.save();
//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       user: newUser,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       error: error.message,
//     });
//   }
// };

// export const verify = async (req, res) => {
  
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         message: "Authorization token is missing or invalid",
//       });
//     }
//     const token = authHeader.split(" ")[1];
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (error) {
//       if (error.name === "TokenExpiredError") {
//         return res.status(400).json({
//           success: false,
//           message: "the registration token has expired",
//         });
//       }
//       return res.status(400).json({
//         success: false,
//         message: "Token verification failed",
//       });
//     }

//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     user.token = null;
//     user.isVerified = true;
//     await user.save();
//     return res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const reVerify = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "10m",
//     });
//     verifyEmail(token, email);
//     user.token = token;
//     await user.save();
//     return res.status(200).json({
//       success: true,
//       message: "Verification email sent successfully",
//       token: user.token,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const newUser = await User.create({
      firstName, lastName, email,
      password: hashedPassword,
      otp, otpExpiry
    });

    await sendOTPMail(otp, email, "Verify Your Account");

    res.status(201).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // 2. Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Update user document
    user.otp = newOtp;
    user.otpExpiry = newExpiry;
    await user.save();

    // 4. Send the mail
    await sendOTPMail(newOtp, email, "Your New Verification Code");

    res.status(200).json({ 
      success: true, 
      message: "New OTP sent to email successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
export const verifySignup = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null; 
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ success: true, message: "Account verified successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (existingUser.isVerified === false) {
      return res.status(400).json({
        success: false,
        message: "Email not verified",
      });
    }

    //generate token
    const accessToken = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "10d",
      }
    );
    const refreshToken = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "10d",
      }
    );
    existingUser.isLoggedIn = true;
    await existingUser.save();

    //check for existing seesion and delete it
    const existingSession = await Session.findOne({ userId: existingUser._id });
    if (existingSession) {
      await Session.deleteOne({ userId: existingUser._id });
    }

    //create new session
    await Session.create({ userId: existingUser._id });
    return res.status(200).json({
      success: true,
      message: `Wellcome Back ${existingUser.firstName}`,
      user: existingUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.id;
    await Session.deleteMany({ userId: userId });
    await User.findByIdAndUpdate(userId, { isLoggedIn: false });
    return res.status(200).json({
      success: true,
      message: "User Logged out successfully",
    });
  } catch (error) {
    return (
      res,
      status(500).json({
        success: false,
        message: error.message,
      })
    );
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; //10 minutes from now
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPMail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const {email} = req.params;
    if(!otp){
      return res.status(400).json({
        success:false,
        message:"OTP is required"
      });
    }
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      });
    }
    if(!user.otp || !user.otpExpiry){
      return res.status(400).json({
        success:false,
        message:"OTP is not generated or already verified"
      });
    }
    if(user.otpExpiry < new Date()){
      return res.status(400).json({
        success:false,
        message:"OTP has expired"
      });
    }
    if(user.otp !== otp){
      return res.status(400).json({
        success:false,
        message:"Invalid OTP"
      });
    }
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res.status(200).json({
      success:true,
      message:"OTP verified successfully"
    });
}catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const {newPassword,confirmPassword} = req.body;
    const {email} = req.params;
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      });
    }
    if(!newPassword || !confirmPassword){
      return res.status(400).json({
        success:false,
        message:"All fields are required"
      });
    }
    if(newPassword !== confirmPassword){
      return res.status(400).json({
        success:false,
        message:"Passwords do not match"
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword,10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({
      success:true,
      message:"Password changed successfully"
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,   
      message: error.message,
    });
  }
};

export const allUser= async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      success: true,
      users,
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

export const getUserById = async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await User.findById(userId).select("-password -otp -otpExpiry -token");
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      });
    }
    res.status(200).json({
      success:true,
      user,
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

export const updateUser= async (req, res) => {
  try {
    const userIdToUpdate =  req.params.id;
    const loggedInUser= req.user;
    const { firstName, lastName, address, city, zipCode,phoneNo,role } = req.body;
    
    if(loggedInUser._id.toString() !== userIdToUpdate && loggedInUser.role !== 'admin'){
      return res.status(403).json({
        success:false,
        message:"You are not authorized to update this user"
      });
    }
    let user = await User.findById(userIdToUpdate);
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }  
    
    let profilePicUrl = user.profilePic;
    let profilePicPublicId = user.profilePicPublicId;
    
    // If a new profile picture is uploaded, update the URL and public ID
    if (req.file) {
      if(profilePicPublicId){
        //delete the previous image from cloudinary
        await cloudinary.uploader.destroy(profilePicPublicId);
      }
      const uploadResult = await new Promise((resolve, reject) => {
        const stream= cloudinary.uploader.upload_stream(
          { folder: 'profiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
          
        )
        stream.end(req.file.buffer);
      });
      profilePicUrl = uploadResult.secure_url;
      profilePicPublicId = uploadResult.public_id;
    }
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.zipCode = zipCode || user.zipCode;
    user.phoneNo = phoneNo || user.phoneNo;
    user.role = role || user.role;
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId;

    const updatedUser =  await user.save();
    return res.status(200).json({
      success:true,
      message:"Profile Updated Successfully",
      user:updatedUser,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can delete only your account!' });
    }

    await Promise.all([
      Cart.deleteMany({ userId: userId }),    
      Wishlist.deleteMany({ userId: userId }), 
      Order.deleteMany({ userId: userId }),    
    ]);

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ 
      success: true, 
      message: 'User and all associated data (cart, wishlist, orders) have been deleted.' 
    });

  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};