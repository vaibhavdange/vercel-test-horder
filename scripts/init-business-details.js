#!/usr/bin/env node

/**
 * Script to initialize business details in the billing settings
 * Run this script to set up default business details for bills
 */

const defaultBusinessDetails = {
  restaurantName: "BORDERS RESTO & PUB",
  address: "123, Example St., Delhi, 112234",
  phone: "9012345678",
  email: "hello@borderspub.com",
  website: "www.borderspub.in",
  fssai: "11223344556677",
  gstin: "27ABCDE1234F1Z5",
};

async function initBusinessDetails() {
  try {
    console.log('Initializing business details...');
    
    const response = await fetch('http://localhost:3000/api/billing-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'business_details',
        value: defaultBusinessDetails,
        description: 'Business details for bills and receipts',
        isActive: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Business details initialized successfully:', result);
    } else {
      const error = await response.text();
      console.error('❌ Failed to initialize business details:', error);
    }
  } catch (error) {
    console.error('❌ Error initializing business details:', error);
  }
}

// Run the script
initBusinessDetails();
