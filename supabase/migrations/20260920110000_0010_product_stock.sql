-- Stock on hand per product, managed from site/admin/products.html.
-- Display/edit only for now: the storefront does not yet hide out-of-stock items or
-- decrement on sale (see PROJECT_PLAN.md backlog).
alter table public.products
  add column stock integer not null default 0 check (stock >= 0);
