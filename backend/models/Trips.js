const mongoose = require('mongoose');
const FinancialYear = require('../services/FinancialYear');

const tripSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trip_date: { type: Date, required: true },
    start_odometer: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'start_odometer must be an integer' },
    },
    end_odometer: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'end_odometer must be an integer' },
    },
    // derived: end_odometer - start_odometer
    distance_km: { type: Number },
    purpose: { type: String, required: true, enum: ['Business', 'Private'] },
    // derived from trip_date, e.g. "2025-26" (financial year runs 1 Jul - 30 Jun)
    fin_year: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      // runs on every res.json(trip)
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // the frontend uses trip.id
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Generate fin_year and distance_km
tripSchema.pre('validate', function () {
  // distance_km
  if (this.start_odometer != null && this.end_odometer != null) {
    if (this.end_odometer < this.start_odometer) {
      this.invalidate('end_odometer', 'end_odometer must be >= start_odometer');
    } else {
      this.distance_km = this.end_odometer - this.start_odometer;
    }
  }

  // fin_year, e.g. "2025-26"
  if (this.trip_date) this.fin_year = FinancialYear.forDate(this.trip_date);
});

module.exports = mongoose.model('Trip', tripSchema);
