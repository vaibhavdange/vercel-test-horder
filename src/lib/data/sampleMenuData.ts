// Sample Menu Categories
export const sampleCategories = [
  {
    id: '1',
    name: 'Appetizers',
    description: 'Light starters to awaken your palate',
    image: '/images/categories/appetizers.jpg',
    isActive: true,
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Soups',
    description: 'Traditional Indian soups and broths',
    image: '/images/categories/soups.jpg',
    isActive: true,
    sortOrder: 2
  },
  {
    id: '3',
    name: 'Tandoori Specialties',
    description: 'Clay oven grilled delicacies',
    image: '/images/categories/tandoori.jpg',
    isActive: true,
    sortOrder: 3
  },
  {
    id: '4',
    name: 'Curries',
    description: 'Rich and aromatic curry preparations',
    image: '/images/categories/curries.jpg',
    isActive: true,
    sortOrder: 4
  },
  {
    id: '5',
    name: 'Biryani & Rice',
    description: 'Fragrant rice dishes and biryanis',
    image: '/images/categories/biryani.jpg',
    isActive: true,
    sortOrder: 5
  },
  {
    id: '6',
    name: 'Breads',
    description: 'Freshly baked Indian breads',
    image: '/images/categories/breads.jpg',
    isActive: true,
    sortOrder: 6
  },
  {
    id: '7',
    name: 'Desserts',
    description: 'Traditional Indian sweets and desserts',
    image: '/images/categories/desserts.jpg',
    isActive: true,
    sortOrder: 7
  },
  {
    id: '8',
    name: 'Beverages',
    description: 'Refreshing drinks and traditional beverages',
    image: '/images/categories/beverages.jpg',
    isActive: true,
    sortOrder: 8
  }
];

