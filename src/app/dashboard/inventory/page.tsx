"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Filter, Package, Search, X, Save, AlertTriangle, MapPin, Truck, DollarSign, Grid3X3, List, FolderPlus, Settings } from "lucide-react";
import { useStockItems, useCreateStockItem, useUpdateStockItem, useDeleteStockItem } from "@/hooks/use-stock-items";
import { useInventoryCategories, useCreateInventoryCategory, useUpdateInventoryCategory, useDeleteInventoryCategory } from "@/hooks/use-inventory-categories";
import { StockItem, CreateStockItemData, InventoryCategory, CreateInventoryCategoryData } from "@/types/menu";

import { useCurrency } from "@/hooks/useCurrency";

export default function InventoryPage() {
  const [showAddStockItem, setShowAddStockItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

  // Form state
  const [stockItemForm, setStockItemForm] = useState<CreateStockItemData>({
    name: "",
    description: "",
    unit: "",
    costPerUnit: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    supplier: "",
    location: "",
    categoryId: "",
  });

  const [categoryForm, setCategoryForm] = useState<CreateInventoryCategoryData>({
    name: "",
    description: "",
  });

  // Hooks
  const { data: stockItems, isLoading: stockItemsLoading } = useStockItems({
    categoryId: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchTerm,
    stockFilter: stockFilter === "All" ? undefined : stockFilter
  });
  const { data: categories } = useInventoryCategories();
  const createStockItem = useCreateStockItem();
  const updateStockItem = useUpdateStockItem();
  const deleteStockItem = useDeleteStockItem();
  const createCategory = useCreateInventoryCategory();
  const updateCategory = useUpdateInventoryCategory();
  const deleteCategory = useDeleteInventoryCategory();
  
  // Currency formatter
  const { format } = useCurrency();

  // Filter stock items based on current filters
  const filteredStockItems = stockItems || [];

  const handleSubmitStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStockItem) {
        await updateStockItem.mutateAsync({
          id: editingStockItem.id,
          ...stockItemForm,
        });
        setEditingStockItem(null);
      } else {
        await createStockItem.mutateAsync(stockItemForm);
      }
      
      // Reset form and close modal
      setStockItemForm({
        name: "",
        description: "",
        unit: "",
        costPerUnit: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        supplier: "",
        location: "",
        categoryId: "",
      });
      setShowAddStockItem(false);
    } catch (error) {
      console.error("Failed to save stock item:", error);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...categoryForm,
        });
        setEditingCategory(null);
      } else {
        await createCategory.mutateAsync(categoryForm);
      }
      
      // Reset form and close modal
      setCategoryForm({
        name: "",
        description: "",
      });
      setShowAddCategory(false);
      setShowEditCategory(false);
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleEditStockItem = (stockItem: StockItem) => {
    setEditingStockItem(stockItem);
    setStockItemForm({
      name: stockItem.name,
      description: stockItem.description || "",
      unit: stockItem.unit,
      costPerUnit: stockItem.costPerUnit,
      stockQuantity: stockItem.stockQuantity,
      minStockLevel: stockItem.minStockLevel,
      supplier: stockItem.supplier || "",
      location: stockItem.location || "",
      categoryId: stockItem.categoryId || "",
    });
    setShowAddStockItem(true);
  };

  const handleEditCategory = (category: InventoryCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowEditCategory(true);
  };

  const handleDeleteStockItem = async (stockItemId: string) => {
    if (confirm("Are you sure you want to delete this stock item?")) {
      try {
        await deleteStockItem.mutateAsync(stockItemId);
      } catch (error) {
        console.error("Failed to delete stock item:", error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This will only work if no stock items are assigned to it.")) {
      try {
        await deleteCategory.mutateAsync(categoryId);
        setShowEditCategory(false);
        setEditingCategory(null);
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
  };

  const resetFilters = () => {
    setSelectedCategory("All");
    setStockFilter("All");
    setSearchTerm("");
  };

  const getStockStatus = (stockItem: StockItem) => {
    if (stockItem.stockQuantity <= 0) return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stockItem.stockQuantity <= stockItem.minStockLevel) return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? { text: "Active", color: "bg-green-100 text-green-800" }
      : { text: "Inactive", color: "bg-gray-100 text-gray-800" };
  };

  if (stockItemsLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stock items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('items')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'items' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Items
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'categories' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Categories
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'items' ? (
              <button
                  onClick={() => setShowAddStockItem(true)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                  title="Add Stock Item"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Stock Item</span>
                </button>
            ) : (
              <button
                onClick={() => setShowAddCategory(true)}
                className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                title="Add Category"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Category</span>
              </button>
            )}
            </div>
          </div>
          
          {/* Filters Row - Only show for Items tab */}
          {activeTab === 'items' && (
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search stock items..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="All">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Stock Filter */}
              <div className="sm:w-48">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="All">All Stock Levels</option>
                  <option value="LowStock">Low Stock</option>
                  <option value="OutOfStock">Out of Stock</option>
                  <option value="InStock">In Stock</option>
                </select>
              </div>
              
              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Reset
              </button>
              
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
            </div>
          )}
        </div>
        
        {/* Content by Tab */}
        {activeTab === 'items' ? null : (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(categories || []).map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{category.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.stockItems?.length || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-600">
                        No categories yet. Click "Add Category" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'items' && (
        <div className="w-full">
            {filteredStockItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No stock items found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== "All" || stockFilter !== "All"
                    ? "Try adjusting your search or filters"
                    : "Add your first stock item to get started"
                  }
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStockItems.map((stockItem) => (
                  <div key={stockItem.id} className="bg-white rounded-xl p-4 shadow-soft border border-gray-100 hover:shadow-medium transition-shadow duration-200">
                    {/* Stock Item Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{stockItem.name}</h3>
                        {stockItem.description && (
                          <p className="text-sm text-gray-600 mb-2">{stockItem.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditStockItem(stockItem)}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit stock item"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStockItem(stockItem.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete stock item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock:</span>
                        <span className="font-medium text-gray-900">
                          {stockItem.stockQuantity} {stockItem.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min Level:</span>
                        <span className="text-sm text-gray-500">
                          {stockItem.minStockLevel} {stockItem.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cost:</span>
                        <span className="font-medium text-gray-900">
                          {format(stockItem.costPerUnit)}/{stockItem.unit}
                        </span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(stockItem).color}`}>
                        {getStockStatus(stockItem).text}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(stockItem.isActive).color}`}>
                        {getStatusBadge(stockItem.isActive).text}
                      </span>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1 text-xs text-gray-500">
                      {stockItem.supplier && (
                        <div className="flex items-center space-x-1">
                          <Truck className="h-3 w-3" />
                          <span>{stockItem.supplier}</span>
                        </div>
                      )}
                      {stockItem.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{stockItem.location}</span>
                        </div>
                      )}
                      {stockItem.category && (
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{stockItem.category.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Min Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStockItems.map((stockItem) => (
                        <tr key={stockItem.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{stockItem.name}</div>
                              {stockItem.description && (
                                <div className="text-sm text-gray-500">{stockItem.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {stockItem.category?.name || 'Uncategorized'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {stockItem.stockQuantity} {stockItem.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {stockItem.minStockLevel} {stockItem.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {format(stockItem.costPerUnit)}/{stockItem.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(stockItem).color}`}>
                                {getStockStatus(stockItem).text}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(stockItem.isActive).color}`}>
                                {getStatusBadge(stockItem.isActive).text}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditStockItem(stockItem)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit stock item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStockItem(stockItem.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete stock item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
        )}
      </div>

      {/* Add/Edit Stock Item Modal */}
      {showAddStockItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStockItem ? 'Edit Stock Item' : 'Add New Stock Item'}
              </h3>
              <button
                onClick={() => {
                  setShowAddStockItem(false);
                  setEditingStockItem(null);
                  setStockItemForm({
                    name: "",
                    description: "",
                    unit: "",
                    costPerUnit: 0,
                    stockQuantity: 0,
                    minStockLevel: 0,
                    supplier: "",
                    location: "",
                    categoryId: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitStockItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={stockItemForm.name}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Flour, Tomatoes, Olive Oil"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPC</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stockItemForm.description}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, description: e.target.value.replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 012345678905"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    value={stockItemForm.unit}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., kg, pieces, liters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={stockItemForm.categoryId}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockItemForm.costPerUnit}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockItemForm.stockQuantity}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, stockQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockItemForm.minStockLevel}
                  onChange={(e) => setStockItemForm({ ...stockItemForm, minStockLevel: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input 
                    type="text"
                    value={stockItemForm.supplier}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Local Market, Sysco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                  <input 
                    type="text"
                    value={stockItemForm.location}
                    onChange={(e) => setStockItemForm({ ...stockItemForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Pantry A, Fridge 1"
                  />
                </div>
              </div>
            
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
                  disabled={createStockItem.isPending || updateStockItem.isPending}
                >
                  {createStockItem.isPending || updateStockItem.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                  <span>{editingStockItem ? 'Update' : 'Create'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStockItem(false);
                    setEditingStockItem(null);
                    setStockItemForm({
                      name: "",
                      description: "",
                      unit: "",
                      costPerUnit: 0,
                      stockQuantity: 0,
                      minStockLevel: 0,
                      supplier: "",
                      location: "",
                      categoryId: "",
                    });
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal (no icon/color) */}
      {(showAddCategory || showEditCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setShowEditCategory(false);
                  setEditingCategory(null);
                  setCategoryForm({
                    name: "",
                    description: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitCategory} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="e.g., Dairy, Produce, Pantry"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Write your category description here"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {createCategory.isPending || updateCategory.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                  <span>{editingCategory ? 'Update' : 'Create'}</span>
                  )}
                </button>
                
                {editingCategory && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteCategory(editingCategory.id)}
                    disabled={deleteCategory.isPending}
                    className="px-6 py-2 bg-red-50 text-red-700 border border-red-200 rounded-full hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <span>{deleteCategory.isPending ? "Deleting..." : "Delete"}</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setShowEditCategory(false);
                    setEditingCategory(null);
                    setCategoryForm({
                      name: "",
                      description: "",
                    });
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
