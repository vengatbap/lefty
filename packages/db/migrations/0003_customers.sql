CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_organization_phone_unique UNIQUE (organization_id, phone)
);
CREATE INDEX IF NOT EXISTS customers_org_created_idx ON customers(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_org_phone_idx ON customers(organization_id, phone);