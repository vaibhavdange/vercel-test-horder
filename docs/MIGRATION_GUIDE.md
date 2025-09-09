# Settings Migration Guide: Multi-row to Column-based Approach

## Overview

This migration converts the billing settings from a multi-row key-value approach to a column-based approach for better performance, type safety, and maintainability.

## What Changed

### 1. Database Schema Changes

**New Columns Added to `public.settings` table:**
- `restaurantName` - Official restaurant name
- `restaurantID` - Unique restaurant identifier
- `storeID` - Unique store/location identifier
- `addressLineOne` - Primary address line
- `addressLineTwo` - Secondary address line (landmark, area)
- `restaurantCity` - City location
- `restaurantPin` - PIN/ZIP code
- `restaurantPhone` - Primary contact phone
- `restaurantEmail` - Primary contact email
- `restaurantWebsite` - Restaurant website URL
- `restaurantGstRate` - Default GST rate as percentage
- `restaurantGst` - GST registration number
- `restaurantTaxId` - Tax identification number
- `restaurantFssai` - FSSAI license number
- `restaurantPolicy` - Restaurant policy text
- `restaurantFooterNote` - Footer note for bills/receipts
- `restaurantFooterNoteExtra` - Additional footer note

### 2. API Changes

**New Endpoints:**
- `GET/PUT /api/settings/restaurant` - Direct access to restaurant settings

**Updated Endpoints:**
- `GET/POST /api/billing-settings` - Now supports both old and new formats with backward compatibility

### 3. Database Operations

**New Methods in `supabase.ts`:**
- `getRestaurantSettings()` - Fetch restaurant-specific settings
- `updateRestaurantSettings()` - Update restaurant settings with type safety

### 4. TypeScript Types

**New Interfaces:**
- `RestaurantSettings` - Complete restaurant settings interface
- `UpdateRestaurantSettingsRequest` - Type-safe update request

### 5. React Hooks

**New Hook:**
- `useRestaurantSettings()` - Direct access to restaurant settings
- `useUpdateRestaurantSettings()` - Type-safe updates

**Updated Hooks:**
- `useBusinessDetails()` - Now works with both old and new formats
- `useDefaultTaxRate()` - Uses column-based approach

## Migration Steps

### Step 1: Run Database Migration

Execute the SQL migration file:
```bash
# Run this in your Supabase SQL editor
supabase/migrations/20250128000003_settings_columns.sql
```

### Step 2: Verify Migration

The migration will:
1. Add new columns to the `settings` table
2. Create a default settings record
3. Migrate existing `billing_settings` data to the new columns
4. Add indexes and constraints

### Step 3: Test the New API

Test the new restaurant settings endpoint:
```bash
# Get restaurant settings
curl http://localhost:3000/api/settings/restaurant

# Update restaurant settings
curl -X PUT http://localhost:3000/api/settings/restaurant \
  -H "Content-Type: application/json" \
  -d '{"restaurantName": "My Restaurant", "restaurantPhone": "1234567890"}'
```

## Backward Compatibility

The migration maintains full backward compatibility:

1. **Existing API calls continue to work** - The billing-settings API automatically detects and transforms column-based data to the old format
2. **Existing React components work unchanged** - All existing hooks and components continue to function
3. **Gradual migration** - You can migrate components one by one to use the new column-based approach

## Benefits

### Performance
- **Single query** instead of multiple row lookups
- **Indexed columns** for faster searches
- **Reduced JSON parsing** overhead

### Type Safety
- **Strong typing** for each setting field
- **Compile-time validation** of setting updates
- **Better IDE support** with autocomplete

### Maintainability
- **Clear schema** with documented columns
- **Database constraints** for data integrity
- **Easier debugging** with direct column access

### Data Integrity
- **Proper data types** (numbers, booleans, text)
- **Database-level validation**
- **Consistent data structure**

## Usage Examples

### Using New Column-based Approach

```typescript
// Fetch restaurant settings
const { data: settings } = useRestaurantSettings();

// Update restaurant settings
const updateSettings = useUpdateRestaurantSettings();
updateSettings.mutate({
  restaurantName: "New Restaurant Name",
  restaurantPhone: "9876543210",
  restaurantGstRate: 18.0
});
```

### Backward Compatible Usage (Still Works)

```typescript
// This still works exactly as before
const { data: businessDetails } = useBusinessDetails();
const { data: taxRate } = useDefaultTaxRate();
```

## Migration Checklist

- [x] Database migration SQL created
- [x] Database operations updated
- [x] API endpoints updated with backward compatibility
- [x] TypeScript types added
- [x] React hooks updated
- [x] Backward compatibility maintained
- [ ] Run database migration
- [ ] Test new API endpoints
- [ ] Verify existing functionality still works
- [ ] Update components to use new approach (optional)

## Next Steps

1. **Run the migration** in your Supabase instance
2. **Test the new endpoints** to ensure they work correctly
3. **Gradually migrate components** to use the new column-based approach for better performance
4. **Consider deprecating** the old billing_settings table once all components are migrated

## Rollback Plan

If you need to rollback:
1. The old `billing_settings` table remains intact
2. Remove the new columns from the `settings` table
3. The API will automatically fall back to the old approach
4. No data loss occurs during rollback
