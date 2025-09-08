# Stunting Detection using Naive Bayes

## Introduction
Stunting is a condition where children have low height-for-age due to chronic malnutrition.  
**Naive Bayes** is a probabilistic classifier that can predict the likelihood of a child being stunted based on various features.

### Example Features
- Age (in months)  
- Weight (kg)  
- Height (cm)  
- Family Income  
- Parents' Education  
- Access to clean water and nutrition  

Label:
- `1` = Stunted  
- `0` = Not Stunted  

## How Naive Bayes Works
1. Naive Bayes assumes features are independent given the class label.  
2. Calculates **prior probability** of each class.  
3. Calculates **likelihood** of features given the class.  
4. Computes **posterior probability** for prediction.  
5. Chooses the class with the highest probability.  

## Python Implementation (Simplified Example)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import classification_report, accuracy_score

# Example dataset (toy data)
data = {
    "age": [24, 36, 18, 30, 20, 40, 28],
    "weight": [10, 14, 8, 12, 9, 15, 11],
    "height": [80, 95, 75, 90, 78, 100, 85],
    "income": [1000000, 3000000, 800000, 2500000, 900000, 4000000, 1200000],
    "stunted": [1, 0, 1, 0, 1, 0, 1]
}
df = pd.DataFrame(data)

# Features and label
X = df[["age", "weight", "height", "income"]]
y = df["stunted"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train Naive Bayes
model = GaussianNB()
model.fit(X_train, y_train)

# Prediction
y_pred = model.predict(X_test)

# Evaluation
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))
