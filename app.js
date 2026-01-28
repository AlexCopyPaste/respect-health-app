// ====================
// משתנים גלובליים
// ====================
let charts = {};
let pendingDelete = null;
let currentSection = null;
let settings = { largeFont: false, historyLimit: false, showExport: false };
let chartInstances = {}; 

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    updateDates();

    // חיבור טפסים
    document.getElementById('bpForm').addEventListener('submit', function(e) { e.preventDefault(); saveBP(); });
    document.getElementById('sugarForm').addEventListener('submit', function(e) { e.preventDefault(); saveSugar(); });
    document.getElementById('weightForm').addEventListener('submit', function(e) { e.preventDefault(); saveWeight(); });
    document.getElementById('dietForm').addEventListener('submit', function(e) { e.preventDefault(); saveDiet(); });
    document.getElementById('walkingForm').addEventListener('submit', function(e) { e.preventDefault(); saveWalking(); });
    document.getElementById('medsForm').addEventListener('submit', function(e) { e.preventDefault(); saveMeds(); });
    document.getElementById('cycleForm').addEventListener('submit', function(e) { e.preventDefault(); saveCycle(); });

    // הגדרות
    document.getElementById('largeFontToggle').addEventListener('change', (e) => toggleSetting('largeFont', e.target.checked));
    document.getElementById('themeSwitch').addEventListener('change', (e) => toggleSetting('theme', e.target.checked));
    document.getElementById('historyLimitToggle').addEventListener('change', (e) => toggleSetting('historyLimit', e.target.checked));
    document.getElementById('exportToggle').addEventListener('change', (e) => toggleSetting('showExport', e.target.checked));
});

// ====================
// שמירה (עם תמיכה בעריכה)
// ====================

function saveBP() {
    if(!checkRequired('bpForm')) return;
    const data = {
        date: document.getElementById('bpDate').value,
        sys: document.getElementById('systolic').value,
        dia: document.getElementById('diastolic').value,
        pulse: document.getElementById('pulse').value
    };
    handleSave('bp', data, 'bpEditIndex');
    document.getElementById('bpForm').reset();
    afterSave('bp');
}

function saveSugar() {
    if(!checkRequired('sugarForm')) return;
    const data = {
        date: document.getElementById('sugarDate').value,
        val: document.getElementById('glucoseLevel').value,
        time: document.getElementById('sugarTime').value
    };
    handleSave('sugar', data, 'sugarEditIndex');
    document.getElementById('sugarForm').reset();
    afterSave('sugar');
}

function saveWeight() {
    if(!checkRequired('weightForm')) return;
    const data = {
        date: document.getElementById('weightDate').value,
        val: document.getElementById('weightVal').value
    };
    handleSave('weight', data, 'weightEditIndex');
    document.getElementById('weightForm').reset();
    afterSave('weight');
}

function saveDiet() {
    const data = {
        date: document.getElementById('dietDate').value,
        target: document.getElementById('calorieTarget').value,
        total: (parseInt(document.getElementById('calBreakfast').value)||0) + 
               (parseInt(document.getElementById('calLunch').value)||0) + 
               (parseInt(document.getElementById('calDinner').value)||0),
        b: document.getElementById('calBreakfast').value,
        l: document.getElementById('calLunch').value,
        d: document.getElementById('calDinner').value
    };
    handleSave('diet', data, 'dietEditIndex');
    document.getElementById('dietForm').reset();
    afterSave('diet');
}

function saveWalking() {
    if(!checkRequired('walkingForm')) return;
    const data = {
        date: document.getElementById('walkingDate').value,
        start: document.getElementById('walkStart').value,
        end: document.getElementById('walkEnd').value,
        diff: document.getElementById('walkDifficulty').value,
        speed: document.getElementById('walkSpeed').value
    };
    handleSave('walking', data, 'walkingEditIndex');
    document.getElementById('walkingForm').reset();
    afterSave('walking');
}

function saveMeds() {
    if(!checkRequired('medsForm')) return;
    const times = [];
    document.querySelectorAll('.med-time:checked').forEach(cb => times.push(cb.value));
    const data = { name: document.getElementById('medName').value, times: times.join(', ') };
    handleSave('meds', data, 'medsEditIndex');
    document.getElementById('medsForm').reset();
    afterSave('meds');
}

