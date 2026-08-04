const mongoose = require('mongoose');

const { Schema } = mongoose;

const voteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['up', 'down'], required: true },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    content: { type: String, required: true, maxlength: 500, trim: true },
    commentIDs: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    commentedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    commentedDate: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    votes: [voteSchema],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

commentSchema.virtual('url').get(function url() {
  return `comments/${this._id}`;
});

module.exports = mongoose.model('Comment', commentSchema);
