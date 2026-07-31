# Stress Test Results

These metrics represent the "Before" state of the system, hitting the `smartplaza-stress` database populated with 200 documents per collection via `seed.js`.

## Baseline Execution Stats (No Pagination / No Lean)

| Query Area | Execution Time (ms) | Docs Examined | Docs Returned | Stage |
|---|---|---|---|---|
| Product.find() (All Inventory) | 0ms | 200 | 200 | COLLSCAN |
| Sale.find() (All Sales) | 0ms | 200 | 200 | COLLSCAN |
| EMIInvoice.find() (All EMI) | 0ms | 1015 | 1015 | COLLSCAN |
| StockBatch.find() (Current Stock from Batches) | 0ms | 200 | 200 | COLLSCAN |
| Customer.find() (All Customers) | 0ms | 200 | 200 | COLLSCAN |

## Specific Filter Queries (No Indexes)

| Query Area | Execution Time (ms) | Docs Examined | Stage |
|---|---|---|---|
| Sale filter by `customerPhone` | 0ms | 200 (all) | COLLSCAN |
| Customer filter by `mobileNumber` | 0ms | 200 (all) | COLLSCAN |

### Observations (Phase 3)
1. **COLLSCAN Everywhere**: As expected, every list endpoint and basic filter query is resulting in a `COLLSCAN` (Collection Scan). The database is scanning every single document in the collection to find matches or return lists.
2. **Missing Indexes**: Fields commonly used for searching (e.g., `customerPhone` in Sales, `mobileNumber` in Customers) do not have indexes, meaning lookups scale linearly with database size and will be extremely slow at scale.
3. **Payload Bloat**: Because `.find()` returns full Mongoose documents instead of plain JSON (no `.lean()`), and returns all fields (no `.select()`), the memory footprint and network payload are unnecessarily large.

## Action Plan for Phase 4 (Backend Optimization)
1. Implement **Pagination** (`limit` and `skip`) on all list-returning endpoints (`/api/sales`, `/api/products`, etc.).
2. Add **Indexes** on frequently queried fields (`customerPhone`, `mobileNumber`, `status`, etc.).
3. Use **`.lean()`** for read-only queries to bypass Mongoose hydration overhead.
4. Use **`.select()`** to exclude unnecessary fields from list payloads.
