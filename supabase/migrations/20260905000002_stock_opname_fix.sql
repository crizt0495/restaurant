-- =====================================================
-- STOCK OPNAME: add total_difference_value column
-- Fixes: P0 - column referenced in action but missing in table
-- =====================================================

alter table stock_opnames add column if not exists total_difference_value numeric(14,2) default 0;