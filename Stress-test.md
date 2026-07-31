# SmartPlaza — GSD Stress Test & Optimization Plan

**Goal:** Seed 200 records per collection, identify every page/endpoint that breaks or degrades under that load, then fix via frontend pagination + backend MongoDB optimization — with verification at each step.

**Rule for the agent:** Work through phases sequentially. Do not jump to Phase 4 optimizations before Phases 1–3 confirm which pages actually fail — optimize based on evidence, not assumption. Report findings after each phase before proceeding.

---

## Phase 1 — Audit & Map Risk Surfaces

1. Scan `backend/models/` and list every Mongoose schema (Products, Sales/Invoices, Customers, EMI records, Employees, Orders, Suppliers, etc.).
2. Scan `backend/routes/` + `backend/controllers/` and flag every `find()` / `aggregate()` / list-returning endpoint with **no `.limit()`/`.skip()`** — primary failure points.
3. Cross-reference with `frontend/src/views/` — for each list-rendering page (tables, dashboards, dropdowns), confirm whether it fetches all records at once or already paginates.
4. Produce a table:

   | Page/Endpoint | Collection | Current Fetch Pattern | Risk Level | Fix Needed |
   |---|---|---|---|---|

**Expected high-risk pages (from spec):**
- Inventory list (serial-tracked items, multi-supplier)
- Sales/Invoice history (cash + EMI, dual-invoice)
- Customer directory + EMI outstanding view
- Employee-wise sales reports
- E-commerce storefront product grid
- Customer order history/tracking portal
- Dashboard KPI aggregations (revenue, P&L, EMI overdue)
- Courier fraud-detection lookup logs

---

## Phase 2 — Seed Test Data

5. Write `backend/scripts/seed.js` inserting **200 documents per collection** (use `faker`), respecting relationships (invoices → real product/customer IDs, EMI records → real invoices).
6. Include edge cases: long product names, high-decimal prices, overdue EMIs, out-of-stock items, duplicate mobile numbers (for fraud detection).
7. Run only against local/staging MongoDB — **never production**.

---

## Phase 3 — Load & Observe

8. Start backend + frontend in dev mode.
9. Hit every flagged endpoint/page; record response time, payload size, render time/jank, timeouts/crashes.
10. Run `.explain("executionStats")` on slow queries — confirm `COLLSCAN` vs `IXSCAN`.

---

## Phase 4 — Backend Optimization

11. Add indexes on frequently filtered/sorted fields (`productId`, `customerId`, `saleDate`, `status`, `mobileNumber`); compound indexes for multi-field queries.
12. Convert unpaginated endpoints to accept `page` + `limit`, returning `{ data, total, page, totalPages }`.
13. Use `.lean()` on read-only queries.
14. Use `.select()` projection to trim unused fields in list views.
15. Dashboard KPIs: move aggregation into MongoDB pipelines (`$match` + `$group`) instead of JS; or precompute/cache summary docs on a refresh interval.
16. Add short-TTL caching for expensive aggregate endpoints where real-time-exact isn't required.

---

## Phase 5 — Frontend Optimization

17. Replace "fetch all, render all" tables with server-side pagination (MUI `TablePagination` + React Query page-keyed `useQuery` or `useInfiniteQuery`).
18. Debounce search/filter inputs.
19. Consider virtualization (`react-window`) for very long lists (e.g., product grid) in addition to pagination.
20. Add loading skeletons for page transitions.

---

## Phase 6 — Re-test & Verify

21. Re-run the 200-record load against every page from the Phase 1 table.
22. Confirm: response times under target (e.g., <300ms for list endpoints), no full collection scans (`IXSCAN` only), smooth paginated rendering.
23. Document before/after metrics in `STRESS_TEST_RESULTS.md`.

---

## Phase 7 — Cleanup

24. Add a `--clean` flag/script to remove seeded test data from staging.
25. Commit per phase (indexes, backend pagination, frontend pagination) so each can be reviewed/rolled back independently.

---

### Deliverables checklist
- [ ] Phase 1 risk table
- [ ] `backend/scripts/seed.js` (+ `--clean` mode)
- [ ] Phase 3 raw perf notes / explain() outputs
- [ ] Index migration script
- [ ] Paginated endpoints (list them)
- [ ] Paginated/virtualized frontend components (list them)
- [ ] `STRESS_TEST_RESULTS.md` before/after report