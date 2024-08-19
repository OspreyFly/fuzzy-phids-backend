\echo 'Delete and recreate fuzzy_phids db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE fuzzy_phids;
CREATE DATABASE fuzzy_phids;
\connect fuzzy_phids

\i fuzzy-schema.sql

\echo 'Delete and recreate fuzzy_phids_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE fuzzy_phids_test;
CREATE DATABASE fuzzy_phids_test;
\connect fuzzy_phids_test

\i fuzzy-schema.sql