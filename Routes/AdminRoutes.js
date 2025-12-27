const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Car = require('../Models/Car');

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Admin signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email, role: 'admin' });
        const adminpresent = await User.find({role:'admin'})
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists with this email' });
        }
        if(adminpresent.length===1){
            return res.status(400).json({ message: 'admin is already created' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const admin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Admin created successfully',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all cars (admin only)
router.get('/cars', verifyAdmin, async (req, res) => {
    try {
        const cars = await Car.find({});
        res.json(cars);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



// Add new car (admin only)
router.post('/cars', verifyAdmin, async (req, res) => {
    try {
        const car = new Car(req.body);
        await car.save();
        res.status(201).json(car);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update car (admin only)
router.put('/cars/:id', verifyAdmin, async (req, res) => {
    try {
        const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete car (admin only)
router.delete('/cars/:id', verifyAdmin, async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;