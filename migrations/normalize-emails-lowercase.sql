-- Migration: normalize all user emails to lowercase
-- This fixes UserNotFound errors caused by email case-sensitivity mismatches
-- between what was stored at registration and what is typed at login.
--
-- Safe to run multiple times (idempotent).

UPDATE users
SET email = lower(email)
WHERE email != lower(email);
