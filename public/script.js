document.addEventListener('DOMContentLoaded', () => {
    let newsData = {};

    const newsContainer = document.getElementById('news-container');
    const searchInput = document.getElementById('search-input');
    const noteInput = document.getElementById('note-input');
    const saveNoteBtn = document.getElementById('save-note');
    const notesList = document.getElementById('notes-list');
    const darkToggle = document.getElementById('dark-toggle');

    function loadNews() {
        newsContainer.innerHTML = '<p>Loading news...</p>';

        fetch('/news')
            .then(res => res.json())
            .then(data => {
                newsData = data;

                if (
                    (!data.theHindu || data.theHindu.length === 0) &&
                    (!data.hindustanTimes || data.hindustanTimes.length === 0) &&
                    (!data.timesOfIndia || data.timesOfIndia.length === 0)
                ) {
                    newsContainer.innerHTML = '<p>No news found.</p>';
                    return;
                }

                showNews('all'); // default
            })
            .catch(() => {
                newsContainer.innerHTML = '<p>Error loading news.</p>';
            });
    }

    function showNews(source) {
        newsContainer.innerHTML = '';

        let items = [];

        if (source === 'all') {
            items = [
                ...(newsData.theHindu || []),
                ...(newsData.hindustanTimes || []),
                ...(newsData.timesOfIndia || [])
            ];
            items = shuffleArray(items);
        } else {
            items = newsData[source] || [];
        }

        if (items.length === 0) {
            newsContainer.innerHTML = '<p>No news found for this source.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <h3><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
                <span>Source: ${item.source}</span>
            `;
            newsContainer.appendChild(card);
        });
    }

    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    document.querySelectorAll('button.source-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('button.source-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const selectedSource = btn.dataset.source;
            showNews(selectedSource);
        });
    });

    darkToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark', darkToggle.checked);
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            document.querySelectorAll('.news-card').forEach(card => {
                const title = card.querySelector('h3').innerText.toLowerCase();
                card.style.display = title.includes(query) ? 'block' : 'none';
            });
        });
    }

    // Notepad functions
    function loadNotes() {
        fetch('/notes')
            .then(res => res.json())
            .then(data => {
                notesList.innerHTML = '';
                data.forEach(note => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${note.text}</span>
                        <button data-id="${note._id}">Delete</button>
                    `;
                    notesList.appendChild(li);
                });
            });
    }

    saveNoteBtn.addEventListener('click', () => {
        const text = noteInput.value.trim();
        if (!text) return;

        fetch('/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        }).then(() => {
            noteInput.value = '';
            loadNotes();
        });
    });

    notesList.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            const id = e.target.getAttribute('data-id');
            fetch(`/notes/${id}`, {
                method: 'DELETE'
            }).then(() => {
                loadNotes();
            });
        }
    });

    loadNews();
    loadNotes();
});
