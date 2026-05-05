const DEFAULT_APPLIANCES = [
    { id: 1, icon: '❄️', name: 'Air Conditioner', watts: 1500, hours: 8 },
    { id: 2, icon: '🖥', name: 'Desktop PC', watts: 300, hours: 6 },
    { id: 3, icon: '📺', name: 'Television', watts: 150, hours: 5 },
    { id: 4, icon: '💡', name: 'LED Lights (x5)', watts: 50, hours: 10 },
    { id: 5, icon: '🧊', name: 'Refrigerator', watts: 150, hours: 24 },
    { id: 6, icon: '🌀', name: 'Ceiling Fan', watts: 75, hours: 12 },
    { id: 7, icon: '🔌', name: 'Phone Charger', watts: 20, hours: 3 },
    { id: 8, icon: '☕', name: 'Coffee Maker', watts: 1000, hours: 0.5 },
];

let appliances = JSON.parse(localStorage.getItem('powerhour') || JSON.stringify(DEFAULT_APPLIANCES));
let showBars = true;
let showHog = true;

function save() {
    localStorage.setItem('powerhour', JSON.stringify(appliances));
}

function renderAppliances() {
    const currency = document.getElementById('currencySymbol').value;
    document.getElementById('appCount').textContent = appliances.length + ' DEVICES';
    document.getElementById('appList').innerHTML = appliances.map((a, i) => {
        const cost = calcMonthlyCost(a);
        const level = cost > 20 ? 'danger' : cost > 8 ? 'warning' : 'safe';
        return `
            <div class="appliance-row ${level}" style="animation-delay:${i * 0.04}s">
                <div class="app-icon">${a.icon}</div>
                <div class="app-name">${a.name}</div>
                <div class="app-watts">
                    <input type="number" value="${a.watts}" min="1" onchange="updateAppliance(${i}, 'watts', this.value)" />
                    <span class="app-watts-label">W</span>
                </div>
                <div class="app-hours">
                    <input type="number" value="${a.hours}" min="0" max="24" step="0.5" onchange="updateAppliance(${i}, 'hours', this.value)" />
                    <span class="app-hours-label">hrs/day</span>
                </div>
                <div class="app-cost" style="color:${level === 'danger' ? 'var(--red)' : level === 'warning' ? 'var(--amber3)' : 'var(--green)'}">${currency}${cost.toFixed(2)}</div>
                <button class="app-del" onclick="delAppliance(${a.id})">✕</button>
            </div>`;
    }).join('');
}

function updateAppliance(index, key, value) {
    appliances[index][key] = +value;
    save();
    recalculate();
}

function calcMonthlyCost(a) {
    const rate = parseFloat(document.getElementById('ratePerKwh').value) || 0.15;
    const days = parseInt(document.getElementById('daysInMonth')?.value || 30);
    return (a.watts / 1000) * a.hours * days * rate;
}

function recalculate() {
    renderAppliances();
    const currency = document.getElementById('currencySymbol').value;
    const costs = appliances.map(a => calcMonthlyCost(a));
    const total = costs.reduce((a, b) => a + b, 0);
    const days = parseInt(document.getElementById('daysInMonth')?.value || 30);
    const totalKwh = appliances.reduce((a, ap) => a + (ap.watts / 1000) * ap.hours * days, 0);

    document.getElementById('totalBill').textContent = currency + total.toFixed(2);
    document.getElementById('totalPeriod').textContent = totalKwh.toFixed(1) + ' kWh · ' + currency + (total / days).toFixed(2) + ' daily';
    document.getElementById('dailyCost').textContent = currency + (total / days).toFixed(2);
    document.getElementById('weeklyCost').textContent = currency + (total / days * 7).toFixed(2);
    document.getElementById('yearlyCost').textContent = currency + (total * 12).toFixed(0);
    document.getElementById('totalKwh').textContent = totalKwh.toFixed(1) + ' kWh';

    // HOG TROPHY
    if (costs.length > 0 && showHog) {
        const maxIdx = costs.indexOf(Math.max(...costs));
        document.getElementById('hogTrophy').style.display = 'block';
        document.getElementById('hogName').textContent = appliances[maxIdx].icon + ' ' + appliances[maxIdx].name.toUpperCase();
        document.getElementById('hogCost').textContent = `${currency}${costs[maxIdx].toFixed(2)} monthly (${((costs[maxIdx] / total) * 100).toFixed(0)}% of bill)`;
    } else {
        document.getElementById('hogTrophy').style.display = 'none';
    }

    // BAR CHART
    if (showBars && total > 0) {
        const sorted = [...appliances.map((a, i) => ({ ...a, cost: costs[i] }))].sort((a, b) => b.cost - a.cost).slice(0, 6);
        const maxCost = Math.max(...sorted.map(s => s.cost));
        document.getElementById('barChart').innerHTML = sorted.map(a => `
            <div class="bar-item">
                <div class="bar-item-top"><span>${a.icon} ${a.name}</span><span>${currency}${a.cost.toFixed(2)}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${(a.cost / maxCost) * 100}%"></div></div>
            </div>`).join('');
    } else {
        document.getElementById('barChart').innerHTML = '';
    }
}

function delAppliance(id) {
    appliances = appliances.filter(a => a.id !== id);
    save();
    recalculate();
}

function addCustomAppliance() {
    const name = prompt('Appliance name:');
    if (!name) return;
    const watts = parseInt(prompt('Wattage (W):')) || 100;
    const hours = parseFloat(prompt('Hours per day:')) || 1;
    appliances.push({ id: Date.now(), icon: '🔌', name, watts, hours });
    save();
    recalculate();
}

function applyPreset() {
    const v = document.getElementById('countryPreset').value;
    if (v) document.getElementById('ratePerKwh').value = v;
    recalculate();
}

function openSettings() { document.getElementById('settingsModal').classList.add('open'); }
function closeSettings() { document.getElementById('settingsModal').classList.remove('open'); }

function toggleTheme() {
    const btn = document.getElementById('themeToggle');
    btn.classList.toggle('on');
    document.documentElement.dataset.theme = btn.classList.contains('on') ? 'light' : '';
}

function toggleBars() {
    const btn = document.getElementById('barToggle');
    btn.classList.toggle('on');
    showBars = btn.classList.contains('on');
    recalculate();
}

function toggleHog() {
    const btn = document.getElementById('hogToggle');
    btn.classList.toggle('on');
    showHog = btn.classList.contains('on');
    recalculate();
}

// Close modal on click outside
document.getElementById('settingsModal').addEventListener('click', e => {
    if (e.target.id === 'settingsModal') closeSettings();
});

// Initial run
recalculate();