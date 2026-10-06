const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, required: true, enum: ['Employer', 'Employee'] },
    employer_username: { type: String, default: null },
  },
  {
    timestamps: true, // adds createdAt/updatedAt for you
    toJSON: {
      // runs on every res.json(user)
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // the frontend uses user.id
        delete ret._id;
        delete ret.__v;
        delete ret.password_hash;    // never leaks the hash
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);