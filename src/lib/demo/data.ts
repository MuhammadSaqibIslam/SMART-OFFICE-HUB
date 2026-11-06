export type Row = Record<string, unknown>
export type DemoDatabase = Record<string, Row[]>

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000000'

export function createDemoDatabase(): DemoDatabase {
  let nextId = 1
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
  const dateFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  const record = (fields: Row, age = 5000): Row => ({
    id: `demo-${nextId++}`,
    created_at: minutesAgo(age),
    updated_at: minutesAgo(age),
    ...fields,
  })

  const categories = ['Stationery', 'Printing', 'Cleaning', 'Pantry', 'Electronics Accessories'].map((name) =>
    record({ name, description: null }),
  )
  const categoryId = (name: string) => categories.find((category) => category.name === name)?.id

  const item = (name: string, category: string, quantity: number, min: number, unit: string, location: string) =>
    record({ name, category_id: categoryId(category), description: null, sku: null, quantity, min_stock_threshold: min, unit, location })

  const employee = (full_name: string, employee_id: string, department: string, job_title: string, status = 'active') =>
    record({
      full_name,
      employee_id,
      email: `${full_name.split(' ')[0].toLowerCase()}@demo.local`,
      department,
      job_title,
      contact_number: '0300-0000000',
      joining_date: dateFromNow(-400),
      status,
      notes: null,
      avatar_url: null,
    })

  const asset = (name: string, asset_type: string, brand: string, model: string, serial_number: string, status: string, location: string, warrantyDays = 400) =>
    record({
      name,
      asset_type,
      brand,
      model,
      serial_number,
      purchase_date: dateFromNow(-300),
      purchase_cost: null,
      warranty_expiry: dateFromNow(warrantyDays),
      location,
      status,
      description: null,
      notes: null,
    })

  const employees = [
    employee('Ali Ahmed', 'EMP-001', 'IT', 'Software Engineer'),
    employee('Sara Khan', 'EMP-002', 'HR', 'HR Manager'),
    employee('Usman Tariq', 'EMP-003', 'Finance', 'Accountant'),
    employee('Ayesha Malik', 'EMP-004', 'Marketing', 'Marketing Lead'),
    employee('Bilal Raza', 'EMP-005', 'IT', 'System Administrator'),
    employee('Hina Shah', 'EMP-006', 'Operations', 'Office Coordinator'),
    employee('Zain Abbas', 'EMP-007', 'Sales', 'Sales Executive'),
    employee('Fatima Noor', 'EMP-008', 'Finance', 'Finance Officer', 'inactive'),
  ]

  const assets = [
    asset('Dell Latitude 5420', 'Laptop', 'Dell', 'Latitude 5420', 'SN-DL-1001', 'assigned', 'Floor 2'),
    asset('HP EliteBook 840', 'Laptop', 'HP', 'EliteBook 840', 'SN-HP-1002', 'assigned', 'Floor 2'),
    asset('MacBook Air M2', 'Laptop', 'Apple', 'Air M2', 'SN-AP-1003', 'assigned', 'Floor 3', 20),
    asset('Lenovo ThinkPad T14', 'Laptop', 'Lenovo', 'T14', 'SN-LN-1004', 'available', 'IT Store'),
    asset('Dell 24" Monitor', 'Monitor', 'Dell', 'P2422H', 'SN-DL-2001', 'assigned', 'Floor 2'),
    asset('Samsung 27" Monitor', 'Monitor', 'Samsung', 'S27', 'SN-SM-2002', 'available', 'IT Store'),
    asset('HP LaserJet Pro', 'Printer', 'HP', 'M404', 'SN-HP-3001', 'under_maintenance', 'Floor 1'),
    asset('Logitech Webcam C920', 'Webcam', 'Logitech', 'C920', 'SN-LG-4001', 'available', 'IT Store'),
    asset('iPad 10th Gen', 'Tablet', 'Apple', 'iPad 10', 'SN-AP-5001', 'missing', 'Unknown'),
    asset('Cisco IP Phone', 'Phone', 'Cisco', '7821', 'SN-CS-6001', 'retired', 'Store Room'),
  ]

  const assignment = (assetIndex: number, employeeIndex: number) =>
    record({
      asset_id: assets[assetIndex].id,
      employee_id: employees[employeeIndex].id,
      assigned_date: dateFromNow(-120),
      return_date: null,
      return_condition: null,
      accessories: 'Charger, bag',
      notes: null,
      status: 'active',
      assigned_by: DEMO_USER_ID,
    })

  const request = (request_number: string, status: string, age: number) =>
    record({ request_number, status, notes: 'Monthly office reorder', requested_by: DEMO_USER_ID }, age)

  const requests = [
    request('PR-0001', 'received', 9000),
    request('PR-0002', 'ordered', 6000),
    request('PR-0003', 'approved', 3000),
    request('PR-0004', 'submitted', 800),
    request('PR-0005', 'draft', 120),
  ]

  const requestItem = (requestIndex: number, item_name: string, quantity: number) =>
    record({ request_id: requests[requestIndex].id, item_id: null, item_name, quantity, notes: null })

  const log = (action: string, description: string, entity_type: string, age: number) =>
    record({ action, description, entity_type, entity_id: null, performed_by: DEMO_USER_ID }, age)

  return {
    profiles: [
      {
        id: DEMO_USER_ID,
        full_name: 'Guest User',
        email: 'guest@demo.local',
        role: 'office_manager',
        avatar_url: null,
        created_at: minutesAgo(9000),
        updated_at: minutesAgo(9000),
      },
    ],
    inventory_categories: categories,
    inventory_items: [
      item('A4 Printer Paper', 'Printing', 4, 10, 'reams', 'Store Room A'),
      item('Black Toner Cartridge', 'Printing', 0, 2, 'pcs', 'Store Room A'),
      item('Blue Ball Pens', 'Stationery', 120, 30, 'pcs', 'Cabinet 1'),
      item('Sticky Notes', 'Stationery', 8, 10, 'packs', 'Cabinet 1'),
      item('Staplers', 'Stationery', 15, 5, 'pcs', 'Cabinet 2'),
      item('File Folders', 'Stationery', 60, 20, 'packs', 'Cabinet 2'),
      item('Hand Sanitizer', 'Cleaning', 3, 5, 'liters', 'Janitor Room'),
      item('Floor Cleaner', 'Cleaning', 22, 6, 'liters', 'Janitor Room'),
      item('Tissue Rolls', 'Cleaning', 48, 12, 'rolls', 'Janitor Room'),
      item('Green Tea', 'Pantry', 12, 4, 'boxes', 'Pantry'),
      item('Coffee', 'Pantry', 2, 3, 'kg', 'Pantry'),
      item('Sugar', 'Pantry', 18, 5, 'kg', 'Pantry'),
      item('USB-C Cables', 'Electronics Accessories', 25, 5, 'pcs', 'IT Store'),
      item('Wireless Mouse', 'Electronics Accessories', 0, 3, 'pcs', 'IT Store'),
    ],
    inventory_transactions: [],
    employees,
    hardware_assets: assets,
    asset_assignments: [assignment(0, 0), assignment(1, 3), assignment(2, 1), assignment(4, 0)],
    asset_history: [],
    purchase_requests: requests,
    purchase_request_items: [
      requestItem(0, 'A4 Printer Paper', 20),
      requestItem(1, 'Black Toner Cartridge', 4),
      requestItem(2, 'Wireless Mouse', 10),
      requestItem(3, 'Coffee', 5),
      requestItem(3, 'Sugar', 10),
      requestItem(4, 'Sticky Notes', 20),
    ],
    activity_logs: [
      log('stock_out', 'Stock out: 6 reams of "A4 Printer Paper" (10 → 4)', 'inventory_item', 12),
      log('purchase_request_created', 'Purchase request PR-0005 created', 'purchase_request', 120),
      log('asset_assigned', '"MacBook Air M2" assigned to Sara Khan', 'hardware_asset', 240),
      log('employee_created', 'Employee "Zain Abbas" added', 'employee', 600),
      log('purchase_request_status', 'Purchase request PR-0004 → submitted', 'purchase_request', 800),
      log('stock_in', 'Stock in: 20 liters of "Floor Cleaner" (2 → 22)', 'inventory_item', 1400),
      log('asset_updated', 'Hardware asset "HP LaserJet Pro" updated', 'hardware_asset', 1800),
      log('asset_created', 'Hardware asset "Lenovo ThinkPad T14" added', 'hardware_asset', 5000),
    ],
    ai_conversations: [],
    ai_messages: [],
  }
}
