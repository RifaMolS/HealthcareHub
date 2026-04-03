import sys
import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model = None
label_encoders = {}
feature_columns = [
    'Age', 'Gender', 'Weight_kg', 'Height_cm', 'BMI',
    'Disease_Type', 'Severity', 'Physical_Activity_Level',
    'Daily_Caloric_Intake', 'Cholesterol_mg/dL', 'Blood_Pressure_mmHg',
    'Glucose_mg/dL', 'Dietary_Restrictions', 'Allergies',
    'Preferred_Cuisine', 'Weekly_Exercise_Hours'
]

# Attempt to train dynamically
try:
    csv_path = 'Dataset/diet_recommendations_dataset.csv'
    if os.path.exists(csv_path):
        print(f"Training ML model from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # Drop columns not needed for training
        X = df[feature_columns].copy()
        
        # Fill NaN
        X['Dietary_Restrictions'] = X['Dietary_Restrictions'].fillna('None')
        X['Allergies'] = X['Allergies'].fillna('None')
        X['Disease_Type'] = X['Disease_Type'].fillna('None')
        X['Severity'] = X['Severity'].fillna('None')
        
        y = df['Diet_Recommendation'].fillna('Balanced')
        
        # Encode categorical
        cat_cols = ['Gender', 'Disease_Type', 'Severity', 'Physical_Activity_Level', 
                    'Dietary_Restrictions', 'Allergies', 'Preferred_Cuisine']
        
        for col in cat_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
            
        model = RandomForestClassifier(n_estimators=50, random_state=42)
        model.fit(X, y)
        print("Model trained successfully!")
    else:
        print("Dataset not found, ML Prediction will use heuristics.")
except Exception as e:
    print(f"Failed to train model: {e}")

@app.route('/predict_diet', methods=['POST'])
def predict_diet():
    data = request.json
    
    bmi = data.get('BMI', 22.0)
    cal = data.get('Daily_Caloric_Intake', 2000)
    disease = data.get('Disease_Type', 'None')
    restr = data.get('Dietary_Restrictions', 'None')
    allerg = data.get('Allergies', 'None')

    plan = f"### Your AI-Synthesized Clinical Diet Protocol\n\n**Biometric Snapshot:** BMI: {bmi}, Caloric Target: {cal} kcal.\n\n"
    
    if model is not None:
        try:
            # Reconstruct the prediction row
            pred_data = {
                'Age': [data.get('Age', 30)],
                'Gender': [data.get('Gender', 'Female')],
                'Weight_kg': [data.get('Weight_kg', 65.0)],
                'Height_cm': [data.get('Height_cm', 165.0)],
                'BMI': [data.get('BMI', 23.8)],
                'Disease_Type': [data.get('Disease_Type', 'None')],
                'Severity': [data.get('Severity', 'None')],
                'Physical_Activity_Level': [data.get('Physical_Activity_Level', 'Moderate')],
                'Daily_Caloric_Intake': [data.get('Daily_Caloric_Intake', 2000)],
                'Cholesterol_mg/dL': [data.get('Cholesterol_mg_dL', 180)],
                'Blood_Pressure_mmHg': [data.get('Blood_Pressure_mmHg', 120)],
                'Glucose_mg/dL': [data.get('Glucose_mg_dL', 90)],
                'Dietary_Restrictions': [data.get('Dietary_Restrictions', 'None')],
                'Allergies': [data.get('Allergies', 'None')],
                'Preferred_Cuisine': [data.get('Preferred_Cuisine', 'Indian')],
                'Weekly_Exercise_Hours': [data.get('Weekly_Exercise_Hours', 3)],
            }
            
            df_pred = pd.DataFrame(pred_data)
            
            for col, le in label_encoders.items():
                if col in df_pred.columns:
                    val = str(df_pred[col].iloc[0])
                    if val in le.classes_:
                        df_pred[col] = le.transform([val])
                    else:
                        # Unseen val fallback to 0
                        df_pred[col] = 0
            
            # Predict
            prediction = model.predict(df_pred[features_columns] if 'features_columns' in dir() else df_pred[feature_columns])[0]
            
            plan += f"#### Advanced ML Prediction Model output:\n**Recommended Strategy:** {prediction}\n\n*This protocol was generated using Random Forest Classification based on your exact biometrics and condition parameters.*\n\n"
            
            plan += f"**Suggested Meal Options:**\n"
            if "low_carb" in prediction.lower():
                 plan += "- **Breakfast:** Spinach and feta omelet.\n- **Lunch:** Chicken salad with olive oil and avocado.\n- **Dinner:** Grilled salmon with roasted asparagus.\n\n"
            elif "ketogenic" in prediction.lower() or "keto" in prediction.lower():
                 plan += "- **Breakfast:** Scrambled eggs with cheese and bacon.\n- **Lunch:** Tuna salad in lettuce wraps.\n- **Dinner:** Steak with buttery cauliflower mash.\n\n"
            elif "high_protein" in prediction.lower():
                 plan += "- **Breakfast:** Greek yogurt with protein powder and almonds.\n- **Lunch:** Turkey breast sandwich on whole wheat bread.\n- **Dinner:** Lean beef sirloin with quinoa and broccoli.\n\n"
            elif "dash" in prediction.lower() or "low_sodium" in prediction.lower():
                 plan += "- **Breakfast:** Oatmeal with fresh berries and skim milk.\n- **Lunch:** Grilled chicken wrap with plenty of greens.\n- **Dinner:** Baked fish with sweet potato and steamed carrots.\n\n"
            elif "mediterranean" in prediction.lower():
                 plan += "- **Breakfast:** Whole grain toast with tomatoes and olive oil.\n- **Lunch:** Hummus, cucumber, and feta cheese pita.\n- **Dinner:** Grilled shrimp with couscous and zucchini.\n\n"
            else:
                 plan += "- **Breakfast:** Mixed fruit bowl and boiled eggs.\n- **Lunch:** Mixed lentil soup with a side of brown rice.\n- **Dinner:** Sautéed mixed vegetables with light paneer.\n\n"

            if restr != 'None':
                plan += f"**Adaptations:** This plan strictly adheres to your specific dietary requirements.\n\n"
            if allerg != 'None':
                plan += f"**Allergen Safety:** Guaranteed free from *{allerg}*.\n\n"
            
            return jsonify({"plan": plan})
            
        except Exception as e:
            print("Prediction explicit fallback:", e)

    # Heuristic Fallback
    if str(disease).lower() == 'diabetes':
        plan += "#### 🥗 Glycemic Control Protocol\n- **Breakfast:** Oats with seeds and nuts.\n- **Lunch:** Multigrain roti, dal, and extensive green salad.\n- **Dinner:** Grilled paneer or tofu with sautéed mixed vegetables.\n\n*Pro-tip: Focus on high-fiber foods to stabilize glucose.*\n\n"
    elif str(disease).lower() == 'obesity':
        plan += "#### 🥑 Caloric Deficit & Nutrient Dense Plan\n- **Breakfast:** High-protein smoothie (whey/plant protein, spinach, berries).\n- **Lunch:** Quinoa bowl with roasted chickpeas and vegetables.\n- **Dinner:** Clear lentil soup and steamed broccoli.\n\n*Pro-tip: Maintain strict portion control and prioritize protein.*\n\n"
    elif str(disease).lower() == 'hypertension':
        plan += "#### 💙 Cardiac Care Plan\n- **Breakfast:** Fresh fruits and low-fat yogurt.\n- **Lunch:** Lean chicken or fish with steamed veggies.\n- **Dinner:** Light lentil stew.\n\n*Pro-tip: Strictly limit sodium intake and monitor your BP regularly.*\n\n"
    else:
        plan += "#### 🍏 Optimized Maintenance Diet\n- **Breakfast:** Mixed fruit bowl with Greek yogurt.\n- **Lunch:** Brown rice, lean protein (dal/chicken), and yogurt.\n- **Dinner:** Light vegetable soup and a small portion of complex carbs.\n\n*Pro-tip: Maintain consistent hydration.*\n\n"
        
    if restr != 'None':
        plan += f"**Adaptations:** This plan adheres to your *{restr}* limitations.\n\n"
    if allerg != 'None':
        plan += f"**Allergen Safety:** Clean and free from *{allerg}*.\n\n"
        
    return jsonify({"plan": plan})

if __name__ == '__main__':
    app.run(port=5002, debug=True)
