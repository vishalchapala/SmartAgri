
const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    farmName: {
      type: String,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    mainCrop: {
      type: String,
      required: true,
    },

    soilType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Farm = mongoose.model("Farm", farmSchema);

module.exports = Farm;