require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

app.use(express.json());
app.use(express.static('public'));

app.post('/location', async (req, res) => {
    const { latitude, longitude } = req.body;

    if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
    ) {
        return res.status(400).json({
            error: 'Invalid location data.'
        });
    }

    try {
        const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'LocationSharingDemo/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('Location lookup failed.');
        }

        const data = await response.json();
        const address = data.address || {};

        const city =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            'Unknown';

        const country = address.country || 'Unknown';

        const { error } = await supabase
            .from('shared_locations')
            .insert([{ city, country }]);

        if (error) {
            throw error;
        }

        console.log('Location saved:', {
            city,
            country,
            time: new Date().toISOString()
        });

        res.json({
            message: 'Location saved successfully.',
            city,
            country
        });

    } catch (error) {
        console.error('Error:', error.message);

        res.status(500).json({
            error: 'Unable to save location.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Website running at http://localhost:${PORT}`);
});