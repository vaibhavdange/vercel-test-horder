// Export product types
export * from './product';

// Export transaction types
export * from './transaction';

// Export customer types (excluding conflicting types)
export type { Customer, CreateCustomerData, UpdateCustomerData } from './customer';

// Export user types
export * from './user';

// Export category types (excluding conflicting types)
export type { Category, CreateCategoryData, UpdateCategoryData } from './category';

// Export settings types
export * from './settings';

// Export table types (excluding conflicting types)
export type { 
  Floor, 
  Area, 
  Table, 
  TableStatus, 
  TableWithDetails,
  CreateFloorRequest,
  UpdateFloorRequest,
  CreateAreaRequest,
  UpdateAreaRequest,
  CreateTableRequest,
  UpdateTableRequest,
  TableStatusUpdateRequest
} from './tables';

// Export order types (excluding conflicting types)
export type { 
  Order, 
  OrderItem, 
  CreateOrderData, 
  CreateOrderItemData 
} from './orders';

// Export restaurant types (excluding conflicting types)
export type { 
  Guest,
  Visit,
  SpecialOccasion,
  Reservation,
  WaitlistEntry,
  Server,
  ServerSection,
  TableExtended,
  TablePosition,
  TableAttribute,
  ExtendedTableStatus,
  Floor as RestaurantFloor,
  FloorLayout,
  Obstacle,
  Area as RestaurantArea,
  Analytics,
  QuickAction,
  TimeSlot,
  TimelineView,
  DragOperation,
  GestureAction,
  CRMIntegration,
  NotificationSettings,
  CreateReservationRequest,
  UpdateReservationRequest,
  CreateWaitlistRequest,
  TableActionRequest,
  Region,
  TaxRule,
  RestaurantSettings,
  DeviceConfig
} from './restaurant';

// Export menu types (excluding conflicting types)
export type { 
  Product as MenuProduct, 
  CreateProductData as CreateMenuProductData, 
  UpdateProductData as UpdateMenuProductData 
} from './menu';

// Export staff types (excluding conflicting types)
export type { User as StaffUser } from './staff';