function saveCycle() {
    if(!checkRequired('cycleForm')) return;
    const data = { start: document.getElementById('cycleStart').value, notes: document.getElementById('cycleNotes').value };
    handleSave('cycle', data, 'cycleEditIndex');
    document.getElementById('cycleForm').reset();
    afterSave('cycle');
}

function handleSave(type, dataObj, editIndexId) {
    const key = 'respect_' + type;
    let list = JSON.parse(localStorage.getItem(key)) || [];
    const editIdx = document.getElementById(editIndexId).value;

    if (editIdx !== "") {
        list[editIdx] = dataObj;
        document.getElementById(editIndexId).value = "";
        const btn = document.getElementById(type + 'SubmitBtn');
        if(btn) btn.textContent = "שמור";
    } else {
        list.unshift(dataObj);
    }
    localStorage.setItem(key, JSON.stringify(list));
}

function afterSave(type) {
    updateDates();
    document.querySelectorAll('input').forEach(i => i.className = '');
    loadData(type);
}

function checkRequired(formId) {
    const inputs = document.getElementById(formId).querySelectorAll('input[required]');
    for(let i of inputs) {
        if(!i.value) { alert("נא למלא שדות חובה"); return false; }
    }
    return true;
}

// ====================
// עריכה
// ====================
window.editItem = function(type, index) {
    const key = 'respect_' + type;
    let list = JSON.parse(localStorage.getItem(key)) || [];
    const item = list[index];
    if(!item) return;

    document.querySelector('.content-scroll').scrollTop = 0;

    if(type === 'bp') {
        document.getElementById('bpDate').value = item.date;
        document.getElementById('systolic').value = item.sys;
        document.getElementById('diastolic').value = item.dia;
        document.getElementById('pulse').value = item.pulse;
        document.getElementById('bpEditIndex').value = index;
        document.getElementById('bpSubmitBtn').textContent = "עדכן";
        validateBP();
    }
    else if(type === 'sugar') {
        document.getElementById('sugarDate').value = item.date;
        document.getElementById('glucoseLevel').value = item.val;
        document.getElementById('sugarTime').value = item.time;
        document.getElementById('sugarEditIndex').value = index;
        document.getElementById('sugarSubmitBtn').textContent = "עדכן";
        validateSugar();
    }
    else if(type === 'weight') {
        document.getElementById('weightDate').value = item.date;
        document.getElementById('weightVal').value = item.val;
        document.getElementById('weightEditIndex').value = index;
        document.getElementById('weightSubmitBtn').textContent = "עדכן";
        validateWeight();
    }
    else if(type === 'diet') {
        document.getElementById('dietDate').value = item.date;
        document.getElementById('calorieTarget').value = item.target;
        document.getElementById('calBreakfast').value = item.b || "";
        document.getElementById('calLunch').value = item.l || "";
        document.getElementById('calDinner').value = item.d || "";
        document.getElementById('dietEditIndex').value = index;
        document.getElementById('dietSubmitBtn').textContent = "עדכן";
    }
    else if(type === 'walking') {
        document.getElementById('walkingDate').value = item.date;
        document.getElementById('walkStart').value = item.start;
        document.getElementById('walkEnd').value = item.end;
        document.getElementById('walkDifficulty').value = item.diff;
        document.getElementById('walkSpeed').value = item.speed;
        document.getElementById('walkingEditIndex').value = index;
        document.getElementById('walkingSubmitBtn').textContent = "עדכן";
    }
    else if(type === 'meds') {
        document.getElementById('medName').value = item.name;
        document.querySelectorAll('.med-time').forEach(cb => cb.checked = false);
        if(item.times) {
            item.times.split(', ').forEach(t => {
                const cb = document.querySelector(`.med-time[value="${t}"]`);
                if(cb) cb.checked = true;
            });
        }
        document.getElementById('medsEditIndex').value = index;
        document.getElementById('medsSubmitBtn').textContent = "עדכן";
    }
    else if(type === 'cycle') {
        document.getElementById('cycleStart').value = item.start;
        document.getElementById('cycleNotes').value = item.notes;
        document.getElementById('cycleEditIndex').value = index;
        document.getElementById('cycleSubmitBtn').textContent = "עדכן";
    }
}

// ====================
// ולידציה וצבעים
// ====================
function setClass(el, cls) { el.className = cls; }

