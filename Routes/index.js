const express = require('express');
const router = express.Router();
const Car = require('../Models/Car');
const FeaturedCar = require('../Models/FeaturedCars');
const Review = require('../Models/Reviews');

// Add your routes here
router.get('/cars', async (req, res) => {
    try {
        const cars = await Car.find({});
        res.json(cars);
        res.status(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// adding cars from admin pannel using Post

router.post('/addCar',async(req,res)=>{
    const {name,image,type,seats,pricePerDay,fuelType,transmission,location,description}=req.body;
    if(!name || !image || !type || !seats || !pricePerDay || !fuelType || !transmission || !location || !description){
        return res.status(422).json({error:"Please fill all the fields"});
    }
    const CarName = await Car.findOne({name:name});
    if(CarName){
        return res.status(422).json({error:"Car already exists"});
    }
    try{
        const car = new Car({name,image,type,seats,pricePerDay,fuelType,transmission,location,description});
        await car.save();
        res.status(200).json({message:"Car added successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }

})

router.get('/FeaturedCars', async(req,res)=>{
    try{
        const FeaturedCars = await FeaturedCar.find({});
        res.json(FeaturedCars);
        res.status(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.get('/Reviews',async(req,res)=>{
try{
    const reviews = await Review.find({});
    res.json(reviews);
    res.status(200);

}catch(err){
    res.status(500).json({error:err.message});  
}
    
});


router.get('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;