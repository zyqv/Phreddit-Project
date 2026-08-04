const mongoose = require('mongoose');

const { Schema } = mongoose;

const communitySchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100, trim: true, unique: true },
    description: { type: String, required: true, maxlength: 500, trim: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postIDs: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    startDate: { type: Date, default: Date.now },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

communitySchema.virtual('memberCount').get(function memberCount() {
  return this.members.length;
});

communitySchema.virtual('url').get(function url() {
  return `communities/${this._id}`;
});

module.exports = mongoose.model('Community', communitySchema);
