-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.accounts (
  id text NOT NULL,
  userId text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refreshToken text,
  accessToken text,
  expiresAt bigint,
  tokenType text,
  scope text,
  idToken text,
  sessionState text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.areas (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  floorId text NOT NULL,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT areas_pkey PRIMARY KEY (id),
  CONSTRAINT areas_floorId_fkey FOREIGN KEY (floorId) REFERENCES public.floors(id)
);
CREATE TABLE public.billing_settings (
  id text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  description text,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT billing_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🍴'::text,
  parentId text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parentId_fkey FOREIGN KEY (parentId) REFERENCES public.categories(id)
);
CREATE TABLE public.customers (
  id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  loyaltyPoints integer NOT NULL DEFAULT 0,
  totalPurchases double precision NOT NULL DEFAULT 0.0,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.floors (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT floors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_categories (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '📦'::text,
  color text NOT NULL DEFAULT '#3B82F6'::text,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT inventory_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id text NOT NULL,
  orderId text NOT NULL,
  productId text NOT NULL,
  productName text NOT NULL,
  quantity integer NOT NULL,
  unitPrice double precision NOT NULL,
  totalPrice double precision NOT NULL,
  customizationNotes text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  taxRate double precision NOT NULL DEFAULT 0.0,
  taxAmount double precision NOT NULL DEFAULT 0.0,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.orders(id),
  CONSTRAINT order_items_productId_fkey FOREIGN KEY (productId) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id text NOT NULL,
  orderNumber text NOT NULL,
  kotNumber integer,
  orderType text NOT NULL DEFAULT 'dine-in'::text,
  tableId text,
  tableNumber text,
  customerId text,
  customerName text,
  customerPhone text,
  status text NOT NULL DEFAULT 'pending'::text,
  subStatus text,
  subtotal double precision NOT NULL,
  taxAmount double precision NOT NULL DEFAULT 0.0,
  serviceChargeAmount double precision NOT NULL DEFAULT 0.0,
  serviceChargeRate double precision NOT NULL DEFAULT 0.0,
  discountAmount double precision NOT NULL DEFAULT 0.0,
  totalAmount double precision NOT NULL,
  paymentStatus text NOT NULL DEFAULT 'pending'::text,
  paymentMethod text,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  startedCookingAt timestamp without time zone,
  readyAt timestamp without time zone,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_tableId_fkey FOREIGN KEY (tableId) REFERENCES public.tables(id),
  CONSTRAINT orders_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.customers(id)
);
CREATE TABLE public.product_extras (
  id text NOT NULL,
  productId text NOT NULL,
  stockItemId text,
  name text NOT NULL,
  price double precision NOT NULL DEFAULT 0.0,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT product_extras_pkey PRIMARY KEY (id),
  CONSTRAINT product_extras_stockItemId_fkey FOREIGN KEY (stockItemId) REFERENCES public.stock_items(id),
  CONSTRAINT product_extras_productId_fkey FOREIGN KEY (productId) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id text NOT NULL,
  barcode text,
  name text NOT NULL,
  description text,
  price double precision NOT NULL,
  cost double precision,
  categoryId text,
  taxCategoryId text,
  stockQuantity integer NOT NULL DEFAULT 0,
  minStockLevel integer NOT NULL DEFAULT 0,
  taxRate double precision NOT NULL DEFAULT 0.0,
  serviceChargeRate double precision NOT NULL DEFAULT 0.0,
  image text,
  thumbnail text,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  isAlcohol boolean NOT NULL DEFAULT false,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.categories(id),
  CONSTRAINT products_taxCategoryId_fkey FOREIGN KEY (taxCategoryId) REFERENCES public.tax_categories(id)
);
CREATE TABLE public.recipe_items (
  id text NOT NULL,
  recipeId text NOT NULL,
  stockItemId text,
  quantity double precision NOT NULL,
  unit text NOT NULL,
  notes text,
  CONSTRAINT recipe_items_pkey PRIMARY KEY (id),
  CONSTRAINT recipe_items_stockItemId_fkey FOREIGN KEY (stockItemId) REFERENCES public.stock_items(id),
  CONSTRAINT recipe_items_recipeId_fkey FOREIGN KEY (recipeId) REFERENCES public.recipes(id)
);
CREATE TABLE public.recipes (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  productId text NOT NULL,
  servings integer NOT NULL DEFAULT 1,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_productId_fkey FOREIGN KEY (productId) REFERENCES public.products(id)
);
CREATE TABLE public.refunds (
  id text NOT NULL,
  refundNumber text NOT NULL,
  orderId text NOT NULL,
  transactionId text NOT NULL,
  refundAmount double precision NOT NULL,
  refundReason text,
  refundMethod text NOT NULL,
  refundStatus text NOT NULL DEFAULT 'pending'::text,
  cashierId text,
  customerId text,
  refundDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refundedItems text,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.customers(id),
  CONSTRAINT refunds_cashierId_fkey FOREIGN KEY (cashierId) REFERENCES public.users(id),
  CONSTRAINT refunds_transactionId_fkey FOREIGN KEY (transactionId) REFERENCES public.transactions(id),
  CONSTRAINT refunds_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.orders(id)
);
CREATE TABLE public.reservations (
  id text NOT NULL,
  customerName text NOT NULL,
  customerPhone text,
  customerEmail text,
  reservationDate timestamp without time zone NOT NULL,
  reservationTime text NOT NULL,
  partySize integer NOT NULL,
  tableNumber text,
  tableId text,
  specialRequests text,
  status text NOT NULL DEFAULT 'confirmed'::text,
  customerId text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_tableId_fkey FOREIGN KEY (tableId) REFERENCES public.tables(id),
  CONSTRAINT reservations_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.customers(id)
);
CREATE TABLE public.sessions (
  id text NOT NULL,
  userId text NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.settings (
  id text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  description text,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff (
  id text NOT NULL,
  userId text NOT NULL,
  employeeId text NOT NULL,
  profilePicture text,
  dateOfBirth timestamp without time zone,
  salary double precision,
  shiftStart text,
  shiftEnd text,
  address text,
  additionalDetails text,
  hireDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.staff_attendance (
  id text NOT NULL,
  staffId text NOT NULL,
  date timestamp without time zone NOT NULL,
  status text NOT NULL,
  checkIn timestamp without time zone,
  checkOut timestamp without time zone,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT staff_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT staff_attendance_staffId_fkey FOREIGN KEY (staffId) REFERENCES public.staff(id)
);
CREATE TABLE public.stock_items (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  unit text NOT NULL,
  costPerUnit double precision NOT NULL,
  stockQuantity double precision NOT NULL DEFAULT 0,
  minStockLevel double precision NOT NULL DEFAULT 0,
  supplier text,
  location text,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  categoryId text,
  CONSTRAINT stock_items_pkey PRIMARY KEY (id),
  CONSTRAINT stock_items_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.inventory_categories(id)
);
CREATE TABLE public.tables (
  id text NOT NULL,
  tableNumber text NOT NULL,
  capacity integer NOT NULL,
  areaId text NOT NULL,
  floorId text NOT NULL,
  status text NOT NULL DEFAULT 'available'::text,
  displayOrder integer NOT NULL DEFAULT 0,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_floorId_fkey FOREIGN KEY (floorId) REFERENCES public.floors(id),
  CONSTRAINT tables_areaId_fkey FOREIGN KEY (areaId) REFERENCES public.areas(id)
);
CREATE TABLE public.tax_categories (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  taxRate double precision NOT NULL DEFAULT 0.0,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT tax_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id text NOT NULL,
  transactionNumber text NOT NULL,
  orderId text,
  totalAmount double precision NOT NULL,
  taxAmount double precision NOT NULL DEFAULT 0.0,
  discountAmount double precision NOT NULL DEFAULT 0.0,
  paymentMethod text NOT NULL,
  paymentStatus text NOT NULL DEFAULT 'completed'::text,
  cashierId text,
  customerId text,
  transactionDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  items text NOT NULL,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.orders(id),
  CONSTRAINT transactions_cashierId_fkey FOREIGN KEY (cashierId) REFERENCES public.users(id),
  CONSTRAINT transactions_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.customers(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  username text NOT NULL,
  passwordHash text NOT NULL,
  fullName text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'cashier'::text,
  isActive boolean NOT NULL DEFAULT true,
  lastLogin timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verificationTokens (
  id text NOT NULL,
  userId text NOT NULL,
  token text NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT verificationTokens_pkey PRIMARY KEY (id),
  CONSTRAINT verificationTokens_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);