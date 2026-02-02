import seaborn as sns
import matplotlib.pyplot as plt

# Load example dataset
tips = sns.load_dataset("tips")

# Scatter plot with regression line
sns.lmplot(data=tips, x="total_bill", y="tip", hue="sex", height=6, aspect=1.2)

# Show the plot
plt.show()
