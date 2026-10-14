-- Wallets the server has verified for a user.
--
-- Authorization needs to know which wallets a DID owns, but the access token
-- does not always carry that (Privy documents its claims as sid/sub/iss/aud/iat/
-- exp only), so the list is learned from Privy's API and kept here. Persisting it
-- means ownership checks do not depend on an external call per request, and a
-- user is not locked out if Privy is briefly unreachable.

alter table users add column if not exists wallets text[] not null default '{}';

-- Seed from the single wallet column so existing users keep working.
update users
   set wallets = array[wallet]
 where wallet is not null
   and wallets = '{}';
