// ==========================================
// 1. הגדרות ומשתנים
// ==========================================
const form = document.getElementById('healthForm');
const entriesList = document.getElementById('entriesList');
const dateInput = document.getElementById('date');
const exportBtn = document.getElementById('exportBtn');
const editIdInput = document.getElementById('editId');
const submitBtn = document.getElementById('submitBtn');
const themeSwitch = document.getElementById('themeSwitch'); // הבורר החדש

// הגדרת תאריך ושעה נוכחיים כברירת מחדל
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dateInput.value = now.toISOString().slice(0, 16);

// ==========================================
// 2. אתחול האפליקציה
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    loadTheme();
});

// ==========================================
// 3. ניווט בין מסכים (תוקן: פותח דפים נפרדים)
// ==========================================
function showSection(sectionId) {
    // הסתר את כל המסכים
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });

    // הצג את המסך הרצוי
    const targetScreen = document.getElementById(sectionId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        // טיימר קטן כדי לאפשר אנימציה
        setTimeout(() => {
            targetScreen.classList.add('active');
        }, 10);
    }
    
    // גלילה לראש העמוד
    window.scrollTo(0, 0);
}

function showHome() {
    // הסתר את כל המסכים הפנימיים
    document.querySelectorAll('.screen').forEach(el => {
        if (el.id !== 'mainMenu') {
            el.classList.remove('active');
            setTimeout(() => el.classList.add('hidden'), 300); // מחכה לסיום האנימציה
        }
    });

    // הצג את התפריט הראשי
    const menu = document.getElementById('mainMenu');
    menu.classList.remove('hidden');
    menu.classList.add('active');
    
    resetForm();
}

// ==========================================
// 4. ניהול מצב לילה (לוגיקה חדשה לבורר)
// ==========================================
themeSwitch.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    } else {
        themeSwitch.checked = false;
    }
}

// ==========================================
// 5. צור קשר בוואטסאף (הוספת הפונקציה)
// ==========================================
window.contactSupport = function() {
    const phone = "9720547565000";
    const message = encodeURIComponent("אני משתמש באפליקציה שלך ורוצה לומר לך ש...");
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
}

// ==========================================
// 6. שמירה ועיבוד נתונים (לוגיקה קיימת)
// ==========================================
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const isEdit = editIdInput.value !== '';
    const entryId = isEdit ? parseInt(editIdInput.value) : Date.now();

    const entryData = {
        id: entryId,
        date: document.getElementById('date').value,
        systolic: document.getElementById('systolic').value,
        diastolic: document.getElementById('diastolic').value,
        pulse: document.getElementById('pulse').value,
        // weight: document.getElementById('weight').value, // הוסר זמנית מהטופס הזה
        notes: document.getElementById('notes').value
    };

    saveOrUpdateEntry(entryData, isEdit);
    resetForm();
    loadEntries();
    
    // הודעת אישור קטנה
    alert('הנתונים נשמרו בהצלחה!');
});

function saveOrUpdateEntry(entry, isUpdate) {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    
    if (isUpdate) {
        const index = entries.findIndex(e => e.id === entry.id);
        if (index !== -1) entries[index] = entry;
    } else {
        entries.unshift(entry);
    }
    
    localStorage.setItem('respectHealthData', JSON.stringify(entries));
}

function loadEntries() {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    entriesList.innerHTML = '';

    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'entry-card';
        
        let content = `<div class="entry-date">${new Date(entry.date).toLocaleString('he-IL')}</div>`;
        content += `<div class="entry-data">`;
        if (entry.systolic) content += `לחץ דם: ${entry.systolic}/${entry.diastolic} | `;
        if (entry.pulse) content += `דופק: ${entry.pulse}`;
        content += `</div>`;
        
        if (entry.notes) content += `<div style="font-size:0.9em; margin-top:5px; color:#888;">"${entry.notes}"</div>`;

        content += `
            <div style="position: absolute; left: 15px; top: 15px;">
                <button onclick="editEntry(${entry.id})" class="btn-small">✏️</button>
                <button onclick="deleteEntry(${entry.id})" class="btn-small" style="color:red;">🗑️</button>
            </div>
        `;

        div.innerHTML = content;
        entriesList.appendChild(div);
    });
}

window.deleteEntry = function(id) {
    if(confirm('למחוק?')) {
        let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('respectHealthData', JSON.stringify(entries));
        loadEntries();
    }
}

window.editEntry = function(id) {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        document.getElementById('date').value = entry.date;
        document.getElementById('systolic').value = entry.systolic;
        document.getElementById('diastolic').value = entry.diastolic;
        document.getElementById('pulse').value = entry.pulse;
        document.getElementById('notes').value = entry.notes;
        
        editIdInput.value = entry.id;
        submitBtn.textContent = 'עדכן';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetForm() {
    form.reset();
    editIdInput.value = '';
    submitBtn.textContent = 'שמור מדידה';
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
}

exportBtn.addEventListener('click', function() {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    if(entries.length === 0) { alert("אין נתונים"); return; }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFFתאריך,לחץ דם,דופק,הערות\n";
    entries.forEach(e => {
        csvContent += `${e.date},${e.systolic}/${e.diastolic},${e.pulse},"${e.notes}"\n`;
    });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "health_data.csv";
    link.click();
});