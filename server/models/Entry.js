const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    guestName: { type: String, required: true },
    mobile: { type: String, required: true },
    houseId: { type: String, required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    entryTime: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Entry", entrySchema);
