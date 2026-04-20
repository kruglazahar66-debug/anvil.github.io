let events = [];
let currentUser = null;

const STORAGE_USERS = 'anvil_users';
const STORAGE_EVENTS = 'anvil_events';
const STORAGE_VOTES = 'anvil_votes';

function initData() {
    let users = localStorage.getItem(STORAGE_USERS);
    if (!users) {
        const defaultUsers = [
            { username: "admin", password: "admin123", role: "admin" },
            { username: "proplayer", password: "play123", role: "user" },
            { username: "fanatic", password: "fan2026", role: "user" }
        ];
        localStorage.setItem(STORAGE_USERS, JSON.stringify(defaultUsers));
    }
    
    let storedEvents = localStorage.getItem(STORAGE_EVENTS);
    if (!storedEvents) {
        const demoEvents = [
            { 
                id: "ev1", 
                title: "⚡ ANVIL GRAND FINAL | Titans vs Phantoms", 
                datetime: getFutureDate(1, 14), 
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
                description: "Решающий матч сезона 2026",
                embedType: "youtube" 
            },
            { 
                id: "ev2", 
                title: "🎮 KING'S CUP | Team Anvil vs Serpents", 
                datetime: getFutureDate(2, 10), 
                url: "https://www.twitch.tv/anvil_esports", 
                description: "Прямая трансляция",
                embedType: "twitch" 
            }
        ];
        localStorage.setItem(STORAGE_EVENTS, JSON.stringify(demoEvents));
    }
    
    let votes = localStorage.getItem(STORAGE_VOTES);
    if (!votes) {
        localStorage.setItem(STORAGE_VOTES, JSON.stringify({}));
    }
    
    loadEventsFromStorage();
}

function getFutureDate(days, hours) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    return date.toISOString().slice(0, 16);
}

function loadEventsFromStorage() {
    const data = localStorage.getItem(STORAGE_EVENTS);
    if (data) {
        events = JSON.parse(data);
        events.forEach(ev => {
            if (!ev.embedType) {
                if (ev.url.includes('youtube') || ev.url.includes('youtu.be')) ev.embedType = 'youtube';
                else if (ev.url.includes('twitch.tv')) ev.embedType = 'twitch';
                else ev.embedType = 'generic';
            }
        });
        saveEventsToStorage();
    }
}

function saveEventsToStorage() {
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
}

function getVotesData() {
    return JSON.parse(localStorage.getItem(STORAGE_VOTES) || "{}");
}

function saveVotesData(votesObj) {
    localStorage.setItem(STORAGE_VOTES, JSON.stringify(votesObj));
}

