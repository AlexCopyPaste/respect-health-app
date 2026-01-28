const storageKeys = { bp: 'respect_bp', sugar: 'respect_sugar', weight: 'respect_weight', meds: 'respect_meds', cycle: 'respect_cycle', diet: 'respect_diet', walking: 'respect_walking' };
let charts = {}; let pendingDeleteAction = null; let settings = { largeFont: false, historyLimit: false, showExport: false };

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateAllDateFields();
    // מאזינים
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
    if (localStorage.getItem('theme') === 'dark') { document.body.setAttribute('data-theme', 'dark'); document.getElementById('themeSwitch').checked = true; }
}
function toggleSetting(key, value) {
    if (key === 'theme') { document.body.setAttribute('data-theme', value ? 'dark' : 'light'); localStorage.setItem('theme', value ? 'dark' : 'light'); return; }
    settings[key] = value; localStorage.setItem('respect_settings', JSON.stringify(settings));
    if (key === 'largeFont') document.body.classList.toggle('large-font', value);
    if (key === 'showExport') updateExportVisibility();
    if (key === 'historyLimit') refreshCurrentSection();
}
function updateExportVisibility() {
    const btn = document.getElementById('exportCsvBtn');
    if (settings.showExport && document.querySelector('.screen.active:not(#mainMenu)')) btn.classList.remove('hidden'); else btn.classList.add('hidden');
}

// === ולידציה עם 4 צבעים ===
window.validateField = function(input, type) {
    let val = parseFloat(input.value);
    input.className = ''; 
    if (isNaN(val)) return;
    let colorClass = 'bg-normal';

    if (type === 'pulse') {
        if (val < 50) colorClass = 'bg-low'; // נמוך
        else if (val > 120) colorClass = 'bg-high'; // גבוה
        else if (val > 100) colorClass = 'bg-borderline'; // גבולי
    } 
    else if (type === 'systolic') { 
        if (val < 90) colorClass = 'bg-low';
        else if (val > 140) colorClass = 'bg-high';
        else if (val >= 130) colorClass = 'bg-borderline';
    }
    else if (type === 'diastolic') { 
        if (val < 60) colorClass = 'bg-low';
        else if (val > 90) colorClass = 'bg-high';
        else if (val >= 85) colorClass = 'bg-borderline';
    }
    else if (type === 'sugar') {
        const mode = document.getElementById('sugarTime').value;
        const highLimit = (mode === 'fasting') ? 126 : 200;
        const borderLimit = (mode === 'fasting') ? 100 : 140;
        
        if (val < 70) colorClass = 'bg-low';
        else if (val >= highLimit) colorClass = 'bg-high';
        else if (val >= borderLimit) colorClass = 'bg-borderline';
    }
    input.classList.add(colorClass);
}
window.revalidateSugar = function() { validateField(document.getElementById('glucoseLevel'), 'sugar'); }

// === שמירה ===
const forms = ['bpForm', 'sugarForm', 'weightForm', 'medsForm', 'cycleForm', 'dietForm', 'walkingForm'];
forms.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('submit', (e) => { e.preventDefault(); saveData(id.replace('Form', '').replace('Section', '')); });
});
function saveData(type) {
    const inputs = document.getElementById(type + 'Form').querySelectorAll('input[required]');
    for (let input of inputs) { if (!input.value.trim()) { alert("יש למלא שדות חובה"); return; } }
    
    let data = {};
    // איסוף נתונים (אותו קוד, מקוצר)
    if (type === 'bp') data = { date: document.getElementById('bpDate').value, sys: document.getElementById('systolic').value, dia: document.getElementById('diastolic').value, pulse: document.getElementById('pulse').value };
    else if (type === 'sugar') data = { date: document.getElementById('sugarDate').value, val: document.getElementById('glucoseLevel').value, time: document.getElementById('sugarTime').value };
    else if (type === 'weight') data = { date: document.getElementById('weightDate').value, val: document.getElementById('weightVal').value };
    else if (type === 'meds') { const times = []; document.querySelectorAll('.med-time:checked').forEach(cb => times.push(cb.value)); data = { name: document.getElementById('medName').value, times: times.join(', ') }; }
    else if (type === 'cycle') data = { start: document.getElementById('cycleStart').value, notes: document.getElementById('cycleNotes').value };
    else if (type === 'diet') { const b = parseInt(document.getElementById('calBreakfast').value)||0, l = parseInt(document.getElementById('calLunch').value)||0, d = parseInt(document.getElementById('calDinner').value)||0; data = { date: document.getElementById('dietDate').value, target: document.getElementById('calorieTarget').value, total: b+l+d }; }
    else if (type === 'walking') { data = { date: document.getElementById('walkingDate').value, start: document.getElementById('walkStart').value, end: document.getElementById('walkEnd').value, diff: document.getElementById('walkDifficulty').value, speed: document.getElementById('walkSpeed').value }; }

    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    list.unshift(data); localStorage.setItem(key, JSON.stringify(list));
    document.getElementById(type + 'Form').reset(); updateAllDateFields(); document.querySelectorAll('input').forEach(i => i.className = ''); loadDataForSection(type);
}

