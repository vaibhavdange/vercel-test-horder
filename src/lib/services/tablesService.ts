import { 
  Floor, 
  Area, 
  Table, 
  TableStatus, 
  CreateFloorRequest, 
  CreateAreaRequest, 
  CreateTableRequest, 
  UpdateTableRequest,
  TableOrderUpdateRequest
} from '@/types/tables';

const API_BASE = '/api';

export class TablesService {
  // Floor management
  static async getFloors(): Promise<Floor[]> {
    const response = await fetch(`${API_BASE}/floors`);
    if (!response.ok) {
      throw new Error('Failed to fetch floors');
    }
    return response.json();
  }

  static async createFloor(data: CreateFloorRequest): Promise<Floor> {
    const response = await fetch(`${API_BASE}/floors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create floor');
    }
    return response.json();
  }

  static async updateFloor(id: string, data: Partial<CreateFloorRequest>): Promise<Floor> {
    const response = await fetch(`${API_BASE}/floors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update floor');
    }
    return response.json();
  }

  static async deleteFloor(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/floors/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete floor');
    }
  }

  // Area management
  static async getAreas(): Promise<Area[]> {
    const response = await fetch(`${API_BASE}/areas`);
    if (!response.ok) {
      throw new Error('Failed to fetch areas');
    }
    return response.json();
  }

  static async createArea(data: CreateAreaRequest): Promise<Area> {
    const response = await fetch(`${API_BASE}/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create area');
    }
    return response.json();
  }

  static async updateArea(id: string, data: Partial<CreateAreaRequest>): Promise<Area> {
    const response = await fetch(`${API_BASE}/areas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update area');
    }
    return response.json();
  }

  static async deleteArea(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/areas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete area');
    }
  }

  // Table management
  static async getTables(): Promise<Table[]> {
    const response = await fetch(`${API_BASE}/tables`);
    if (!response.ok) {
      throw new Error('Failed to fetch tables');
    }
    return response.json();
  }

  static async createTable(data: CreateTableRequest): Promise<Table> {
    const response = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create table');
    }
    return response.json();
  }

  static async updateTable(id: string, data: UpdateTableRequest): Promise<Table> {
    const response = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update table');
    }
    return response.json();
  }

  static async updateTableStatus(id: string, status: TableStatus): Promise<Table> {
    const response = await fetch(`${API_BASE}/tables`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tableId: id, status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update table status');
    }
    return response.json();
  }

  static async updateTableOrder(data: TableOrderUpdateRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/tables`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update table order');
    }
    return response.json();
  }

  static async deleteTable(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete table');
    }
  }



  // Utility methods
  static async getTablesByFloor(floorId: string): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.floorId === floorId);
  }

  static async getTablesByArea(areaId: string): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.areaId === areaId);
  }

  static async getAvailableTables(): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.status === 'available');
  }

  static async getOccupiedTables(): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.status === 'occupied');
  }

  static async getReservedTables(): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.status === 'reserved');
  }

  static async getCleaningTables(): Promise<Table[]> {
    const tables = await this.getTables();
    return tables.filter(table => table.status === 'cleaning');
  }

  // Table status management
  static async markTableAsOccupied(tableId: string): Promise<Table> {
    return this.updateTableStatus(tableId, 'occupied');
  }

  static async markTableAsAvailable(tableId: string): Promise<Table> {
    return this.updateTableStatus(tableId, 'available');
  }

  static async markTableAsReserved(tableId: string): Promise<Table> {
    return this.updateTableStatus(tableId, 'reserved');
  }

  static async markTableAsCleaning(tableId: string): Promise<Table> {
    return this.updateTableStatus(tableId, 'cleaning');
  }

  static async markTableAsUnavailable(tableId: string): Promise<Table> {
    return this.updateTableStatus(tableId, 'unavailable');
  }

  // Bulk operations
  static async bulkUpdateTableStatus(tableIds: string[], status: TableStatus): Promise<Table[]> {
    const promises = tableIds.map(id => this.updateTableStatus(id, status));
    return Promise.all(promises);
  }

  static async bulkMarkTablesAsAvailable(tableIds: string[]): Promise<Table[]> {
    return this.bulkUpdateTableStatus(tableIds, 'available');
  }

  static async bulkMarkTablesAsCleaning(tableIds: string[]): Promise<Table[]> {
    return this.bulkUpdateTableStatus(tableIds, 'cleaning');
  }
}