// Sample Menu Items
export const sampleMenuItems = [
  // Appetizers
  {
    id: '1',
    name: 'Pani Puri',
    description: 'Crispy hollow puris filled with spiced potato, chickpeas, and tangy tamarind water',
    price: 120,
    categoryId: '1',
    image: '/images/menu/pani-puri.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 2,
    preparationTime: 8,
    allergens: ['gluten'],
    nutritionalInfo: {
      calories: 120,
      protein: 3,
      carbs: 18,
      fat: 4
    }
  },
  {
    id: '2',
    name: 'Chicken Tikka',
    description: 'Tender chicken marinated in yogurt and spices, grilled to perfection',
    price: 180,
    categoryId: '1',
    image: '/images/menu/chicken-tikka.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 3,
    preparationTime: 15,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 180,
      protein: 22,
      carbs: 2,
      fat: 8
    }
  },
  {
    id: '3',
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes, peas, and aromatic spices',
    price: 90,
    categoryId: '1',
    image: '/images/menu/samosa.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 2,
    preparationTime: 10,
    allergens: ['gluten'],
    nutritionalInfo: {
      calories: 150,
      protein: 4,
      carbs: 20,
      fat: 6
    }
  },

  // Soups
  {
    id: '4',
    name: 'Mulligatawny Soup',
    description: 'Traditional Anglo-Indian soup with lentils, vegetables, and aromatic spices',
    price: 140,
    categoryId: '2',
    image: '/images/menu/mulligatawny.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 2,
    preparationTime: 12,
    allergens: ['gluten'],
    nutritionalInfo: {
      calories: 110,
      protein: 6,
      carbs: 15,
      fat: 3
    }
  },
  {
    id: '5',
    name: 'Rasam',
    description: 'Spicy and tangy South Indian soup with tamarind and aromatic spices',
    price: 110,
    categoryId: '2',
    image: '/images/menu/rasam.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 4,
    preparationTime: 10,
    allergens: [],
    nutritionalInfo: {
      calories: 80,
      protein: 3,
      carbs: 12,
      fat: 2
    }
  },

  // Tandoori Specialties
  {
    id: '6',
    name: 'Tandoori Chicken',
    description: 'Whole chicken marinated in yogurt and spices, slow-cooked in clay oven',
    price: 350,
    categoryId: '3',
    image: '/images/menu/tandoori-chicken.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 3,
    preparationTime: 25,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 320,
      protein: 35,
      carbs: 4,
      fat: 16
    }
  },
  {
    id: '7',
    name: 'Seekh Kebab',
    description: 'Minced lamb mixed with spices and herbs, grilled on skewers',
    price: 240,
    categoryId: '3',
    image: '/images/menu/seekh-kebab.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 3,
    preparationTime: 18,
    allergens: [],
    nutritionalInfo: {
      calories: 220,
      protein: 18,
      carbs: 3,
      fat: 12
    }
  },
  {
    id: '8',
    name: 'Paneer Tikka',
    description: 'Fresh cottage cheese marinated in spices and grilled to perfection',
    price: 220,
    categoryId: '3',
    image: '/images/menu/paneer-tikka.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 2,
    preparationTime: 15,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 180,
      protein: 12,
      carbs: 4,
      fat: 10
    }
  },

  // Curries
  {
    id: '9',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and butter gravy with cream',
    price: 280,
    categoryId: '4',
    image: '/images/menu/butter-chicken.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 2,
    preparationTime: 20,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 280,
      protein: 22,
      carbs: 8,
      fat: 18
    }
  },
  {
    id: '10',
    name: 'Palak Paneer',
    description: 'Fresh spinach curry with cottage cheese cubes',
    price: 240,
    categoryId: '4',
    image: '/images/menu/palak-paneer.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 2,
    preparationTime: 18,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 200,
      protein: 14,
      carbs: 6,
      fat: 12
    }
  },
  {
    id: '11',
    name: 'Lamb Rogan Josh',
    description: 'Tender lamb in aromatic Kashmiri curry with yogurt and spices',
    price: 340,
    categoryId: '4',
    image: '/images/menu/lamb-rogan-josh.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 3,
    preparationTime: 25,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 320,
      protein: 28,
      carbs: 6,
      fat: 20
    }
  },

  // Biryani & Rice
  {
    id: '12',
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice cooked with tender chicken and aromatic spices',
    price: 320,
    categoryId: '5',
    image: '/images/menu/chicken-biryani.jpg',
    isAvailable: true,
    isVegetarian: false,
    spiceLevel: 3,
    preparationTime: 30,
    allergens: [],
    nutritionalInfo: {
      calories: 420,
      protein: 25,
      carbs: 45,
      fat: 16
    }
  },
  {
    id: '13',
    name: 'Vegetable Pulao',
    description: 'Basmati rice cooked with fresh vegetables and mild spices',
    price: 200,
    categoryId: '5',
    image: '/images/menu/vegetable-pulao.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 1,
    preparationTime: 20,
    allergens: [],
    nutritionalInfo: {
      calories: 280,
      protein: 6,
      carbs: 50,
      fat: 8
    }
  },

  // Breads
  {
    id: '14',
    name: 'Naan',
    description: 'Soft and fluffy leavened bread baked in clay oven',
    price: 60,
    categoryId: '6',
    image: '/images/menu/naan.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 0,
    preparationTime: 8,
    allergens: ['gluten', 'dairy'],
    nutritionalInfo: {
      calories: 120,
      protein: 4,
      carbs: 22,
      fat: 2
    }
  },
  {
    id: '15',
    name: 'Roti',
    description: 'Whole wheat flatbread cooked on griddle',
    price: 40,
    categoryId: '6',
    image: '/images/menu/roti.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 0,
    preparationTime: 5,
    allergens: ['gluten'],
    nutritionalInfo: {
      calories: 80,
      protein: 3,
      carbs: 15,
      fat: 1
    }
  },

  // Desserts
  {
    id: '16',
    name: 'Gulab Jamun',
    description: 'Soft milk solids dumplings soaked in rose-flavored sugar syrup',
    price: 100,
    categoryId: '7',
    image: '/images/menu/gulab-jamun.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 0,
    preparationTime: 10,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 180,
      protein: 4,
      carbs: 30,
      fat: 6
    }
  },
  {
    id: '17',
    name: 'Kheer',
    description: 'Traditional rice pudding with milk, sugar, and cardamom',
    price: 120,
    categoryId: '7',
    image: '/images/menu/kheer.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 0,
    preparationTime: 15,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 220,
      protein: 6,
      carbs: 35,
      fat: 8
    }
  },

  // Beverages
  {
    id: '18',
    name: 'Masala Chai',
    description: 'Spiced Indian tea with milk and aromatic spices',
    price: 80,
    categoryId: '8',
    image: '/images/menu/masala-chai.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 1,
    preparationTime: 5,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 60,
      protein: 2,
      carbs: 8,
      fat: 2
    }
  },
  {
    id: '19',
    name: 'Lassi',
    description: 'Sweet yogurt-based drink with rose water and cardamom',
    price: 90,
    categoryId: '8',
    image: '/images/menu/lassi.jpg',
    isAvailable: true,
    isVegetarian: true,
    spiceLevel: 0,
    preparationTime: 3,
    allergens: ['dairy'],
    nutritionalInfo: {
      calories: 140,
      protein: 6,
      carbs: 20,
      fat: 4
    }
  }
];

