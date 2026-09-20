const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const Farm = require("./models/Farm");
const User = require("./models/User");
const bcrypt = require("bcrypt");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());


// ======================================================
// FILE UPLOAD CONFIGURATION
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });


// ======================================================
// BASIC TEST ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "🌱 SmartAgri Backend is Running!",
    status: "success",
  });
});


// ======================================================
// AUTHENTICATION - SIGNUP
// ======================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Failed to create account.",
    });
  }
});


// ======================================================
// AUTHENTICATION - LOGIN
// ======================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Failed to login.",
    });
  }
});


// ======================================================
// PROFILE - UPDATE
// ======================================================

app.put("/api/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      farmName,
      location,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      user.email = email.toLowerCase().trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (farmName !== undefined) {
      user.farmName = farmName.trim();
    }

    if (location !== undefined) {
      user.location = location.trim();
    }

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
});


// ======================================================
// PROFILE - GET
// ======================================================

app.get("/api/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch profile.",
    });
  }
});

console.log("✅ PROFILE GET ROUTE LOADED");

app.get("/api/test-profile", (req, res) => {
  res.json({
    message: "PROFILE ROUTE TEST WORKING"
  });
});


// ======================================================
// CROP RECOMMENDATION
// ======================================================

app.post("/api/crop-recommendation", async (req, res) => {
  try {
    const {
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      ph,
      rainfall,
      soilType,
    } = req.body;

    if (
      nitrogen === undefined ||
      phosphorus === undefined ||
      potassium === undefined ||
      temperature === undefined ||
      humidity === undefined ||
      ph === undefined ||
      rainfall === undefined ||
      !soilType
    ) {
      return res.status(400).json({
        message: "Please provide all crop conditions.",
      });
    }

    const response = await axios.post(
      "http://127.0.0.1:8000/predict-crop",
      {
        nitrogen: Number(nitrogen),
        phosphorus: Number(phosphorus),
        potassium: Number(potassium),
        temperature: Number(temperature),
        humidity: Number(humidity),
        ph: Number(ph),
        rainfall: Number(rainfall),
      }
    );

    const prediction = response.data.prediction;

    res.json({
      message: "AI crop recommendation generated successfully",

      recommendation: {
        crop: prediction.crop,
        confidence: prediction.confidence,

        reason:
          "The recommendation was generated using the SmartAgri Random Forest machine learning model.",

        input: {
          nitrogen,
          phosphorus,
          potassium,
          temperature,
          humidity,
          ph,
          rainfall,
          soilType,
        },
      },
    });
  } catch (error) {
    console.error(
      "Crop ML recommendation failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to generate AI crop recommendation",
      error: error.message,
    });
  }
});


// ======================================================
// FARM - GET ALL FARMS
// ======================================================

app.get("/api/farms", async (req, res) => {
  try {
    const farms = await Farm.find().sort({
      createdAt: -1,
    });

    res.json({
      message: "Farms fetched successfully",
      farms: farms,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch farms",
      error: error.message,
    });
  }
});


// ======================================================
// FARM - CREATE
// ======================================================

app.post("/api/farms", async (req, res) => {
  try {
    const farm = new Farm(req.body);

    const savedFarm = await farm.save();

    res.status(201).json({
      message: "🚜 Farm saved successfully!",
      farm: savedFarm,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save farm",
      error: error.message,
    });
  }
});


// ======================================================
// DISEASE DETECTION
// ======================================================

app.post(
  "/api/disease-detection",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a crop image.",
        });
      }

      console.log(
        "📷 Image received:",
        req.file.filename
      );

      const formData = new FormData();

      formData.append(
        "image",
        fs.createReadStream(req.file.path)
      );

      const aiResponse = await axios.post(
        "http://127.0.0.1:8000/predict",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      console.log(
        "🤖 AI response:",
        aiResponse.data
      );

      res.json({
        message: "Image analyzed successfully!",

        image: {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          size: req.file.size,
        },

        prediction: aiResponse.data.prediction,
      });
    } catch (error) {
      console.error(
        "❌ AI server error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to communicate with AI server.",
        error: error.message,
      });
    }
  }
);


// ======================================================
// SOIL ANALYSIS
// ======================================================

