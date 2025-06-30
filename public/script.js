$(document).ready(function () {
    let newsData = {};

    const newsContainer = $('#news-container');

    // Load news from server
    function loadNews() {
        newsContainer.html('<p>Loading news...</p>');
        // Search filter
$('#search-input').on('input', function () {
    const query = $(this).val().toLowerCase();

    $('.news-card').each(function () {
        const title = $(this).find('h3').text().toLowerCase();
        if (title.includes(query)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
});


        $.getJSON('/news', function (data) {
            newsData = data;

            if (
                (!data.theHindu || data.theHindu.length === 0) &&
                (!data.hindustanTimes || data.hindustanTimes.length === 0) &&
                (!data.timesOfIndia || data.timesOfIndia.length === 0)
            ) {
                newsContainer.html('<p>No news found.</p>');
                return;
            }

            showNews('all'); // default: show mixed news
        }).fail(() => {
            newsContainer.html('<p>Error loading news.</p>');
        });
    }

    // Show news by source or all mixed
    function showNews(source) {
        newsContainer.empty();

        let items = [];

        if (source === 'all') {
            items = [...(newsData.theHindu || []), ...(newsData.hindustanTimes || []), ...(newsData.timesOfIndia || [])];
            items = shuffleArray(items);
        } else {
            items = newsData[source] || [];
        }

        if (items.length === 0) {
            newsContainer.html('<p>No news found for this source.</p>');
            return;
        }

        items.forEach(item => {
            const card = $(`
                <div class="news-card">
                    <h3><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
                    <span>Source: ${item.source}</span>
                </div>
            `);
            newsContainer.append(card);
        });
    }

    // Fisher-Yates shuffle to randomize array
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // Source button click handler
    $('nav').on('click', 'button.source-btn', function () {
        $('button.source-btn').removeClass('active');
        $(this).addClass('active');

        const selectedSource = $(this).data('source');
        showNews(selectedSource);
    });

    // Dark mode toggle
    $('#dark-toggle').on('change', function () {
        if (this.checked) {
            $('body').addClass('dark');
        } else {
            $('body').removeClass('dark');
        }
    });

    // --- Notepad functionality ---

    // Load notes from backend
    function loadNotes() {
        $.get('/notes', function (data) {
            const list = $('#notes-list');
            list.empty();
            data.forEach(note => {
                const li = $(`
                    <li>
                        <span>${note.text}</span>
                        <button data-id="${note._id}">Delete</button>
                    </li>
                `);
                list.append(li);
            });
        });
    }

    // Add new note
    $('#save-note').on('click', function () {
        const text = $('#note-input').val().trim();
        if (!text) return;
        $.ajax({
            url: '/notes',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ text }),
            success: function () {
                $('#note-input').val('');
                loadNotes();
            }
        });
    });

    // Delete note handler
    $('#notes-list').on('click', 'button', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `/notes/${id}`,
            method: 'DELETE',
            success: function () {
                loadNotes();
            }
        });
    });

    // Initial load
    loadNews();
    loadNotes();
});
