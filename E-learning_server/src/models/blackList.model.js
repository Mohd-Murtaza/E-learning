const mongoose = require("mongoose");

const blacklistSchema = mongoose.Schema(
  {
    accesstoken: {
      type: String,
    },
  },
  { versionKey: false }
);

const BlackListModel = mongoose.model("BlackListModel", blacklistSchema);

module.exports = { BlackListModel };
