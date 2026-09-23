-- Add tax & service charge enable/disable toggles to organizations
alter table organizations
  add column if not exists is_tax_active boolean not null default false;

alter table organizations
  add column if not exists is_service_charge_active boolean not null default false;