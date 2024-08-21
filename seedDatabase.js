const fs = require('fs');
const { Pool } = require('pg');
const generateData = require('./api'); // Adjust the path as necessary

// Initialize connection pool
const pool = new Pool({
    user: 'noah',
    host: 'localhost',
    database: 'fuzzy_phids',
    password: 'password',
    port: 5432,
});

async function main() {
    try {
        await runSQLFile('./fuzzy.sql');
        await runSQLFile('./fuzzy-schema.sql');
        await seedDatabase();
        console.log('Database setup and seeding completed successfully.');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

main().catch(console.error);

async function runSQLFile(filePath) {
    const sqlCommands = fs.readFileSync(filePath, 'utf8');
    try {
        await pool.query(sqlCommands);
        console.log(`Schema created successfully.`);
    } catch (err) {
        console.error(`Error executing SQL file ${filePath}:`, err.stack);
    }
}

async function seedDatabase() {
    const data = await generateData();

    // Format data for SQL insertion
    const formattedData = data.map(item => {
        return `('${item.species}', ${item.price}, '${item.url_image}')`;
    });

    const sqlInsertCommand = `INSERT INTO insects (species, price, url_image) VALUES ${formattedData};`;

    try {
        await pool.query(sqlInsertCommand);
        console.log('Data seeded successfully.');
    } catch (err) {
        console.error('Error seeding data:', err.stack);
    }
}