function getEmbedUrl(rawUrl, typeHint) {
    let url = rawUrl.trim();
    
    if (url.includes('youtube.com/watch') || url.includes('youtu.be') || typeHint === 'youtube') {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('/embed/')) {
            videoId = url.split('/embed/')[1]?.split('?')[0];
        }
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
        }
    }
    
    if (url.includes('twitch.tv') || typeHint === 'twitch') {
        let channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
        if (channelMatch) {
            let channel = channelMatch[1];
            return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false`;
        }
        if (url.includes('player.twitch.tv')) return url;
        return url;
    }
    
    return url;
}

function formatTimeRemaining(date) {
    const now = new Date();
    const diff = date - now;
    if (diff <= 0) return 'Идёт сейчас';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `через ${days}д ${hours % 24}ч`;
    if (hours > 0) return `через ${hours}ч`;
    return `через ${Math.floor(diff / (1000 * 60))}мин`;
}

function renderStreams() {
    const container = document.getElementById('streamsList');
    if (!container) return;
    
    if (events.length === 0) {
        container.innerHTML = `<div style="padding: 3rem; text-align: center;"><i class="fas fa-eye-slash" style="font-size: 3rem; color: #ff5e3a;"></i><p>Нет эфиров</p></div>`;
        return;
    }
    
    const votesData = getVotesData();
    const now = new Date();
    
    container.innerHTML = events.map(event => {
        const eventVotes = votesData[event.id] || { teamA: 0, teamB: 0, userVotes: {} };
        const userVote = (currentUser && eventVotes.userVotes[currentUser.username]) ? eventVotes.userVotes[currentUser.username] : null;
        const total = eventVotes.teamA + eventVotes.teamB;
        const percentA = total ? Math.round((eventVotes.teamA / total) * 100) : 50;
        const embedSrc = getEmbedUrl(event.url, event.embedType);
        const eventDate = new Date(event.datetime);
        const isLive = (eventDate <= now && (now - eventDate) < 3 * 60 * 60 * 1000);
        
        return `
            <div class="stream-card" data-id="${event.id}">
                <div class="stream-video">
                    <iframe src="${embedSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
                </div>
                <div class="stream-info">
                    <div class="match-title">
                        ${escapeHtml(event.title)} 
                        ${isLive ? '<span class="live-badge"><i class="fas fa-circle"></i> LIVE</span>' : ''}
                    </div>
                    <div class="datetime">
                        <i class="far fa-calendar-alt"></i> ${new Date(event.datetime).toLocaleString()}
                        <span style="margin-left: 0.8rem;"><i class="far fa-clock"></i> ${formatTimeRemaining(eventDate)}</span>
                    </div>
                    ${event.description ? `<div class="match-description">${escapeHtml(event.description)}</div>` : ''}
                    <div class="predict-section">
                        <div class="predict-title"><i class="fas fa-chart-line"></i> Прогноз</div>
                        <div class="vote-buttons">
                            <button class="vote-btn ${userVote === 'teamA' ? 'voted' : ''}" data-event="${event.id}" data-choice="teamA">
                                🔥 Team A (${eventVotes.teamA})
                            </button>
                            <button class="vote-btn ${userVote === 'teamB' ? 'voted' : ''}" data-event="${event.id}" data-choice="teamB">
                                💀 Team B (${eventVotes.teamB})
                            </button>
                        </div>
                        <div class="results">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentA}%;">${percentA > 15 ? percentA + '%' : ''}</div>
                            </div>
                            <div class="stats-text">
                                <span>A: ${percentA}% (${eventVotes.teamA})</span>
                                <span>B: ${100 - percentA}% (${eventVotes.teamB})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentUser) {
                showToast('Войдите чтобы голосовать', 'error');
                showAuthModal('login');
                return;
            }
            voteForEvent(btn.dataset.event, btn.dataset.choice);
        });
    });
}

function voteForEvent(eventId, choice) {
    if (!currentUser) return;
    let votesData = getVotesData();
    if (!votesData[eventId]) votesData[eventId] = { teamA: 0, teamB: 0, userVotes: {} };
    const evVotes = votesData[eventId];
    const previous = evVotes.userVotes[currentUser.username];
    if (previous === choice) return;
    if (previous === 'teamA') evVotes.teamA--;
    if (previous === 'teamB') evVotes.teamB--;
    if (choice === 'teamA') evVotes.teamA++;
    if (choice === 'teamB') evVotes.teamB++;
    evVotes.userVotes[currentUser.username] = choice;
    saveVotesData(votesData);
    renderStreams();
    showToast('Голос учтён!', 'success');
}

function refreshAdminSelect() {
    const select = document.getElementById('editEventSelect');
    if (select) {
        select.innerHTML = '<option value="">-- Выбрать событие --</option>' + events.map(ev => `<option value="${ev.id}">${escapeHtml(ev.title)}</option>`).join('');
    }
}

function addOrUpdateEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const datetime = document.getElementById('eventDatetime').value;
    const url = document.getElementById('streamUrl').value.trim();
    const desc = document.getElementById('eventDesc').value;
    if (!title || !datetime || !url) {
        showAdminMsg('Заполните все поля', false);
        return;
    }
    let embedType = 'generic';
    if (url.includes('youtube') || url.includes('youtu.be')) embedType = 'youtube';
    else if (url.includes('twitch')) embedType = 'twitch';
    const newEvent = { id: 'ev_' + Date.now(), title, datetime, url, description: desc, embedType };
    events.push(newEvent);
    saveEventsToStorage();
    renderStreams();
    refreshAdminSelect();
    clearAdminForm();
    showAdminMsg('Событие добавлено', true);
}

function deleteSelectedEvent() {
    const id = document.getElementById('editEventSelect').value;
    if (!id) { showAdminMsg('Выберите событие', false); return; }
    if (confirm('Удалить?')) {
        events = events.filter(ev => ev.id !== id);
        saveEventsToStorage();
        let votes = getVotesData();
        delete votes[id];
        saveVotesData(votes);
        renderStreams();
        refreshAdminSelect();
        showAdminMsg('Удалено', true);
    }
}

