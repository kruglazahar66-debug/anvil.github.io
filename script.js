const STORAGE_USERS = 'anvil_users';
const STORAGE_MATCHES = 'anvil_matches';
const STORAGE_CURRENT_USER = 'anvil_current_user';

let matches = [];
let currentUser = null;

window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('hide');
    }, 800);
});

function getEmbedUrl(url) {
    if (!url) return '';
    
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1`;
        }
    }
    
    if (url.includes('twitch.tv')) {
        let channel = '';
        if (url.includes('twitch.tv/') && !url.includes('player.twitch.tv')) {
            channel = url.split('twitch.tv/')[1]?.split('/')[0];
        } else if (url.includes('channel=')) {
            channel = url.split('channel=')[1]?.split('&')[0];
        }
        if (channel) {
            return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&parent=localhost&autoplay=false`;
        }
    }
    
    if (url.includes('vimeo.com')) {
        let videoId = url.split('vimeo.com/')[1]?.split('?')[0];
        if (videoId) {
            return `https://player.vimeo.com/video/${videoId}?autoplay=0`;
        }
    }
    
    if (url.includes('/embed/') || url.includes('player.')) {
        return url;
    }
    
    return url;
}

function getStreamAlternative(url) {
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
        }
    }
    return url;
}

function initData() {
    let users = localStorage.getItem(STORAGE_USERS);
    if (!users) {
        const defaultUsers = [
            { id: '1', login: 'admin', password: 'admin123', role: 'admin', name: 'Захар', avatar: '👑' },
            { id: '2', login: 'user', password: 'user123', role: 'user', name: 'Алексей', avatar: '👤' }
        ];
        localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    }

    let storedMatches = localStorage.getItem(STORAGE_MATCHES);
    if (!storedMatches) {
        const defaultMatches = [
            { id: 'm1', title: '🏆 Чемпионат Мира по футболу • Финал', datetime: getFutureDate(0), streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', status: 'upcoming', preview: 'Сборная Бразилии vs Сборная Франции. Прогноз: 2-1' },
            { id: 'm2', title: '🎮 ESL One Dota 2 • Гранд Финал', datetime: getFutureDate(1), streamUrl: 'https://www.twitch.tv/riotgames', status: 'upcoming', preview: 'Team Spirit vs Gaimin Gladiators. Прямой эфир' },
            { id: 'm3', title: '🏀 НБА • Плей-офф', datetime: getFutureDate(2), streamUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', status: 'upcoming', preview: 'LA Lakers vs Golden State. Прогноз экспертов' }
        ];
        localStorage.setItem(STORAGE_MATCHES, JSON.stringify(defaultMatches));
    }
    matches = JSON.parse(localStorage.getItem(STORAGE_MATCHES));
    
    let sessUser = sessionStorage.getItem(STORAGE_CURRENT_USER);
    if (sessUser) {
        currentUser = JSON.parse(sessUser);
    }
}

function getFutureDate(daysFromNow) {
    let date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    if (daysFromNow === 0) {
        date.setHours(date.getHours() + 1);
    } else {
        date.setHours(20, 0, 0, 0);
    }
    return date.toISOString().slice(0, 16);
}

function saveMatches() {
    localStorage.setItem(STORAGE_MATCHES, JSON.stringify(matches));
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS));
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function register(login, password, name) {
    const users = getUsers();
    if (users.find(u => u.login === login)) {
        throw new Error('Пользователь уже существует');
    }
    const newUser = {
        id: Date.now().toString(),
        login,
        password,
        role: 'user',
        name: name || login,
        avatar: '👤'
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

function login(login, password) {
    const users = getUsers();
    const user = users.find(u => u.login === login && u.password === password);
    if (!user) throw new Error('Неверный логин или пароль');
    const sessionUser = { ...user };
    delete sessionUser.password;
    currentUser = sessionUser;
    sessionStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify(currentUser));
    return currentUser;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem(STORAGE_CURRENT_USER);
    renderApp();
}

function addMatch(title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const newMatch = {
        id: Date.now().toString(),
        title,
        datetime,
        streamUrl,
        preview: preview || 'Прогнозы и ставки открыты',
        status: new Date(datetime) <= new Date() ? 'live' : 'upcoming'
    };
    matches.push(newMatch);
    saveMatches();
    renderApp();
}

function updateMatch(id, title, datetime, streamUrl, preview) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    const index = matches.findIndex(m => m.id === id);
    if (index !== -1) {
        matches[index] = { 
            ...matches[index], 
            title, 
            datetime, 
            streamUrl,
            preview: preview || matches[index].preview,
            status: new Date(datetime) <= new Date() ? 'live' : 'upcoming'
        };
        saveMatches();
        renderApp();
    }
}

function deleteMatch(id) {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Доступ только админу');
    matches = matches.filter(m => m.id !== id);
    saveMatches();
    renderApp();
}

function renderApp() {
    const app = document.getElementById('app');
    const nav = document.getElementById('nav-links');
    
    if (currentUser) {
        nav.innerHTML = `
            <button class="nav-btn" onclick="window.showMatchesView()"><i class="fas fa-calendar"></i> Расписание</button>
            <button class="nav-btn" onclick="window.showLiveView()"><i class="fas fa-broadcast-tower"></i> Прямые эфиры</button>
            ${currentUser.role === 'admin' ? '<button class="nav-btn" onclick="window.showAdminPanel()"><i class="fas fa-crown"></i> Админ панель</button>' : ''}
            <div class="user-info"><i class="fas fa-user-circle"></i> ${escapeHtml(currentUser.name)}</div>
            <button class="logout-btn" onclick="window.logout()"><i class="fas fa-sign-out-alt"></i> Выйти</button>
        `;
    } else {
        nav.innerHTML = `<button class="nav-btn" onclick="window.showAuth()"><i class="fas fa-lock"></i> Вход / Регистрация</button>`;
    }

    if (!currentUser) {
        showAuth();
        return;
    }

    showMatchesView();
}

window.showMatchesView = function() {
    const app = document.getElementById('app');
    const now = new Date();
    const liveMatches = matches.filter(m => new Date(m.datetime) <= now);
    const upcomingMatches = matches.filter(m => new Date(m.datetime) > now);
    
    let html = `
        <div class="hero-section">
            <h1><i class="fas fa-fire-flame-curved"></i> ANVIL SPORTS</h1>
            <p>Прямые трансляции, прогнозы и аналитика от экспертов</p>
        </div>
    `;
    
    if (liveMatches.length > 0) {
        html += `
            <div class="live-banner">
                <h3><i class="fas fa-circle" style="color: #ff0000; font-size: 14px;"></i> ПРЯМО СЕЙЧАС В ЭФИРЕ</h3>
                <div class="live-count">${liveMatches.length} трансляции</div>
            </div>
        `;
        liveMatches.forEach(m => {
            html += `
                <div class="match-card" onclick="window.watchStream('${m.id}')">
                    <div class="match-badge badge-live"><i class="fas fa-circle"></i> LIVE</div>
                    <div class="match-title">${escapeHtml(m.title)}</div>
                    <div class="match-datetime"><i class="fas fa-clock"></i> ${new Date(m.datetime).toLocaleString()}</div>
                    <div class="match-preview"><i class="fas fa-chart-line"></i> ${escapeHtml(m.preview)}</div>
                    <button class="stream-btn"><i class="fas fa-play"></i> Смотреть трансляцию</button>
                </div>
            `;
        });
    }
    
    html += `<div class="matches-grid">`;
    upcomingMatches.forEach(m => {
        html += `
            <div class="match-card" onclick="window.watchStream('${m.id}')">
                <div class="match-badge badge-upcoming"><i class="fas fa-clock"></i> Скоро</div>
                <div class="match-title">${escapeHtml(m.title)}</div>
                <div class="match-datetime"><i class="fas fa-calendar-alt"></i> ${new Date(m.datetime).toLocaleString()}</div>
                <div class="match-preview"><i class="fas fa-chart-line"></i> ${escapeHtml(m.preview)}</div>
                <button class="stream-btn"><i class="fas fa-ticket-alt"></i> Запланировано</button>
            </div>
        `;
    });
    html += `</div>`;
    if (upcomingMatches.length === 0 && liveMatches.length === 0) html += `<div style="text-align:center; padding: 60px;">Нет запланированных матчей</div>`;
    app.innerHTML = html;
};

window.watchStream = function(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        alert('Матч не найден');
        return;
    }
    
    const app = document.getElementById('app');
    const embedUrl = getEmbedUrl(match.streamUrl);
    const originalUrl = getStreamAlternative(match.streamUrl);
    const isLive = new Date(match.datetime) <= new Date();
    
    app.innerHTML = `
        <button onclick="window.showMatchesView()" class="nav-btn" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i> Назад к расписанию</button>
        <div class="player-container">
            <div class="player-header">
                <div class="player-title">
                    ${isLive ? '<span class="match-badge badge-live" style="margin-right: 12px;"><i class="fas fa-circle"></i> LIVE</span>' : ''}
                    ${escapeHtml(match.title)}
                </div>
                <div class="player-actions">
                    <button class="player-action-btn" onclick="window.openInNewTab('${escapeHtml(originalUrl)}')"><i class="fab fa-youtube"></i> Открыть на YouTube</button>
                    <button class="player-action-btn" onclick="window.toggleFullscreen()"><i class="fas fa-expand"></i> Полный экран</button>
                </div>
            </div>
            <div class="match-datetime" style="padding: 0 20px 20px 20px;"><i class="fas fa-calendar-alt"></i> ${new Date(match.datetime).toLocaleString()}</div>
            <iframe id="streamFrame" class="player-frame" src="${escapeHtml(embedUrl)}" allowfullscreen allow="autoplay; encrypted-media; fullscreen" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox" loading="lazy"></iframe>
            <div style="padding: 16px 20px; background: rgba(0,0,0,0.5); font-size: 13px; color: #888; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                <i class="fas fa-info-circle"></i> Если видео не загружается, нажмите "Открыть на YouTube"
            </div>
        </div>
    `;
};

