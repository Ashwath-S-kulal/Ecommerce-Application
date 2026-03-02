// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// export const sendOTPMail = async (otp, email) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS,
//     },
//   });

//   const mailConfigurations = {
//     from: `Sanjeevini Group Avarse <${process.env.MAIL_USER}>`,
//     to: email,
//     subject: `Verification Code: ${otp} - Sanjeevini Group`,
//     html: `
//     <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 10px; overflow: hidden;">
//         <div style="background-color: #db2777; padding: 20px; text-align: center;">
//             <h1 style="color: white; margin: 0; font-size: 24px;">Sanjeevini Group Avarse</h1>
//         </div>
//         <div style="padding: 30px; background-color: #ffffff; color: #333333;">
//             <h2 style="color: #1a1a1a;">Verify Your Account</h2>
//             <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
//             <p style="font-size: 16px; line-height: 1.6;">
//                 You are receiving this email because a request was made for a verification code related to your <b>Sanjeevini</b> account. Please use the following One-Time Password (OTP) to proceed:
//             </p>
//             <div style="text-align: center; margin: 30px 0;">
//                 <span style="display: inline-block; padding: 15px 30px; background-color: #fdf2f8; color: #db2777; font-size: 32px; font-weight: bold; letter-spacing: 5px; border: 2px dashed #db2777; border-radius: 8px;">
//                     ${otp}
//                 </span>
//             </div>
//             <p style="font-size: 14px; color: #666666; text-align: center;">
//                 This code is valid for <b>10 minutes</b>. For your security, please do not share this code with anyone.
//             </p>
//             <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
//             <p style="font-size: 12px; color: #999999; text-align: center; line-height: 1.4;">
//                 If you did not request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
//             </p>
//         </div>
//         <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999999;">
//             © 2026 Sanjeevini Group Avarse. All rights reserved.
//         </div>
//     </div>
//     `,
//   };

//   transporter.sendMail(mailConfigurations, function (error, info) {
//     if (error) throw Error(error);
//     console.log("OTP sent successfully: ");
//     console.log(info);
//   });
// };

export const sendOTPMail = async (otp, email) => {
  // Add this to check if the key is actually reaching Vercel
  if (!process.env.BREVO_API_KEY) {
    console.error("CRITICAL: BREVO_API_KEY is missing in Vercel!");
    return { success: false, error: "Configuration missing" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Sanjeevini Group",
          email: "ashwathsashwaths33@gmail.com",
        },
        to: [{ email: email }],
        subject: `OTP: ${otp}`,
        htmlContent: 
        `<!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                <td align="center" style="padding: 20px 0;">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    
                    <tr>
                        <td align="center" style="background-color: #db2777; padding: 30px 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Sanjeevini Group</h1>
                        <p style="color: #fce7f3; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Secure Verification</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                        <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Account Verification</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                            Hello, <br><br>
                            Thank you for choosing Sanjeevini Group. To complete your registration and secure your account, please use the verification code below:
                        </p>

                        <div style="text-align: center; background-color: #fdf2f8; border: 2px dashed #db2777; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                            <span style="font-size: 36px; font-weight: 800; color: #db2777; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                            ${otp}
                            </span>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                            This code will expire in <strong>10 minutes</strong>.<br>
                            If you did not request this code, please ignore this email.
                        </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 18px;">
                            &copy; 2026 Sanjeevini Group Avarse. All rights reserved.<br>
                            This is an automated security notification.
                        </p>
                        </td>
                    </tr>
                    </table>
                </td>
                </tr>
            </table>
            </body>
            </html>
            `,
      }),
    });

    const data = await response.json();
    console.log("Brevo Response:", data); // Check this in Vercel Logs
    return { success: true };
  } catch (err) {
    console.error("Vercel Edge Error:", err);
    return { success: false, error: err.message };
  }
};
