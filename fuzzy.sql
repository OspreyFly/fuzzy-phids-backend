DROP DATABASE fuzzy_phids;
CREATE DATABASE fuzzy_phids;
-- Log the creation of the database
SELECT 'Created database fuzzy_phids' AS message;

\connect fuzzy_phids

DROP DATABASE fuzzy_phids_test;
CREATE DATABASE fuzzy_phids_test;
-- Log the creation of the database
SELECT 'Created database fuzzy_phids_test' AS message;

\connect fuzzy_phids_test

