-- Sample Data Migration for Indian Fine Dining POS
-- This migration populates the database with sample categories, menu items, and inventory

-- Insert Categories
INSERT INTO "public"."categories" ("id", "name", "description", "image", "is_active", "sort_order", "created_at", "updated_at") VALUES
('1', 'Appetizers', 'Light starters to awaken your palate', '/images/categories/appetizers.jpg', true, 1, NOW(), NOW()),
('2', 'Soups', 'Traditional Indian soups and broths', '/images/categories/soups.jpg', true, 2, NOW(), NOW()),
('3', 'Tandoori Specialties', 'Clay oven grilled delicacies', '/images/categories/tandoori.jpg', true, 3, NOW(), NOW()),
('4', 'Curries', 'Rich and aromatic curry preparations', '/images/categories/curries.jpg', true, 4, NOW(), NOW()),
('5', 'Biryani & Rice', 'Fragrant rice dishes and biryanis', '/images/categories/biryani.jpg', true, 5, NOW(), NOW()),
('6', 'Breads', 'Freshly baked Indian breads', '/images/categories/breads.jpg', true, 6, NOW(), NOW()),
('7', 'Desserts', 'Traditional Indian sweets and desserts', '/images/categories/desserts.jpg', true, 7, NOW(), NOW()),
('8', 'Beverages', 'Refreshing drinks and traditional beverages', '/images/categories/beverages.jpg', true, 8, NOW(), NOW());

-- Insert Menu Items (Products)
INSERT INTO "public"."products" ("id", "name", "description", "price", "category_id", "image_url", "is_available", "is_vegetarian", "spice_level", "preparation_time", "allergens", "nutritional_info", "created_at", "updated_at") VALUES
-- Appetizers
('1', 'Pani Puri', 'Crispy hollow puris filled with spiced potato, chickpeas, and tangy tamarind water', 120, '1', '/images/menu/pani-puri.jpg', true, true, 2, 8, '["gluten"]', '{"calories": 120, "protein": 3, "carbs": 18, "fat": 4}', NOW(), NOW()),
('2', 'Chicken Tikka', 'Tender chicken marinated in yogurt and spices, grilled to perfection', 180, '1', '/images/menu/chicken-tikka.jpg', true, false, 3, 15, '["dairy"]', '{"calories": 180, "protein": 22, "carbs": 2, "fat": 8}', NOW(), NOW()),
('3', 'Samosa', 'Crispy pastry filled with spiced potatoes, peas, and aromatic spices', 90, '1', '/images/menu/samosa.jpg', true, true, 2, 10, '["gluten"]', '{"calories": 150, "protein": 4, "carbs": 20, "fat": 6}', NOW(), NOW()),

-- Soups
('4', 'Mulligatawny Soup', 'Traditional Anglo-Indian soup with lentils, vegetables, and aromatic spices', 140, '2', '/images/menu/mulligatawny.jpg', true, true, 2, 12, '["gluten"]', '{"calories": 110, "protein": 6, "carbs": 15, "fat": 3}', NOW(), NOW()),
('5', 'Rasam', 'Spicy and tangy South Indian soup with tamarind and aromatic spices', 110, '2', '/images/menu/rasam.jpg', true, true, 4, 10, '[]', '{"calories": 80, "protein": 3, "carbs": 12, "fat": 2}', NOW(), NOW()),

-- Tandoori Specialties
('6', 'Tandoori Chicken', 'Whole chicken marinated in yogurt and spices, slow-cooked in clay oven', 350, '3', '/images/menu/tandoori-chicken.jpg', true, false, 3, 25, '["dairy"]', '{"calories": 320, "protein": 35, "carbs": 4, "fat": 16}', NOW(), NOW()),
('7', 'Seekh Kebab', 'Minced lamb mixed with spices and herbs, grilled on skewers', 240, '3', '/images/menu/seekh-kebab.jpg', true, false, 3, 18, '[]', '{"calories": 220, "protein": 18, "carbs": 3, "fat": 12}', NOW(), NOW()),
('8', 'Paneer Tikka', 'Fresh cottage cheese marinated in spices and grilled to perfection', 220, '3', '/images/menu/paneer-tikka.jpg', true, true, 2, 15, '["dairy"]', '{"calories": 180, "protein": 12, "carbs": 4, "fat": 10}', NOW(), NOW()),

-- Curries
('9', 'Butter Chicken', 'Tender chicken in rich tomato and butter gravy with cream', 280, '4', '/images/menu/butter-chicken.jpg', true, false, 2, 20, '["dairy"]', '{"calories": 280, "protein": 22, "carbs": 8, "fat": 18}', NOW(), NOW()),
('10', 'Palak Paneer', 'Fresh spinach curry with cottage cheese cubes', 240, '4', '/images/menu/palak-paneer.jpg', true, true, 2, 18, '["dairy"]', '{"calories": 200, "protein": 14, "carbs": 6, "fat": 12}', NOW(), NOW()),
('11', 'Lamb Rogan Josh', 'Tender lamb in aromatic Kashmiri curry with yogurt and spices', 340, '4', '/images/menu/lamb-rogan-josh.jpg', true, false, 3, 25, '["dairy"]', '{"calories": 320, "protein": 28, "carbs": 6, "fat": 20}', NOW(), NOW()),

-- Biryani & Rice
('12', 'Chicken Biryani', 'Fragrant basmati rice cooked with tender chicken and aromatic spices', 320, '5', '/images/menu/chicken-biryani.jpg', true, false, 3, 30, '[]', '{"calories": 420, "protein": 25, "carbs": 45, "fat": 16}', NOW(), NOW()),
('13', 'Vegetable Pulao', 'Basmati rice cooked with fresh vegetables and mild spices', 200, '5', '/images/menu/vegetable-pulao.jpg', true, true, 1, 20, '[]', '{"calories": 280, "protein": 6, "carbs": 50, "fat": 8}', NOW(), NOW()),

