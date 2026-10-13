-- Privy owns authentication.
--
-- Users are keyed by the DID Privy issues (`did:privy:…`) instead of an
-- email/password pair: passwords are gone (Privy handles credentials, wallets
-- and social logins), and the wallet column mirrors the linked EVM wallet the
-- access token carries. Safe to run on a database where 0001 already applied.

alter table users add column if not exists privy_did text;
alter table users add column if not exists wallet text;

-- The removed email/password flow is the only writer of these columns.
alter table users drop column if exists password_hash;
alter table users drop column if exists email;

-- One user per DID. This unique index also backs the `on conflict (privy_did)`
-- upsert that runs on every authenticated request.
create unique index if not exists users_privy_did_key on users (privy_did);

-- Rows created by the removed flow have no DID and can never authenticate
-- again; drop them (watchlist rows cascade) rather than keep unusable owners.
delete from users where privy_did is null;
