CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE order_status AS ENUM ('new','accepted','preparing','ready','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_type AS ENUM ('dine_in','takeaway','delivery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','authorized','paid','failed','refunded','partially_refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE stock_movement_type AS ENUM ('sale','adjustment','return','opening'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Bahrain',
  currency text NOT NULL DEFAULT 'BHD',
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT locations_organization_name_unique UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_organization_email_unique UNIQUE (organization_id, email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  category_id uuid REFERENCES menu_categories(id),
  name text NOT NULL,
  sku text,
  price numeric(12,3) NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  track_availability boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  type stock_movement_type NOT NULL,
  quantity integer NOT NULL,
  reference_type text,
  reference_id uuid,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  name text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  number text NOT NULL,
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'new',
  table_id uuid REFERENCES tables(id),
  subtotal numeric(12,3) NOT NULL,
  tax numeric(12,3) NOT NULL DEFAULT 0,
  discount numeric(12,3) NOT NULL DEFAULT 0,
  total numeric(12,3) NOT NULL,
  metadata jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,3) NOT NULL,
  total numeric(12,3) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL,
  method text NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount numeric(12,3) NOT NULL,
  provider_reference text,
  idempotency_key text UNIQUE,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locations_org_idx ON locations(organization_id);
CREATE INDEX IF NOT EXISTS users_org_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS menu_items_location_idx ON menu_items(location_id);
CREATE INDEX IF NOT EXISTS orders_location_created_idx ON orders(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS stock_movements_item_created_idx ON stock_movements(menu_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
