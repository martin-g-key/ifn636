// router using express module

const express = require('express');
const mongoose = require('mongoose');
const TripsModel = require('./models/Trips');
const UsersModel = require('./models/Users');

const router = express.Router();

// id validation check
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// If the body field is in the editable list, then accept from json object
// define editable fields
const editable_fields = ['trip_date', 'start_odometer', 'end_odometer', 'purpose']

function pick_editable_body(body) {
    const out = {};
    for (const field of editable_fields) {
        if (body[field] !== undefined) out[field] = body[field];
    }
    return out;
}

// use the username to find user role
// control what trips can be seen based on user role 
async function trips_scope(req) {
    if (req.user.role === 'Employee') {
        return {user: req.user.sub }; 
    }
    const employees = await UsersModel.find({ employer_username: req.user.username }).select('_id');
    const ids = employees.map((e) => e._id);
    ids.push(req.user.sub);
    return { user: { $in: ids } };
}

/// PLACEHOLDER mongoose validation checks in editable_fields 

// GET -- All trips that the user can see based on role 
router.get('/', async (req, res, next) => {
    try {
        // filter based on user role
        const filter = await trips_scope(req);

        // PLACEHOLDER FY year filter
        
        // check user data
        const trips = await TripsModel.find(filter)
            .populate("user", "username")
            .sort({ trip_date: -1 });
        res.json(trips);
    } catch (err) {
        next(err); 
    }
});

// POST -- Add trips
router.post('/', async (req, res, next) => {
    try {
        // check that the user still exists as there are no foreign keys in nosql, 
        const owner = await UsersModel.exists({ _id: req.user.sub });
        if (!owner) return res.status(401).json({ error: 'user no longer exists' });

        const created = await TripsModel.create({
            ...pick_editable_body(req.body),
            user: req.user.sub,
        });
        res.status(201).json(created);


    } catch (err) { next(err); } // to be updated with data validation ticket
});


module.exports = router; 