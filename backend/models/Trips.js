const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
    {
        // fix data types.
        user: { type: mongoose.Schema.Types.ObjectId, ref:'User', required: true, index: true},
        trip_date: { type: Date, required: true}, // should be date
        start_odometer: {type: Number, required: true, min: 0}, // should be int
        end_odometer: {type: Number, required: true, min: 0}, // should be int
        distance_km: {type: Number}, // should be int, derived from end_odometer - start_odometer
        purpose: {type: String, required: true, enum: ['Business', 'Private'] },
        fin_year: {type: Number}, // should be year, derived from trip_date
    },
    {
    timestamps: true,
    toJSON: {
      // runs on every res.json(trip)
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // the frontend uses user.id
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// generate fin_year and distance_km 
tripSchema.pre('validate', function () {
  // distance_km
  if (this.start_odometer != null && this.end_odometer != null) {
    if (this.end_odometer < this.start_odometer) {
      this.invalidate('end_odometer', 'end_odometer must be >= start_odometer');
    }
    this.distance_km = this.end_odometer - this.start_odometer;
  }

  // fin_year
  if (this.trip_date) {
    const year = this.trip_date.getUTCFullYear();
    const month = this.trip_date.getUTCMonth();
    this.fin_year = month >= 6 ? year + 1 : year;
  }
});


module.exports = mongoose.model('Trip', tripSchema);