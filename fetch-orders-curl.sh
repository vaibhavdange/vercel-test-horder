#!/bin/bash

# Fetch orders using curl (make sure your dev server is running)
echo "🔍 Fetching orders via API..."

# Get all orders
curl -s "http://localhost:3000/api/orders" | jq '.[] | {id: .id, orderNumber: .orderNumber, orderType: .orderType, customerName: .customerName, subtotal: .subtotal, discountAmount: .discountAmount, serviceChargeAmount: .serviceChargeAmount, totalAmount: .totalAmount, paymentStatus: .paymentStatus, createdAt: .createdAt}' | head -20

echo ""
echo "📋 Recent order IDs:"
curl -s "http://localhost:3000/api/orders" | jq -r '.[] | "\(.id) - \(.orderNumber) - \(.orderType) - ₹\(.totalAmount)"' | head -10
