export interface InventoryCategory {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface InventoryItem {
  id: string
  name: string
  category_id: string
  description: string | null
  sku: string | null
  quantity: number
  min_stock_threshold: number
  unit: string
  location: string | null
  created_at: string
  updated_at: string
  category?: InventoryCategory
}

export interface InventoryTransaction {
  id: string
  item_id: string
  type: 'stock_in' | 'stock_out'
  quantity: number
  previous_stock: number
  updated_stock: number
  notes: string | null
  performed_by: string | null
  created_at: string
  item?: InventoryItem
}

export interface Employee {
  id: string
  full_name: string
  employee_id: string | null
  email: string | null
  department: string | null
  job_title: string | null
  contact_number: string | null
  joining_date: string | null
  status: 'active' | 'inactive'
  notes: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface HardwareAsset {
  id: string
  name: string
  asset_type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_cost: number | null
  warranty_expiry: string | null
  location: string | null
  status: 'available' | 'assigned' | 'under_maintenance' | 'missing' | 'retired'
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  assigned_date: string
  return_date: string | null
  return_condition: 'good' | 'damaged' | 'needs_repair' | 'incomplete' | null
  accessories: string | null
  notes: string | null
  status: 'active' | 'returned' | 'transferred'
  assigned_by: string | null
  created_at: string
  updated_at: string
  asset?: HardwareAsset
  employee?: Employee
}

export interface AssetHistory {
  id: string
  asset_id: string
  action: string
  details: string | null
  performed_by: string | null
  created_at: string
}

export interface PurchaseRequest {
  id: string
  request_number: string | null
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received'
  notes: string | null
  requested_by: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseRequestItem {
  id: string
  request_id: string
  item_id: string | null
  item_name: string
  quantity: number
  notes: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  action: string
  description: string
  entity_type: string | null
  entity_id: string | null
  performed_by: string | null
  created_at: string
}
