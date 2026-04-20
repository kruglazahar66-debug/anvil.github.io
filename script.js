let users = [
    { id: 1, username: "zakhar", password: "zakhar123", role: "admin", fullName: "Захар" },
    { id: 2, username: "alex", password: "alex123", role: "user", fullName: "Алексей" },
    { id: 3, username: "mariya", password: "mariya123", role: "user", fullName: "Мария" }
];

let currentUser = null;

let events = [
    {
        id: "ev1",
        title: "ANVIL Major 2026 — Финал",
        datetime: "2026-04-28T19:00",
        prediction: "🔥 ANVIL победит с коэффициентом 1.85 | Тотал больше 2.5",
        streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        platform: "youtube"
    },
    {
        id: "ev2",
        title: "Dragon Series: ANVIL vs Titans",
        datetime: "2026-04-23T17:30",
        prediction: "📊 Победа ANVIL — кф 1.72 | Аналитика: форма команды 7 побед подряд",
        streamUrl: "https://www.youtube.com/embed/3JZ_D3ELwOQ",
        platform: "youtube"
    },
    {
        id: "ev3",
        title: "Прямой эфир: Разбор турнира с Захаром",
        datetime: "2026-04-24T20:00",
        prediction: "🎙 Эксклюзивный прогноз на плей-офф",
        streamUrl: "https://player.twitch.tv/?channel=anvil_esports&parent=localhost",
        platform: "twitch"
    },
    {
        id: "ev4",
        title: "ANVIL Academy — Молодёжный турнир",
        datetime: "2026-04-26T15:00",
        prediction: "⭐ Топ-проспекты: смотреть обязательно",
        streamUrl: "",
        platform: "none"
    }
];

function saveToLocalStorage() {
    localStorage.setItem("anvil_events", JSON.stringify(events));
    localStorage.setItem("anvil_users", JSON.stringify(users));
}

function loadFromLocalStorage() {
    const storedEvents = localStorage.getItem("anvil_events");
    if (storedEvents) events = JSON.parse(storedEvents);
    const storedUsers = localStorage.getItem("anvil_users");
    if (storedUsers) users = JSON.parse(storedUsers);
}
loadFromLocalStorage();

function persistAndRender() {
    saveToLocalStorage();
    renderApp();
}

