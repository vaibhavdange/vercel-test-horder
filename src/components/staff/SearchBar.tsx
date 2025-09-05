import React from "react";
import { Search } from "lucide-react";

export function SearchBar({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  onReset,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, email, or employee ID..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
      
      {/* Role Filter */}
      <div className="sm:w-48">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">All Roles</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
          <option value="Cashier">Cashier</option>
          <option value="Kitchen Staff">Kitchen Staff</option>
        </select>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={onReset}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
      >
        Reset
      </button>
    </div>
  );
}
