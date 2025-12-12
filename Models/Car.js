const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    // Add your car fields here
     name:String,
        image:String,
        type:String,
        seats:String,
        pricePerDay:String,
        rating:Number,
        fuelType:String,
        transmission:String,
        location:String,
        description:String,
        booking:Boolean
    // Add more fields as needed
});

module.exports = mongoose.model('Car', carSchema, 'CarsList');