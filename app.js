// ==========================================
// ניהול משתנים ונתונים
// ==========================================
const storageKeys = {
    bp: 'respect_bp',
    sugar: 'respect_sugar',
    weight: 'respect_weight',
    meds: 'respect_meds',
    cycle: 'respect_cycle'
};

// אובייקט לשמירת הגרפים (כדי שנוכל לרענן אותם)
let charts = {};

// משתנה לשמירת הפעולה של המחיקה
let pendingDeleteAction = null;

document.addEventListener('DOMContentLoaded', () => {
    // אתחול PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // קביעת תאריך ושעה נוכחיים לכל השדות
    updateAllDateFields();
    setupTheme();
});

// פונקציה לעדכון שדות תאריך
function updateAllDateFields() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateStr = now.toISOString().slice(0, 16);
    
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
        input.value = dateStr;
    });
    
    // תאריך בלבד למחזור
    const dateOnly = now.toISOString().slice(0, 10);
    const cycleInput = document.getElementById('cycleStart');
    if(cycleInput) cycleInput.value = dateOnly;
}

// ==========================================
// בדיקת תקינות קלט (רק מספרים)
// ==========================================
window.validateNumber = function(input) {
    // מוחק כל מה שאינו ספרות או נקודה
    input.value = input.value.replace(/[^0-9.]/g, '');
}

// ==========================================
// ניווט
// ==========================================
let currentCategory = null;

window.showSection = function(sectionId) {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('mainMenu').classList.add('hidden');

    const target = document.getElementById(sectionId);
    target.classList.remove('hidden');
    target.classList.add('active');

    currentCategory = target.getAttribute('data-category');
    loadDataForSection(currentCategory);
}

window.showHome = function() {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    
    const menu = document.getElementById('mainMenu');
    menu.classList.remove('hidden');
    menu.classList.add('active');
    
    currentCategory = null;
    document.getElementById('exportCsvBtn').classList.add('hidden');
    updateAllDateFields(); // איפוס תאריכים בחזרה
}

// ==========================================
// מנגנון מחיקה ידידותי (Modal)
// ==========================================
function confirmDelete(callback) {
    pendingDeleteAction = callback;
    document.getElementById('customConfirm').classList.remove('hidden');
}

window.closeConfirm = function(isConfirmed) {
    document.getElementById('customConfirm').classList.add('hidden');
    if (isConfirmed && pendingDeleteAction) {
        pendingDeleteAction();
    }
    pendingDeleteAction = null;
}

// ==========================================
// שמירת נתונים
// ==========================================
// מאזינים לטפסים בצורה גנרית
const forms = {
    'bpForm': 'bp',
    'sugarForm': 'sugar',
    'weightForm': 'weight',
    'medsForm': 'meds',
    'cycleForm': 'cycle'
};

Object.keys(forms).forEach(formId => {
    document.getElementById(formId).addEventListener('submit', (e) => {
        e.preventDefault();
        const type = forms[formId];
        saveData(type);
    });
});

function saveData(type) {
    let data = {};
    
    if (type === 'bp') {
        data = {
            date: document.getElementById('bpDate').value,
            sys: document.getElementById('systolic').value,
            dia: document.getElementById('diastolic').value,
            pulse: document.getElementById('pulse').value
        };
    } else if (type === 'sugar') {
        data = {
            date: document.getElementById('sugarDate').value,
            val: document.getElementById('glucoseLevel').value,
            time: document.getElementById('sugarTime').value
        };
    } else if (type === 'weight') {
        data = {
            date: document.getElementById('weightDate').value,
            val: document.getElementById('weightVal').value
        };
    } else if (type === 'meds') {
        // איסוף צ'ק בוקסים
        const times = [];
        document.querySelectorAll('.med-time:checked').forEach(cb => times.push(cb.value));
        data = {
            name: document.getElementById('medName').value,
            times: times.join(', ')
        };
    } else if (type === 'cycle') {
        data = {
            start: document.getElementById('cycleStart').value,
            notes: document.getElementById('cycleNotes').value
        };
    }

    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    list.unshift(data); // הוספה להתחלה
    localStorage.setItem(key, JSON.stringify(list));
    
    // ניקוי שדות (חוץ מתאריך)
    document.getElementById(type + 'Form').reset();
    updateAllDateFields();
    
    loadDataForSection(type);
}

