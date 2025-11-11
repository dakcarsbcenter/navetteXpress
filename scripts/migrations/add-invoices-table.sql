-- Migration: Ajouter la table invoices (factures)
-- Date: 2024-11-10
-- Description: Création de la table des factures générées automatiquement lors de la validation des devis

-- Créer l'enum pour le statut des factures
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'cancelled', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Créer la table invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  quote_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT amount_check CHECK (amount > 0),
  CONSTRAINT total_check CHECK (total_amount > 0),
  CONSTRAINT fk_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE RESTRICT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email ON invoices(customer_email);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE invoices IS 'Table des factures générées automatiquement lors de la validation des devis';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro unique de facture au format INV-YYYY-XXXXX';
COMMENT ON COLUMN invoices.quote_id IS 'Référence au devis accepté qui a généré cette facture';
COMMENT ON COLUMN invoices.tax_rate IS 'Taux de TVA en pourcentage';
COMMENT ON COLUMN invoices.issue_date IS 'Date d''émission de la facture';
COMMENT ON COLUMN invoices.due_date IS 'Date d''échéance de paiement';
COMMENT ON COLUMN invoices.paid_date IS 'Date de paiement effectif';
