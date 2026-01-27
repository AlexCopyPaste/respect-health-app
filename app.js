// 1. בחירת אלמנטים מה-HTML
const form = document.getElementById('healthForm');
const entriesList = document.getElementById('entriesList');
const dateInput = document.getElementById('date');
const exportBtn = document.getElementById('exportBtn');

// הגדרת תאריך ושעה נוכחיים כברירת מחדל בטופס
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dateInput.value = now.toISOString().slice(0, 16);

// 2. טעינת נתונים בעת עליית האתר
document.addEventListener('DOMContentLoaded', loadEntries);

// 3. פונקציה לשמירת טופס
form.addEventListener('submit', function(e) {
    e.preventDefault(); // מניעת רענון דף

    // יצירת אובייקט עם הנתונים
    const newEntry = {
        id: Date.now(), // מזהה ייחודי
        date: document.getElementById('date').value,
        systolic: document.getElementById('systolic').value,
        diastolic: document.getElementById('diastolic').value,
        pulse: document.getElementById('pulse').value,
        weight: document.getElementById('weight').value,
        notes: document.getElementById('notes').value
    };

    // שמירה ב-LocalStorage
    saveEntry(newEntry);

    // ניקוי הטופס והצגה מחדש
    form.reset();
    dateInput.value = now.toISOString().slice(0, 16); // החזרת תאריך
    loadEntries();
});

// 4. פונקציית שמירה בזיכרון הדפדפן
function saveEntry(entry) {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    entries.unshift(entry); // הוספה לראש הרשימה
    localStorage.setItem('respectHealthData', JSON.stringify(entries));
}

// 5. פונקציית טעינה והצגה של הנתונים
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

        // כפתור מחיקה
        content += `<button onclick="deleteEntry(${entry.id})" class="delete-btn">🗑️</button>`;

        div.innerHTML = content;
        entriesList.appendChild(div);
    });
}

// 6. פונקציית מחיקה
window.deleteEntry = function(id) {
    if(confirm('למחוק את הרישום הזה?')) {
        let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
        entries = entries.filter(entry => entry.id !== id);
        localStorage.setItem('respectHealthData', JSON.stringify(entries));
        loadEntries();
    }
}

// 7. פונקציית ייצוא ל-CSV (אקסל)
exportBtn.addEventListener('click', function() {
    let entries = JSON.parse(localStorage.getItem('respectHealthData')) || [];
    if(entries.length === 0) {
        alert("אין נתונים לייצוא");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // הוספת BOM לעברית
    csvContent += "תאריך,לחץ דם גבוה,לחץ דם נמוך,דופק,משקל,הערות\n";

    entries.forEach(e => {
        csvContent += `${e.date},${e.systolic},${e.diastolic},${e.pulse},${e.weight},"${e.notes}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respect_health_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});