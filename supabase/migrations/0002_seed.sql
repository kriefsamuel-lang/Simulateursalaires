-- =====================================================================
-- Données de référence
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paliers du hesder arkhot — année fiscale 2025
-- Source : רשות המסים, « דגשים לנוהל מתן אורכות להגשת דוחות שנתיים
-- במס הכנסה לשנת המס 2025 », 28 avril 2026.
-- ---------------------------------------------------------------------

-- א. יחידים
insert into paliers (annee, population, date_limite, pourcentage, libelle) values
  (2025, 'yehidim', '2026-08-31', 10,  'שלב א — 10 %'),
  (2025, 'yehidim', '2026-11-30', 50,  'שלב ב — 50 %'),
  (2025, 'yehidim', '2027-02-28', 100, 'שלב ג — 100 %')
on conflict (annee, population, pourcentage) do nothing;

-- ב. חבר בני אדם (כולל מלכ"רים ונאמנויות)
insert into paliers (annee, population, date_limite, pourcentage, libelle) values
  (2025, 'haver_bnei_adam', '2026-08-31', 10,  'שלב א — 10 %'),
  (2025, 'haver_bnei_adam', '2026-12-31', 40,  'שלב ב — 40 %'),
  (2025, 'haver_bnei_adam', '2027-03-31', 100, 'שלב ג — 100 %')
on conflict (annee, population, pourcentage) do nothing;

-- ---------------------------------------------------------------------
-- Checklists types
-- ---------------------------------------------------------------------
insert into modeles_taches (type_client, libelle, ordre) values
  ('individu', 'Réception des pièces du client',              10),
  ('individu', 'טופס 106 / attestations de salaire',          20),
  ('individu', 'Relevés bancaires et טופס 867',               30),
  ('individu', 'Revenus étrangers et conventions fiscales',   40),
  ('individu', 'Saisie et rapprochement comptable',           50),
  ('individu', 'הצהרת הון si demandée',                        60),
  ('individu', 'Contrôle de cohérence et calcul de l''impôt', 70),
  ('individu', 'Validation et signature du client',           80),
  ('individu', 'שידור דוח מקוון מלא',                          90),
  ('individu', 'Classement et archivage du dossier',         100),

  ('societe', 'Réception de la balance générale',             10),
  ('societe', 'Rapprochements bancaires',                     20),
  ('societe', 'Inventaire et travaux en cours',               30),
  ('societe', 'Immobilisations et amortissements (פחת)',       40),
  ('societe', 'Rapprochement TVA / מע"מ',                      50),
  ('societe', 'Rapprochement ניכויים et טופס 126',             60),
  ('societe', 'États financiers (דוח כספי) signés',            70),
  ('societe', 'דוח התאמה למס et calcul de l''impôt',           80),
  ('societe', 'Validation et signature des dirigeants',       90),
  ('societe', 'שידור דוח מקוון מלא',                          100),
  ('societe', 'Classement et archivage du dossier',           110),

  ('amouta', 'Réception de la balance générale',              10),
  ('amouta', 'Ventilation par affectation des dons',          20),
  ('amouta', 'Rapprochements bancaires',                      30),
  ('amouta', 'Rapprochement ניכויים et טופס 126',              40),
  ('amouta', 'États financiers selon תקן 5',                   50),
  ('amouta', 'דוח מילולי pour רשם העמותות',                    60),
  ('amouta', 'Suivi אישור ניהול תקין',                          70),
  ('amouta', 'Validation par le ועד המנהל',                     80),
  ('amouta', 'שידור דוח מקוון מלא',                            90),
  ('amouta', 'Classement et archivage du dossier',            100)
on conflict (type_client, libelle) do nothing;
