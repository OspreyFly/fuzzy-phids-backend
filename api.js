// api.js
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const PEXELS_API_KEY = 'qSZndJabj877sDPiqQnZmUXQ7CoJGGk6NSeMr3dVgI6oqn17ZjZEPfrh'; // Replace with your actual Pexels API key
const PEXELS_BASE_URL = 'https://api.pexels.com/v1/search';

 async function generateData() {
    const numberOfInsects = 5; // Number of insects to generate
    const insectsData = [];

    // Generate initial data using Faker
    for (let i = 0; i < numberOfInsects; i++) {
        const species = faker.animal.insect();
        const price = faker.commerce.price();

        // Add generated data to the array without the image URL
        insectsData.push({
            species,
            price
        });
    }

    // Fetch images from Pexels using the species as the query term
    for (let i = 0; i < numberOfInsects; i++) {
        const params = {
            query: insectsData[i].species,
            per_page: 1, // Request one image per query
            page: 1 // Start from the first page
        };

        try {
            const response = await axios.get(`${PEXELS_BASE_URL}?query=${encodeURIComponent(params.query)}&per_page=${params.per_page}&page=${params.page}`, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });

            const photo = response.data.photos[0];
            const imageUrl = photo.src.large; // Assuming 'large' is the desired size

            // Update the insectsData array with the fetched image URL
            insectsData[i] = {
                ...insectsData[i],
                url_image: imageUrl
            };
        } catch (error) {
            console.error(`Failed to fetch image for insect ${i}:`, error);
        }
    }

    return insectsData;
}

module.exports = generateData;