// ==========================================
// טעינת נתונים + גרפים + היסטוריה
// ==========================================
function loadDataForSection(type) {
    if (!type) return;
    
    const key = storageKeys[type];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById(`${type}List`);
    const exportBtn = document.getElementById('exportCsvBtn');
    
    // הצגת כפתור ייצוא
    if (list.length > 0) exportBtn.classList.remove('hidden');
    else exportBtn.classList.add('hidden');

    // בניית הרשימה
    container.innerHTML = '';
    
    list.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const dateDisplay = item.date ? item.date.slice(11, 16) + ' ' + item.date.slice(8,10)+'/'+item.date.slice(5,7) : '';

        let html = `<div class="history-date">${dateDisplay}</div>`;
        html += `<div class="history-data">`;
        
        // עיצוב שונה לכל סוג - שימוש באייקונים
        if (type === 'bp') {
            html += `<span>❤️ ${item.pulse}</span>`;
            html += `<span>⬆️ ${item.sys}</span>`;
            html += `<span>⬇️ ${item.dia}</span>`;
        } else if (type === 'sugar') {
            html += `<span>🩸 ${item.val}</span> <small>(${item.time})</small>`;
        } else if (type === 'weight') {
            html += `<span>⚖️ ${item.val} kg</span>`;
        } else if (type === 'meds') {
            html += `<span>${item.name} (${item.times})</span>`;
        } else if (type === 'cycle') {
            html += `<span>🌸 התחלה: ${item.start}</span>`;
        }
        html += `</div>`;

        // כפתור מחיקה שפותח את המודל החדש
        html += `<button class="delete-icon" onclick="reqDelete('${type}', ${index})">🗑️</button>`;
        
        div.innerHTML = html;
        container.appendChild(div);
    });

    // ציור הגרף (רק אם יש קנבס מתאים ויש נתונים)
    updateChart(type, list);
}

// בקשת מחיקה
window.reqDelete = function(type, index) {
    confirmDelete(() => {
        const key = storageKeys[type];
        let list = JSON.parse(localStorage.getItem(key)) || [];
        list.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(list));
        loadDataForSection(type);
    });
}

// ==========================================
// ניהול גרפים (Chart.js)
// ==========================================
function updateChart(type, rawData) {
    const canvas = document.getElementById(`${type}Chart`);
    if (!canvas) return; // לא לכל דף יש גרף

    // הריסת גרף קודם אם קיים
    if (charts[type]) {
        charts[type].destroy();
    }

    if (rawData.length === 0) return;

    // הכנת נתונים לגרף (הופכים סדר כדי שיוצג כרונולוגית משמאל לימין)
    const data = [...rawData].reverse(); 
    const labels = data.map(i => i.date.slice(5, 10)); // רק תאריך (חודש-יום)

    let datasets = [];

    if (type === 'bp') {
        datasets = [
            { label: 'סיסטולי', data: data.map(i => i.sys), borderColor: '#ff3b30', tension: 0.4 },
            { label: 'דיאסטולי', data: data.map(i => i.dia), borderColor: '#ff9500', tension: 0.4 }
        ];
    } else if (type === 'weight') {
        datasets = [
            { label: 'משקל', data: data.map(i => i.val), borderColor: '#af52de', tension: 0.4, fill: true, backgroundColor: 'rgba(175, 82, 222, 0.1)' }
        ];
    } else if (type === 'sugar') {
        datasets = [
            { label: 'סוכר', data: data.map(i => i.val), borderColor: '#007aff', tension: 0.4 }
        ];
    }

    charts[type] = new Chart(canvas, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

// ==========================================
// ייצוא CSV
// ==========================================
window.exportCurrentData = function() {
    if (!currentCategory) return;
    const key = storageKeys[currentCategory];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    
    let csvContent = '\uFEFF';
    // כותרות בהתאם לסוג... (אותו קוד כמו קודם)
    if (currentCategory === 'bp') csvContent += "תאריך,סיסטולי,דיאסטולי,דופק\n";
    // ... להשלים לפי הצורך או להשאיר פשוט
    
    list.forEach(item => {
        csvContent += `${Object.values(item).join(',')}\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    link.download = `respect_${currentCategory}.csv`;
    link.click();
}

// הגדרות וערכות נושא
function setupTheme() {
    const toggle = document.getElementById('themeSwitch');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggle.checked = true;
    }
    toggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

window.resetData = function() {
    confirmDelete(() => {
        localStorage.clear();
        location.reload();
    });
}