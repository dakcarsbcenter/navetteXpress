-- Migration: Ajouter champ pour motif d'annulation
-- Date: 14 octobre 2025

ALTER TABLE bookings 
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN cancelled_at TIMESTAMP;