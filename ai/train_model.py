import os
import json
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models


# ==========================================
# SETTINGS
# ==========================================

DATASET_PATH = r"C:\Users\VISHAL CHAPALA\SmartAgri\ai\dataset\raw\color"
MODEL_DIR = r"C:\Users\VISHAL CHAPALA\SmartAgri\ai\model"

IMAGE_SIZE = 224
BATCH_SIZE = 16

# Start small so CPU training is manageable
MAX_IMAGES_PER_CLASS = 300

EPOCHS = 2


# ==========================================
# CREATE MODEL FOLDER
# ==========================================

os.makedirs(MODEL_DIR, exist_ok=True)


# ==========================================
# IMAGE TRANSFORMS
# ==========================================

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])


# ==========================================
# LOAD FULL DATASET
# ==========================================

print("\n🌱 Loading PlantVillage dataset...")

full_dataset = datasets.ImageFolder(
    DATASET_PATH,
    transform=transform
)

print("✅ Dataset loaded")
print("📸 Total images:", len(full_dataset))
print("🌿 Number of classes:", len(full_dataset.classes))


# ==========================================
# CREATE SMALL DATASET
# ==========================================

print("\n✂️ Creating smaller training dataset...")

selected_indices = []

for class_index in range(len(full_dataset.classes)):

    class_indices = [
        i for i, (_, label) in enumerate(full_dataset.samples)
        if label == class_index
    ]

    class_indices = class_indices[:MAX_IMAGES_PER_CLASS]

    selected_indices.extend(class_indices)


small_dataset = torch.utils.data.Subset(
    full_dataset,
    selected_indices
)

print("📸 Images selected:", len(small_dataset))


# ==========================================
# SAVE CLASS NAMES
# ==========================================

class_names = full_dataset.classes

with open(
    os.path.join(MODEL_DIR, "class_names.json"),
    "w"
) as file:

    json.dump(class_names, file, indent=4)

print("✅ Class names saved")


# ==========================================
# TRAIN / VALIDATION SPLIT
# ==========================================

train_size = int(0.8 * len(small_dataset))
validation_size = len(small_dataset) - train_size

train_dataset, validation_dataset = random_split(
    small_dataset,
    [train_size, validation_size],
    generator=torch.Generator().manual_seed(42)
)

print("📚 Training images:", len(train_dataset))
print("🧪 Validation images:", len(validation_dataset))


# ==========================================
# DATA LOADERS
# ==========================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0
)

validation_loader = DataLoader(
    validation_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)


# ==========================================
# LOAD RESNET18
# ==========================================

print("\n🧠 Loading ResNet18...")

weights = models.ResNet18_Weights.DEFAULT

model = models.resnet18(weights=weights)


# ==========================================
# FREEZE PRETRAINED LAYERS
# ==========================================

for parameter in model.parameters():
    parameter.requires_grad = False


# ==========================================
# REPLACE FINAL LAYER
# ==========================================

number_of_classes = len(class_names)

model.fc = nn.Linear(
    model.fc.in_features,
    number_of_classes
)


# ==========================================
# USE CPU
# ==========================================

device = torch.device("cpu")

model = model.to(device)

print("💻 Device:", device)


# ==========================================
# LOSS + OPTIMIZER
# ==========================================

criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam(
    model.fc.parameters(),
    lr=0.001
)


# ==========================================
# TRAIN
# ==========================================

print("\n🚀 Starting training...\n")

for epoch in range(EPOCHS):

    model.train()

    total_loss = 0
    correct = 0
    total = 0

    for batch_number, (images, labels) in enumerate(train_loader):

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs, labels)

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)

        correct += (predicted == labels).sum().item()

        if (batch_number + 1) % 20 == 0:

            print(
                f"Epoch {epoch + 1}/{EPOCHS} "
                f"| Batch {batch_number + 1}/{len(train_loader)}"
            )

    accuracy = 100 * correct / total

    print(
        f"\n✅ Epoch {epoch + 1} completed"
    )

    print(
        f"Loss: {total_loss / len(train_loader):.4f}"
    )

    print(
        f"Training Accuracy: {accuracy:.2f}%\n"
    )


# ==========================================
# VALIDATION
# ==========================================

print("🔎 Checking validation accuracy...")

model.eval()

correct = 0
total = 0

with torch.no_grad():

    for images, labels in validation_loader:

        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)

        _, predicted = torch.max(outputs, 1)

        total += labels.size(0)

        correct += (predicted == labels).sum().item()


validation_accuracy = 100 * correct / total

print(
    f"✅ Validation Accuracy: {validation_accuracy:.2f}%"
)


# ==========================================
# SAVE MODEL
# ==========================================

model_path = os.path.join(
    MODEL_DIR,
    "plant_disease_model.pth"
)

torch.save(
    {
        "model_state_dict": model.state_dict(),
        "class_names": class_names
    },
    model_path
)

print("\n💾 Model saved successfully!")

print(
    "📁",
    model_path
)

print("\n🎉 Training completed successfully! 🌱🤖")