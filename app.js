const storageKeys = {
    bp: 'respect_bp',
    sugar: 'respect_sugar',
    weight: 'respect_weight',
    meds: 'respect_meds',
    cycle: 'respect_cycle',
    diet: 'respect_diet',
    walking: 'respect_walking'
};

let charts = {};
let pendingDeleteAction = null;
let settings = { largeFont: false, historyLimit: false, showExport: false };

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateAllDateFields();
    
    // ניהול הגדרות
    document.getElementById('largeFontToggle').addEventListener('change', (e) => toggleSetting('largeFont', e.target.checked));
    document.getElementById('themeSwitch').addEventListener('change', (e) => toggleSetting('theme', e.target.checked));
    document.getElementById('historyLimitToggle').addEventListener('change', (e) => toggleSetting('historyLimit', e.target.checked));
    document.getElementById('exportToggle').addEventListener('change', (e) => toggleSetting('showExport', e.target.checked));
});

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('respect_settings')) || {};
    settings = { ...settings, ...saved };
    
    document.getElementById('largeFontToggle').checked = settings.largeFont;
    document.body.classList.toggle('large-font', settings.largeFont);
    document.getElementById('historyLimitToggle').checked = settings.historyLimit;
    document.getElementById('exportToggle').checked = settings.showExport;
    
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeSwitch').checked = true;
    }
}

function toggleSetting(key, value) {
    if (key === 'theme') {
        document.body.setAttribute('data-theme', value ? 'dark' : 'light');
        localStorage.setItem('theme', value ? 'dark' : 'light');
        return;
    }
    settings[key] = value;
    localStorage.setItem('respect_settings', JSON.stringify(settings));
    if (key === 'largeFont') document.body.classList.toggle('large-font', value);
    if (key === 'showExport') updateExportVisibility();
    if (key === 'historyLimit') refreshCurrentSection();
}

function updateExportVisibility() {
    const btn = document.getElementById('exportCsvBtn');
    if (settings.showExport && document.querySelector('.screen.active:not(#mainMenu)')) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

// =======================
// שמירת נתונים עם ולידציה
// =======================
const forms = ['bpForm', 'sugarForm', 'weightForm', 'medsForm', 'cycleForm', 'dietForm', 'walkingForm'];
forms.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('submit', (e) => {
        e.preventDefault();
        saveData(id.replace('Form', '').replace('Section', '')); 
    });
});

function saveData(type) {
    // בדיקת שדות ריקים (ולידציה נוספת)
    const inputs = document.getElementById(type + 'Form').querySelectorAll('input[required]');
    for (let input of inputs) {
        if (!input.value.trim()) {
            alert("נא למלא את כל השדות המסומנים");
            return;
        }
    }

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
        data = { date: document.getElementById('weightDate').value, val: document.getElementById('weightVal').value };
    } else if (type === 'diet') {
        const b = parseInt(document.getElementById('calBreakfast').value) || 0;
        const l = parseInt(document.getElementById('calLunch').value) || 0;
        const d = parseInt(document.getElementById('calDinner').value) || 0;
        data = { date: document.getElementById('dietDate').value, target: document.getElementById('calorieTarget').value, total: b + l + d };
    } else if (type === 'walking') {
        data = {
            date: document.getElementById('walkingDate').value,
            start: document.getElementById('walkStart').value,
            end: document.getElementById('walkEnd').value,
            diff: document.getElementById('walkDifficulty').value,
            speed: document.getElementById('walkSpeed').value
        };
    } else if (type === 'meds') {
        const times = [];
        document.querySelectorAll('.med-time:checked').forEach(cb => times.push(cb.value));
        data = { name: document.getElementById('medName').value, times: times.join(', ') };
    } else if (type === 'cycle') {
        data = { start: document.getElementById('cycleStart').value, notes: document.getElementById('cycleNotes').value };
    }

    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    list.unshift(data);
    localStorage.setItem(key, JSON.stringify(list));

    document.getElementById(type + 'Form').reset();
    updateAllDateFields();
    document.querySelectorAll('input').forEach(i => i.className = '');
    loadDataForSection(type);
}

// =======================
// טעינת היסטוריה - שורה אחת
// =======================
let currentSection = null;

window.showSection = function(sectionId) {
    document.getElementById('mainMenu').classList.remove('active');
    setTimeout(() => document.getElementById('mainMenu').classList.add('hidden'), 200);

    const target = document.getElementById(sectionId);
    target.classList.remove('hidden');
    target.classList.add('active');
    
    currentSection = target.getAttribute('data-category');
    if(currentSection) loadDataForSection(currentSection);
    updateExportVisibility();
}

window.showHome = function() {
    document.querySelectorAll('.screen').forEach(el => { el.classList.remove('active'); el.classList.add('hidden'); });
    const menu = document.getElementById('mainMenu');
    menu.classList.remove('hidden');
    menu.classList.add('active');
    document.getElementById('exportCsvBtn').classList.add('hidden');
}

function refreshCurrentSection() { if (currentSection) loadDataForSection(currentSection); }