// === תצוגה ===
let currentSection = null;
window.showSection = function(id) {
    document.getElementById('mainMenu').classList.remove('active'); setTimeout(() => document.getElementById('mainMenu').classList.add('hidden'), 200);
    const target = document.getElementById(id); target.classList.remove('hidden'); target.classList.add('active');
    currentSection = target.getAttribute('data-category'); if(currentSection) loadDataForSection(currentSection); updateExportVisibility();
}
window.showHome = function() { document.querySelectorAll('.screen').forEach(el => { el.classList.remove('active'); el.classList.add('hidden'); }); document.getElementById('mainMenu').classList.remove('hidden'); document.getElementById('mainMenu').classList.add('active'); document.getElementById('exportCsvBtn').classList.add('hidden'); }
function refreshCurrentSection() { if (currentSection) loadDataForSection(currentSection); }

function loadDataForSection(type) {
    const key = storageKeys[type]; let list = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById(`${type}List`); container.innerHTML = '';
    if (settings.historyLimit) { const m = new Date(); m.setMonth(m.getMonth() - 1); list = list.filter(i => new Date(i.date || i.start) >= m); }

    list.forEach((item, index) => {
        const div = document.createElement('div'); div.className = 'history-item';
        let dateStr = ''; if(item.date) { const d=new Date(item.date); dateStr=`${d.getDate()}/${d.getMonth()+1}`; } else if(item.start){ const d=new Date(item.start); dateStr=`${d.getDate()}/${d.getMonth()+1}`; }
        
        let html = `<span class="history-date-small">${dateStr}</span><div class="history-data-row">`;
        if (type === 'bp') html += `<span>❤️${item.pulse}</span><span>⬆️${item.sys}</span><span>⬇️${item.dia}</span>`;
        else if (type === 'sugar') html += `<span>🩸${item.val}</span>`;
        else if (type === 'weight') html += `<span>⚖️${item.val}</span>`;
        else if (type === 'diet') html += `<span>🔥${item.total}</span>`;
        else if (type === 'walking') html += `<span>🚶${item.start}-${item.end}</span>`;
        else if (type === 'meds') html += `<span>💊${item.name}</span>`;
        else if (type === 'cycle') html += `<span>🥀${item.notes}</span>`;
        html += `</div><button class="delete-icon" onclick="reqDelete('${type}', ${index})">×</button>`;
        div.innerHTML = html; container.appendChild(div);
    });
    updateChart(type, list);
}

function updateChart(type, rawData) {
    const canvas = document.getElementById(`${type}Chart`); if (!canvas) return; if (charts[type]) charts[type].destroy();
    const data = [...rawData].reverse(); const labels = data.map(i => { const d = new Date(i.date); return `${d.getDate()}/${d.getMonth()+1}`; });
    let datasets = [];
    if (type === 'bp') datasets = [{ label: 'גבוה', data: data.map(i => i.sys), borderColor: 'red' }, { label: 'נמוך', data: data.map(i => i.dia), borderColor: 'orange' }];
    else if (type === 'weight') datasets = [{ label: 'משקל', data: data.map(i => i.val), borderColor: 'purple', fill: true }];
    else if (type === 'sugar') datasets = [{ label: 'סוכר', data: data.map(i => i.val), borderColor: 'blue' }];
    charts[type] = new Chart(canvas, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
}

window.reqDelete = function(type, index) { document.getElementById('customConfirm').classList.remove('hidden'); pendingDeleteAction = () => { const k=storageKeys[type]; let l=JSON.parse(localStorage.getItem(k))||[]; l.splice(index, 1); localStorage.setItem(k, JSON.stringify(l)); loadDataForSection(type); }; }
window.closeConfirm = function(c) { document.getElementById('customConfirm').classList.add('hidden'); if(c && pendingDeleteAction) pendingDeleteAction(); pendingDeleteAction = null; }
window.resetData = function() { if(confirm('למחוק הכל?')) { localStorage.clear(); location.reload(); } }
window.exportCurrentData = function() { if (!currentSection) return; const k=storageKeys[currentSection]; const l=JSON.parse(localStorage.getItem(k))||[]; let c='\uFEFFתאריך,נתונים\n'; l.forEach(i=>{c+=`${i.date||i.start},${JSON.stringify(i).replace(/,/g,' ')}\n`}); const a=document.createElement("a"); a.href='data:text/csv;charset=utf-8,'+encodeURI(c); a.download=`respect_${currentSection}.csv`; a.click(); }
function updateAllDateFields() { const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); const s = now.toISOString().slice(0, 16); document.querySelectorAll('input[type="datetime-local"]').forEach(i => i.value = s); const d = document.getElementById('cycleStart'); if(d) d.value = now.toISOString().slice(0, 10); }