window.validateBP = function() {
    const sys = parseFloat(document.getElementById('systolic').value);
    const dia = parseFloat(document.getElementById('diastolic').value);
    const pul = parseFloat(document.getElementById('pulse').value);
    const sysEl = document.getElementById('systolic');
    if(sys < 90) setClass(sysEl, 'bg-low'); else if(sys > 140) setClass(sysEl, 'bg-high'); else if(sys >= 130) setClass(sysEl, 'bg-borderline'); else setClass(sysEl, 'bg-normal');
    const diaEl = document.getElementById('diastolic');
    if(dia < 60) setClass(diaEl, 'bg-low'); else if(dia > 90) setClass(diaEl, 'bg-high'); else if(dia >= 85) setClass(diaEl, 'bg-borderline'); else setClass(diaEl, 'bg-normal');
    const pulEl = document.getElementById('pulse');
    if(pul < 50) setClass(pulEl, 'bg-low'); else if(pul > 100) setClass(pulEl, 'bg-high'); else setClass(pulEl, 'bg-normal');
}

window.validateSugar = function() {
    const val = parseFloat(document.getElementById('glucoseLevel').value);
    const mode = document.getElementById('sugarTime').value;
    const el = document.getElementById('glucoseLevel');
    const highLimit = (mode === 'fasting') ? 126 : 200;
    const borderLimit = (mode === 'fasting') ? 100 : 140;
    if(val < 70) setClass(el, 'bg-low'); else if(val >= highLimit) setClass(el, 'bg-high'); else if(val >= borderLimit) setClass(el, 'bg-borderline'); else setClass(el, 'bg-normal');
}

window.validateWeight = function() {
    const val = parseFloat(document.getElementById('weightVal').value);
    const el = document.getElementById('weightVal');
    if(val < 45) setClass(el, 'bg-low'); else if(val > 120) setClass(el, 'bg-high'); else if(val > 100) setClass(el, 'bg-borderline'); else setClass(el, 'bg-normal');
}

// ====================
// תצוגה
// ====================
window.openSection = function(name) {
    document.getElementById('mainMenu').classList.remove('active');
    setTimeout(() => document.getElementById('mainMenu').classList.add('hidden'), 200);
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(name + 'Section');
    target.classList.remove('hidden');
    target.classList.add('active');
    currentSection = name;
    loadData(name);
    updateExportBtn();
}

window.showHome = function() {
    document.querySelectorAll('.screen').forEach(el => { el.classList.remove('active'); el.classList.add('hidden'); });
    const menu = document.getElementById('mainMenu');
    menu.classList.remove('hidden');
    menu.classList.add('active');
    document.getElementById('exportCsvBtn').classList.add('hidden');
    document.querySelectorAll('.chart-wrapper').forEach(cw => cw.classList.add('hidden'));
}

function loadData(type) {
    const key = 'respect_' + type;
    let list = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById(type + 'List');
    container.innerHTML = '';

    if (settings.historyLimit) {
        const m = new Date(); m.setMonth(m.getMonth() - 1);
        list = list.filter(i => new Date(i.date || i.start) >= m);
    }

    list.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        let dObj = null;
        if(item.date) dObj = new Date(item.date);
        else if(item.start) dObj = new Date(item.start);
        
        let dStr = "";
        if(dObj) {
            const time = dObj.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            const date = dObj.toLocaleDateString('he-IL', {day:'2-digit', month:'2-digit'});
            dStr = `${date} ${time}`;
        }

        let buttons = `<div class="history-actions"><button class="action-icon" onclick="reqDelete('${type}', ${index})">🗑️</button><button class="action-icon" onclick="editItem('${type}', ${index})">✏️</button></div>`;
        let content = `<div class="history-right">`;
        
        if(type === 'bp') content += `<div class="history-data-row"><span>❤️${item.pulse}</span><span>⬆️${item.sys}</span><span>⬇️${item.dia}</span></div>`;
        else if(type === 'sugar') content += `<div class="history-data-row"><span>🩸${item.val}</span></div>`;
        else if(type === 'weight') content += `<div class="history-data-row"><span>📟${item.val}</span></div>`;
        else if(type === 'diet') content += `<div class="history-data-row"><span>🔥${item.total}</span></div>`;
        else if(type === 'walking') content += `<div class="history-data-row"><span>🚶${item.start}-${item.end}</span></div>`;
        else if(type === 'meds') content += `<div class="history-data-row"><span>💊${item.name}</span></div>`;
        else if(type === 'cycle') content += `<div class="history-data-row"><span>🥀${item.notes}</span></div>`;
        
        content += `<div class="history-date-full">${dStr}</div></div>`;
        div.innerHTML = content + buttons;
        container.appendChild(div);
    });

    if(type === 'bp' || type === 'sugar' || type === 'weight') updateChart(type, list);
}