window.openInNewTab = function(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
};

window.toggleFullscreen = function() {
    const iframe = document.getElementById('streamFrame');
    if (iframe) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        }
    }
};

window.showLiveView = function() {
    const app = document.getElementById('app');
    const now = new Date();
    const liveMatches = matches.filter(m => new Date(m.datetime) <= now);
    if (liveMatches.length === 0) {
        app.innerHTML = `<div class="hero-section"><h2>📺 Прямые эфиры</h2><p>Сейчас нет активных трансляций</p><button onclick="window.showMatchesView()" class="stream-btn" style="margin-top: 20px;">Вернуться к расписанию</button></div>`;
        return;
    }
    let html = `<div class="hero-section"><h2><i class="fas fa-broadcast-tower"></i> Прямые эфиры ANVIL</h2><p>Смотрите спортивные события в реальном времени</p></div><div class="matches-grid">`;
    liveMatches.forEach(m => {
        html += `
            <div class="match-card" onclick="window.watchStream('${m.id}')">
                <div class="match-badge badge-live"><i class="fas fa-circle"></i> LIVE</div>
                <div class="match-title">${escapeHtml(m.title)}</div>
                <button class="stream-btn"><i class="fas fa-play"></i> Смотреть сейчас</button>
            </div>
        `;
    });
    html += `</div><button onclick="window.showMatchesView()" class="nav-btn" style="margin: 30px auto; display: block;">К расписанию</button>`;
    app.innerHTML = html;
};

window.showAdminPanel = function() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Нет прав администратора');
        showMatchesView();
        return;
    }
    const app = document.getElementById('app');
    let matchesListHtml = matches.map(m => `
        <div class="match-item">
            <div class="match-info">
                <strong>${escapeHtml(m.title)}</strong>
                <br><small>${new Date(m.datetime).toLocaleString()}</small>
                <br><small>${escapeHtml(m.streamUrl.substring(0, 50))}...</small>
            </div>
            <div class="match-actions">
                <button class="edit-btn" onclick="window.editMatch('${m.id}')"><i class="fas fa-edit"></i> Ред.</button>
                <button class="delete-btn" onclick="window.deleteMatchAdmin('${m.id}')"><i class="fas fa