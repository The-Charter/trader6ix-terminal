-- Harden idempotency so a retried request cannot move funds twice.
--
-- request_hash binds a key to the exact payload it was first used with: the
-- same key with a different body is rejected (409) instead of replaying an
-- unrelated stored response. expires_at lets completed entries age out, so the
-- table stays bounded without a scheduler.

alter table idempotency_keys add column if not exists request_hash text;
alter table idempotency_keys add column if not exists expires_at timestamptz not null default now() + interval '24 hours';

create index if not exists idempotency_keys_expires_at_idx on idempotency_keys (expires_at);