function loadDataForSection(type) {
    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById(`${type}List`);
    container.innerHTML = '';

    if (settings.historyLimit) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        list = list.filter(item => {
            const itemDate = new Date(item.date || item.start);
            return itemDate >= oneMonthAgo;
        });
    }

    list.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        // עיצוב תאריך מקוצר
        let dateStr = '';
        if (item.date) {
            const d = new Date(item.date);
            dateStr = `${d.getDate()}/${d.getMonth()+1}`;
        } else if (item.start) {
            const d = new Date(item.start);
            dateStr = `${d.getDate()}/${d.getMonth()+1}`;
        }

        // בניית שורה אחת עם אייקונים
        let html = `<span class="history-date-small">${dateStr}</span>`;
        html += `<div class="history-data-row">`;
        
        if (type === 'bp') {
            html += `<span>❤️${item.pulse}</span><span>⬆️${item.sys}</span><span>⬇️${item.dia}</span>`;
        } else if (type === 'sugar') {
            const icon = item.time === 'fasting' ? '🌙' : '🥪';
            html += `<span>${icon} ${item.val}</span>`;
        } else if (type === 'weight') {
            html += `<span>⚖️ ${item.val}kg</span>`;
        } else if (type === 'diet') {
            html += `<span>🔥 ${item.total}</span><span>🎯 ${item.target}</span>`;
        } else if (type === 'walking') {
            html += `<span>⏱️${item.start}-${item.end}</span><span>👣${item.diff}</span>`;
        } else if (type === 'meds') {
            html += `<span>💊 ${item.name}</span><span>${item.times}</span>`;
        } else if (type === 'cycle') {
            html += `<span>🥀 התחלה</span><span>📝${item.notes}</span>`;
        }
        
        html += `</div>`;
        html += `<button class="delete-icon" onclick="reqDelete('${type}', ${index})">×</button>`;
        
        div.innerHTML = html;
        container.appendChild(div);
    });

    updateChart(type, list);
}

// =======================
// גרפים, מחיקה וולידציה ויזואלית
// =======================
function updateChart(type, rawData) {
    const canvas = document.getElementById(`${type}Chart`);
    if (!canvas) return;
    if (charts[type]) charts[type].destroy();
    
    const data = [...rawData].reverse();
    const labels = data.map(i => { const d = new Date(i.date); return `${d.getDate()}/${d.getMonth()+1}`; });

    let datasets = [];
    if (type === 'bp') datasets = [{ label: 'גבוה', data: data.map(i => i.sys), borderColor: 'red' }, { label: 'נמוך', data: data.map(i => i.dia), borderColor: 'orange' }];
    else if (type === 'weight') datasets = [{ label: 'משקל', data: data.map(i => i.val), borderColor: 'purple', fill: true }];
    else if (type === 'sugar') datasets = [{ label: 'סוכר', data: data.map(i => i.val), borderColor: 'blue' }];

    charts[type] = new Chart(canvas, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
}

window.validateField = function(input, type) {
    let val = parseFloat(input.value);
    input.className = ''; 
    if (isNaN(val)) return;

    let colorClass = 'bg-normal';
    if (type === 'pulse') { if (val < 50 || val > 120) colorClass = 'bg-danger-high'; else if (val > 100) colorClass = 'bg-borderline'; } 
    else if (type === 'systolic') { if (val < 90 || val > 140) colorClass = 'bg-danger-high'; else if (val >= 130) colorClass = 'bg-borderline'; }
    else if (type === 'diastolic') { if (val < 60 || val > 90) colorClass = 'bg-danger-high'; else if (val >= 85) colorClass = 'bg-borderline'; }
    else if (type === 'weight') { if (val < 45 || val > 120) colorClass = 'bg-danger-high'; else if (val > 100) colorClass = 'bg-borderline'; }
    else if (type === 'sugar') { 
        const mode = document.getElementById('sugarTime').value;
        const limit = (mode === 'fasting') ? 126 : 200;
        if (val < 70 || val >= limit) colorClass = 'bg-danger-high'; else if (val >= 100) colorClass = 'bg-borderline';
    }
    input.classList.add(colorClass);
}

window.revalidateSugar = function() { validateField(document.getElementById('glucoseLevel'), 'sugar'); }

window.reqDelete = function(type, index) {
    document.getElementById('customConfirm').classList.remove('hidden');
    pendingDeleteAction = () => {
        const key = storageKeys[type];
        let list = JSON.parse(localStorage.getItem(key)) || [];
        list.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(list));
        loadDataForSection(type);
    };
}

window.closeConfirm = function(confirm) {
    document.getElementById('customConfirm').classList.add('hidden');
    if (confirm && pendingDeleteAction) pendingDeleteAction();
    pendingDeleteAction = null;
}

window.resetData = function() { if(confirm('למחוק הכל?')) { localStorage.clear(); location.reload(); } }

window.exportCurrentData = function() {
    if (!currentSection) return;
    const key = storageKeys[currentSection];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    let csv = '\uFEFFתאריך,נתונים\n';
    list.forEach(i => { csv += `${i.date || i.start},${JSON.stringify(i).replace(/,/g, ' ')}\n`; });
    const link = document.createElement("a");
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = `respect_${currentSection}.csv`;
    link.click();
}

function updateAllDateFields() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const str = now.toISOString().slice(0, 16);
    document.querySelectorAll('input[type="datetime-local"]').forEach(i => i.value = str);
    const dateInput = document.getElementById('cycleStart');
    if(dateInput) dateInput.value = now.toISOString().slice(0, 10);
}