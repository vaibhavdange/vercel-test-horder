"use client";

import { useState, useEffect, useRef } from "react";
import { generateBillHTML } from "@/lib/print/bill";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, AlertCircle, Users, Truck, Trash2, Plus, Minus, Edit, ShoppingCart, UserPlus, Menu, X } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useCreateOrderOptimistic, useUpdateOrder } from "@/hooks/use-orders";
import { useSearchCustomers, useCreateCustomer, useCustomerByPhone } from "@/hooks/use-customers";
import { useTables } from "@/hooks/useTables";
import { CreateOrderData, CreateOrderItemData, Customer } from "@/types/orders";
import MenuSearchBar from "@/components/orders/MenuSearchBar";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Category as ApiCategory } from "@/types/category";
import { useBillingSettings } from "@/hooks/use-billing-settings";
import { generateNextKOTNumber } from "@/lib/database/kot-numbering";
import PaymentDrawer from "@/components/ui/PaymentDrawer";
import OrderConfirmationMessage from "@/components/ui/OrderConfirmationMessage";
import { useCurrency } from "@/hooks/useCurrency";
import { useAnalytics } from "@/hooks/use-analytics";

// Type declaration for electron
declare global {
  interface Window {
    electron?: {
      printer?: {
        print: (content: any) => Promise<any>;
        getPrinters: () => Promise<any>;
      };
    };
  }
}

type MenuItem = any;

interface ExtraSelection {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  customizationNotes?: string;
  extras?: ExtraSelection[];
}

interface DisplayCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
}

