import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.datasets import mnist

# Load dataset
(x_train, y_train), (x_test, y_test) = mnist.load_data()

print(x_train.shape)
print(y_train.shape)

# Preprocess
x_train = x_train.reshape(60000, 784).astype("float32") / 255.0
x_test = x_test.reshape(10000, 784).astype("float32") / 255.0

# Build model
model = keras.Sequential([
    layers.Dense(512, activation='relu'),
    layers.Dense(256, activation='relu'),
    layers.Dense(10, activation='softmax')   # softmax for probabilities
])

# Compile model
model.compile(
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=False),
    optimizer=keras.optimizers.Adam(0.020),
    metrics=['accuracy'],
)

# Train
model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=10,
    verbose=2
)

# Evaluate
model.evaluate(x_test, y_test, batch_size=64, verbose=2)

# Example prediction
predictions = model.predict(x_test[:5])
print("Predicted probabilities:\n", predictions)
print("Predicted labels:\n", predictions.argmax(axis=1))
print("True labels:\n", y_test[:5])

