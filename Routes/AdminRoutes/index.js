const express = require('express');
const app = express();
const User = require('../../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

router.post('/register-admin', async (req, res) => {
const{name,email,password,role} = req.body;
try{
    const existingAdmin = await User.findOne({role:'admin'});
    if(existingAdmin){
        return res.status(400).json({message:"Admin already exists"});
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = new User({name,email,password: passwordHash,role:'admin'});
    await newAdmin.save();
    res.status(201).json({message:"Admin registered successfully"});
 }catch (error) {
    res.status(500).json({message:"Internal server error"});
 }  
});


router.post('/login-admin', async (req, res) => {
    const {email,password} = req.body;
    try{
        const admin = await User.findOne({email,role:'admin'});
        if(!admin){
            return res.status(400).json({message:"Invalid admin credentials"});
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid admin credentials"});
        }
        const token = jwt.sign({userId:admin._id}, process.env.JWT_SECRET, {expiresIn:'1h'});
        res.status(200).json({message:"Admin logged in successfully", token, name:admin.name, email:admin.email});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
});

module.exports = router;