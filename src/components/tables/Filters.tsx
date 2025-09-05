"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TableStatus } from "@/types/tables";

type FiltersProps = {
  floor: string;
  setFloor: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  status: TableStatus | 'all';
  setStatus: (v: TableStatus | 'all') => void;
  counts: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    unavailable: number;
  };
  floors: Array<{ id: string; name: string }>;
  areas: Array<{ id: string; name: string }>;
};

export function Filters({
  floor,
  setFloor,
  area,
  setArea,
  status,
  setStatus,
  counts,
  floors,
  areas,
}: FiltersProps) {
  return (
    <div className="space-y-4">
      {/* Mobile: Horizontal scrollable filters */}
      <div className="md:hidden space-y-3">
        {/* Floors and Areas - Mobile scrollable */}
        <div className="overflow-x-auto -mx-2 px-2">
          <ToggleGroup type="single" value={floor} onValueChange={setFloor} className="flex-nowrap">
            <ToggleGroupItem value="all" className="whitespace-nowrap">All Floors</ToggleGroupItem>
            {floors.map((floorItem) => (
              <ToggleGroupItem key={floorItem.id} value={floorItem.id} className="whitespace-nowrap">
                {floorItem.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <ToggleGroup type="single" value={area} onValueChange={setArea} className="flex-nowrap">
            <ToggleGroupItem value="all" className="whitespace-nowrap">All Areas</ToggleGroupItem>
            {areas.map((areaItem) => (
              <ToggleGroupItem key={areaItem.id} value={areaItem.id} className="whitespace-nowrap">
                {areaItem.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Status - Mobile scrollable */}
        <div className="overflow-x-auto -mx-2 px-2">
          <ToggleGroup type="single" value={status} onValueChange={(v) => setStatus(v as TableStatus | 'all')} className="flex-nowrap">
            <ToggleGroupItem value="all" className="whitespace-nowrap">All ({counts.available + counts.occupied + counts.reserved + counts.cleaning + counts.unavailable})</ToggleGroupItem>
            <ToggleGroupItem value="available" className="whitespace-nowrap">
              Available ({counts.available})
            </ToggleGroupItem>
            <ToggleGroupItem value="occupied" className="whitespace-nowrap">
              Occupied ({counts.occupied})
            </ToggleGroupItem>
            <ToggleGroupItem value="reserved" className="whitespace-nowrap">
              Reserved ({counts.reserved})
            </ToggleGroupItem>
            <ToggleGroupItem value="cleaning" className="whitespace-nowrap">
              Cleaning ({counts.cleaning})
            </ToggleGroupItem>
            <ToggleGroupItem value="unavailable" className="whitespace-nowrap">
              Unavailable ({counts.unavailable})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Desktop: Separate containers */}
      <div className="hidden md:block space-y-4">
        {/* Floors and Areas Container */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl border bg-white shadow-sm">
          <ToggleGroup type="single" value={floor} onValueChange={setFloor}>
            <ToggleGroupItem value="all">All Floors</ToggleGroupItem>
            {floors.map((floorItem) => (
              <ToggleGroupItem key={floorItem.id} value={floorItem.id}>
                {floorItem.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <ToggleGroup type="single" value={area} onValueChange={setArea}>
            <ToggleGroupItem value="all">All Areas</ToggleGroupItem>
            {areas.map((areaItem) => (
              <ToggleGroupItem key={areaItem.id} value={areaItem.id}>
                {areaItem.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Status Container */}
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <ToggleGroup type="single" value={status} onValueChange={(v) => setStatus(v as TableStatus | 'all')}>
            <ToggleGroupItem value="all">All ({counts.available + counts.occupied + counts.reserved + counts.cleaning + counts.unavailable})</ToggleGroupItem>
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
        </div>
      </div>
    </div>
  );
}
