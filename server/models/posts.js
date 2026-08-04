const mongoose = require('mongoose');

const { Schema } = mongoose;

const voteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['up', 'down'], required: true },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 100, trim: true },
    content: { type: String, required: true, trim: true },
    linkFlairID: { type: Schema.Types.ObjectId, ref: 'LinkFlair', default: null },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postedDate: { type: Date, default: Date.now },
    commentIDs: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    views: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    votes: [voteSchema],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

postSchema.virtual('url').get(function url() {
  return `posts/${this._id}`;
});

module.exports = mongoose.model('Post', postSchema);