export default function NewOrderPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [tableId, setTableId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizationNotes, setCustomizationNotes] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Order Amendment State
  const [isAmendingOrder, setIsAmendingOrder] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | undefined>();
  const [amendmentMode, setAmendmentMode] = useState(false);

  // Refs for customer search
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);

  // Router for navigation
  const router = useRouter();

  // Fetch categories and products from database
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts(
    activeCategory === "All" ? undefined : activeCategory
  );

  // Get all products for "All" category count
  const { data: allProducts = [] } = useProducts();
  
  // Fetch analytics data for popular products sorting
  const { data: analytics, error: analyticsError } = useAnalytics('month');
  
  // Temporary debug - will remove after verification
  useEffect(() => {
    console.log('🔍 Products data updated:', {
      allProductsCount: allProducts.length,
      allProducts: allProducts.map(p => ({ id: p.id, name: p.name, isActive: p.isActive }))
    });
  }, [allProducts]);

  // Fetch tables from database
  const { tables, getAvailableTables, tablesLoading } = useTables();
  const availableTables = getAvailableTables();
  
  // Currency formatter
  const { format } = useCurrency();

  // Preselect table from URL (?table=<tableId>)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const preselectTableId = params.get('table');
      if (preselectTableId && tables.length > 0) {
        const t = tables.find(t => t.id === preselectTableId);
        if (t && t.status === 'available') {
          setOrderType('dine-in');
          setTableId(preselectTableId);
          setTableNumber(t.tableNumber);
        }
      }
    } catch {}
  }, [tables]);

  // Get order button action setting
  const { data: billingSettings = [] } = useBillingSettings();
  const orderButtonAction = billingSettings.find(setting => setting.key === "order_button_action")?.value || "create_order";

  // Customer search and creation
  const { data: customerSearchResults = [] } = useSearchCustomers(customerName);
  const { data: existingCustomer } = useCustomerByPhone(customerPhone);
  const createCustomer = useCreateCustomer();
  const createOrderOptimistic = useCreateOrderOptimistic();
  const updateOrder = useUpdateOrder();

  // Auto-save customer when name is entered
  const handleCustomerNameChange = async (name: string) => {
    setCustomerName(name);
    
    if (name.length >= 2) {
      // Show suggestions for existing customers
      const suggestions = await searchCustomersByName(name);
      setCustomerSuggestions(suggestions);
      setShowCustomerSuggestions(true);
    } else {
      setShowCustomerSuggestions(false);
      setCustomerSuggestions([]);
    }
    
    // Clear customer ID if name is changed manually
    if (customerId) {
      setCustomerId(undefined);
    }
  };

  // Auto-find customer when phone is entered
  const handleCustomerPhoneChange = async (phone: string) => {
    setCustomerPhone(phone);
    
    if (phone.length >= 3) {
      // Search for customers with matching phone numbers
      const suggestions = await searchCustomersByPhone(phone);
      setCustomerSuggestions(suggestions);
      setShowCustomerSuggestions(true);
    } else {
      setShowCustomerSuggestions(false);
      setCustomerSuggestions([]);
    }
    
    // Clear customer ID if phone is changed manually
    if (customerId) {
      setCustomerId(undefined);
    }
  };

  // Check for order amendment data on page load
  useEffect(() => {
    const amendOrderData = localStorage.getItem('amendOrderData');
    if (amendOrderData) {
      try {
        const data = JSON.parse(amendOrderData);
        console.log('Loading amendment data:', data);
        if (data.isAmending) {
          // Set amendment mode
          setAmendmentMode(true);
          setIsAmendingOrder(true);
          setExistingOrderId(data.existingOrderId);
          
          // Set order type and details
          setOrderType(data.orderType);
          setTableId(data.tableId || "");
          setTableNumber(data.tableNumber || "");
          setCustomerName(data.customerName || "");
          setCustomerPhone(data.customerPhone || "");
          setCustomerId(data.customerId);
          
          console.log('Amendment mode set. TableId:', data.tableId, 'OrderType:', data.orderType);
          
          // Load existing order items
          if (data.existingItems && data.existingItems.length > 0) {
            setOrderItems(data.existingItems);
          }
          
          // Clear the localStorage data
          localStorage.removeItem('amendOrderData');
        }
      } catch (error) {
        console.error('Error parsing amendment data:', error);
        localStorage.removeItem('amendOrderData');
      }
    }
  }, []);

  // Handle responsive behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search customers by name (helper function)
  const searchCustomersByName = async (query: string): Promise<Customer[]> => {
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Search customers by phone (helper function)
  const searchCustomersByPhone = async (query: string): Promise<Customer[]> => {
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const customers = await response.json();
        // Filter to only show customers whose phone numbers contain the query
        return customers.filter((customer: Customer) => 
          customer.phone && customer.phone.includes(query)
        );
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // Find customer by phone (helper function)
  const findCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    try {
      const response = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const customers = await response.json();
        return customers[0] || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Select customer from suggestions
  const selectCustomerFromSuggestions = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || "");
    setCustomerId(customer.id);
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };

  // Auto-create customer when order is submitted (if new customer)
  const ensureCustomerExists = async (): Promise<string | undefined> => {
    if (customerId) {
      return customerId; // Customer already exists
    }

    if (customerName.trim() && customerPhone.trim()) {
      try {
        // Check if customer already exists by phone
        const existingCustomer = await findCustomerByPhone(customerPhone);
        if (existingCustomer) {
          setCustomerId(existingCustomer.id);
          return existingCustomer.id;
        }

        // Create new customer
        const newCustomer = await createCustomer.mutateAsync({
          name: customerName.trim(),
          phone: customerPhone.trim(),
        });
        setCustomerId(newCustomer.id);
        return newCustomer.id;
      } catch (error) {
        console.error("Failed to create customer:", error);
        return undefined;
      }
    }

    return undefined;
  };

  const addToOrder = (item: MenuItem, notes?: string) => {
    const existingItem = orderItems.find((orderItem: OrderItem) => orderItem.id === item.id);
    
    if (existingItem) {
      setOrderItems((prev: OrderItem[]) => prev.map((orderItem: OrderItem) =>
        orderItem.id === item.id
          ? { 
              ...orderItem, 
              quantity: orderItem.quantity + 1, 
              total: (orderItem.quantity + 1) * item.price + (orderItem.extras?.reduce((s, e) => s + e.price, 0) || 0) * (orderItem.quantity + 1),
              customizationNotes: notes || orderItem.customizationNotes
            }
          : orderItem
      ));
    } else {
      setOrderItems((prev: OrderItem[]) => [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price,
        customizationNotes: notes
      }]);
    }
    
    // Show a brief success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successMsg.textContent = `${item.name} added to order!`;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 2000);
  };

  const updateItemCustomizationNotes = (itemId: string, notes: string) => {
    setOrderItems((prev: OrderItem[]) => prev.map((orderItem: OrderItem) =>
      orderItem.id === itemId
        ? { ...orderItem, customizationNotes: notes }
        : orderItem
    ));
    
    // Show a brief success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successMsg.textContent = `Customization notes updated!`;
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 2000);
  };

  // Map categories for display with icons
  const displayCategories: DisplayCategory[] = [
    { 
      id: "All", 
      name: "All", 
      count: allProducts.length, 
      icon: "🍽️" 
    },
    ...categories.map((cat: ApiCategory) => ({
      id: cat.id,
      name: cat.name,
      count: (cat as any)._count?.products || 0,
      icon: cat.icon || "🍴" // Use the actual icon from database, fallback to 🍴
    }))
  ];

  // Customer search and selection
  useEffect(() => {
    if (existingCustomer) {
      setCustomerName(existingCustomer.name);
      setCustomerId(existingCustomer.id);
    } else {
      setCustomerName("");
      setCustomerId(undefined);
    }
  }, [existingCustomer]);

  const handleItemClick = (item: MenuItem) => {
    addToOrder(item);
  };

  const findMenuItemById = (id: string): MenuItem | undefined => {
    return products.find((item: MenuItem) => item.id === id);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems((prev: OrderItem[]) => prev.filter((item: OrderItem) => item.id !== itemId));
    } else {
      setOrderItems((prev: OrderItem[]) => prev.map((item: OrderItem) =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price + (item.extras?.reduce((s, e) => s + e.price, 0) || 0) * newQuantity }
          : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    setOrderItems((prev: OrderItem[]) => prev.filter((item: OrderItem) => item.id !== itemId));
  };

  const getSubtotal = (): number => {
    return orderItems.reduce((sum: number, item: OrderItem) => sum + item.total, 0);
  };
  // Toggle extra for a specific order item
  const toggleExtraForItem = (itemId: string, extra: { id: string; name: string; price: number }) => {
    setOrderItems((prev: OrderItem[]) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const has = item.extras?.some((e) => e.id === extra.id);
      const newExtras = has
        ? (item.extras || []).filter((e) => e.id !== extra.id)
        : [ ...(item.extras || []), { id: extra.id, name: extra.name, price: extra.price } ];
      const extrasTotal = newExtras.reduce((s, e) => s + e.price, 0) * (item.quantity || 1);
      return {
        ...item,
        extras: newExtras,
        total: item.quantity * item.price + extrasTotal,
      };
    }));
  };


  const getTax = (): number => {
    // Use product-specific tax rates if available, otherwise use default
    const totalTax = orderItems.reduce((sum: number, item: OrderItem) => {
      const product = products.find(p => p.id === item.id);
      const taxRate = product?.taxRate || 0;
      return sum + (item.total * (taxRate / 100));
    }, 0);
    return totalTax;
  };

  const getServiceCharge = (): number => {
    // Use product-specific service charge rates if available, otherwise use default
    const totalServiceCharge = orderItems.reduce((sum: number, item: OrderItem) => {
      const product = products.find(p => p.id === item.id);
      const serviceChargeRate = product?.serviceChargeRate || 0;
      return sum + (item.total * (serviceChargeRate / 100));
    }, 0);
    return totalServiceCharge;
  };

  const getTotal = (): number => {
    return getSubtotal() + getTax() + getServiceCharge();
  };

  const handleOrderTypeSelect = (type: "dine-in" | "takeaway") => {
    setOrderType(type);
    if (type === "dine-in") {
      setShowTableModal(true);
    } else {
      setTableNumber("Takeaway");
      setTableId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(undefined);
    }
  };

  const handleOrderTypeChange = (newType: "dine-in" | "takeaway") => {
    setOrderType(newType);
    if (newType === "takeaway") {
      setTableNumber("Takeaway");
      setTableId("");
    } else {
      setTableNumber(""); // Reset to empty for dine-in to force table selection
      setTableId("");
    }
  };

  const createOrderInDatabase = async () => {
    if (orderItems.length === 0) {
      alert("Please add items to the order first!");
      return;
    }
    
    if (!orderType) {
      alert("Please select order type!");
      return;
    }

    console.log('Validation check - OrderType:', orderType, 'AmendmentMode:', amendmentMode, 'TableId:', tableId);
    if (orderType === "dine-in" && !amendmentMode && (!tableId || tableId === "")) {
      alert("Please select a table!");
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Ensure customer exists (create if new, find if existing)
      const finalCustomerId = await ensureCustomerExists();

      const orderData: CreateOrderData = {
        orderType,
        tableId: orderType === "dine-in" ? tableId : undefined,
        tableNumber: orderType === "dine-in" ? tableNumber : undefined,
        customerId: finalCustomerId,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        status: "pending",
        subStatus: amendmentMode ? "Order Amended" : "Order Created",
        subtotal: getSubtotal(),
        taxAmount: getTax(),
        serviceChargeAmount: getServiceCharge(),
        discountAmount: 0,
        totalAmount: getTotal(),
        paymentStatus: "pending",
        notes: amendmentMode ? "Order amended with additional items" : "",
        orderItems: orderItems.map((item: any) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          customizationNotes: [
            item.customizationNotes?.trim() || '',
            ...(item.extras && item.extras.length > 0 ? [`Extras: ${item.extras.map((e: any) => `${e.name} (+${format(Number(e.price))})`).join(', ')}`] : [])
          ].filter(Boolean).join(' | '),
        })),
      };

      if (amendmentMode && existingOrderId) {
        // For amendments, update the existing order
        try {
          console.log('Amending order:', existingOrderId);
          console.log('New order items:', orderItems);
          console.log('New totals:', { subtotal: getSubtotal(), tax: getTax(), total: getTotal() });
          
          // Update the existing order with amended items
          const amendedOrderData = {
            orderItems: orderItems.map(item => ({
              productId: item.id,
              productName: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.total,
              customizationNotes: [
                item.customizationNotes?.trim() || '',
                ...(item.extras && item.extras.length > 0 ? [`Extras: ${item.extras.map((e: any) => `${e.name} (+${format(Number(e.price))})`).join(', ')}`] : [])
              ].filter(Boolean).join(' | ')
            })),
            subtotal: getSubtotal(),
            taxAmount: getTax(),
            serviceChargeAmount: getServiceCharge(),
            totalAmount: getTotal(),
            subStatus: "Order Amended",
            notes: `Order amended with additional items. ${orderData.notes || ''}`
          };
          
          await updateOrder.mutateAsync({ 
            orderId: existingOrderId, 
            orderData: amendedOrderData 
          });
          alert("Order amended successfully!");
          // Reset form and stay on page for potential new orders
          setOrderItems([]);
          setOrderType(null);
          setTableNumber("");
          setCustomerName("");
          setCustomerPhone("");
          setCustomerId(undefined);
          setShowCustomerSuggestions(false);
          setCustomerSuggestions([]);
          setIsAmendingOrder(false);
          setExistingOrderId(undefined);
          setAmendmentMode(false);
        } catch (error) {
          console.error("Failed to amend order:", error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          alert(`Failed to amend order: ${errorMessage}`);
          return;
        }
      } else {
        // Regular new order - use optimistic updates for instant feedback
        try {
          // Start optimistic creation - this will instantly show the order
          const createdOrder = await createOrderOptimistic.mutateAsync(orderData);
          
          // Show order confirmation message immediately
          setConfirmedOrder(createdOrder);
          setShowOrderConfirmation(true);
          
          // Handle different order button actions based on billing settings
          switch (orderButtonAction) {
            case "create_order_print_kot":
              // Print KOT after creating order
              await printKOT(createdOrder);
              break;
            case "create_order_print_bill":
              // Print Bill with unpaid status
              await printBill(createdOrder, false, undefined);
              break;
            case "create_order_pay":
              // Open payment drawer and print bill once paid
              await handleCreateOrderAndPay(createdOrder);
              return; // Don't redirect yet, wait for payment
            default:
              // Just create order (default behavior)
              break;
          }
          
          // Don't redirect immediately, let user see confirmation message
          // router.push('/dashboard/orders'); // Redirect to orders page
        } catch (error) {
          console.error("Failed to create order:", error);
          alert("Failed to create order. Please try again.");
          return; // Don't reset form on error
        }
      }
      
    // Reset the order
    setOrderItems([]);
    setOrderType(null);
    setTableNumber("");
      setTableId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(undefined);
      setShowCustomerSuggestions(false);
      setCustomerSuggestions([]);
      setIsAmendingOrder(false);
      setExistingOrderId(undefined);
      setAmendmentMode(false);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Helper function to print KOT
  const printKOT = async (order: any) => {
    try {
      // Generate KOT number if not exists
      if (!order.kotNumber) {
        const kotNumber = await generateNextKOTNumber();
        // Update order with KOT number - use any to bypass type checking for now
        await updateOrder.mutateAsync({
          orderId: order.id,
          orderData: { kotNumber } as any
        });
      }
      
      // Print KOT using electron printer API
      if (window.electron?.printer?.print) {
        const kotContent = generateKOTContent(order);
        await window.electron.printer.print(kotContent);
        console.log("KOT printed successfully");
      } else {
        console.log("KOT content ready for printing:", generateKOTContent(order));
      }
    } catch (error) {
      console.error("Failed to print KOT:", error);
    }
  };

  // Helper function to print Bill
  const printBill = async (order: any, isPaid: boolean, paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }) => {
    try {
      // Always load bill settings (backend first, then localStorage fallback)
      let billSettings: any = {};
      try {
        const res = await fetch('/api/settings/printers');
        if (res.ok) {
          const data = await res.json();
          if (data?.bill && typeof data.bill === 'object') {
            billSettings = data.bill;
            try { localStorage.setItem('settings.print.bill', JSON.stringify(billSettings)); } catch {}
          }
        }
      } catch {}
      if (!billSettings || Object.keys(billSettings).length === 0) {
        const billSettingsRaw = typeof window !== 'undefined' ? localStorage.getItem('settings.print.bill') : null;
        billSettings = billSettingsRaw ? JSON.parse(billSettingsRaw) : {};
      }

      const html = generateBillHTML({
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        serviceChargeAmount: order.serviceChargeAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        isPaid,
        items: (order.orderItems || []).map((it: any) => ({ name: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, totalPrice: it.totalPrice, notes: it.customizationNotes })),
        business: billSettings.business,
        tax: { showSplitGST: !!billSettings?.tax?.showSplitGST },
        extras: { 
          showPaymentDetails: billSettings?.extras?.showPaymentDetails !== false,
          paymentMethod: paymentDetails?.method,
          cashReceived: paymentDetails?.cashReceived,
          changeDue: paymentDetails?.changeDue
        },
        footer: billSettings.footer,
      }, { paper: billSettings.paper === '80' ? '80' : '58', dateTimeFormat: billSettings.dateTimeFormat });

      // Print Bill using electron printer API if available; otherwise, expose the HTML
      if (window.electron?.printer?.print) {
        await window.electron.printer.print({ html, silent: true, paper: (billSettings.paper === '80' ? '80' : '58') });
        console.log("Bill printed successfully");
      } else {
        console.log("Bill content ready for printing:", html);
      }
    } catch (error) {
      console.error("Failed to print Bill:", error);
    }
  };

  // Helper function to handle create order and pay
  const handleCreateOrderAndPay = async (order: any) => {
    try {
      // Open payment drawer
      setShowPaymentDrawer(true);
      setCurrentOrder(order);
      // The payment drawer will handle printing the bill once payment is complete
    } catch (error) {
      console.error("Failed to open payment drawer:", error);
      // Fallback: reset form and stay on page
      alert("Failed to open payment drawer. Please try again.");
      setOrderItems([]);
      setOrderType(null);
      setTableNumber("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(undefined);
      setShowCustomerSuggestions(false);
      setCustomerSuggestions([]);
      setIsAmendingOrder(false);
      setExistingOrderId(undefined);
      setAmendmentMode(false);
    }
  };

  // Handler for closing order confirmation message
  const handleCloseOrderConfirmation = () => {
    setShowOrderConfirmation(false);
    setConfirmedOrder(null);
    // Reset the order form to start fresh
    setOrderItems([]);
    setOrderType(null);
    setTableNumber("");
    setTableId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerId(undefined);
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
    setIsAmendingOrder(false);
    setExistingOrderId(undefined);
    setAmendmentMode(false);
    // Stay on the same page - no redirect
  };

  // Handler for Pay Now button in confirmation message
  const handlePayNowFromConfirmation = () => {
    if (confirmedOrder) {
      setShowOrderConfirmation(false);
      setShowPaymentDrawer(true);
      setCurrentOrder(confirmedOrder);
    }
  };

  // Helper function to generate KOT content
  const generateKOTContent = (order: any) => {
    return `
      ========================================
                    KOT #${order.kotNumber || 'N/A'}
      ========================================
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      Order Type: ${order.orderType}
      ${order.tableNumber ? `Table: ${order.tableNumber}` : ''}
      Customer: ${order.customerName || 'Walk-in'}
      
      ITEMS:
      ${order.orderItems.map((item: any, index: number) => 
        `${index + 1}. ${item.productName} x${item.quantity} - ${format(item.totalPrice)}${item.customizationNotes ? `\n   Notes: ${item.customizationNotes}` : ''}`
      ).join('\n')}
      
      ${order.notes ? `\nOrder Notes: ${order.notes}` : ''}
      
      ========================================
      Total: ${format(order.totalAmount)}
      ========================================
    `;
  };

  // Helper function to generate Bill content
  const generateBillContent = (order: any, isPaid: boolean) => {
    return `
      ========================================
                    BILL
      ========================================
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      Order #: ${order.id}
      Order Type: ${order.orderType}
      ${order.tableNumber ? `Table: ${order.tableNumber}` : ''}
      Customer: ${order.customerName || 'Walk-in'}
      ${order.customerPhone ? `Phone: ${order.customerPhone}` : ''}
      
      ITEMS:
      ${order.orderItems.map((item: any, index: number) => 
        `${index + 1}. ${item.productName} x${item.quantity} @ ${format(item.unitPrice)} = ${format(item.totalPrice)}${item.customizationNotes ? `\n   Notes: ${item.customizationNotes}` : ''}`
      ).join('\n')}
      
      ========================================
      Subtotal: ${format(order.subtotal)}
      Tax: ${format(order.taxAmount)}
      Service Charge: ${format(order.serviceChargeAmount)}
      ========================================
      TOTAL: ${format(order.totalAmount)}
      Status: ${isPaid ? 'PAID' : 'UNPAID'}
      ========================================
      ${order.notes ? `\nNotes: ${order.notes}` : ''}
      
      Thank you for your order!
      Powered by HORDER POS SYSTEM
    `;
  };

  // State for payment drawer
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  // State for order confirmation message
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Sort products by popularity (most selling items first) when in "All" category
  const sortByPopularity = (items: any[]) => {
    if (activeCategory !== "All" || !analytics?.popularProducts) {
      return items;
    }
    
    // Create a map of product popularity scores
    const popularityMap = new Map();
    analytics.popularProducts.forEach((popularProduct, index) => {
      // Calculate popularity score: higher quantity and revenue = higher score
      // Add position bonus (earlier in list = higher score)
      const positionBonus = Math.max(0, 10 - index); // Top 10 get bonus points
      const popularityScore = (popularProduct.totalQuantity * 0.6) + (popularProduct.totalRevenue * 0.4) + positionBonus;
      popularityMap.set(popularProduct.productId, popularityScore);
    });
    
    // Sort items by popularity score (highest first)
    return [...items].sort((a, b) => {
      const scoreA = popularityMap.get(a.id) || 0;
      const scoreB = popularityMap.get(b.id) || 0;
      return scoreB - scoreA; // Descending order
    });
  };

  const filteredItems = activeCategory === "All" 
    ? sortByPopularity(products)
    : products.filter(item => item.categoryId === activeCategory);

  // Apply search filter across ALL items regardless of category
  const searchFilteredItems = searchQuery.trim() 
    ? sortByPopularity(allProducts.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories.find(cat => cat.id === item.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : filteredItems;

  // Auto-navigate to category when searching for items
  useEffect(() => {
    if (searchQuery.trim()) {
      // Find the first matching item's category from all products
      const firstMatch = allProducts.find(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories.find(cat => cat.id === item.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (firstMatch && firstMatch.categoryId !== activeCategory) {
        setActiveCategory(firstMatch.categoryId || "All");
      }
    }
  }, [searchQuery, activeCategory, allProducts, categories]);

  // Mock data for contextual information
  const getPrepTime = (item: MenuItem) => {
    const prepTimes: Record<string, string> = {
      "Pizza": "15-20 min",
      "Burger": "8-12 min", 
      "Chicken": "12-18 min",
      "Pasta": "10-15 min",
      "Bakery": "5-8 min",
      "Beverages": "2-5 min",
      "Desserts": "5-10 min"
    };
    
    const category = categories.find(cat => cat.id === item.categoryId);
    return category ? prepTimes[category.name] || "10-15 min" : "10-15 min";
  };

  const getDietaryInfo = (item: MenuItem) => {
    const dietary: string[] = [];
    if (item.name.toLowerCase().includes("vegetarian") || item.name.toLowerCase().includes("veggie")) {
      dietary.push("🌱");
    }
    if (item.name.toLowerCase().includes("spicy") || item.name.toLowerCase().includes("hot")) {
      dietary.push("🔥");
    }
    if (item.name.toLowerCase().includes("fresh") || item.name.toLowerCase().includes("organic")) {
      dietary.push("🌿");
    }
    return dietary;
  };

  const getPopularityBadge = (item: MenuItem) => {
    // Check if item is in top popular products
    if (activeCategory === "All" && analytics?.popularProducts) {
      const topProducts = analytics.popularProducts.slice(0, 10); // Top 10
      const isPopular = topProducts.some(popularProduct => popularProduct.productId === item.id);
      
      if (isPopular) {
        const rank = topProducts.findIndex(popularProduct => popularProduct.productId === item.id) + 1;
        return `🔥 #${rank} Best Seller`;
      }
    }
    
    // Fallback to category-based popularity for other categories
    const popularCategories = ["Pizza", "Burger", "Chicken"];
    const category = categories.find(cat => cat.id === item.categoryId);
    return category && popularCategories.includes(category.name) ? "⭐ Popular" : null;
  };

  if (categoriesLoading || productsLoading) {
  return (
    <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading menu...</p>
                  </div>
        </div>
      </div>
    );
  }

  if (categoriesError || productsError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Failed to load menu. Please try again.</p>
                  </div>
              </div>
            </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 min-w-0 flex overflow-hidden">
        {/* Mobile Sidebar Toggle Button - Only visible on mobile */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-20 right-4 z-40 bg-white border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors duration-200"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {orderItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {orderItems.length}
            </span>
          )}
        </button>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 flex flex-col p-6 overflow-y-auto md:mr-0">
          {/* Order Type Selection - Moved to right sidebar */}

          {/* Search Bar - Static component */}
          <MenuSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultsCount={searchFilteredItems.length}
            activeCategoryName={activeCategory !== "All" ? (categories.find((cat: ApiCategory) => cat.id === activeCategory)?.name || 'Category') : undefined}
          />

          {/* Categories */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Error loading categories</span>
              </div>
            ) : (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {displayCategories.map((category: DisplayCategory) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-32 h-32 flex-shrink-0 rounded-xl border-2 transition-all duration-200 ${
                      activeCategory === category.id
                        ? "border-green-200 bg-green-50 text-green-700 shadow-soft"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-center h-full flex flex-col items-center justify-center p-4">
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <div className="font-semibold text-sm mb-1">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.count} items</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Items</h2>
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading menu items...</span>
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Error loading menu items</span>
              </div>
            ) : searchFilteredItems.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <span>
                  {searchQuery 
                    ? `No items found matching "${searchQuery}"`
                    : "No items found in this category"
                  }
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {searchFilteredItems.map((item: MenuItem) => (
                  <div 
                    key={item.id} 
                    className="w-48 h-48 bg-white rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-200 relative cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => addToOrder(item)}
                  >
                    {/* Product Image */}
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                      {(() => {
                        // Use the product's actual image or thumbnail from database
                        const productImage = item.thumbnail || item.image;
                        const category = categories.find((cat: ApiCategory) => cat.id === item.categoryId);
                        
                        // Get appropriate fallback icon based on category
                        const getFallbackIcon = () => {
                          if (!category) return "🍽️";
                          
                          const categoryName = category.name.toLowerCase();
                          if (categoryName.includes('pizza')) return "🍕";
                          if (categoryName.includes('burger')) return "🍔";
                          if (categoryName.includes('chicken')) return "🍗";
                          if (categoryName.includes('bakery')) return "🧁";
                          if (categoryName.includes('beverage')) return "🥤";
                          if (categoryName.includes('pasta')) return "🍝";
                          if (categoryName.includes('salad')) return "🥗";
                          if (categoryName.includes('dessert')) return "🍰";
                          if (categoryName.includes('seafood')) return "🦐";
                          return category.icon || "🍽️";
                        };
                        
                        if (productImage) {
                          return (
                            <OptimizedImage
                              src={productImage}
                              alt={item.name}
                              className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                              priority={false}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              fallbackIcon={<div className="text-4xl opacity-60">{getFallbackIcon()}</div>}
                            />
                          );
                        } else {
                          // Fallback with category-appropriate emoji when no image is available
                          return (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <div className="text-4xl opacity-60">{getFallbackIcon()}</div>
                            </div>
                          );
                        }
                      })()}
                      
                      {/* Stock indicator overlay */}
                      {item.stockQuantity <= item.minStockLevel && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                            Low Stock
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 flex flex-col flex-1">
                      {/* Product Name */}
                      <h3 className="text-base font-bold text-gray-900 leading-tight mb-2 line-clamp-1">
                        {item.name}
                      </h3>
                    
                      {/* Bottom Section - Price and Stock */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-lg font-bold text-green-600">
                          {format(item.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Stock: {item.stockQuantity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar - Order Summary */}
        <div className={`fixed md:relative inset-y-0 right-0 z-30 w-96 bg-white border-l border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}>
          {/* Mobile Close Button - Only visible on mobile */}
          <div className="md:hidden flex justify-end p-4 border-b border-gray-200">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Order Type Selection - Compact */}
          {!orderType && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOrderTypeSelect("dine-in")}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-green-700"
                >
                  <Users className="h-4 w-4" />
                  <span>Dine In</span>
                </button>
                <button
                  onClick={() => handleOrderTypeSelect("takeaway")}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-green-700"
                >
                  <Truck className="h-4 w-4" />
                  <span>Takeaway</span>
                </button>
              </div>
            </div>
          )}

          {/* Order Info Header - Compact */}
          {orderType && (
            <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    orderType === "dine-in"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    {orderType === "dine-in" ? "Dine In" : "Takeaway"}
                  </div>
                  {customerName && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      {customerName}
                    </span>
                  )}
                  {orderType === "dine-in" && (
                    tableNumber ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Table {tableNumber}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Select Table
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowTableModal(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200"
                    title="Edit order details"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                    title="Cancel order"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          </div>

          {/* Order Items */}
          <div className="flex-1 p-6 overflow-y-auto">
            {orderItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items in order</p>
                <p className="text-sm">Select items from the menu to add to your order</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Customization Notes Display */}
                    {item.customizationNotes && (
                      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        <span className="font-medium">Notes:</span> {item.customizationNotes}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{format(item.total)}</p>
                      </div>
                    </div>
                    
                    {/* Extras badges inline with customization notes action */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const prod = products.find(p => p.id === item.id) as any;
                          const extras = (prod as any)?.extras || [];
                          if (extras.length === 0) return null;
                          const selectedIds = new Set((item.extras || []).map(e => e.id));
                          return extras.map((ex: any) => {
                            const enabled = selectedIds.has(ex.id);
                            return (
                              <button
                                key={ex.id}
                                onClick={() => toggleExtraForItem(item.id, { id: ex.id, name: ex.name, price: ex.price })}
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${enabled ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                title={`${ex.name} (+${format(Number(ex.price))})`}
                              >
                                {ex.name}
                              </button>
                            );
                          });
                        })()}
                      </div>
                      <button
                        onClick={() => {
                          const menuItem = findMenuItemById(item.id);
                          if (menuItem) {
                            setSelectedItem(menuItem);
                            setCustomizationNotes(item.customizationNotes || "");
                            setEditingItemId(item.id);
                            setShowCustomizationModal(true);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                        title="Add/edit customization notes"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Totals and Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {orderItems.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{format(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{format(getTax())}</span>
                </div>
                {getServiceCharge() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Charge:</span>
                    <span className="font-medium">{format(getServiceCharge())}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{format(getTotal())}</span>
                </div>
              </div>
            )}

            <button
              onClick={createOrderInDatabase}
              disabled={orderItems.length === 0 || !orderType || isCreatingOrder}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isCreatingOrder ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{amendmentMode ? "Creating Amended Order..." : "Creating Order..."}</span>
                </div>
              ) : (
                <span>
                  {amendmentMode 
                    ? "Create Amended Order" 
                    : orderButtonAction === "create_order_print_kot" 
                      ? "Create Order & Print KOT"
                      : orderButtonAction === "create_order_print_bill"
                        ? "Create Order & Print Bill"
                        : orderButtonAction === "create_order_pay"
                          ? "Create Order & Pay"
                          : "Create Order"
                  }
                </span>
              )}
            </button>
          </div>
          
          {/* Order Confirmation Message */}
          <OrderConfirmationMessage
            isVisible={showOrderConfirmation}
            onClose={handleCloseOrderConfirmation}
            onPayNow={handlePayNowFromConfirmation}
          />
        </div>
      </div>

      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Order Details</h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                <select
                  value={orderType || "dine-in"}
                  onChange={(e) => {
                    const newType = e.target.value as "dine-in" | "takeaway";
                    handleOrderTypeChange(newType);
                    if (newType === "takeaway") {
                      setCustomerName("Walk-in Customer");
                      setCustomerPhone("");
                      setCustomerId(undefined);
                    } else {
                      setCustomerName("");
                      setCustomerPhone("");
                      setCustomerId(undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>

              {orderType === "dine-in" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                    {tablesLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading tables...
                      </div>
                    ) : (
                      <>
                        <select
                          value={tableId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setTableId(selectedId);
                            const t = tables.find(t => t.id === selectedId);
                            setTableNumber(t?.tableNumber || "");
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select a table</option>
                          {availableTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.area?.name} - Table {table.tableNumber} ({table.capacity} seats)
                            </option>
                          ))}
                        </select>
                        {availableTables.length === 0 && !tablesLoading && (
                          <p className="mt-1 text-sm text-orange-600">No available tables found. Please check table status or add more tables.</p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      placeholder="Enter customer phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    {showCustomerSuggestions && customerSuggestions.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-soft max-h-40 overflow-y-auto">
                        {customerSuggestions.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomerFromSuggestions(customer)}
                            className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.phone || "No phone"}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selecting the customer
                                selectCustomerFromSuggestions(customer);
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Customer suggestions appear automatically when typing */}
                </>
              )}

              {orderType === "takeaway" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      placeholder="Enter customer phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    {showCustomerSuggestions && customerSuggestions.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-soft max-h-40 overflow-y-auto">
                        {customerSuggestions.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomerFromSuggestions(customer)}
                            className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.phone || "No phone"}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selecting the customer
                                selectCustomerFromSuggestions(customer);
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Customer suggestions appear automatically when typing */}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">Are you sure you want to cancel this order? This action cannot be undone.</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  // Reset the entire order
                  setOrderItems([]);
                  setOrderType(null);
                  setTableNumber("");
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerId(undefined);
                  setShowCancelConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customization Notes Modal */}
      {showCustomizationModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItemId ? "Edit Customization Notes" : "Add to Order"}
              </h3>
              <button
                onClick={() => {
                  setShowCustomizationModal(false);
                  setEditingItemId(null);
                  setCustomizationNotes("");
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedItem.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{selectedItem.description}</p>
                <div className="text-lg font-bold text-green-600">{format(selectedItem.price)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customization Notes (Optional)
                </label>
                <textarea
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  placeholder="e.g., No onions, Extra cheese, Well done..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomizationModal(false);
                  setEditingItemId(null);
                  setCustomizationNotes("");
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingItemId) {
                    // Update customization notes for existing item
                    updateItemCustomizationNotes(editingItemId, customizationNotes);
                  } else {
                    // Add new item to order
                    addToOrder(selectedItem, customizationNotes);
                  }
                  setShowCustomizationModal(false);
                  setSelectedItem(null);
                  setCustomizationNotes("");
                  setEditingItemId(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                {editingItemId ? "Update Notes" : "Add to Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {/* This modal is no longer needed as customer input is inline */}

      {/* Payment Drawer */}
      {showPaymentDrawer && currentOrder && (
        <PaymentDrawer
          isOpen={showPaymentDrawer}
          onClose={() => {
            setShowPaymentDrawer(false);
            setCurrentOrder(null);
            // Reset order form to start fresh
            setOrderItems([]);
            setOrderType(null);
            setTableNumber("");
            setCustomerName("");
            setCustomerPhone("");
            setCustomerId(undefined);
            // Stay on the same page - no redirect
          }}
          order={currentOrder}
          onPaymentComplete={async (transaction: any, paymentDetails?: { method: string; cashReceived?: number; changeDue?: number }) => {
            // Print bill with paid status and payment details
            await printBill(currentOrder, true, paymentDetails);
            // Close payment drawer
            setShowPaymentDrawer(false);
            setCurrentOrder(null);
            // Reset order form to start fresh
            setOrderItems([]);
            setOrderType(null);
            setTableNumber("");
            setCustomerName("");
            setCustomerPhone("");
            setCustomerId(undefined);
            // Stay on the same page - no redirect
          }}
        />
      )}
    </div>
  );
}
