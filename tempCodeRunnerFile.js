const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const PORT = 3000;

// Helper function to fix relative URLs to absolute
function fixUrl(link, baseUrl) {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    if (link.startsWith('/')) return baseUrl + link;
    return baseUrl + '/' + link;
}

// Economic Times
async function fetchEconomicTimes() {
    const url = 'https://economictimes.indiatimes.com/news/latest-news';
    const baseUrl = 'https://economictimes.indiatimes.com';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        // Change selector here:
        $('ul.listLatestNews li a').each((i, el) => {
            const title = $(el).text().trim();
            const link = fixUrl($(el).attr('href'), baseUrl);
            if (title.length > 10) {
                results.push({ source: 'Economic Times', title, link });
            }
        });

        console.log(`Economic Times: Found ${results.length} headlines`);
        if(results.length === 0){
          console.log('Sample HTML snippet:', data.slice(0, 1000)); // logs first 1000 chars of fetched html
        }

        return results;
    } catch (err) {
        console.error('Economic Times fetch error:', err.message);
        return [{ source: 'Economic Times', title: 'Error fetching data', link: '#' }];
    }
}


// The Hindu
async function fetchEconomicTimes() {
    const url = 'https://economictimes.indiatimes.com/news/latest-news';
    const baseUrl = 'https://economictimes.indiatimes.com';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        $('.eachStory h3 a').each((i, el) => {
            const title = $(el).text().trim();
            const link = fixUrl($(el).attr('href'), baseUrl);
            if (title.length > 10) {
                results.push({ source: 'Economic Times', title, link });
            }
        });

        console.log(`Economic Times: Found ${results.length} headlines`);

        return results;
    } catch (err) {
        console.error('Economic Times fetch error:', err.message);
        return [{ source: 'Economic Times', title: 'Error fetching data', link: '#' }];
    }
}


// Hindustan Times
async function fetchHindustanTimes() {
    const url = 'https://www.hindustantimes.com/india-news';
    const baseUrl = 'https://www.hindustantimes.com';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        // On this page, headlines often in h3 a tags inside a container class 'media-heading' or similar
        // Let's target h3 a
        $('h3 a').each((i, el) => {
            const title = $(el).text().trim();
            const link = fixUrl($(el).attr('href'), baseUrl);
            if (title.length > 10) {
                results.push({ source: 'Hindustan Times', title, link });
            }
        });
        return results;
    } catch (err) {
        console.error('Hindustan Times fetch error:', err.message);
        return [{ source: 'Hindustan Times', title: 'Error fetching data', link: '#' }];
    }
}

// Times of India
async function fetchTimesOfIndia() {
    const url = 'https://timesofindia.indiatimes.com/home/headlines';
    const baseUrl = 'https://timesofindia.indiatimes.com';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        // Headlines on this page usually inside span.w_tle a or div.content a with headline text
        $('span.w_tle a, .content a').each((i, el) => {
            const title = $(el).text().trim();
            const link = fixUrl($(el).attr('href'), baseUrl);
            if (title.length > 10) {
                results.push({ source: 'Times of India', title, link });
            }
        });
        return results;
    } catch (err) {
        console.error('Times of India fetch error:', err.message);
        return [{ source: 'Times of India', title: 'Error fetching data', link: '#' }];
    }
}

app.get('/news', async (req, res) => {
    try {
        const [etNews, hinduNews, htNews, toiNews] = await Promise.all([
            fetchEconomicTimes(),
            fetchTheHindu(),
            fetchHindustanTimes(),
            fetchTimesOfIndia()
        ]);

        res.json({
            economicTimes: etNews,
            theHindu: hinduNews,
            hindustanTimes: htNews,
            timesOfIndia: toiNews
        });
    } catch (err) {
        console.error('Error in /news endpoint:', err.message);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.listen(PORT, () => {
    console.log(`NewsMania running at http://localhost:${PORT}`);
});