function clearAdminForm() {
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDatetime').value = '';
    document.getElementById('streamUrl').value = '';
    document.getElementById('eventDesc').value = '';
}

function showAdminMsg(msg, isOk) {
    const div = document.getElementById('adminMsg');
    if (div) {
        div.style.display = 'block';
        div.className = isOk ? 'error-msg success-msg' : 'error-msg';
        div.innerHTML = msg;
        setTimeout(() => div.style.display = 'none', 3000);
    }
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = { username: user.username, role: user.role };
        updateUiForUser();
        renderStreams();
        closeModal();
        showToast(`Welcome ${username}!`, 'success');
        return true;
    }
    showToast('Неверный логин/пароль', 'error');
    return false;
}

function register(username, password) {
    if (username.length < 3 || password.length < 3) {
        showToast('Минимум 3 символа', 'error');
        return false;
    }
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS));
    if (users.find(u => u.username === username)) {
        showToast('Пользователь существует', 'error');
        return false;
    }
    users.push({ username, password, role: 'user' });
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    showToast('Регистрация успешна!', 'success');
    closeModal();
    return true;
}

function logout() {
    currentUser = null;
    updateUiForUser();
    renderStreams();
    showToast('Вы вышли', 'info');
}

function updateUiForUser() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const roleSpan = document.getElementById('userRoleBadge');
    const welcomeDiv = document.getElementById('welcomeArea');
    const adminPanelDiv = document.getElementById('adminPanel');
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (roleSpan) roleSpan.innerHTML = `<i class="fas fa-user-check"></i> ${currentUser.username} ${currentUser.role === 'admin' ? '👑' : ''}`;
        if (welcomeDiv) welcomeDiv.innerHTML = `🔥 Добро пожаловать, ${currentUser.username}!`;
        if (adminPanelDiv) adminPanelDiv.style.display = currentUser.role === 'admin' ? 'block' : 'none';
        if (currentUser.role === 'admin') refreshAdminSelect();
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (roleSpan) roleSpan.innerHTML = '';
        if (welcomeDiv) welcomeDiv.innerHTML = '🔮 Войдите для прогнозов';
        if (adminPanelDiv) adminPanelDiv.style.display = 'none';
    }
}

let activeModal = null;

function showAuthModal(type) {
    if (activeModal) closeModal();
    const modalHtml = `
        <div class="modal-overlay" id="authModal">
            <div class="modal">
                <h3>${type === 'login' ? 'Вход' : 'Регистрация'}</h3>
                <input type="text" id="modalUsername" placeholder="Логин">
                <input type="password" id="modalPassword" placeholder="Пароль">
                <div class="modal-buttons">
                    <button id="modalSubmitBtn">${type === 'login' ? 'Войти' : 'Создать'}</button>
                    <button id="modalCloseBtn">Отмена</button>
                </div>
                ${type === 'login' ? '<small>admin/admin123</small>' : ''}
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    activeModal = document.getElementById('authModal');
    document.getElementById('modalSubmitBtn').onclick = () => {
        const username = document.getElementById('modalUsername').value;
        const password = document.getElementById('modalPassword').value;
        if (type === 'login') login(username, password);
        else register(username, password);
    };
    document.getElementById('modalCloseBtn').onclick = closeModal;
    activeModal.onclick = (e) => { if (e.target === activeModal) closeModal(); };
}

function closeModal() {
    if (activeModal) { activeModal.remove(); activeModal = null; }
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white; padding: 12px 24px; border-radius: 40px;
        z-index: 3000; animation: fadeSlideUp 0.3s ease;
    `;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initData();
    renderStreams();
    updateUiForUser();
    
    document.getElementById('loginBtn').onclick = () => showAuthModal('login');
    document.getElementById('registerBtn').onclick = () => showAuthModal('register');
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('addEventBtn').onclick = () => { if (currentUser?.role === 'admin') addOrUpdateEvent(); else showToast('Только админ', 'error'); };
    document.getElementById('deleteEventBtn').onclick = () => { if (currentUser?.role === 'admin') deleteSelectedEvent(); else showToast('Только админ', 'error'); };
});