import pandas as pd

# -----------------------------
# Step 1: Create sample data
# -----------------------------
# Inventory data
inventory_data = {
    "ProductID": [101, 102, 103],
    "ProductName": ["Laptop", "Mouse", "Keyboard"],
    "Stock": [50, 200, 150],
    "UnitPrice": [800, 20, 45]
}

# Finance data (sales invoices)
finance_data = {
    "InvoiceID": [1, 2, 3],
    "ProductID": [101, 102, 103],
    "Quantity": [2, 5, 3],
    "PaymentStatus": ["Paid", "Pending", "Paid"]
}

# -----------------------------
# Step 2: Convert to DataFrames
# -----------------------------
df_inventory = pd.DataFrame(inventory_data)
df_finance = pd.DataFrame(finance_data)

print("📦 Inventory Data:")
print(df_inventory, "\n")

print("💰 Finance Data:")
print(df_finance, "\n")

# -----------------------------
# Step 3: Join Inventory + Finance
# -----------------------------
df_merged = pd.merge(df_finance, df_inventory, on="ProductID")

print("📊 Merged Data (Sales + Inventory):")
print(df_merged, "\n")

# -----------------------------
# Step 4: Add Calculated Column
# -----------------------------
df_merged["TotalAmount"] = df_merged["Quantity"] * df_merged["UnitPrice"]

print("💵 Sales with Total Amount:")
print(df_merged[["InvoiceID", "ProductName", "Quantity", "UnitPrice", "TotalAmount", "PaymentStatus"]], "\n")

# -----------------------------
# Step 5: Generate a Report
# -----------------------------
report = df_merged.groupby("PaymentStatus")["TotalAmount"].sum()
print("📑 Sales Report (by Payment Status):")
print(report)