// ====================
// גרפים
// ====================
window.toggleChart = function(type) {
    const wrapper = document.getElementById(type + 'ChartSection');
    if(wrapper.classList.contains('hidden')) wrapper.classList.remove('hidden'); else wrapper.classList.add('hidden');
}

window.updateChartFilter = function(type, days) {
    const key = 'respect_' + type;
    let list = JSON.parse(localStorage.getItem(key)) || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filteredList = list.filter(i => new Date(i.date) >= cutoff);
    updateChart(type, filteredList);
}

function updateChart(type, rawData) {
    const ctx = document.getElementById(type + 'Chart');
    if(!ctx) return;
    if(chartInstances[type]) chartInstances[type].destroy();

    const data = [...rawData].reverse();
    const labels = data.map(i => {
        const d = new Date(i.date);
        return `${d.getDate()}/${d.getMonth()+1}`;
    });

    let datasets = [];
    if(type==='bp') datasets = [{label:'גבוה', data:data.map(i=>i.sys), borderColor:'red'}, {label:'נמוך', data:data.map(i=>i.dia), borderColor:'orange'}];
    else if(type==='weight') datasets = [{label:'משקל', data:data.map(i=>i.val), borderColor:'purple', fill:true, tension:0.4}];
    else if(type==='sugar') datasets = [{label:'סוכר', data:data.map(i=>i.val), borderColor:'blue', tension:0.4}];

    chartInstances[type] = new Chart(ctx, { type:'line', data:{labels, datasets}, options:{responsive:true, maintainAspectRatio:false, plugins: { legend: { display: true, position: 'top' } } } });
}

function updateDates() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const s = now.toISOString().slice(0,16);
    document.querySelectorAll('input[type="datetime-local"]').forEach(i => i.value = s);
    const cyc = document.getElementById('cycleStart');
    if(cyc) cyc.value = now.toISOString().slice(0,10);
}

function loadSettings() {
    const s = JSON.parse(localStorage.getItem('respect_settings')) || {};
    settings = {...settings, ...s};
    document.getElementById('largeFontToggle').checked = settings.largeFont;
    if(settings.largeFont) document.body.classList.add('large-font');
    document.getElementById('historyLimitToggle').checked = settings.historyLimit;
    document.getElementById('exportToggle').checked = settings.showExport;
    if(localStorage.getItem('theme') === 'dark') { document.body.setAttribute('data-theme', 'dark'); document.getElementById('themeSwitch').checked = true; }
}

function toggleSetting(key, val) {
    if(key === 'theme') {
        document.body.setAttribute('data-theme', val ? 'dark' : 'light');
        localStorage.setItem('theme', val ? 'dark' : 'light');
        return;
    }
    settings[key] = val;
    localStorage.setItem('respect_settings', JSON.stringify(settings));
    if(key === 'largeFont') document.body.classList.toggle('large-font', val);
    if(key === 'showExport') updateExportBtn();
    if(key === 'historyLimit' && currentSection) loadData(currentSection);
}

function updateExportBtn() {
    const btn = document.getElementById('exportCsvBtn');
    if(settings.showExport && currentSection) btn.classList.remove('hidden'); else btn.classList.add('hidden');
}

window.reqDelete = function(type, idx) {
    document.getElementById('customConfirm').classList.remove('hidden');
    pendingDelete = () => {
        const key = 'respect_' + type;
        let list = JSON.parse(localStorage.getItem(key)) || [];
        list.splice(idx, 1);
        localStorage.setItem(key, JSON.stringify(list));
        loadData(type);
    };
}

window.closeConfirm = function(yes) {
    document.getElementById('customConfirm').classList.add('hidden');
    if(yes && pendingDelete) pendingDelete();
    pendingDelete = null;
}

window.resetAllData = function() {
    if(confirm('למחוק את כל הנתונים באפליקציה?')) { localStorage.clear(); location.reload(); }
}

window.exportData = function() {
    if(!currentSection) return;
    const key = 'respect_' + currentSection;
    const list = JSON.parse(localStorage.getItem(key)) || [];
    let csv = '\uFEFFתאריך,נתונים\n';
    list.forEach(i => csv += `${i.date||i.start},${JSON.stringify(i).replace(/,/g,' ')}\n`);
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.download = key + '.csv';
    a.click();
}