// Sample Inventory Items
export const sampleInventoryItems = [
  // Proteins
  {
    id: '1',
    name: 'Chicken Breast',
    category: 'Proteins',
    unit: 'kg',
    currentStock: 25.5,
    minStockLevel: 10,
    costPerUnit: 8.50,
    supplier: 'Fresh Poultry Co.',
    isActive: true,
    expiryDate: '2024-02-15'
  },
  {
    id: '2',
    name: 'Lamb Shoulder',
    category: 'Proteins',
    unit: 'kg',
    currentStock: 15.2,
    minStockLevel: 8,
    costPerUnit: 12.75,
    supplier: 'Premium Meats Ltd.',
    isActive: true,
    expiryDate: '2024-02-10'
  },
  {
    id: '3',
    name: 'Paneer (Cottage Cheese)',
    category: 'Dairy',
    unit: 'kg',
    currentStock: 8.0,
    minStockLevel: 5,
    costPerUnit: 6.25,
    supplier: 'Fresh Dairy Products',
    isActive: true,
    expiryDate: '2024-02-08'
  },

  // Vegetables
  {
    id: '4',
    name: 'Onions',
    category: 'Vegetables',
    unit: 'kg',
    currentStock: 20.0,
    minStockLevel: 10,
    costPerUnit: 2.50,
    supplier: 'Fresh Vegetables Co.',
    isActive: true,
    expiryDate: '2024-02-20'
  },
  {
    id: '5',
    name: 'Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    currentStock: 12.5,
    minStockLevel: 8,
    costPerUnit: 3.75,
    supplier: 'Fresh Vegetables Co.',
    isActive: true,
    expiryDate: '2024-02-12'
  },
  {
    id: '6',
    name: 'Spinach',
    category: 'Vegetables',
    unit: 'kg',
    currentStock: 5.0,
    minStockLevel: 3,
    costPerUnit: 4.50,
    supplier: 'Fresh Vegetables Co.',
    isActive: true,
    expiryDate: '2024-02-05'
  },
  {
    id: '7',
    name: 'Potatoes',
    category: 'Vegetables',
    unit: 'kg',
    currentStock: 30.0,
    minStockLevel: 15,
    costPerUnit: 2.25,
    supplier: 'Fresh Vegetables Co.',
    isActive: true,
    expiryDate: '2024-02-25'
  },

  // Spices
  {
    id: '8',
    name: 'Garam Masala',
    category: 'Spices',
    unit: 'kg',
    currentStock: 2.5,
    minStockLevel: 1,
    costPerUnit: 15.00,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '9',
    name: 'Turmeric Powder',
    category: 'Spices',
    unit: 'kg',
    currentStock: 3.0,
    minStockLevel: 1.5,
    costPerUnit: 12.50,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '10',
    name: 'Cumin Seeds',
    category: 'Spices',
    unit: 'kg',
    currentStock: 2.0,
    minStockLevel: 1,
    costPerUnit: 18.75,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  },

  // Dairy
  {
    id: '11',
    name: 'Yogurt',
    category: 'Dairy',
    unit: 'kg',
    currentStock: 10.0,
    minStockLevel: 5,
    costPerUnit: 4.25,
    supplier: 'Fresh Dairy Products',
    isActive: true,
    expiryDate: '2024-02-10'
  },
  {
    id: '12',
    name: 'Ghee (Clarified Butter)',
    category: 'Dairy',
    unit: 'kg',
    currentStock: 5.0,
    minStockLevel: 2,
    costPerUnit: 22.50,
    supplier: 'Fresh Dairy Products',
    isActive: true,
    expiryDate: '2024-06-30'
  },

  // Grains
  {
    id: '13',
    name: 'Basmati Rice',
    category: 'Grains',
    unit: 'kg',
    currentStock: 50.0,
    minStockLevel: 20,
    costPerUnit: 5.75,
    supplier: 'Premium Grains Ltd.',
    isActive: true,
    expiryDate: '2024-08-31'
  },
  {
    id: '14',
    name: 'Whole Wheat Flour',
    category: 'Grains',
    unit: 'kg',
    currentStock: 25.0,
    minStockLevel: 10,
    costPerUnit: 3.25,
    supplier: 'Premium Grains Ltd.',
    isActive: true,
    expiryDate: '2024-06-30'
  },
  {
    id: '15',
    name: 'All Purpose Flour',
    category: 'Grains',
    unit: 'kg',
    currentStock: 20.0,
    minStockLevel: 8,
    costPerUnit: 2.75,
    supplier: 'Premium Grains Ltd.',
    isActive: true,
    expiryDate: '2024-06-30'
  },

  // Other Ingredients
  {
    id: '16',
    name: 'Tamarind Paste',
    category: 'Other',
    unit: 'kg',
    currentStock: 3.0,
    minStockLevel: 1,
    costPerUnit: 8.50,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '17',
    name: 'Rose Water',
    category: 'Other',
    unit: 'liters',
    currentStock: 5.0,
    minStockLevel: 2,
    costPerUnit: 12.00,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  },
  {
    id: '18',
    name: 'Cardamom Pods',
    category: 'Spices',
    unit: 'kg',
    currentStock: 1.5,
    minStockLevel: 0.5,
    costPerUnit: 45.00,
    supplier: 'Spice Traders Inc.',
    isActive: true,
    expiryDate: '2024-12-31'
  }
];
