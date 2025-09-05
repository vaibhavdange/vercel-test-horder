# Staff Components

This directory contains the modular components for the Staff Management page, refactored from a single large file into smaller, reusable components.

## Structure

```
/components/staff
├── index.ts              # Export all components
├── Tabs.tsx              # Tab switcher component
├── StaffTable.tsx        # Staff list table
├── AttendanceTable.tsx   # Attendance list table
├── StaffForm.tsx         # Add/edit staff form with React Hook Form + Zod
├── AttendanceForm.tsx    # Add/edit attendance form
├── SearchBar.tsx         # Search and filter bar
├── utils.tsx             # Shared utility functions
└── README.md             # This file
```

## Components

### Tabs
- Simple tab switcher for "Staff Management" and "Attendance"
- Uses pill-style buttons with active/inactive states
- Props: `activeTab`, `setActiveTab`

### StaffTable
- Displays staff members in a table format
- Includes search and role filtering
- Handles loading, error, and empty states
- Props: `searchTerm`, `selectedRole`, `onEditStaff`

### AttendanceTable
- Displays attendance records for a selected date
- Shows status icons and formatted times
- Handles loading and empty states
- Props: `selectedDate`, `onEditAttendance`

### StaffForm
- Modal form for adding/editing staff members
- Uses React Hook Form with Zod validation
- Pill-style Create/Update and Cancel buttons
- Handles both create and update operations
- Props: `open`, `onClose`, `editingStaff`

### AttendanceForm
- Modal form for adding/editing attendance records
- Uses React Hook Form with Zod validation
- Pill-style Create/Update and Cancel buttons
- Handles both create and update operations
- Props: `open`, `onClose`, `editingAttendance`, `selectedDate`

### SearchBar
- Search input and role filter dropdown
- Pill-style Reset button to clear filters
- Props: `searchTerm`, `setSearchTerm`, `selectedRole`, `setSelectedRole`, `onReset`

### Utils
- `getStatusIcon()` - Returns appropriate icon for attendance status
- `getStatusColor()` - Returns appropriate color classes for status badges
- `formatTime()` - Formats datetime strings to time display
- `formatDate()` - Formats date strings to readable format

## Usage

```tsx
import { Tabs, StaffTable, AttendanceTable, StaffForm, AttendanceForm, SearchBar } from "@/components/staff";

// Use in your main page component
<StaffTable
  searchTerm={searchTerm}
  selectedRole={selectedRole}
  onEditStaff={handleEditStaff}
/>
```

## Benefits

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used in other parts of the app
3. **Maintainability**: Easier to debug and update individual components
4. **Type Safety**: Full TypeScript support with proper prop types
5. **Form Validation**: React Hook Form + Zod for robust form handling
6. **Consistent UI**: Uses shadcn/ui components throughout
