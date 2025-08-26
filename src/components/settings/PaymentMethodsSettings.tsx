"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, CreditCard, Settings, DollarSign } from "lucide-react";
import CashButtonSettings from "./CashButtonSettings";

interface PaymentMethod {
  id: string;
  name: string;
  type: "cash" | "card" | "digital" | "other";
  isActive: boolean;
  description?: string;
  icon?: string;
}

interface PaymentMethodsSettingsProps {
  className?: string;
}

export default function PaymentMethodsSettings({ className = '' }: PaymentMethodsSettingsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'methods' | 'cash-buttons'>('methods');

  // Mock data - replace with actual API calls
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      name: "Cash",
      type: "cash",
      isActive: true,
      description: "Physical cash payments",
      icon: "💵"
    },
    {
      id: "2",
      name: "Credit Card",
      type: "card",
      isActive: true,
      description: "Credit and debit card payments",
      icon: "💳"
    },
    {
      id: "3",
      name: "Digital Wallet",
      type: "digital",
      isActive: true,
      description: "Mobile payment apps",
      icon: "📱"
    }
  ]);

  const [formData, setFormData] = useState({
    name: "",
    type: "cash" as PaymentMethod["type"],
    description: "",
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMethod) {
      // Update existing method
      setPaymentMethods(prev => prev.map(method => 
        method.id === editingMethod.id 
          ? { ...method, ...formData }
          : method
      ));
      setEditingMethod(null);
    } else {
      // Add new method
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        ...formData
      };
      setPaymentMethods(prev => [...prev, newMethod]);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      description: method.description || "",
      isActive: method.isActive
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "cash",
      description: "",
      isActive: true
    });
  };

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage payment methods and configure cash payment options for your restaurant.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('methods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'methods'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('cash-buttons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cash-buttons'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="h-4 w-4 inline mr-2" />
            Cash Buttons
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search payment methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <Settings className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </button>
          </div>

          {/* Payment Methods List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filteredMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No payment methods found</p>
                <p className="text-sm">Try adjusting your search or add a new method</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMethods.map((method) => (
                  <div key={method.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{method.name}</h4>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          method.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleEdit(method)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cash-buttons' && (
        <CashButtonSettings />
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Cash, Credit Card"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod["type"] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Brief description of the payment method"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingMethod ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
