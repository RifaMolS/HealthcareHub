import pickle
import sys

try:
    with open('label_encoders.pkl', 'rb') as f:
        le = pickle.load(f)
    print("Label encoders keys (Categorical Features):", list(le.keys()))
except Exception as e:
    print("Error reading encoders:", e)

try:
    with open('random_forest_diet_model.pkl', 'rb') as f:
        model = pickle.load(f)
    if hasattr(model, 'feature_names_in_'):
        print("Features expected:", list(model.feature_names_in_))
    else:
        print("Model has no feature_names_in_ attribute. It might not be a scikit-learn model, or it was saved with an older version.")
except Exception as e:
    print("Error reading model:", e)
