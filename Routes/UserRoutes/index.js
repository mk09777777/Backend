const express = require('express');
const router = express.Router();
const User = require('../../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

router.post('/register', async (req, res) => {
    try{
        const {name,email,password} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return  res.status(400).json({message:"User already exists"});
        }   
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({name,email,password:hashedPassword});
        await newUser.save();
        console.log("User registered successfully",newUser);
        res.status(201).json({message:"User registered successfully"});
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({message:"Internal server error"});
    }
});
router.post('/login', async (req, res) => {
    try{
        const {email,password} = req.body;
        console.log('Login attempt:', { email, password: password ? 'provided' : 'missing' });
        
        const user = await User.findOne({email});
        console.log('User found:', user ? 'yes' : 'no');
        
        if(!user){
            console.log('User not found for email:', email);
            return res.status(400).json({message:"Invalid credentials"});
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        
        if(!isPasswordValid){
            console.log('Password comparison failed');
            return res.status(400).json({message:"Invalid credentials"});
        }
        
        const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn:'1h'});
        res.status(200).json({token});
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({message:"Internal server error"});
    }
});

router.post('/google-login', async (req, res) => {
    try {
        const { tokenId } = req.body;
        console.log('Google login attempt with tokenId:', tokenId ? 'provided' : 'missing');
        
        if (!tokenId) {
            return res.status(400).json({ message: "Token ID is required" });
        }

       const client = new OAuth2Client(process.env.CLIENT_ID);
       const ticket = await client.verifyIdToken({
           idToken: tokenId,
           audience: process.env.CLIENT_ID,
       });
       const payload = ticket.getPayload();
       const userId = payload['sub'];
       const email = payload['email'];

       let user = await User.findOne({ email });
       if (!user) {
           user = new User({ name: payload['name'], email, password: userId });
           await user.save();
       }

       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.status(200).json({ token });
   } catch (error) {
       console.error("Google login error:", error);
       res.status(500).json({ message: "Internal server error" });
   }
});



router.post('/google-signup', async (req, res) => {
    try{
        const { tokenId } = req.body;
        console.log('Google signup attempt with tokenId:', tokenId ? 'provided' : 'missing');
        
        if (!tokenId) {
            return res.status(400).json({ message: "Token ID is required" });
        }

        const client = new OAuth2Client(process.env.CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userId = payload['sub'];
        const email = payload['email'];

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name: payload['name'], email, password: userId });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error("Google signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post('/logout', (req, res) => {
try{
    res.clearCookie('token');
    res.status(200).json({message:"Logged out successfully"});
} catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({message:"Internal server error"});    
}
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in user document (you may want to add expiry time)
        user.resetOTP = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();
        
        // Configure nodemailer
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`
        };
        
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.resetOTP !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear OTP
        user.password = hashedPassword;
        user.resetOTP = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;