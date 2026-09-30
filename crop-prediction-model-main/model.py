#Importing Liabraries

import numpy as np
import pandas as pd
import pickle

#For data visualization
import matplotlib.pyplot as plt
import seaborn as sns

#For warnings
import warnings
warnings.filterwarnings('ignore')

#For Clustering Analysis
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import accuracy_score

#Loading Dataset
data = pd.read_csv('Crop_recommendation.csv')
data

#Shape of dataset
print("Shape of the dataset :", data.shape)

#Checking missing values
data.isnull().sum()

#Checking Crops present in Dataset
data['label'].value_counts()

# Exclude 'label' column for correlation matrix
fig, ax = plt.subplots(1, 1, figsize=(15, 9))
sns.heatmap(data.drop(['label'], axis=1).corr(), annot=True, cmap='viridis')
ax.set(xlabel='features')
ax.set(ylabel='features')

#plt.title('Correlation between different features', fontsize = 15, c='black')
#plt.show()

#sns.pairplot(data,hue = 'label')

print("Average Ratio of nitrogen in the soil : {0: .2f}".format(data['N'].mean()))
print("Average Ratio of Phosphorous in the soil : {0: .2f}".format(data['P'].mean()))
print("Average Ratio of Potassium in the soil : {0: .2f}".format(data['K'].mean()))
print("Average temperature in Celsius : {0: .2f}".format(data['temperature'].mean()))
print("Average Relative Humidity in % is : {0: .2f}".format(data['humidity'].mean()))
print("Average pH value of the soil : {0: .2f}".format(data['ph'].mean()))
print("Average Rain fall in mm : {0: .2f}".format(data['rainfall'].mean()))

# Remove all @interact decorators and their associated functions


plt.figure(figsize=(15,8))
plt.subplot(2,4,1)
sns.distplot(data['N'],color = 'blue')
plt.xlabel('Ratio of Nitrogen',fontsize = 12)
plt.grid()

plt.subplot(2,4,2)
sns.distplot(data['P'],color = 'green')
plt.xlabel('Ratio of Phosphorous',fontsize = 12)
plt.grid()

plt.subplot(2,4,3)
sns.distplot(data['K'],color = 'darkblue')
plt.xlabel('Ratio of Potassium',fontsize = 12)
plt.grid()

plt.subplot(2,4,4)
sns.distplot(data['temperature'],color = 'black')
plt.xlabel('Temperature',fontsize = 12)
plt.grid()

plt.subplot(2,4,5)
sns.distplot(data['rainfall'],color = 'grey')
plt.xlabel('Rainfall',fontsize = 12)
plt.grid()

plt.subplot(2,4,6)
sns.distplot(data['humidity'],color = 'lightgreen')
plt.xlabel('Humidity',fontsize = 12)
plt.grid()

plt.subplot(2,4,7)
sns.distplot(data['ph'],color = 'darkgreen')
plt.xlabel('ph level',fontsize = 12)
plt.grid()

plt.suptitle('Distribution for Agricultural Conditions', fontsize = 20)
#plt.show()


# Remove all @interact decorators and their associated functions

print("Crops which requires very High rainfall:",data[data['rainfall'] > 200]['label'].unique())
print("Crops which requires very Low rainfall:",data[data['rainfall'] < 40]['label'].unique())

print("Crops which requires very High ratio of Nitrogen Content in soil :",data[data['N'] > 120]['label'].unique())
print("Crops which requires very High ratio of Phosphorous Content in soil :",data[data['P'] > 100]['label'].unique())
print("Crops which requires very High ratio of Potassium Content in soil :",data[data['K'] > 200]['label'].unique())
print("Crops which requires very High Rainfall :",data[data['rainfall'] > 200]['label'].unique())
print("Crops which requires very Low Rainfall:",data[data['rainfall'] < 40]['label'].unique())
print("Crops which requires very Low Temperature :",data[data['temperature'] < 10]['label'].unique())
print("Crops which requires very High Temperature :",data[data['temperature'] > 40]['label'].unique())
print("Crops which requires very Low Humidity :",data[data['humidity'] < 20]['label'].unique())
print("Crops which requires very Low pH :",data[data['ph'] < 4]['label'].unique())
print("Crops which requires very High pH :",data[data['ph'] > 8]['label'].unique())

print("Summer Crops")
print(data[(data['temperature'] > 30) & (data['humidity'] > 50)]['label'].unique())
print("--------------------------------------------------------------------------")
print("Winter Crops")
print(data[(data['temperature'] < 20) & (data['humidity'] > 30)]['label'].unique())
print("--------------------------------------------------------------------------")
print("Rainy Crops")
print(data[(data['rainfall'] > 200) & (data['humidity'] > 30)]['label'].unique())

#Removing the Labels column 
x = data.drop(['label'], axis=1)

#Selecting all values of data
x = x.values

#Checking the shape
print(x.shape)

#Determining Optimum number of Clusters within Dataset by using K-means Clustering
plt.rcParams['figure.figsize'] = (10,4)

wcss = []
for i in range(1,11):
    km = KMeans(n_clusters = i,init = 'k-means++',max_iter = 300, n_init = 10, random_state = 0)
    km.fit(x)
    wcss.append(km.inertia_)
    
#Plotting the Results
plt.plot(range(1,11),wcss)
plt.title('The Elbow Method',fontsize = 20)
plt.xlabel('No. of Cluster')
plt.ylabel('wcss')
#plt.show()

#Implementing K-means Algorithm to perform Clustering Analysis
km = KMeans(n_clusters = 4,init = 'k-means++',max_iter = 300, n_init = 10, random_state = 0)
y_means = km.fit_predict(x)

#Lets find out results
a = data['label']
y_means = pd.DataFrame(y_means)
z = pd.concat([y_means, a],axis = 1)
z = z.rename(columns = {0: 'cluster'})

#Checking Clusters of Each crop
print("Checking results after applying K-means Clustering Analysis \n")
print("Crops in First Cluster:", z[z['cluster'] == 0]['label'].unique())
print("---------------------------------------------------------------")
print("Crops in Second Cluster:", z[z['cluster'] == 1]['label'].unique())
print("---------------------------------------------------------------")
print("Crops in Third Cluster:", z[z['cluster'] == 2]['label'].unique())
print("---------------------------------------------------------------")
print("Crops in Forth Cluster:", z[z['cluster'] == 3]['label'].unique())

#Splitting dataset for Predictive Modelling
y = data['label']
x = data.drop(['label'],axis = 1)

print("Shape of x:", x.shape)
print("Shape of y:", y.shape)

#Training and Testing Sets for Validation of Results
x_train,x_test,y_train,y_test = train_test_split(x,y,test_size = 0.2,random_state = 0)

print("The shape of x train:", x_train.shape)
print("The shape of x test:", x_test.shape)
print("The shape of y train:", y_train.shape)
print("The shape of y test:", y_test.shape)


model = LogisticRegression(solver='liblinear')
model.fit(x_train, y_train)
y_pred = model.predict(x_test)

print("Test Accuracy:", accuracy_score(y_test, y_pred))

filename = 'crop_pred_model'
pickle.dump(model, open('model.pkl', 'wb'))

# Loading model to compare the results
model = pickle.load(open('model.pkl', 'rb'))
print(model.predict([[90, 40, 40, 20, 80, 7, 200]]))