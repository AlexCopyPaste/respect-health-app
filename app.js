// 1. בחירת אלמנטים מה-HTML
const form = document.getElementById('healthForm');
const entriesList = document.getElementById('entriesList');
const dateInput = document.getElementById('date');
const exportBtn = document.getElementById('exportBtn');
const themeToggle = document.getElementById('themeToggle');
const editIdInput = document.getElementById('editId');
const submitBtn = document.getElementById('submitBtn');

// הגדרת תאריך ושעה נוכחיים כברירת מחדל בטופס
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dateInput.value = now.toISOString().slice(0, 16);

// 2. טעינת נתונים והגדרות בעת עליית האתר
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    loadTheme();
});

// 3. ניהול מצב לילה (Dark Mode)
themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.querySelector('.icon').textContent = '🌙';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.querySelector('.icon').textContent = '☀️';
    }
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('.icon').textContent = '☀️';
    }
}

// 4. פונקציה לשמירת טופס (יצירה או עדכון)
form.addEventListener('submit', function(e) {
    e.preventDefault(); // מניעת רענון דף

    const isEdit = editIdInput.value !== '';
    const entryId = isEdit ? parseInt(editIdInput.value) : Date.now();

    // יצירת אובייקט עם הנתונים
    const entryData = {
        id: entryId,
        date: document.getElementById('date').value,
        systolic: document.getElementById('systolic').value,
        diastolic: document.getElementById('diastolic').value,
        pulse: document.getElementById('pulse').value,
        weight: document.getElementById('weight').value,
        notes: document.getElementById('notes').value
    };

    // שמירה או עדכון ב-LocalStorage
    saveOrUpdateEntry(entryData, isEdit);

    // ניקוי הטופס והצגה מחדש
    resetForm();
    loadEntries();
});

// 5. פונקציית שמירה/עדכון בלוגיקה
function saveOrUpdateEntry(entry, isUpdate) {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    
    if (isUpdate) {
        // מציאת האינדקס של הרשומה הקיימת והחלפתה
        const index = entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
            entries[index] = entry;
        }
    } else {
        // הוספה לראש הרשימה
        entries.unshift(entry);
    }
    
    localStorage.setItem('respectHealthData', JSON.stringify(entries));
}

// 6. פונקציית טעינה והצגה של הנתונים
function loadEntries() {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    entriesList.innerHTML = ''; // ניקוי הרשימה הקיימת

    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'entry-card';
        
        // יצירת מחרוזת תצוגה
        let content = `<div class="entry-date">${new Date(entry.date).toLocaleString('he-IL')}</div>`;
        content += `<div class="entry-data">`;
        if (entry.systolic || entry.diastolic) content += `לחץ דם: ${entry.systolic}/${entry.diastolic} | `;
        if (entry.pulse) content += `דופק: ${entry.pulse} | `;
        if (entry.weight) content += `משקל: ${entry.weight}`;
        content += `</div>`;
        
        if (entry.notes) {
            content += `<div class="entry-notes">"${entry.notes}"</div>`;
        }

        // כפתורי פעולה (עריכה ומחיקה)
        content += `
            <div style="position: absolute; left: 10px; top: 10px;">
                <button onclick="editEntry(${entry.id})" class="btn-small" style="background: #f39c12; margin-left: 5px;">✏️</button>
                <button onclick="deleteEntry(${entry.id})" class="btn-small" style="background: #e74c3c;">🗑️</button>
            </div>
        `;

        div.innerHTML = content;
        entriesList.appendChild(div);
    });
}

// 7. פונקציית מחיקה
window.deleteEntry = function(id) {
    if(confirm('למחוק את הרישום הזה?')) {
        let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('respectHealthData', JSON.stringify(entries));
        loadEntries();
        
        // אם מחקנו בזמן עריכה - ננקה את הטופס
        if (editIdInput.value == id) {
            resetForm();
        }
    }
}

// 8. פונקציית עריכה (מעלה נתונים לטופס)
window.editEntry = function(id) {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        // מילוי הטופס בנתונים הקיימים
        document.getElementById('date').value = entry.date;
        document.getElementById('systolic').value = entry.systolic;
        document.getElementById('diastolic').value = entry.diastolic;
        document.getElementById('pulse').value = entry.pulse;
        document.getElementById('weight').value = entry.weight;
        document.getElementById('notes').value = entry.notes;
        
        // סימון שאנחנו במצב עריכה
        editIdInput.value = entry.id;
        submitBtn.textContent = 'עדכן מדידה';
        submitBtn.style.backgroundColor = '#f39c12'; // צבע כתום לעריכה
        
        // גלילה לראש העמוד
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// פונקציית עזר לניקוי הטופס
function resetForm() {
    form.reset();
    editIdInput.value = '';
    submitBtn.textContent = 'שמור מדידה';
    submitBtn.style.backgroundColor = ''; // חזרה לצבע המקורי
    
    // החזרת התאריך הנוכחי
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
}

// 9. פונקציית ייצוא ל-CSV (אקסל)
exportBtn.addEventListener('click', function() {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    if(entries.length === 0) {
        alert("אין נתונים לייצוא");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // הוספת BOM לעברית
    csvContent += "תאריך,לחץ דם גבוה,לחץ דם נמוך,דופק,משקל,הערות\n";

    entries.forEach(e => {
        // ניקוי פסיקים מהערות כדי לא לשבור את ה-CSV
        const safeNotes = e.notes ? e.notes.replace(/,/g, ' ') : '';
        csvContent += `${e.date},${e.systolic},${e.diastolic},${e.pulse},${e.weight},"${safeNotes}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respect_health_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});