-- Breads
('14', 'Naan', 'Soft and fluffy leavened bread baked in clay oven', 60, '6', '/images/menu/naan.jpg', true, true, 0, 8, '["gluten", "dairy"]', '{"calories": 120, "protein": 4, "carbs": 22, "fat": 2}', NOW(), NOW()),
('15', 'Roti', 'Whole wheat flatbread cooked on griddle', 40, '6', '/images/menu/roti.jpg', true, true, 0, 5, '["gluten"]', '{"calories": 80, "protein": 3, "carbs": 15, "fat": 1}', NOW(), NOW()),

-- Desserts
('16', 'Gulab Jamun', 'Soft milk solids dumplings soaked in rose-flavored sugar syrup', 100, '7', '/images/menu/gulab-jamun.jpg', true, true, 0, 10, '["dairy"]', '{"calories": 180, "protein": 4, "carbs": 30, "fat": 6}', NOW(), NOW()),
('17', 'Kheer', 'Traditional rice pudding with milk, sugar, and cardamom', 120, '7', '/images/menu/kheer.jpg', true, true, 0, 15, '["dairy"]', '{"calories": 220, "protein": 6, "carbs": 35, "fat": 8}', NOW(), NOW()),

-- Beverages
('18', 'Masala Chai', 'Spiced Indian tea with milk and aromatic spices', 80, '8', '/images/menu/masala-chai.jpg', true, true, 1, 5, '["dairy"]', '{"calories": 60, "protein": 2, "carbs": 8, "fat": 2}', NOW(), NOW()),
('19', 'Lassi', 'Sweet yogurt-based drink with rose water and cardamom', 90, '8', '/images/menu/lassi.jpg', true, true, 0, 3, '["dairy"]', '{"calories": 140, "protein": 6, "carbs": 20, "fat": 4}', NOW(), NOW());

-- Insert Inventory Items (Stock Items)
INSERT INTO "public"."stock_items" ("id", "name", "category", "unit", "current_stock", "min_stock_level", "cost_per_unit", "supplier", "is_active", "expiry_date", "created_at", "updated_at") VALUES
-- Proteins
('1', 'Chicken Breast', 'Proteins', 'kg', 25.5, 10, 8.50, 'Fresh Poultry Co.', true, '2024-02-15', NOW(), NOW()),
('2', 'Lamb Shoulder', 'Proteins', 'kg', 15.2, 8, 12.75, 'Premium Meats Ltd.', true, '2024-02-10', NOW(), NOW()),
('3', 'Paneer (Cottage Cheese)', 'Dairy', 'kg', 8.0, 5, 6.25, 'Fresh Dairy Products', true, '2024-02-08', NOW(), NOW()),

-- Vegetables
('4', 'Onions', 'Vegetables', 'kg', 20.0, 10, 2.50, 'Fresh Vegetables Co.', true, '2024-02-20', NOW(), NOW()),
('5', 'Tomatoes', 'Vegetables', 'kg', 12.5, 8, 3.75, 'Fresh Vegetables Co.', true, '2024-02-12', NOW(), NOW()),
('6', 'Spinach', 'Vegetables', 'kg', 5.0, 3, 4.50, 'Fresh Vegetables Co.', true, '2024-02-05', NOW(), NOW()),
('7', 'Potatoes', 'Vegetables', 'kg', 30.0, 15, 2.25, 'Fresh Vegetables Co.', true, '2024-02-25', NOW(), NOW()),

-- Spices
('8', 'Garam Masala', 'Spices', 'kg', 2.5, 1, 15.00, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW()),
('9', 'Turmeric Powder', 'Spices', 'kg', 3.0, 1.5, 12.50, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW()),
('10', 'Cumin Seeds', 'Spices', 'kg', 2.0, 1, 18.75, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW()),

-- Dairy
('11', 'Yogurt', 'Dairy', 'kg', 10.0, 5, 4.25, 'Fresh Dairy Products', true, '2024-02-10', NOW(), NOW()),
('12', 'Ghee (Clarified Butter)', 'Dairy', 'kg', 5.0, 2, 22.50, 'Fresh Dairy Products', true, '2024-06-30', NOW(), NOW()),

-- Grains
('13', 'Basmati Rice', 'Grains', 'kg', 50.0, 20, 5.75, 'Premium Grains Ltd.', true, '2024-08-31', NOW(), NOW()),
('14', 'Whole Wheat Flour', 'Grains', 'kg', 25.0, 10, 3.25, 'Premium Grains Ltd.', true, '2024-06-30', NOW(), NOW()),
('15', 'All Purpose Flour', 'Grains', 'kg', 20.0, 8, 2.75, 'Premium Grains Ltd.', true, '2024-06-30', NOW(), NOW()),

-- Other Ingredients
('16', 'Tamarind Paste', 'Other', 'kg', 3.0, 1, 8.50, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW()),
('17', 'Rose Water', 'Other', 'liters', 5.0, 2, 12.00, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW()),
('18', 'Cardamom Pods', 'Spices', 'kg', 1.5, 0.5, 45.00, 'Spice Traders Inc.', true, '2024-12-31', NOW(), NOW());

-- Insert Tax Category with 5% rate
INSERT INTO "public"."tax_categories" ("id", "name", "rate", "description", "is_active", "created_at", "updated_at") VALUES
('1', 'Standard GST', 5.0, 'Standard 5% GST applicable on all food items', true, NOW(), NOW());

-- Update products to include tax_category_id
UPDATE "public"."products" SET "tax_category_id" = '1' WHERE "id" IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19');
