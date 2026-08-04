const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    displayName: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    reputation: { type: Number, default: 100 },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.virtual('url').get(function url() {
  return `users/${this._id}`;
});

module.exports = mongoose.model('User', userSchema);
