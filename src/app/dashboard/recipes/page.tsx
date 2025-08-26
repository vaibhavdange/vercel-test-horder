"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Package, Grid3X3, List, Search } from 'lucide-react';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe, Recipe, CreateRecipeData, UpdateRecipeData } from '@/hooks/use-recipes';
import { useProducts } from '@/hooks/use-products';
import { useStockItems } from '@/hooks/use-ingredients';
import { useHighlight } from '@/hooks/use-highlight';
import { useCurrency } from '@/hooks/useCurrency';

export default function RecipesPage() {
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipeForm, setRecipeForm] = useState<CreateRecipeData>({
    name: '',
    description: '',
    productId: '',
    servings: 1,
    items: []
  });

  // Use highlight hook for search result highlighting
  useHighlight();

  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
  const { data: products = [] } = useProducts();
  const { data: ingredients = [] } = useStockItems();
  
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const deleteRecipeMutation = useDeleteRecipe();
  
  // Currency formatter
  const { format } = useCurrency();

  // Helper functions
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    return ingredient?.name || 'Unknown Ingredient';
  };

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const recipeName = recipe.name.toLowerCase();
    const recipeDescription = (recipe.description || '').toLowerCase();
    const menuItemName = getProductName(recipe.productId).toLowerCase();
    
    return recipeName.includes(query) || 
           recipeDescription.includes(query) || 
           menuItemName.includes(query);
  });

  const resetForm = () => {
    setRecipeForm({
      name: '',
      description: '',
      productId: '',
      servings: 1,
      items: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recipeForm.items.length === 0) {
      alert('Please add at least one ingredient to the recipe');
      return;
    }

    try {
      if (editingRecipe) {
        await updateRecipeMutation.mutateAsync({
          id: editingRecipe.id,
          data: recipeForm
        });
        setEditingRecipe(null);
      } else {
        await createRecipeMutation.mutateAsync(recipeForm);
      }
      
      resetForm();
      setShowAddRecipe(false);
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe');
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      productId: recipe.productId,
      servings: recipe.servings,
      items: recipe.items.map(item => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || ''
      }))
    });
    setShowAddRecipe(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipeMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe');
      }
    }
  };

  const addIngredientItem = () => {
    setRecipeForm(prev => ({
      ...prev,
      items: [...prev.items, {
        ingredientId: '',
        quantity: 0,
        unit: '',
        notes: ''
      }]
    }));
  };

  const removeIngredientItem = (index: number) => {
    setRecipeForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateIngredientItem = (index: number, field: keyof typeof recipeForm.items[0], value: any) => {
    setRecipeForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateRecipeCost = (recipe: Recipe) => {
    return recipe.items.reduce((total, item) => {
      const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
      if (ingredient) {
        return total + (ingredient.costPerUnit * item.quantity);
      }
      return total;
    }, 0);
  };

  if (recipesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Search, Add Recipe, and View Toggle Bar */}
        <div className="flex justify-between items-center mb-6">
          {/* Left side: Search and Add Recipe */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Search Bar */}
            <div className="flex items-center bg-gray-100 rounded-lg p-2 flex-1 max-w-md">
              <Search className="h-5 w-5 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search recipes by name, description, or menu item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none flex-1"
              />
            </div>
            
            {/* Add New Recipe Button */}
            <button
              onClick={() => {
                resetForm();
                setShowAddRecipe(true);
                setEditingRecipe(null);
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Recipe
            </button>
          </div>

          {/* Right side: View Toggle */}
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

        {/* Search Results Count */}
        {searchQuery && (
          <div className="mb-6 text-sm text-gray-600">
            {filteredRecipes.length} of {recipes.length} recipes
          </div>
        )}

        {/* Recipe List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id} 
                id={`recipe-${recipe.id}`}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{recipe.name}</h3>
                    <p className="text-gray-600 text-sm">{getProductName(recipe.productId)}</p>
                    {recipe.description && (
                      <p className="text-gray-500 text-sm mt-1">{recipe.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingRecipe(recipe)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Recipe"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(recipe)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Recipe"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Recipe"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Servings:</span>
                    <span className="font-medium">{recipe.servings}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ingredients:</span>
                    <span className="font-medium">{recipe.items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Cost per serving:</span>
                    <span className="font-medium text-green-600">
                      {format(calculateRecipeCost(recipe) / recipe.servings)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">{format(calculateRecipeCost(recipe))}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipe Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost per Serving
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecipes.map((recipe) => (
                    <tr 
                      key={recipe.id} 
                      id={`recipe-${recipe.id}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
                          {recipe.description && (
                            <div className="text-sm text-gray-500">{recipe.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getProductName(recipe.productId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{recipe.servings}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{recipe.items.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {format(calculateRecipeCost(recipe) / recipe.servings)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(calculateRecipeCost(recipe))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setViewingRecipe(recipe)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Recipe"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(recipe)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Recipe"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Recipe"
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

        {/* Add/Edit Recipe Modal */}
        {showAddRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddRecipe(false);
                    setEditingRecipe(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe Name
                    </label>
                    <input
                      type="text"
                      value={recipeForm.name}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menu Item
                    </label>
                    <select
                      value={recipeForm.productId}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, productId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select a menu item</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={recipeForm.description}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servings
                    </label>
                    <input
                      type="number"
                      value={recipeForm.servings}
                      onChange={(e) => setRecipeForm(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Ingredients Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
                    <button
                      type="button"
                      onClick={addIngredientItem}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Ingredient
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recipeForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-4">
                          <select
                            value={item.ingredientId}
                            onChange={(e) => updateIngredientItem(index, 'ingredientId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            required
                          >
                            <option value="">Select ingredient</option>
                            {ingredients.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateIngredientItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Qty"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateIngredientItem(index, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            required
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateIngredientItem(index, 'notes', e.target.value)}
                            placeholder="Notes (optional)"
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeIngredientItem(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddRecipe(false);
                      setEditingRecipe(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {createRecipeMutation.isPending || updateRecipeMutation.isPending
                      ? 'Saving...'
                      : editingRecipe
                      ? 'Update Recipe'
                      : 'Create Recipe'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Recipe Modal */}
        {viewingRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{viewingRecipe.name}</h2>
                <button
                  onClick={() => setViewingRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Menu Item</label>
                    <p className="text-gray-900">{getProductName(viewingRecipe.productId)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Servings</label>
                    <p className="text-gray-900">{viewingRecipe.servings}</p>
                  </div>
                </div>

                {viewingRecipe.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900">{viewingRecipe.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                  <div className="space-y-2">
                    {viewingRecipe.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{getIngredientName(item.ingredientId)}</span>
                          <span className="text-gray-600">{item.quantity} {item.unit}</span>
                        </div>
                        {item.notes && (
                          <span className="text-sm text-gray-500">{item.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Recipe Cost:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {format(calculateRecipeCost(viewingRecipe))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Cost per serving:</span>
                    <span className="text-lg font-medium text-gray-900">
                      {format(calculateRecipeCost(viewingRecipe) / viewingRecipe.servings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
