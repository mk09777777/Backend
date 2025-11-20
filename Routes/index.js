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



module.exports = router;