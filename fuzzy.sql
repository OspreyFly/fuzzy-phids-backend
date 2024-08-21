\echo 'Delete and recreate fuzzy_phids db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE fuzzy_phids;
CREATE DATABASE fuzzy_phids;
-- Log the creation of the database
SELECT 'Created database fuzzy_phids' AS message;

\connect fuzzy_phids



\echo 'Delete and recreate fuzzy_phids_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE fuzzy_phids_test;
CREATE DATABASE fuzzy_phids_test;
-- Log the creation of the database
SELECT 'Created database fuzzy_phids_test' AS message;

\connect fuzzy_phids_test