function formatDateTime(isoString) {
    if (!isoString) return "Дата не указана";
    const d = new Date(isoString);
    return d.toLocaleString("ru-RU", {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function normalizeStreamUrl(url, platform) {
    if (!url || url.trim() === "") return "";
    
    let cleanUrl = url.trim();
    
    // YouTube URL нормализация
    if (cleanUrl.includes("youtube.com/watch?v=")) {
        const videoId = cleanUrl.split("v=")[1]?.split("&")[0];
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    if (cleanUrl.includes("youtu.be/")) {
        const videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    // YouTube embed уже правильный
    if (cleanUrl.includes("youtube.com/embed/")) {
        return cleanUrl;
    }
    
    // Twitch channel
    if (cleanUrl.includes("twitch.tv/")) {
        if (cleanUrl.includes("twitch.tv/embed")) {
            return cleanUrl;
        }
        const channelName = cleanUrl.split("twitch.tv/")[1]?.split("/")[0]?.split("?")[0];
        if (channelName && !cleanUrl.includes("parent=")) {
            return `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}`;
        }
        if (channelName) {
            return cleanUrl;
        }
    }
    
    // Twitch embed уже правильный
    if (cleanUrl.includes("player.twitch.tv/")) {
        if (!cleanUrl.includes("parent=") && window.location.hostname !== "localhost") {
            return `${cleanUrl}&parent=${window.location.hostname}`;
        }
        return cleanUrl;
    }
    
    return cleanUrl;
}

function getEmbedHtml(url, platform) {
    if (!url || url.trim() === "") {
        return `<div class="live-tag" style="background:#475569; animation:none;">⏳ Эфир скоро</div>`;
    }
    
    const normalizedUrl = normalizeStreamUrl(url, platform);
    
    if (normalizedUrl.includes("youtube.com/embed/")) {
        return `
            <div class="live-tag">🔴 ПРЯМОЙ ЭФИР (YouTube)</div>
            <iframe class="stream-iframe" 
                    src="${escapeHtml(normalizedUrl)}?autoplay=0&rel=0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen 
                    loading="lazy">
            </iframe>
        `;
    }
    
    if (normalizedUrl.includes("player.twitch.tv/")) {
        return `
            <div class="live-tag">🔴 ПРЯМОЙ ЭФИР (Twitch)</div>
            <iframe class="stream-iframe" 
                    src="${escapeHtml(normalizedUrl)}" 
                    allowfullscreen 
                    loading="lazy">
            </iframe>
        `;
    }
    
    return `
        <div class="live-tag">🔴 ПРЯМОЙ ЭФИР</div>
        <iframe class="stream-iframe" 
                src="${escapeHtml(normalizedUrl)}" 
                allowfullscreen 
                loading="lazy">
        </iframe>
    `;
}

function showAuthModal(type) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    const isLogin = type === "login";
    modal.innerHTML = `
            <div class="modal-content">
                <h2>${isLogin ? "🔐 Вход в ANVIL" : "📝 Регистрация"}</h2>
                <input type="text" id="authUsername" placeholder="Имя пользователя" style="width:100%; margin-bottom:12px;">
                <input type="password" id="authPassword" placeholder="Пароль" style="width:100%; margin-bottom:20px;">
                <button id="authSubmitBtn" class="primary" style="width:100%; margin-bottom:10px;">${isLogin ? "Войти" : "Создать аккаунт"}</button>
                <button id="closeModalBtn" class="outline" style="width:100%;">Отмена</button>
            </div>
        `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    document.getElementById("closeModalBtn").onclick = close;
    document.getElementById("authSubmitBtn").onclick = () => {
        const username = document.getElementById("authUsername").value.trim();
        const password = document.getElementById("authPassword").value.trim();
        if (!username || !password) {
            alert("Заполните все поля!");
            return;
        }
        if (isLogin) {
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                currentUser = { id: user.id, username: user.username, role: user.role, fullName: user.fullName || user.username };
                close();
                renderApp();
            } else {
                alert("❌ Неверный логин или пароль");
            }
        } else {
            if (users.find(u => u.username === username)) {
                alert("❌ Пользователь уже существует");
                return;
            }
            const newUser = {
                id: Date.now(),
                username,
                password,
                role: "user",
                fullName: username
            };
            users.push(newUser);
            saveToLocalStorage();
            alert("✅ Регистрация успешна! Теперь войдите.");
            close();
            showAuthModal("login");
        }
    };
}

function openAdminDashboard() {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Доступ только для администратора Захара!");
        return;
    }
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
            <div class="modal-content" style="width: 450px; max-width:90%;">
                <h2>👑 Админ-панель | Захар</h2>
                <div style="margin: 1rem 0;">
                    <button id="adminResetEvents" class="primary" style="width:100%; margin-bottom:8px;">🔄 Сбросить расписание (дефолт)</button>
                    <button id="adminAddUser" class="outline" style="width:100%; margin-bottom:8px;">➕ Добавить пользователя</button>
                    <button id="adminChangePass" class="outline" style="width:100%; margin-bottom:8px;">🔑 Сменить пароль</button>
                    <button id="adminListUsers" class="outline" style="width:100%; margin-bottom:8px;">📋 Список пользователей</button>
                    <button id="adminClearData" class="danger" style="width:100%;">⚠️ Очистить все данные (сброс)</button>
                </div>
                <button id="closeAdminModal" class="outline" style="width:100%;">Закрыть</button>
            </div>
        `;
    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    document.getElementById("closeAdminModal").onclick = closeModal;

    document.getElementById("adminResetEvents").onclick = () => {
        if (confirm("Сбросить события до стандартного набора?")) {
            events = [
                { id: "ev1", title: "ANVIL Major 2026 — Финал", datetime: "2026-04-28T19:00", prediction: "🔥 ANVIL победит с коэффициентом 1.85", streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" },
                { id: "ev2", title: "Dragon Series: ANVIL vs Titans", datetime: "2026-04-23T17:30", prediction: "📊 Победа ANVIL — кф 1.72", streamUrl: "https://www.youtube.com/embed/3JZ_D3ELwOQ", platform: "youtube" },
                { id: "ev3", title: "Прямой эфир: Разбор с Захаром", datetime: "2026-04-24T20:00", prediction: "🎙 Эксклюзив", streamUrl: "https://player.twitch.tv/?channel=anvil_esports", platform: "twitch" }
            ];
            persistAndRender();
            alert("Расписание сброшено!");
            closeModal();
        }
    };
    document.getElementById("adminAddUser").onclick = () => {
        const newName = prompt("Логин нового пользователя:");
        if (newName && !users.find(u => u.username === newName)) {
            const newPass = prompt("Пароль:");
            if (newPass) {
                users.push({ id: Date.now(), username: newName, password: newPass, role: "user", fullName: newName });
                saveToLocalStorage();
                alert(`Пользователь ${newName} добавлен!`);
                closeModal();
            }
        } else alert("Имя занято или отмена");
    };
    document.getElementById("adminChangePass").onclick = () => {
        const uname = prompt("Имя пользователя для смены пароля:");
        const user = users.find(u => u.username === uname);
        if (user) {
            const newPwd = prompt("Новый пароль:");
            if (newPwd) {
                user.password = newPwd;
                saveToLocalStorage();
                alert("Пароль изменён!");
                closeModal();
            }
        } else alert("Не найден");
    };
    document.getElementById("adminListUsers").onclick = () => {
        alert("👥 Пользователи:\n" + users.map(u => `${u.username} (${u.role})`).join("\n"));
    };
    document.getElementById("adminClearData").onclick = () => {
        if (confirm("ПОЛНЫЙ СБРОС: удалить всех пользователей, кроме админа Захара?")) {
            users = [{ id: 1, username: "zakhar", password: "zakhar123", role: "admin", fullName: "Захар" }];
            events = [];
            saveToLocalStorage();
            currentUser = null;
            renderApp();
            closeModal();
            alert("Данные очищены. Остался только админ Захар.");
        }
    };
}

function editEventById(eventId) {
    if (!currentUser || currentUser.role !== "admin") return alert("Нет прав");
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const newTitle = prompt("Название события:", event.title);
    if (newTitle !== null) event.title = newTitle;
    const newDateTime = prompt("Дата и время (YYYY-MM-DDTHH:MM):", event.datetime);
    if (newDateTime !== null) event.datetime = newDateTime;
    const newPrediction = prompt("Прогноз:", event.prediction);
    if (newPrediction !== null) event.prediction = newPrediction;
    const newStream = prompt("Введите ссылку на трансляцию (YouTube или Twitch):\n\nYouTube: https://youtube.com/watch?v=... или https://youtu.be/...\nTwitch: https://twitch.tv/канал", event.streamUrl);
    if (newStream !== null) {
        event.streamUrl = newStream;
        if (newStream.includes("youtube") || newStream.includes("youtu.be")) {
            event.platform = "youtube";
        } else if (newStream.includes("twitch")) {
            event.platform = "twitch";
        } else {
            event.platform = "other";
        }
    }
    persistAndRender();
}

function deleteEventById(eventId) {
    if (!currentUser || currentUser.role !== "admin") return alert("Нет прав");
    if (confirm("Удалить событие?")) {
        events = events.filter(e => e.id !== eventId);
        persistAndRender();
    }
}

function renderApp() {
    const root = document.getElementById("appRoot");
    const navDiv = document.getElementById("navButtons");
    if (!root) return;

    if (!currentUser) {
        navDiv.innerHTML = `<button class="outline" id="loginBtn">🔑 Вход</button>
                                 <button id="registerBtn">📝 Регистрация</button>`;
        document.getElementById("loginBtn")?.addEventListener("click", () => showAuthModal("login"));
        document.getElementById("registerBtn")?.addEventListener("click", () => showAuthModal("register"));
    } else {
        const isAdmin = currentUser.role === "admin";
        const adminName = currentUser.username === "zakhar" ? "Захар" : currentUser.fullName;
        navDiv.innerHTML = `
                <div class="user-badge">
                    👋 ${escapeHtml(adminName)} ${isAdmin ? '<span class="admin-star">👑 Админ</span>' : '🎮 Геймер'}
                </div>
                ${isAdmin ? '<button id="adminDashboardBtn" class="primary">⚙️ Админ панель</button>' : ''}
                <button id="logoutBtn" class="danger">🚪 Выйти</button>
            `;
        document.getElementById("logoutBtn")?.addEventListener("click", () => { currentUser = null; renderApp(); });
        if (isAdmin) {
            document.getElementById("adminDashboardBtn")?.addEventListener("click", openAdminDashboard);
        }
    }

    let adminQuickForm = "";
    if (currentUser && currentUser.role === "admin") {
        adminQuickForm = `
                <div class="admin-panel">
                    <h3>🛠 Управление контентом (Захар)</h3>
                    <div class="form-row">
                        <input type="text" id="newTitle" placeholder="Название матча/эфира" style="flex:2">
                        <input type="datetime-local" id="newDateTime" style="flex:1">
                    </div>
                    <div class="form-row">
                        <input type="text" id="newPrediction" placeholder="Прогноз / аналитика">
                        <input type="text" id="newStreamUrl" placeholder="Ссылка YouTube/Twitch (необязательно)">
                    </div>
                    <div class="form-row">
                        <small style="color:#9ca3af;">💡 YouTube: https://youtube.com/watch?v=... | Twitch: https://twitch.tv/канал</small>
                    </div>
                    <button id="quickAddEventBtn" class="primary" style="margin-top:5px;">➕ Добавить событие</button>
                    <hr>
                    <h4>📋 Редактор событий</h4>
                    <div id="adminEventsList"></div>
                </div>
            `;
    }

    let welcomeMsg = "";
    if (currentUser && currentUser.username === "zakhar") {
        welcomeMsg = `<div class="welcome-section">
                <h2>👑 Привет, <span>Захар</span>!</h2>
                <p>Ты имеешь полный контроль над расписанием, эфирами и прогнозами. Добавляй события, меняй ссылки — всё под твоим началом.</p>
            </div>`;
    } else if (currentUser) {
        welcomeMsg = `<div class="welcome-section">
                <h2>Добро пожаловать, <span>${escapeHtml(currentUser.fullName || currentUser.username)}</span> 🔥</h2>
                <p>Следи за топ-матчами, прогнозами и прямыми эфирами от ANVIL.</p>
            </div>`;
    } else {
        welcomeMsg = `<div class="welcome-section">
                <h2>Добро пожаловать в <span>ANVIL</span> ⚔️</h2>
                <p>Войдите в аккаунт, чтобы получить доступ к прогнозам и эксклюзивным эфирам. Администратор: Захар</p>
            </div>`;
    }

    let eventsHtml = `<h2 style="margin-top: 0.5rem;">📺 Расписание эфиров и прогнозы</h2>
                          <div class="schedule-grid">`;
    if (events.length === 0) {
        eventsHtml += `<div style="grid-column:1/-1; text-align:center; padding:3rem;">⏳ Пока нет событий. Админ Захар может добавить расписание.</div>`;
    } else {
        events.forEach(ev => {
            const embedHtml = getEmbedHtml(ev.streamUrl, ev.platform);
            eventsHtml += `
                    <div class="event-card">
                        <h3>⚡ ${escapeHtml(ev.title)}</h3>
                        <div class="event-time">📅 ${formatDateTime(ev.datetime)}</div>
                        <div class="event-prediction">🎯 ${escapeHtml(ev.prediction)}</div>
                        ${embedHtml}
                        ${currentUser && currentUser.role === "admin" ? `
                            <div style="display:flex; gap:10px; margin-top:15px;">
                                <button class="editEventBtn outline" data-id="${ev.id}" style="flex:1;">✏️ Правка</button>
                                <button class="deleteEventBtn danger" data-id="${ev.id}" style="flex:1;">🗑️ Удалить</button>
                            </div>
                        ` : ''}
                    </div>
                `;
        });
    }
    eventsHtml += `</div>`;

    root.innerHTML = adminQuickForm + welcomeMsg + eventsHtml;

    if (currentUser && currentUser.role === "admin") {
        document.getElementById("quickAddEventBtn")?.addEventListener("click", () => {
            const title = document.getElementById("newTitle")?.value.trim();
            const datetime = document.getElementById("newDateTime")?.value;
            const prediction = document.getElementById("newPrediction")?.value.trim();
            let streamUrl = document.getElementById("newStreamUrl")?.value.trim();
            
            if (!title) { alert("Введите название события"); return; }
            
            let platform = "none";
            if (streamUrl) {
                if (streamUrl.includes("youtube") || streamUrl.includes("youtu.be")) {
                    platform = "youtube";
                } else if (streamUrl.includes("twitch")) {
                    platform = "twitch";
                } else {
                    platform = "other";
                }
            }
            
            const newEvent = {
                id: "ev_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
                title: title,
                datetime: datetime || new Date().toISOString().slice(0, 16),
                prediction: prediction || "Прогноз обновится позже",
                streamUrl: streamUrl || "",
                platform: platform
            };
            events.push(newEvent);
            persistAndRender();
        });

        const adminListDiv = document.getElementById("adminEventsList");
        if (adminListDiv) {
            adminListDiv.innerHTML = events.map(ev => `
                    <div class="event-item-admin">
                        <strong>📌 ${escapeHtml(ev.title)}</strong>
                        <div style="display:flex; gap:8px;">
                            <button class="editEventSmall" data-id="${ev.id}" style="padding:0.3rem 1rem;">✏️</button>
                            <button class="deleteEventSmall danger" data-id="${ev.id}" style="padding:0.3rem 1rem;">🗑️</button>
                        </div>
                    </div>
                `).join('');
            document.querySelectorAll(".editEventSmall, .editEventBtn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = btn.getAttribute("data-id");
                    if (id) editEventById(id);
                });
            });
            document.querySelectorAll(".deleteEventSmall, .deleteEventBtn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = btn.getAttribute("data-id");
                    if (id) deleteEventById(id);
                });
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", renderApp);