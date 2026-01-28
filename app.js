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

// =תאריך נוכחי כברירת מחדל לכל השדות
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateStr = now.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:MM
    const dateDateStr = now.toISOString().slice(0, 10); // format: YYYY-MM-DD

    document.getElementById('bpDate').value = dateStr;
    document.getElementById('sugarDate').value = dateStr;
    document.getElementById('weightDate').value = dateStr;
    document.getElementById('cycleStart').value = dateDateStr;

    loadDataForSection('bp'); // טעינה ראשונית ברקע
    setupTheme();
});

// ==========================================
// ניווט וניהול תצוגה
// ==========================================
let currentCategory = null;

function showSection(sectionId) {
    document.getElementById('mainMenu').classList.remove('active');
    setTimeout(() => document.getElementById('mainMenu').classList.add('hidden'), 300);

    const target = document.getElementById(sectionId);
    target.classList.remove('hidden');
    // טיימר קטן לאנימציה
    setTimeout(() => target.classList.add('active'), 10);

    // זיהוי הקטגוריה הנוכחית עבור הייצוא
    currentCategory = target.getAttribute('data-category');
    loadDataForSection(currentCategory);
}

function showHome() {
    const activeScreen = document.querySelector('.screen.active:not(#mainMenu)');
    if (activeScreen) {
        activeScreen.classList.remove('active');
        setTimeout(() => activeScreen.classList.add('hidden'), 300);
    }
    
    const menu = document.getElementById('mainMenu');
    menu.classList.remove('hidden');
    setTimeout(() => menu.classList.add('active'), 10);
    
    currentCategory = null;
    updateExportButton(); // הסתרת הכפתור
}

// ==========================================
// מערכת ולידציה (רמזור) בזמן אמת
// ==========================================
function validateField(input, type) {
    const val = parseFloat(input.value);
    const parentForm = input.closest('form');
    const submitBtn = parentForm.querySelector('button[type="submit"]');
    const feedback = input.parentNode.querySelector('.feedback-text') || { style: {} };
    
    // ניקוי מחלקות קודמות
    input.classList.remove('bg-success', 'bg-warning', 'bg-danger');
    submitBtn.disabled = false;
    feedback.innerText = "";
    feedback.style.color = "";

    if (isNaN(val)) return;

    let status = 'good'; // good, warn, danger

    // לוגיקה לפי סוג
    if (type === 'pulse') {
        if (val > 220) status = 'danger';
        else if (val > 100) status = 'warn';
    } 
    else if (type === 'systolic') {
        if (val > 180 || val < 90) status = 'danger';
        else if (val > 140) status = 'warn';
    }
    else if (type === 'diastolic') {
        if (val > 110 || val < 60) status = 'danger';
        else if (val > 90) status = 'warn';
    }
    else if (type === 'weight') {
        if (val >= 100) status = 'danger';
        else if (val > 90) status = 'warn';
    }
    else if (type === 'sugar') {
        if (val > 200 || val < 70) status = 'danger';
        else if (val > 140) status = 'warn';
    }

    // יישום הצבעים
    if (status === 'good') {
        input.classList.add('bg-success');
    } else if (status === 'warn') {
        input.classList.add('bg-warning');
        if (type === 'weight') feedback.innerText = "מתקרב לטווח הגבוה";
    } else if (status === 'danger') {
        input.classList.add('bg-danger');
        feedback.innerText = "ערך חריג! הכפתור ננעל.";
        feedback.style.color = "red";
        submitBtn.disabled = true; // נעילת כפתור
    }
}

// ==========================================
// שמירת נתונים (לפי מחלקות)
// ==========================================

// 1. לחץ דם
document.getElementById('bpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        date: document.getElementById('bpDate').value,
        sys: document.getElementById('systolic').value,
        dia: document.getElementById('diastolic').value,
        pulse: document.getElementById('pulse').value
    };
    saveItem('bp', data);
});

// 2. סוכר
document.getElementById('sugarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        date: document.getElementById('sugarDate').value,
        val: document.getElementById('glucoseLevel').value,
        time: document.getElementById('sugarTime').value
    };
    saveItem('sugar', data);
});

// 3. משקל
document.getElementById('weightForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        date: document.getElementById('weightDate').value,
        val: document.getElementById('weightVal').value
    };
    saveItem('weight', data);
});

// 4. תרופות (טיפול בצ'ק בוקס)
document.getElementById('medsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const times = [];
    document.querySelectorAll('.med-time:checked').forEach(cb => times.push(cb.value));
    
    const data = {
        name: document.getElementById('medName').value,
        dosage: document.getElementById('medDosage').value,
        times: times.join(', ')
    };
    saveItem('meds', data);
});

// 5. מחזור
document.getElementById('cycleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        start: document.getElementById('cycleStart').value,
        pain: document.getElementById('cyclePain').value,
        notes: document.getElementById('cycleNotes').value
    };
    saveItem('cycle', data);
});

