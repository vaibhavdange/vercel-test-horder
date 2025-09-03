"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, Search, Filter, MoreVertical } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useHighlight } from "@/hooks/use-highlight";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { ImageUpload } from "@/components/ui/ImageUpload";
import ExtrasEditor from "@/components/menu/ExtrasEditor";
import AddonsVariantsEditor, { ExtraFormRow, VariantFormRow } from "@/components/menu/AddonsVariantsEditor";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { EmojiPicker } from "@/components/ui/EmojiPicker";

import { useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-categories";
import { useCurrency } from "@/hooks/useCurrency";
import { useProductLevelTaxEnabled } from "@/hooks/use-billing-settings";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showInactiveItems, setShowInactiveItems] = useState(false);
  
  // Bulk actions state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkActionData, setBulkActionData] = useState<any>({});
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // Use highlight hook for search result highlighting
  useHighlight();

  // Fetch data from database
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts(
    activeCategory === "All" ? undefined : activeCategory,
    searchTerm,
    showInactiveItems
  );

  // Mutations
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  // Currency formatter
  const { format, symbol } = useCurrency();
  const { data: productLevelTaxEnabled = false } = useProductLevelTaxEnabled();

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "🍴"
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    stockQuantity: "",
    minStockLevel: "",
    categoryId: "",
    barcode: "",
    taxRate: "0.0",
    image: "",
    thumbnail: "",
    isActive: true,
    isAlcohol: false,
    extras: [] as { name: string; price: string; stockItemId?: string }[],
    variants: [] as { id?: string; name: string; price: string; isNew?: boolean }[],
  });

  // Removed extra all-products query to reduce load; counts should come from categories API when available

  // Filtered products based on search
  // Server-side search via useProducts(searchTerm); keep client-side filter as fallback if backend ignores search
  const filteredProducts = products;

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    "Main Course": "🍽️",
    "Appetizers": "🥗",
    "Desserts": "🍰",
    "Beverages": "🥤",
    "Pizza": "🍕",
    "Burger": "🍔",
    "Chicken": "🍗",
    "Bakery": "🧁",
    "Seafood": "🦐",
    "Pasta": "🍝",
    "Salad": "🥗",
    "Soup": "🍲",
    "Steak": "🥩",
    "Fish": "🐟",
    "Vegetarian": "🥬",
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || "🍴";
  };

  const handleAddCategory = async () => {
    try {
      // Validate required fields
      if (!categoryForm.name.trim()) {
        alert("Please enter a category name");
        return;
      }

      // Check if category name already exists
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === categoryForm.name.toLowerCase()
      );
      
      if (existingCategory) {
        alert("A category with this name already exists");
        return;
      }

      // Create category via API
      await createCategory.mutateAsync({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        icon: categoryForm.icon
      });
      
      setShowAddCategory(false);
      setCategoryForm({ name: "", description: "", icon: "🍴" });
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon
    });
    setShowEditCategory(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      // Validate required fields
      if (!categoryForm.name.trim()) {
        alert("Please enter a category name");
        return;
      }

      // Check if category name already exists (excluding current category)
      const existingCategory = categories.find(
        cat => cat.id !== editingCategory.id && 
               cat.name.toLowerCase() === categoryForm.name.toLowerCase()
      );
      
      if (existingCategory) {
        alert("A category with this name already exists");
        return;
      }

      // Update category via API
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        icon: categoryForm.icon
      });
      
      setShowEditCategory(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", icon: "🍴" });
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all products in this category.")) {
      try {
        // Delete category via API
        await deleteCategory.mutateAsync(categoryId);
        
        if (activeCategory === categoryId) {
          setActiveCategory("All");
        }
        setShowEditCategory(false);
        setEditingCategory(null);
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Failed to delete category. Please try again.");
      }
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!productForm.name.trim() || !productForm.price || !productForm.categoryId) {
        alert("Please fill in all required fields (Name, Price, and Category)");
        return;
      }

      // Validate numeric fields
      const price = parseFloat(productForm.price);
      const cost = productForm.cost ? parseFloat(productForm.cost) : undefined;
      const stockQuantity = parseInt(productForm.stockQuantity) || 0;
      const minStockLevel = parseInt(productForm.minStockLevel) || 0;
      const taxRate = parseFloat(productForm.taxRate) || 0.0;

      // Check for valid numbers
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price greater than 0");
        return;
      }

      if (cost !== undefined && (isNaN(cost) || cost < 0)) {
        alert("Please enter a valid cost (must be 0 or greater)");
        return;
      }

      if (stockQuantity < 0) {
        alert("Stock quantity cannot be negative");
        return;
      }

      if (minStockLevel < 0) {
        alert("Minimum stock level cannot be negative");
        return;
      }

      if (taxRate < 0 || taxRate > 100) {
        alert("Tax rate must be between 0 and 100");
        return;
      }

      await createProduct.mutateAsync({
        ...productForm,
        price,
        cost,
        stockQuantity,
        minStockLevel,
        taxRate,
        extras: productForm.extras
          .filter((e) => e.name && e.price !== "")
          .map((e) => ({ name: e.name.trim(), price: parseFloat(e.price) || 0, stockItemId: e.stockItemId })),
        variants: productForm.variants
          .filter((v) => v.name && v.price !== "")
          .map((v) => ({ name: v.name.trim(), price: parseFloat(v.price) || 0 })),
      });
      
      setShowAddProduct(false);
      setProductForm({
        name: "", description: "", price: "", cost: "", stockQuantity: "", 
        minStockLevel: "", categoryId: "", barcode: "", taxRate: "0.0", image: "", thumbnail: "", isActive: true, isAlcohol: false, extras: [], variants: []
      });
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product. Please try again.");
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      cost: product.cost?.toString() || "",
      stockQuantity: product.stockQuantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      categoryId: product.categoryId || "",
      barcode: product.barcode || "",
      taxRate: product.taxRate.toString(),
      image: product.image || "",
      thumbnail: product.thumbnail || "",
      isActive: product.isActive,
      isAlcohol: Boolean((product as any).isAlcohol),
      extras: ((product as any).extras || []).map((e: any) => ({
        name: e.name,
        price: String(e.price ?? 0),
        stockItemId: e.stockItemId || undefined,
      })),
      variants: ((product as any).variants || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        price: String(v.price ?? 0),
        isNew: false,
      }))
    });
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      // Validate required fields
      if (!productForm.name.trim() || !productForm.price || !productForm.categoryId) {
        alert("Please fill in all required fields (Name, Price, and Category)");
        return;
      }

      // Validate numeric fields
      const price = parseFloat(productForm.price);
      const cost = productForm.cost ? parseFloat(productForm.cost) : undefined;
      const stockQuantity = parseInt(productForm.stockQuantity) || 0;
      const minStockLevel = parseInt(productForm.minStockLevel) || 0;
      const taxRate = parseFloat(productForm.taxRate) || 0.0;

      // Check for valid numbers
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price greater than 0");
        return;
      }

      if (cost !== undefined && (isNaN(cost) || cost < 0)) {
        alert("Please enter a valid cost (must be 0 or greater)");
        return;
      }

      if (stockQuantity < 0) {
        alert("Stock quantity cannot be negative");
        return;
      }

      if (minStockLevel < 0) {
        alert("Minimum stock level cannot be negative");
        return;
      }

      if (taxRate < 0 || taxRate > 100) {
        alert("Tax rate must be between 0 and 100");
        return;
      }

      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        ...productForm,
        price,
        cost,
        stockQuantity,
        minStockLevel,
        taxRate,
        isAlcohol: Boolean(productForm.isAlcohol),
        extras: productForm.extras
          .filter((e) => e.name && e.price !== "")
          .map((e) => ({ name: e.name.trim(), price: parseFloat(e.price) || 0, stockItemId: e.stockItemId })),
        variants: productForm.variants
          .filter((v) => v.name && v.price !== "")
          .map((v) => ({ name: v.name.trim(), price: parseFloat(v.price) || 0 })),
      });
      
      setShowEditProduct(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await deleteProduct.mutateAsync(productId);
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  // Bulk action functions
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select products first");
      return;
    }

    setIsPerformingBulkAction(true);
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: bulkAction,
          productIds: selectedProducts,
          data: bulkActionData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.message}. ${result.affectedCount} products affected.`);
        
        // Refresh the products list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to perform bulk action: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      alert("Failed to perform bulk action. Please try again.");
    } finally {
      setIsPerformingBulkAction(false);
      setShowBulkActionModal(false);
      setSelectedProducts([]);
      setBulkAction("");
      setBulkActionData({});
    }
  };

  const openBulkActionModal = (action: string) => {
    setBulkAction(action);
    if (action === 'updateStatus') {
      setBulkActionData({ isActive: true });
    } else if (action === 'updateCategory') {
      setBulkActionData({ categoryId: "" });
    } else if (action === 'updateStock') {
      setBulkActionData({ stockQuantity: 0 });
    } else {
      setBulkActionData({});
    }
    setShowBulkActionModal(true);
  };

  const displayCategories = [
    { 
      id: "All", 
      name: "All", 
      count: categories.reduce((acc, cat: any) => acc + ((cat as any)._count?.products || 0), 0), 
      icon: "🍽️" 
    },
    ...categories.map((cat: Category) => ({
      id: cat.id,
      name: cat.name,
      count: (cat as any)._count?.products || 0,
      icon: cat.icon || getCategoryIcon(cat.name)
    }))
  ];

  // Handle image upload
  const handleImageUpload = (imageUrl: string, thumbnailUrl: string) => {
    setProductForm(prev => ({
      ...prev,
      image: imageUrl,
      thumbnail: thumbnailUrl
    }));
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmojiPickerEdit, setShowEmojiPickerEdit] = useState(false);

  // Close emoji pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      if (showEmojiPickerEdit && !(event.target as Element).closest('.emoji-picker-container')) {
        setShowEmojiPickerEdit(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showEmojiPickerEdit]);

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Categories Section */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-base sm:text-lg min-[801px]:text-xl font-semibold text-gray-900">Manage Categories</h2>
            <button
              onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", description: "", icon: "🍴" }); setShowEmojiPicker(false); setShowEmojiPickerEdit(false); setShowAddCategory(true); }}
              className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New Category</span>
            </button>
          </div>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
          <div className="flex space-x-4 overflow-x-auto pb-2">
              {displayCategories.map((category) => (
                <div key={category.id} className="relative group flex-shrink-0">
              <button
                    id={`category-${category.id}`}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-28 h-28 min-[801px]:w-32 min-[801px]:h-32 rounded-xl border-2 transition-all duration-200 ${
                      activeCategory === category.id
                    ? "border-green-200 bg-green-50 text-green-700 shadow-soft"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                    <div className="text-center h-full flex flex-col items-center justify-center p-3 min-[801px]:p-4">
                      <div className="text-3xl min-[801px]:text-4xl mb-2 min-[801px]:mb-3">{category.icon}</div>
                      <div className="font-semibold text-xs min-[801px]:text-sm mb-1">{category.name}</div>
                      <div className="text-[11px] min-[801px]:text-xs text-gray-500">{category.count} items</div>
                    </div>
                  </button>
                  
                  {/* Edit button for categories (except "All") */}
                  {category.id !== "All" && (
                    <button
                      onClick={() => handleEditCategory(categories.find(c => c.id === category.id)!)}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-600 shadow-md"
                      title="Edit category"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  )}
                </div>
            ))}
          </div>
          )}
        </div>

        {/* Menu Items Section */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-base sm:text-lg min-[801px]:text-xl font-semibold text-gray-900">
              {activeCategory === "All" ? "Manage Menu Items" : `Items in ${categories.find(c => c.id === activeCategory)?.name || 'Category'}`}
            </h2>
            <button 
              onClick={() => { setSelectedProduct(null); setProductForm({ name: "", description: "", price: "", cost: "", stockQuantity: "", minStockLevel: "", categoryId: "", barcode: "", taxRate: "0.0", image: "", thumbnail: "", isActive: true, isAlcohol: false, extras: [], variants: [] }); setShowAddProduct(true); }}
              className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Menu Item</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            {/* Show Inactive Items - Toggle Switch */}
            <div className={`w-full sm:w-auto border rounded-lg px-4 py-2 flex items-center justify-between ${
              showInactiveItems 
                ? "border-green-200 bg-green-50" 
                : "border-gray-300 bg-white"
            }`}>
              <span className="text-sm text-gray-700">Inactive Items</span>
              <label className="inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={showInactiveItems}
                  onChange={(e) => setShowInactiveItems(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:bg-white after:border after:border-gray-300 after:rounded-full after:transition-all ${showInactiveItems ? 'bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white' : 'bg-gray-200 peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white'}`}></div>
              </label>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openBulkActionModal('updateStatus')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => openBulkActionModal('updateCategory')}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    Change Category
                  </button>
                  <button
                    onClick={() => openBulkActionModal('updateStock')}
                    className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors duration-200"
                  >
                    Update Stock
                  </button>
                  <button
                    onClick={() => openBulkActionModal('delete')}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items Table */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => handleSelectAllProducts(e.target.checked)}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Image</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Availability</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm ? "No products found matching your search." : "No products in this category."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        id={`product-${product.id}`}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                    <td className="py-4 px-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <OptimizedImage
                            src={product.thumbnail || product.image || ''}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                            fallbackIcon={
                              <div className="text-2xl opacity-60">
                                {product.category?.icon || "🍴"}
                              </div>
                            }
                          />
                        </div>
                      </div>
                    </td>
                                            <td className="py-4 px-4">
                      <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          <span className={product.stockQuantity <= product.minStockLevel ? "text-red-600 font-medium" : ""}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>{product.category?.icon || "🍴"}</span>
                            <span>{product.category?.name || "Unknown"}</span>
                      </div>
                    </td>
                        <td className="py-4 px-4 font-medium text-gray-900">{format(product.price)}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            product.isActive && product.stockQuantity > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {product.isActive && product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                          <Edit className="h-4 w-4" />
                        </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
                            >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Add New Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    {categoryForm.icon}
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="emoji-picker-container">
                      <EmojiPicker
                        value={categoryForm.icon}
                        onChange={(emoji) => setCategoryForm({ ...categoryForm, icon: emoji })}
                        onClose={() => setShowEmojiPicker(false)}
                        className="top-full left-0 mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  placeholder="Enter Category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Write your category description here"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCategory}
                disabled={!categoryForm.name || createCategory.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCategory.isPending ? "Creating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategory && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
              <button
                onClick={() => setShowEditCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPickerEdit(!showEmojiPickerEdit)}
                    className="w-full h-12 border border-gray-300 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    {categoryForm.icon}
                  </button>
                  
                  {/* Emoji Picker for Edit */}
                  {showEmojiPickerEdit && (
                    <div className="emoji-picker-container">
                      <EmojiPicker
                        value={categoryForm.icon}
                        onChange={(emoji) => setCategoryForm({ ...categoryForm, icon: emoji })}
                        onClose={() => setShowEmojiPickerEdit(false)}
                        className="top-full left-0 mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  placeholder="Enter Category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Write your category description here"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button 
                onClick={handleUpdateCategory}
                disabled={!categoryForm.name || updateCategory.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {updateCategory.isPending ? "Updating..." : "Save Changes"}
              </button>
              
              <button 
                onClick={() => handleDeleteCategory(editingCategory.id)}
                disabled={deleteCategory.isPending}
                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>{deleteCategory.isPending ? "Deleting..." : "Delete Category"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Enter product description"
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{`Price (${symbol})`}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{`Cost (${symbol})`}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
                                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productForm.minStockLevel}
                  onChange={(e) => setProductForm({ ...productForm, minStockLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                <input
                  type="text"
                  placeholder="Optional barcode"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0.0"
                  value={productForm.taxRate}
                  onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                  disabled={!productLevelTaxEnabled}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${!productLevelTaxEnabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                />
                {!productLevelTaxEnabled && (
                  <p className="text-xs text-gray-500 mt-1">Enable Product Level Tax in Settings to edit.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={productForm.isActive ? "true" : "false"}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.value === "true" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <ImageUpload
                  currentImage={productForm.image}
                  onImageUpload={handleImageUpload}
                  className="w-full"
                />
              </div>
              {/* Alcohol flag */}
              <div className="col-span-2">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.isAlcohol)}
                    onChange={(e) => setProductForm({ ...productForm, isAlcohol: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Contains Alcohol</span>
                </label>
              </div>
              {/* Add-ons & Variants Section */}
              <AddonsVariantsEditor
                productId={selectedProduct?.id}
                extras={productForm.extras}
                variants={productForm.variants}
                onExtrasChange={(extras) => setProductForm({ ...productForm, extras })}
                onVariantsChange={(variants) => setProductForm({ ...productForm, variants })}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddProduct(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddProduct}
                disabled={!productForm.name || !productForm.price || !productForm.categoryId || createProduct.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProduct.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              <button
                onClick={() => setShowEditProduct(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Product Name</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <textarea
                  placeholder="Enter product description"
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{`Price (${symbol})`}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{`Cost (${symbol})`}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  placeholder="0"
                  value={productForm.minStockLevel}
                  onChange={(e) => setProductForm({ ...productForm, minStockLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Barcode</label>
                <input
                  type="text"
                  placeholder="Optional barcode"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={productForm.taxRate}
                  onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                  disabled={!productLevelTaxEnabled}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${!productLevelTaxEnabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                />
                {!productLevelTaxEnabled && (
                  <p className="text-xs text-gray-500 mt-1">Enable Product Level Tax in Settings to edit.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                <select
                  value={productForm.isActive ? "true" : "false"}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.value === "true" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">Image</label>
                <ImageUpload
                  currentImage={productForm.image}
                  onImageUpload={handleImageUpload}
                  className="w-full"
                />
              </div>
              {/* Alcohol flag */}
              <div className="col-span-2">
                <label className="flex items-center space-x-2 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.isAlcohol)}
                    onChange={(e) => setProductForm({ ...productForm, isAlcohol: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Contains Alcohol</span>
                </label>
              </div>
              {/* Add-ons & Variants Section */}
              <AddonsVariantsEditor
                productId={selectedProduct?.id}
                extras={productForm.extras}
                variants={productForm.variants}
                onExtrasChange={(extras) => setProductForm({ ...productForm, extras })}
                onVariantsChange={(variants) => setProductForm({ ...productForm, variants })}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditProduct(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProduct}
                disabled={!productForm.name || !productForm.price || !productForm.categoryId || updateProduct.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProduct.isPending ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {bulkAction === 'delete' && 'Delete Products'}
                {bulkAction === 'updateStatus' && 'Update Product Status'}
                {bulkAction === 'updateCategory' && 'Change Product Category'}
                {bulkAction === 'updateStock' && 'Update Stock Quantity'}
              </h3>
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {bulkAction === 'delete' && (
                <div className="text-red-600">
                  <p>Are you sure you want to delete {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}?</p>
                  <p className="text-sm mt-2">This action cannot be undone.</p>
                </div>
              )}
              
              {bulkAction === 'updateStatus' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Status</label>
                  <select
                    value={bulkActionData.isActive || true}
                    onChange={(e) => setBulkActionData({ ...bulkActionData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              
              {bulkAction === 'updateCategory' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Category</label>
                  <select
                    value={bulkActionData.categoryId || ""}
                    onChange={(e) => setBulkActionData({ ...bulkActionData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {bulkAction === 'updateStock' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bulkActionData.stockQuantity || ""}
                    onChange={(e) => setBulkActionData({ ...bulkActionData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkActionModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkAction}
                disabled={isPerformingBulkAction || (bulkAction === 'updateCategory' && !bulkActionData.categoryId) || (bulkAction === 'updateStock' && bulkActionData.stockQuantity === undefined)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPerformingBulkAction ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
