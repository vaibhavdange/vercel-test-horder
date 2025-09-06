Your current **Tables Page** is already functional and fairly clean, but the UI can be made more **modern, spacious, and intuitive**.

Here’s a breakdown of improvements you can make:

---

## 🔹 1. Improve Filters & Status Badges

* Right now filters are just pill buttons.
* Use **segmented controls / toggle groups** (like shadcn/ui’s `ToggleGroup`) for cleaner look.
* Show **status counts** inside the filter chips (e.g., "Available (4)").
* Add subtle hover + pressed states.

```tsx
<ToggleGroup type="single" value={statusFilter} onValueChange={setStatusFilter}>
  <ToggleGroupItem value="all">All ({tables.length})</ToggleGroupItem>
  <ToggleGroupItem value="available">Available ({availableCount})</ToggleGroupItem>
  <ToggleGroupItem value="occupied">Occupied ({occupiedCount})</ToggleGroupItem>
  ...
</ToggleGroup>
```

---

## 🔹 2. Redesign Table Cards

Your cards are quite boxy. Improvements:

* **Rounded corners (2xl)** and **soft shadows**.
* Add **color-coded borders or status ribbons** (green for available, amber for reserved, red for occupied).
* Use **icons** more prominently (people, floor, area).
* Add a **"Tap to Seat"** or **"Tap to View"** CTA button inside the card for clarity.

```tsx
<div className={`rounded-2xl border-2 p-4 shadow-sm transition hover:shadow-md 
  ${table.status === "available" ? "border-green-400 bg-green-50" : ""}`}>
  <div className="flex justify-between items-center">
    <span className="font-semibold text-lg">Table {table.tableNumber}</span>
    <StatusBadge status={table.status} />
  </div>
  <div className="mt-3 text-sm text-gray-600 flex flex-col gap-1">
    <span><Users className="inline w-4 h-4 mr-1"/>{table.capacity} seats</span>
    <span><MapPin className="inline w-4 h-4 mr-1"/>{table.area?.name} • {table.floor?.name}</span>
  </div>
  {table.status === "available" && (
    <Button className="mt-3 w-full" size="sm">Seat Now</Button>
  )}
</div>
```

---

## 🔹 3. Drag-and-Drop Edit Mode

* Currently, dragging tables works, but there’s no **visual feedback**.
* Add a **“Rearranging Mode” banner** at the top when `isEditMode` is active.
* Use a **dashed border placeholder** while dragging.
* Dim non-dragged cards for focus.

---

## 🔹 4. Empty States

Instead of just plain text ("No tables found"), use:

* A **friendly illustration / icon** (like a floor plan icon).
* CTA: “Add your first table”.
* Suggest filter reset if filters are applied.

---

## 🔹 5. Management Modal Improvements

* Use **tabs with icons** (floors, areas, tables) for faster navigation.
* Add **inline edit buttons** (instead of opening a new modal for small changes).
* Show **counts** (`Floors (2)`, `Areas (4)`).

---

## 🔹 6. Responsive Layout

* On mobile, cards should be **full width** with swipe actions for quick seat/edit.
* Filters should become a **horizontal scrollable bar** (you’ve started this — make it consistent).

---

## 🔹 7. Performance / UX Polish

* Debounce filter changes so UI feels snappier.
* Show a **“last updated” timestamp** for tables (helps staff know data is fresh).
* Keep **status update buttons** inside the details drawer but also **quick-actions** (long-press / right-click on card).

---

✨ Overall, the design goal is: **less cramped, more visual hierarchy, more at-a-glance info**.
This will make the staff experience smoother (especially during rush hours).

---

## You can drop the code below directly into the project

---

## 🔹 TableCard.tsx (Upgraded)

```tsx
"use client";
import { Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type TableCardProps = {
  table: {
    id: string;
    tableNumber: number;
    capacity: number;
    status: "available" | "occupied" | "reserved" | "cleaning" | "unavailable";
    area?: { name: string };
    floor?: { name: string };
  };
  onSeat?: (id: string) => void;
  onClick?: (id: string) => void;
};

const statusColors: Record<TableCardProps["table"]["status"], string> = {
  available: "border-green-400 bg-green-50 text-green-700",
  occupied: "border-bluae-400 bg-blue-50 text-blue-700",
  reserved: "border-yellow-400 bg-yellow-50 text-yellow-700",
  cleaning: "border-orange-400 bg-orange-50 text-orange-700",
  unavailable: "border-gray-300 bg-gray-50 text-gray-600",
};

export function TableCard({ table, onSeat, onClick }: TableCardProps) {
  return (
    <div
      onClick={() => onClick?.(table.id)}
      className={`rounded-2xl border-2 p-4 shadow-sm transition hover:shadow-md cursor-pointer ${statusColors[table.status]}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">Table {table.tableNumber}</span>
        <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-white/70">
          {table.status}
        </span>
      </div>

      {/* Info */}
      <div className="mt-3 text-sm text-gray-700 flex flex-col gap-1">
        <span className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          {table.capacity} seats
        </span>
        <span className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {table.area?.name} • {table.floor?.name}
        </span>
      </div>

      {/* CTA */}
      {table.status === "available" && (
        <Button
          className="mt-4 w-full"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // prevent parent click
            onSeat?.(table.id);
          }}
        >
          Seat Now
        </Button>
      )}
    </div>
  );
}
```

---

## 🔹 Filters.tsx (Upgraded)

This version uses **segmented controls** (shadcn/ui `ToggleGroup`) + pill buttons.
It shows **counts** inline (like "Available (4)").

```tsx
"use client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FiltersProps = {
  floor: string;
  setFloor: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  counts: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    unavailable: number;
  };
};

export function Filters({
  floor,
  setFloor,
  area,
  setArea,
  status,
  setStatus,
  counts,
}: FiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border bg-white shadow-sm">
      {/* Floors */}
      <ToggleGroup type="single" value={floor} onValueChange={setFloor}>
        <ToggleGroupItem value="all">All Floors</ToggleGroupItem>
        <ToggleGroupItem value="ground">Ground Floor</ToggleGroupItem>
        <ToggleGroupItem value="rooftop">Rooftop</ToggleGroupItem>
      </ToggleGroup>

      {/* Status */}
      <ToggleGroup type="single" value={status} onValueChange={setStatus}>
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="available">
          Available ({counts.available})
        </ToggleGroupItem>
        <ToggleGroupItem value="occupied">
          Occupied ({counts.occupied})
        </ToggleGroupItem>
        <ToggleGroupItem value="reserved">
          Reserved ({counts.reserved})
        </ToggleGroupItem>
        <ToggleGroupItem value="cleaning">
          Cleaning ({counts.cleaning})
        </ToggleGroupItem>
        <ToggleGroupItem value="unavailable">
          Unavailable ({counts.unavailable})
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Areas */}
      <ToggleGroup type="single" value={area} onValueChange={setArea}>
        <ToggleGroupItem value="all">All Areas</ToggleGroupItem>
        <ToggleGroupItem value="inside">Inside Area</ToggleGroupItem>
        <ToggleGroupItem value="outside">Outside Area</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
```

---

## 🔹 How It Looks After Upgrade

* **Table cards** → bigger, rounded, color-coded, with “Seat Now” button.
* **Filters** → cleaner pill-style with counts and better grouping.
* **Mobile** → filters scroll horizontally, cards stack nicely.

---