// פונקציית שמירה גנרית
function saveItem(type, obj) {
    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    list.unshift(obj); // הוספה להתחלה
    localStorage.setItem(key, JSON.stringify(list));
    
    document.querySelector(`#${type}Form`).reset();
    // החזרת תאריך עדכני
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    // איפוס ספציפי לשדות תאריך
    if(type === 'cycle') {
        // לא מאפס תאריך למחזור בדרך כלל
    } else {
        const dateField = document.querySelector(`#${type}Date`) || document.querySelector(`#${type}Start`);
        if(dateField) dateField.value = now.toISOString().slice(0, 16);
    }
    
    loadDataForSection(type);
    alert('נשמר בהצלחה!');
}

// ==========================================
// טעינת נתונים + תחזית מחזור + ייצוא
// ==========================================
function loadDataForSection(type) {
    if (!type) return;
    
    const key = storageKeys[type];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById(`${type}List`);
    
    container.innerHTML = ''; // ניקוי

    // טיפול מיוחד למחזור - תחזית
    if (type === 'cycle' && list.length > 0) {
        const lastPeriod = new Date(list[0].start);
        // חישוב פשוט: הוספת 28 יום
        const nextPeriod = new Date(lastPeriod.setDate(lastPeriod.getDate() + 28));
        document.getElementById('nextCycleDate').innerText = nextPeriod.toLocaleDateString('he-IL');
        document.getElementById('cyclePrediction').classList.remove('hidden');
    }

    list.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        let html = '';
        if (type === 'bp') {
            html = `<div><strong>${formatDate(item.date)}</strong><br>לחץ דם: ${item.sys}/${item.dia} | דופק: ${item.pulse}</div>`;
        } else if (type === 'sugar') {
            html = `<div><strong>${formatDate(item.date)}</strong><br>סוכר: ${item.val} (${item.time})</div>`;
        } else if (type === 'weight') {
            html = `<div><strong>${formatDate(item.date)}</strong><br>משקל: ${item.val} ק"ג</div>`;
        } else if (type === 'meds') {
            html = `<div><strong>${item.name}</strong> (${item.dosage} מ"ג)<br>זמנים: ${item.times}</div>`;
        } else if (type === 'cycle') {
            html = `<div><strong>${item.start}</strong><br>רמת כאב: ${item.pain}<br><small>${item.notes}</small></div>`;
        }

        // כפתור מחיקה
        html += `<button onclick="deleteItem('${type}', ${index})" style="background:none;border:none;font-size:18px;">🗑️</button>`;
        
        div.innerHTML = html;
        container.appendChild(div);
    });

    updateExportButton();
}

function deleteItem(type, index) {
    if(!confirm('למחוק שורה זו?')) return;
    const key = storageKeys[type];
    let list = JSON.parse(localStorage.getItem(key)) || [];
    list.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(list));
    loadDataForSection(type);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
}

// ==========================================
// ייצוא לאקסל (CSV) עם כפתור צף
// ==========================================
function updateExportButton() {
    const btn = document.getElementById('exportCsvBtn');
    if (!currentCategory) {
        btn.classList.add('hidden');
        return;
    }

    const key = storageKeys[currentCategory];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    
    if (list.length > 0) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

function exportCurrentData() {
    if (!currentCategory) return;
    
    const key = storageKeys[currentCategory];
    const list = JSON.parse(localStorage.getItem(key)) || [];
    
    // כותרות לפי סוג
    let csvContent = '\uFEFF'; // BOM לעברית
    
    if (currentCategory === 'bp') csvContent += "תאריך,סיסטולי,דיאסטולי,דופק\n";
    if (currentCategory === 'sugar') csvContent += "תאריך,רמת סוכר,זמן\n";
    if (currentCategory === 'weight') csvContent += "תאריך,משקל\n";
    if (currentCategory === 'meds') csvContent += "שם תרופה,מינון,זמנים\n";
    if (currentCategory === 'cycle') csvContent += "תאריך התחלה,רמת כאב,הערות\n";

    // המרת נתונים
    list.forEach(item => {
        if (currentCategory === 'bp') csvContent += `${item.date},${item.sys},${item.dia},${item.pulse}\n`;
        if (currentCategory === 'sugar') csvContent += `${item.date},${item.val},${item.time}\n`;
        if (currentCategory === 'weight') csvContent += `${item.date},${item.val}\n`;
        if (currentCategory === 'meds') csvContent += `${item.name},${item.dosage},"${item.times}"\n`;
        if (currentCategory === 'cycle') csvContent += `${item.start},${item.pain},"${item.notes}"\n`;
    });

    // הורדה
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `respect_${currentCategory}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// הגדרות
// ==========================================
function setupTheme() {
    const toggle = document.getElementById('themeSwitch');
    if(localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggle.checked = true;
    }
    
    toggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

function resetData() {
    if(confirm('פעולה זו תמחק את כל הנתונים מכל המחלקות. להמשיך?')) {
        localStorage.clear();
        location.reload();
    }
}