app.post("/api/soil-analysis", async (req, res) => {
  try {
    const {
      nitrogen,
      phosphorus,
      potassium,
      ph,
      moisture,
      soilType,
    } = req.body;

    if (
      nitrogen === undefined ||
      phosphorus === undefined ||
      potassium === undefined ||
      ph === undefined ||
      moisture === undefined ||
      !soilType
    ) {
      return res.status(400).json({
        message: "Please provide all soil details.",
      });
    }

    let condition = "";
    let recommendation = "";

    if (
      nitrogen >= 50 &&
      phosphorus >= 30 &&
      potassium >= 30 &&
      ph >= 6 &&
      ph <= 7.5 &&
      moisture >= 40 &&
      moisture <= 70
    ) {
      condition = "Healthy Soil";

      recommendation =
        "The soil has good nutrient levels, suitable pH and sufficient moisture. It is generally suitable for crop cultivation.";
    } else if (
      nitrogen < 50 ||
      phosphorus < 30 ||
      potassium < 30
    ) {
      condition = "Nutrient Deficient";

      recommendation =
        "The soil may require additional nutrients. Consider using suitable organic manure or fertilizer based on a professional soil test.";
    } else if (ph < 6) {
      condition = "Acidic Soil";

      recommendation =
        "The soil is acidic. Consider suitable soil amendments after consulting an agricultural expert.";
    } else if (ph > 7.5) {
      condition = "Alkaline Soil";

      recommendation =
        "The soil is alkaline. Suitable soil management practices may be required to improve nutrient availability.";
    } else if (moisture < 40) {
      condition = "Low Soil Moisture";

      recommendation =
        "The soil moisture is low. Irrigation may be required depending on the crop and weather conditions.";
    } else if (moisture > 70) {
      condition = "High Soil Moisture";

      recommendation =
        "The soil has high moisture. Avoid excessive irrigation and ensure proper drainage.";
    } else {
      condition = "Moderate Soil Condition";

      recommendation =
        "The soil condition is moderate. Regular monitoring of nutrients, pH and moisture is recommended.";
    }

    res.json({
      message: "Soil analysis completed successfully",

      result: {
        condition,
        recommendation,
        nitrogen,
        phosphorus,
        potassium,
        ph,
        moisture,
        soilType,
      },
    });
  } catch (error) {
    console.error(
      "❌ Soil analysis error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to analyze soil.",
      error: error.message,
    });
  }
});


// ======================================================
// FERTILIZER RECOMMENDATION
// ======================================================

app.post(
  "/api/fertilizer-recommendation",
  async (req, res) => {
    try {
      const {
        nitrogen,
        phosphorus,
        potassium,
        ph,
        moisture,
        soilType,
      } = req.body;

      if (
        nitrogen === undefined ||
        phosphorus === undefined ||
        potassium === undefined ||
        ph === undefined ||
        moisture === undefined ||
        !soilType
      ) {
        return res.status(400).json({
          message: "Please provide all soil details.",
        });
      }

      const n = Number(nitrogen);
      const p = Number(phosphorus);
      const k = Number(potassium);
      const soilPh = Number(ph);
      const soilMoisture = Number(moisture);

      let fertilizer = "";
      let reason = "";
      let usage = "";

      if (n < 50) {
        fertilizer = "Urea";

        reason =
          "Nitrogen level is low. Nitrogen fertilizer can support plant growth and leaf development.";

        usage =
          "Apply according to the crop requirement and a proper soil-test recommendation.";
      } else if (p < 30) {
        fertilizer = "DAP (Diammonium Phosphate)";

        reason =
          "Phosphorus level is low. Phosphorus supports root development and flowering.";

        usage =
          "Apply DAP according to the crop requirement and recommended agricultural dosage.";
      } else if (k < 30) {
        fertilizer = "MOP (Muriate of Potash)";

        reason =
          "Potassium level is low. Potassium helps improve plant strength and crop quality.";

        usage =
          "Apply potassium fertilizer according to crop requirements and soil-test recommendations.";
      } else if (soilPh < 6) {
        fertilizer = "Agricultural Lime";

        reason =
          "The soil is acidic. Lime can help increase soil pH and improve nutrient availability.";

        usage =
          "Apply lime only after confirming soil acidity through a proper soil test.";
      } else if (soilPh > 7.5) {
        fertilizer = "Sulfur-based Soil Amendment";

        reason =
          "The soil is alkaline. A suitable soil amendment may help improve nutrient availability.";

        usage =
          "Use soil amendments carefully based on soil-test results and expert advice.";
      } else if (soilMoisture > 70) {
        fertilizer = "No Immediate Fertilizer Required";

        reason =
          "The soil moisture is high. Excess moisture can affect nutrient uptake and root health.";

        usage =
          "Improve drainage and avoid excessive irrigation before applying fertilizer.";
      } else {
        fertilizer = "Balanced NPK Fertilizer";

        reason =
          "The soil has relatively balanced nutrient levels and suitable pH.";

        usage =
          "Use a balanced fertilizer according to the crop type and recommended dosage.";
      }

      res.json({
        message:
          "Fertilizer recommendation generated successfully",

        recommendation: {
          fertilizer,
          reason,
          usage,
          nitrogen: n,
          phosphorus: p,
          potassium: k,
          ph: soilPh,
          moisture: soilMoisture,
          soilType,
        },
      });
    } catch (error) {
      console.error(
        "❌ Fertilizer recommendation error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to generate fertilizer recommendation.",
        error: error.message,
      });
    }
  }
);


// ======================================================
// MONGODB CONNECTION + SERVER START
// ======================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "✅ MongoDB connected successfully"
    );

    app.listen(PORT, () => {
      console.log(
        `🚀 SmartAgri server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );
  });