// Enhanced restaurant management types for advanced table operations

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyStatus: 'regular' | 'vip' | 'platinum';
  allergies?: string[];
  preferences?: string[];
  visitHistory: Visit[];
  specialOccasions?: SpecialOccasion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Visit {
  id: string;
  date: Date;
  tableId: string;
  partySize: number;
  duration: number; // in minutes
  totalSpent: number;
  serverId?: string;
  rating?: number;
  notes?: string;
}

export interface SpecialOccasion {
  id: string;
  type: 'birthday' | 'anniversary' | 'celebration' | 'business';
  date: Date;
  notes?: string;
  isRecurring: boolean;
}

export interface Reservation {
  id: string;
  guestId: string;
  guest: Guest;
  tableId?: string;
  partySize: number;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  specialRequests?: string[];
  isVip: boolean;
  serverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistEntry {
  id: string;
  guestName: string;
  partySize: number;
  phoneNumber?: string;
  estimatedWaitTime: number; // in minutes
  priority: 'normal' | 'high' | 'vip';
  joinedAt: Date;
  notes?: string;
  preferredSeating?: string; // 'booth', 'window', 'quiet', etc.
  specialRequests?: string[];
}

export interface Server {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  sections: ServerSection[];
  currentTables: string[]; // table IDs currently assigned
  maxTables: number;
  experience: 'trainee' | 'junior' | 'senior' | 'manager';
  shift: {
    start: string;
    end: string;
    isWorking: boolean;
  };
  performance: {
    averageTableTurnover: number;
    customerRating: number;
    totalSales: number;
  };
}

export interface ServerSection {
  id: string;
  name: string;
  color: string; // hex color for visual distinction
  tableIds: string[];
  isActive: boolean;
}

// Enhanced table type
export interface TableExtended {
  id: string;
  tableNumber: string;
  capacity: number;
  areaId: string;
  floorId: string;
  status: ExtendedTableStatus;
  isActive: boolean;
  position: TablePosition;
  shape: 'round' | 'square' | 'rectangle' | 'booth';
  serverId?: string;
  sectionId?: string;
  currentReservation?: Reservation;
  currentGuests?: {
    partySize: number;
    seatedAt: Date;
    estimatedDuration: number;
    isOverstaying: boolean;
  };
  attributes: TableAttribute[];
  createdAt: Date;
  updatedAt: Date;
  area: Area;
  floor: Floor;
  orders: any[]; // Using any[] to avoid circular dependency
}

export interface TablePosition {
  x: number; // x coordinate on floor plan
  y: number; // y coordinate on floor plan
  rotation: number; // rotation in degrees
  width: number;
  height: number;
}

export interface TableAttribute {
  type: 'window' | 'booth' | 'highTop' | 'outdoor' | 'quiet' | 'private';
  label: string;
}

// Import the base TableStatus from tables.ts to maintain compatibility
import { TableStatus } from './tables';

export type ExtendedTableStatus = TableStatus | 'needs_attention' | 'check_dropped' | 'ready_to_clear';

export interface Floor {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  layout: FloorLayout;
  createdAt: Date;
  updatedAt: Date;
  areas: Area[];
  tables: TableExtended[];
}

export interface FloorLayout {
  width: number;
  height: number;
  backgroundImage?: string;
  scale: number;
  obstacles: Obstacle[]; // walls, pillars, etc.
}

export interface Obstacle {
  id: string;
  type: 'wall' | 'pillar' | 'bar' | 'kitchen' | 'entrance';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  floorId: string;
  isActive: boolean;
  color: string; // hex color for visual distinction
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
  floor: Floor;
  tables: TableExtended[];
}

export interface Analytics {
  tableMetrics: {
    totalTables: number;
    availableTables: number;
    occupiedTables: number;
    averageTurnover: number; // minutes
    revenuePerTable: number;
    utilizationRate: number; // percentage
  };
  serverMetrics: {
    activeServers: number;
    averageTablesPerServer: number;
    topPerformers: Server[];
  };
  timeSlotData: {
    hour: number;
    occupancyRate: number;
    waitTime: number;
    revenue: number;
  }[];
  busyZones: {
    areaId: string;
    areaName: string;
    occupancyRate: number;
    averageWaitTime: number;
  }[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: (tableId: string, data?: any) => void;
  color: string;
  isEnabled: (table: TableExtended) => boolean;
}

// Timeline view types
export interface TimeSlot {
  hour: number;
  minute: number;
  timestamp: Date;
  reservations: Reservation[];
  isCurrentTime: boolean;
  isPeakTime: boolean;
}

export interface TimelineView {
  startTime: Date;
  endTime: Date;
  interval: number; // minutes between slots
  timeSlots: TimeSlot[];
  tables: TableExtended[];
}

// Interaction types
export interface DragOperation {
  type: 'reservation' | 'waitlist' | 'table';
  sourceId: string;
  targetId?: string;
  data: any;
  isValid: boolean;
}

export interface GestureAction {
  type: 'tap' | 'double_tap' | 'long_press' | 'pinch' | 'pan' | 'swipe';
  target: string;
  data: any;
}

// Integration types
export interface CRMIntegration {
  isEnabled: boolean;
  provider: 'custom' | 'salesforce' | 'hubspot';
  settings: Record<string, any>;
}

export interface NotificationSettings {
  sms: {
    enabled: boolean;
    provider: 'twilio' | 'nexmo';
    templates: Record<string, string>;
  };
  email: {
    enabled: boolean;
    provider: 'sendgrid' | 'mailgun';
    templates: Record<string, string>;
  };
  push: {
    enabled: boolean;
    vapidKey: string;
  };
}

// Export existing types for compatibility
// Note: Order and related types are now in ./orders.ts

// API request/response types
export interface CreateReservationRequest {
  guestId?: string;
  guestDetails?: {
    name: string;
    phone?: string;
    email?: string;
  };
  tableId?: string;
  partySize: number;
  startTime: Date;
  duration: number;
  notes?: string;
  specialRequests?: string[];
  isVip?: boolean;
}

export interface UpdateReservationRequest {
  id: string;
  tableId?: string;
  startTime?: Date;
  endTime?: Date;
  status?: Reservation['status'];
  notes?: string;
}

export interface CreateWaitlistRequest {
  guestName: string;
  partySize: number;
  phoneNumber?: string;
  preferredSeating?: string;
  specialRequests?: string[];
  priority?: WaitlistEntry['priority'];
}

export interface TableActionRequest {
  tableId: string;
  action: 'seat' | 'clear' | 'clean' | 'reserve' | 'transfer' | 'merge' | 'split';
  data?: any;
}

// Restaurant Settings and Region Types
export interface Region {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  currencySymbol: string;
  taxRules: TaxRule[];
  invoiceTemplate: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  isActive: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  rate: number;
  appliesTo: 'all' | 'food' | 'beverages' | 'services';
  isActive: boolean;
}

export interface RestaurantSettings {
  kot: {
    autoPrint: boolean;
    printFormat: 'thermal' | 'a4' | 'receipt';
    includeNotes: boolean;
    includePreparationTime: boolean;
    defaultTaxRate: number;
    allowCustomDiscounts: boolean;
    allowCustomTaxRates: boolean;
  };
  devices: Record<string, any>;
  preparationTimes: Record<string, number>;
  tableLayout: {
    rows: number;
    columns: number;
    spacing: number;
  };
  region: Region;
  billing: {
    invoicePrefix: string;
    autoNumbering: boolean;
    includeLogo: boolean;
    includeQRCode: boolean;
    footerText: string;
  };
  localization: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
}

export interface DeviceConfig {
  printer: {
    type: 'thermal' | 'inkjet' | 'laser';
    port: string;
    baudRate: number;
    isConnected: boolean;
  };
  cashDrawer: {
    port: string;
    isConnected: boolean;
  };
  barcodeScanner: {
    type: 'usb' | 'bluetooth' | 'serial';
    port: string;
    isConnected: boolean;
  };
}