const mongoose = require('mongoose');

const { Schema } = mongoose;

const linkFlairSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 30,
      trim: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

linkFlairSchema.virtual('url').get(function url() {
  return `linkFlairs/${this._id}`;
});

module.exports = mongoose.model('LinkFlair', linkFlairSchema);