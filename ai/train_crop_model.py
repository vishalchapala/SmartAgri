import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


# ==============================
# 1. Load Dataset
# ==============================

data = pd.read_csv("dataset/Crop_recommendation.csv")

print("Dataset loaded successfully!")
print("Rows:", len(data))
print("Columns:", list(data.columns))


# ==============================
# 2. Select Features
# ==============================

X = data[
    [
        "N",
        "P",
        "K",
        "temperature",
        "humidity",
        "ph",
        "rainfall",
    ]
]

y = data["label"]


# ==============================
# 3. Split Dataset
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)


# ==============================
# 4. Create ML Model
# ==============================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
)


# ==============================
# 5. Train
# ==============================

print("\nTraining model...")

model.fit(X_train, y_train)


# ==============================
# 6. Test Model
# ==============================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions,
)

print("\n==============================")
print("Crop Recommendation Model")
print("==============================")

print(f"Accuracy: {accuracy * 100:.2f}%")


# ==============================
# 7. Save Model
# ==============================

joblib.dump(
    model,
    "model/crop_recommendation_model.pkl",
)

print("\n✅ Model saved successfully!")
