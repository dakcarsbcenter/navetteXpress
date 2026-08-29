-- Backfill company_status pour les comptes déjà passés en isCompany=true avant
-- l'introduction du circuit de validation admin (migration 0017). Sans ce backfill,
-- ces comptes seraient traités comme une NOUVELLE demande (et repasseraient en
-- pending) à la prochaine modification de leur profil via /api/client/profile.
UPDATE users
SET company_status = 'approved'
WHERE is_company = true AND company_status = 'none';
