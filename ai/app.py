from flask import Flask, request, jsonify
import torch
import joblib
from torchvision import transforms, models
from PIL import Image
from torch import nn
import json


app = Flask(__name__)


# ==========================================
# FILE PATHS
# ==========================================

MODEL_PATH = r"C:\Users\VISHAL CHAPALA\SmartAgri\ai\model\plant_disease_model.pth"

CLASS_NAMES_PATH = r"C:\Users\VISHAL CHAPALA\SmartAgri\ai\model\class_names.json"
CROP_MODEL_PATH = r"C:\Users\VISHAL CHAPALA\SmartAgri\ai\model\crop_recommendation_model.pkl"


# ==========================================
# LOAD CLASS NAMES
# ==========================================

with open(CLASS_NAMES_PATH, "r") as file:
    class_names = json.load(file)

print("🌿 Classes loaded:", len(class_names))


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

print("🧠 Loading trained disease model...")

checkpoint = torch.load(
    MODEL_PATH,
    map_location=torch.device("cpu")
)

model = models.resnet18(weights=None)

model.fc = nn.Linear(
    model.fc.in_features,
    len(class_names)
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.eval()

print("✅ Disease model loaded successfully!")
# ==========================================
# LOAD CROP RECOMMENDATION MODEL
# ==========================================

crop_model = joblib.load(CROP_MODEL_PATH)

print("✅ Crop recommendation model loaded successfully!")


# ==========================================
# IMAGE TRANSFORMATION
# ==========================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])


# ==========================================
# DISEASE RECOMMENDATIONS
# ==========================================

recommendations = {

    "Apple___Apple_scab":
        "Remove infected leaves and fruits. Improve air circulation and avoid excessive moisture.",

    "Apple___Black_rot":
        "Remove infected plant material and prune affected branches. Keep the orchard clean.",

    "Apple___Cedar_apple_rust":
        "Remove infected leaves and improve air circulation. Monitor the plant regularly.",

    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot":
        "Remove heavily affected leaves and improve field airflow. Use recommended disease management practices.",

    "Corn_(maize)___Common_rust_":
        "Monitor the crop regularly and remove severely affected leaves. Follow appropriate fungicide guidance.",

    "Corn_(maize)___Northern_Leaf_Blight":
        "Remove severely affected leaves and maintain good field sanitation. Use resistant varieties when possible.",

    "Grape___Black_rot":
        "Remove infected leaves and fruit. Improve air circulation and avoid prolonged leaf wetness.",

    "Grape___Esca_(Black_Measles)":
        "Remove severely affected plant parts and monitor vines carefully. Consult an agricultural expert.",

    "Orange___Haunglongbing_(Citrus_greening)":
        "Remove severely affected plants and control insect vectors. Consult an agricultural expert.",

    "Peach___Bacterial_spot":
        "Remove affected leaves and fruit. Maintain good airflow and avoid unnecessary leaf wetness.",

    "Pepper,_bell___Bacterial_spot":
        "Remove infected leaves and maintain good sanitation. Avoid overhead watering.",

    "Potato___Early_blight":
        "Remove affected leaves and maintain proper field sanitation. Avoid excessive moisture on leaves.",

    "Potato___Late_blight":
        "Remove infected plant material immediately and avoid prolonged leaf wetness. Seek expert treatment advice.",

    "Squash___Powdery_mildew":
        "Improve air circulation and remove heavily infected leaves. Avoid overcrowding plants.",

    "Strawberry___Leaf_scorch":
        "Remove affected leaves and maintain good plant spacing and airflow.",

    "Cherry_(including_sour)___Powdery_mildew":
        "Improve air circulation and remove infected plant parts. Monitor the crop regularly.",

    "Tomato___Bacterial_spot":
        "Remove infected leaves and avoid overhead watering. Maintain good garden sanitation.",

    "Tomato___Early_blight":
        "Remove affected leaves, improve airflow and avoid watering the foliage.",

    "Tomato___Late_blight":
        "Remove infected plant material quickly and avoid prolonged leaf moisture. Consult an expert.",

    "Tomato___Leaf_Mold":
        "Improve ventilation and reduce humidity around plants. Remove infected leaves.",

    "Tomato___Septoria_leaf_spot":
        "Remove infected leaves and improve airflow. Avoid overhead watering.",

    "Tomato___Spider_mites Two-spotted_spider_mite":
        "Inspect the underside of leaves and maintain adequate plant moisture. Seek pest management advice.",

    "Tomato___Target_Spot":
        "Remove affected leaves and improve air circulation. Avoid excessive leaf moisture.",

    "Tomato___Tomato_mosaic_virus":
        "Remove infected plants or plant parts and disinfect tools. Control spread between plants.",

    "Tomato___Tomato_Yellow_Leaf_Curl_Virus":
        "Control whitefly populations and remove severely infected plants. Consult an agricultural expert."
}


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return jsonify({
        "message": "🌱 SmartAgri AI Server is Running!",
        "status": "success",
        "model": "Plant Disease ResNet18",
        "classes": len(class_names)
    })


# ==========================================
# PREDICTION
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        if "image" not in request.files:

            return jsonify({
                "message": "Please upload an image.",
                "status": "error"
            }), 400


        image_file = request.files["image"]

        print("📷 Image received:", image_file.filename)


        # Open image
        image = Image.open(image_file).convert("RGB")


        # Transform
        image_tensor = transform(image)

        image_tensor = image_tensor.unsqueeze(0)


        # AI prediction
        with torch.no_grad():

            outputs = model(image_tensor)

            probabilities = torch.softmax(
                outputs,
                dim=1
            )

            confidence, predicted_class = torch.max(
                probabilities,
                1
            )


        # Get class
        disease_code = class_names[
            predicted_class.item()
        ]


        confidence_percentage = (
            confidence.item() * 100
        )


        # ======================================
        # CLEAN CROP + DISEASE NAME
        # ======================================

        parts = disease_code.split("___")

        crop_name = parts[0]

        disease_name = parts[1] if len(parts) > 1 else "Unknown"


        # Clean crop name
        crop_name = crop_name.replace("_", " ")

        crop_name = crop_name.replace(
            "(including sour)",
            ""
        )

        crop_name = crop_name.replace(
            ",",
            ""
        )

        crop_name = crop_name.strip()


        # Clean disease
        disease_name = disease_name.replace(
            "_",
            " "
        )

        disease_name = disease_name.strip()


        # ======================================
        # HEALTHY CHECK
        # ======================================

        is_healthy = (
            "healthy" in disease_name.lower()
        )


        if is_healthy:

            status = "Healthy"

            recommendation = (
                "The plant appears healthy. "
                "Continue regular monitoring, proper watering "
                "and good crop care."
            )

        else:

            status = "Disease Detected"

            recommendation = recommendations.get(
                disease_code,
                "Monitor the plant carefully and consult an agricultural expert for appropriate treatment."
            )


        # ======================================
        # PRINT RESULT
        # ======================================

        print("🌱 Crop:", crop_name)

        print("🦠 Disease:", disease_name)

        print(
            f"📊 Confidence: {confidence_percentage:.2f}%"
        )


        # ======================================
        # SEND RESULT
        # ======================================

        return jsonify({

            "message":
                "AI prediction completed successfully.",

            "status": "success",

            "prediction": {

                "crop": crop_name,

                "disease": disease_name,

                "status": status,

                "confidence":
                    round(
                        confidence_percentage,
                        2
                    ),

                "recommendation":
                    recommendation
            }

        })


    except Exception as error:

        print(
            "❌ Prediction error:",
            str(error)
        )

        return jsonify({

            "message":
                "Failed to analyze image.",

            "status": "error",

            "error": str(error)

        }), 500
# ==========================================
# CROP RECOMMENDATION
# ==========================================

@app.route("/predict-crop", methods=["POST"])
def predict_crop():

    try:
        data = request.get_json()

        nitrogen = float(data["nitrogen"])
        phosphorus = float(data["phosphorus"])
        potassium = float(data["potassium"])
        temperature = float(data["temperature"])
        humidity = float(data["humidity"])
        ph = float(data["ph"])
        rainfall = float(data["rainfall"])

        features = [[
            nitrogen,
            phosphorus,
            potassium,
            temperature,
            humidity,
            ph,
            rainfall
        ]]

        prediction = crop_model.predict(features)[0]

        probabilities = crop_model.predict_proba(features)[0]
        confidence = max(probabilities) * 100
        
        # ==========================================
        # CROP RECOMMENDATION EXPLANATION
        # ==========================================

        reason = (
            f"The AI model analyzed the soil nutrients (N: {nitrogen}, "
            f"P: {phosphorus}, K: {potassium}), temperature "
            f"({temperature}°C), humidity ({humidity}%), soil pH "
            f"({ph}), and rainfall ({rainfall} mm). "
            f"Based on these conditions, the model recommends {prediction}."
        )
        print("🌱 Recommended Crop:", prediction)
        print(f"📊 Confidence: {confidence:.2f}%")

        return jsonify({
            "status": "success",
            "prediction": {
    "crop": prediction,
    "confidence": round(confidence, 2),
    "reason": reason
}
        })

    except Exception as error:

        print("❌ Crop recommendation error:", error)

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )