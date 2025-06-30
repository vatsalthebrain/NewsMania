const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/newsmania', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB connected");
}).catch(err => {
    console.error("❌ MongoDB connection error:", err);
});

// Note model
const Note = mongoose.model('Note', {
    text: String,
    createdAt: { type: Date, default: Date.now }
});

// Helper function to fix relative URLs
function fixUrl(link, baseUrl) {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    if (link.startsWith('/')) return baseUrl + link;
    return baseUrl + '/' + link;
}

// The Hindu
async function fetchTheHindu() {
    const url = 'https://www.thehindu.com/news/';
    const baseUrl = 'https://www.thehindu.com';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];

        $('h3 a').each((i, el) => {
            const title = $(el).text().trim();
            const link = fixUrl($(el).attr('href'), baseUrl);
            if (title.length > 10 && link.includes('/news/')) {
                results.push({ source: 'The Hindu', title, link });
            }
        });
        return results;
    } catch (err) {
        console.error('The Hindu fetch error:', err.message);
        return [{ source: 'The Hindu', title: 'Error fetching data', link: '#' }];
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

// News API endpoint
app.get('/news', async (req, res) => {
    try {
        const [hinduNews, htNews, toiNews] = await Promise.all([
            fetchTheHindu(),
            fetchHindustanTimes(),
            fetchTimesOfIndia()
        ]);

        res.json({
            theHindu: hinduNews,
            hindustanTimes: htNews,
            timesOfIndia: toiNews
        });
    } catch (err) {
        console.error('Error in /news endpoint:', err.message);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Notes API endpoints
app.get('/notes', async (req, res) => {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
});

app.post('/notes', async (req, res) => {
    const note = new Note({ text: req.body.text });
    await note.save();
    res.json(note);
});

app.delete('/notes/:id', async (req, res) => {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`NewsMania running at http://localhost:${PORT}`);
});
