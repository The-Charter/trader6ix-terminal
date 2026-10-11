-- Trader6ix backend — initial schema.
-- Requires the pgcrypto extension for gen_random_uuid().

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists watchlist_items_user_id_idx on watchlist_items (user_id);

create table if not exists idempotency_keys (
  key text not null,
  scope text not null,
  status integer,
  body text,
  created_at timestamptz not null default now(),
  primary key (key, scope)
);

create index if not exists idempotency_keys_created_at_idx on idempotency_keys (created_at);
