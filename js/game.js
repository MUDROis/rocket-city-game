// ===== GAME STATE =====
const gameState = {
    currentStage: 1,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    stage1Completed: false,
    stage2Completed: false,
    stage3Completed: false,
    currentQuestion: 0
};

// ===== STAGE 2: VRAI/FAUX QUESTIONS (based on Twinklville map) =====
const vraiFauxQuestions = [
    { text: "Le parc est à côté de la gare SNCF.", isTrue: true, correction: "" },
    { text: "Il y a une usine entre le stade et la mosquée.", isTrue: true, correction: "" },
    { text: "Il n’y a pas de centre sportif à Twinklville.", isTrue: false, correction: "Il y a un centre sportif à Twinklville." },
    { text: "Le stade est en face de la poste.", isTrue: true, correction: "" },
    { text: "La banque est à gauche de l’hôtel.", isTrue: false, correction: "La banque est à droite de l’hôtel. (L’hôtel est à gauche de la banque.)" },
    { text: "Le commissariat de police est à droite de l’église.", isTrue: true, correction: "" },
    { text: "L’office de tourisme n’est pas loin du stade.", isTrue: true, correction: "" },
    { text: "L’église est à côté de la patinoire.", isTrue: false, correction: "L’église est à côté du commissariat." },
    { text: "Il y a une bibliothèque à Twinklville.", isTrue: false, correction: "Il n’y a pas de bibliothèque à Twinklville." },
    { text: "L’usine est en face du cinéma.", isTrue: true, correction: "" }
];

// ===== STAGE 3: MAP LOCATIONS (Paris coordinates) =====
const mapLocations = [
    {
        name: 'La Boulangerie',
        french: 'la boulangerie',
        lat: 48.8566,
        lng: 2.3522,
        dialogue: {
            ask: 'Excusez-moi, où est la boulangerie, s\'il vous plaît?',
            answer: 'La boulangerie est près de la tour Eiffel. Allez tout droit!',
            correct: 'Merci beaucoup!'
        }
    },
    {
        name: 'La Gare',
        french: 'la gare SNCF',
        lat: 48.8809,
        lng: 2.3553,
        dialogue: {
            ask: 'Comment aller à la gare?',
            answer: 'La gare est au nord. Tournez à droite!',
            correct: 'Parfait, merci!'
        }
    },
    {
        name: 'Le Parc',
        french: 'le parc',
        lat: 48.8462,
        lng: 2.3372,
        dialogue: {
            ask: 'Où est le parc?',
            answer: 'Le parc est au sud. Allez tout droit!',
            correct: 'Super, merci!'
        }
    }
];

let map;
let markers = [];
let currentMapLocation = 0;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stage1')) {
        initStage1();
        initStage2();
        updateScore(0);
    }
});

// ===== STAGE 1 (unchanged, already correct) =====
function initStage1() {
    const wordBank = document.getElementById('wordBank');
    const cityMap = document.getElementById('cityMap');
    
    const buildings = [
        { icon: '🎬', label: 'Cinema', building: 'cinema', french: 'le cinéma' },
        { icon: '🚆', label: 'Train Station', building: 'gare', french: 'la gare SNCF' },
        { icon: '🛒', label: 'Supermarket', building: 'supermarche', french: 'le supermarché' },
        { icon: '🥖', label: 'Bakery', building: 'boulangerie', french: 'la boulangerie' },
        { icon: '🌳', label: 'Park', building: 'parc', french: 'le parc' },
        { icon: '🚓', label: 'Police Station', building: 'police', french: 'le poste de police' },
        { icon: '📚', label: 'Library', building: 'bibliotheque', french: 'la bibliothèque' },
        { icon: '🍽️', label: 'Restaurant', building: 'restaurant', french: 'le restaurant' }
    ];
    
    const shuffled = [...buildings].sort(() => Math.random() - 0.5);
    shuffled.forEach((word) => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-item';
        wordEl.draggable = true;
        wordEl.textContent = word.french;
        wordEl.dataset.word = word.building;
        wordEl.addEventListener('dragstart', handleDragStart);
        wordEl.addEventListener('dragend', handleDragEnd);
        wordBank.appendChild(wordEl);
    });
    
    const slotOrder = ['cinema', 'gare', 'supermarche', 'boulangerie', 'parc', 'police', 'bibliotheque', 'restaurant'];
    slotOrder.forEach(buildingKey => {
        const building = buildings.find(b => b.building === buildingKey);
        const slot = document.createElement('div');
        slot.className = 'building-slot';
        slot.dataset.building = building.building;
        slot.innerHTML = `<div class="building-icon">${building.icon}</div><div class="building-label">${building.label}</div>`;
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
        cityMap.appendChild(slot);
    });
}

let draggedElement = null;
function handleDragStart(e) { draggedElement = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function handleDragEnd(e) { this.classList.remove('dragging'); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; this.classList.add('drag-over'); }
function handleDragLeave(e) { this.classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (draggedElement && !this.classList.contains('filled')) {
        if (draggedElement.dataset.word === this.dataset.building) {
            this.classList.add('correct', 'filled');
            this.innerHTML += `<div style="margin-top:0.5rem;font-weight:bold;color:#06d6a0;">${draggedElement.textContent}</div>`;
            draggedElement.classList.add('matched');
            draggedElement.draggable = false;
            updateScore(10);
            showFeedback('stage1Feedback', 'Bravo! Correct match! 🎉', 'success');
            gameState.correctAnswers++;
            checkStage1Completion();
        } else {
            showFeedback('stage1Feedback', 'Try again! Regardez les icônes! 🤔', 'error');
            setTimeout(() => document.getElementById('stage1Feedback').classList.remove('show'), 2000);
        }
    }
}
function checkStage1Completion() {
    if (document.querySelectorAll('.building-slot.filled').length >= 6 && !gameState.stage1Completed) {
        gameState.stage1Completed = true;
        document.getElementById('stage1Next').style.display = 'inline-flex';
        showFeedback('stage1Feedback', 'Excellent! Stage 1 complete! Ready for Stage 2? 🚀', 'success');
    }
}

// ===== STAGE 2: VRAI/FAUX WITH STATIC IMAGE =====
function initStage2() {
    gameState.currentQuestion = 0;
    gameState.totalQuestions = vraiFauxQuestions.length;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    createStaticMap();
    showVraiFauxQuestion();
}

function createStaticMap() {
    const container = document.getElementById('miniMapContainer');
    container.innerHTML = `
        <h3>🗺️ Twinklville Map - Plan de Twinklville</h3>
        <div style="text-align: center; margin: 1rem 0;">
            <img src="assets/map.png" alt="Twinklville Map" style="max-width:100%; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
        </div>
        <p class="map-legend"><small>Use this map to answer the questions (Vrai / Faux).</small></p>
    `;
}

function showVraiFauxQuestion() {
    const q = vraiFauxQuestions[gameState.currentQuestion];
    document.getElementById('currentQuestion').textContent = gameState.currentQuestion + 1;
    document.getElementById('questionText').innerHTML = q.text;
    
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = '';
    
    // Create two buttons: Vrai and Faux
    const vraiBtn = document.createElement('button');
    vraiBtn.className = 'answer-btn';
    vraiBtn.textContent = '✅ Vrai (True)';
    vraiBtn.onclick = () => checkVraiFaux(true, q);
    
    const fauxBtn = document.createElement('button');
    fauxBtn.className = 'answer-btn';
    fauxBtn.textContent = '❌ Faux (False)';
    fauxBtn.onclick = () => checkVraiFaux(false, q);
    
    answersGrid.appendChild(vraiBtn);
    answersGrid.appendChild(fauxBtn);
}

function checkVraiFaux(selectedBool, question) {
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
    const isCorrect = (selectedBool === question.isTrue);
    
    if (isCorrect) {
        updateScore(15);
        gameState.correctAnswers++;
        showFeedback('stage2Feedback', `Correct! ✅ ${question.text}`, 'success');
    } else {
        const correctionMsg = question.correction ? ` Correction: ${question.correction}` : '';
        showFeedback('stage2Feedback', `Incorrect! ❌ ${question.text}${correctionMsg}`, 'error');
    }
    
    gameState.currentQuestion++;
    if (gameState.currentQuestion < gameState.totalQuestions) {
        setTimeout(() => {
            document.getElementById('stage2Feedback').classList.remove('show');
            showVraiFauxQuestion();
        }, 2500);
    } else {
        gameState.stage2Completed = true;
        setTimeout(() => {
            document.getElementById('stage2Next').style.display = 'inline-flex';
            showFeedback('stage2Feedback', 'Amazing! You\'re ready for the final mission! 🌟', 'success');
        }, 1500);
    }
}

// ===== STAGE 3: LEAFLET MAP (FIXED) =====
function initStage3() {
    // Ensure map container has height (CSS already does)
    // Small delay to let the tab become visible
    setTimeout(() => {
        if (map) {
            map.remove();
        }
        // Re-initialize map
        map = L.map('map', { center: [48.8566, 2.3522], zoom: 13, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | Rocket City Learning',
            maxZoom: 19
        }).addTo(map);
        
        // Force map to recalculate its size
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
        
        currentMapLocation = 0;
        showMapMission();
    }, 300);
}

function showMapMission() {
    if (currentMapLocation >= mapLocations.length) {
        completeStage3();
        return;
    }
    const location = mapLocations[currentMapLocation];
    document.getElementById('missionText').innerHTML = 
        `"${location.dialogue.ask}"<br><br><strong>Task:</strong> Find ${location.french} on the map!`;
    
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    const allMarkers = [
        { lat: location.lat, lng: location.lng, isCorrect: true, name: location.name },
        { lat: location.lat + 0.02, lng: location.lng + 0.02, isCorrect: false, name: 'Café' },
        { lat: location.lat - 0.015, lng: location.lng + 0.01, isCorrect: false, name: 'Pharmacie' }
    ].sort(() => Math.random() - 0.5);
    
    allMarkers.forEach(marker => {
        const m = L.marker([marker.lat, marker.lng]).addTo(map);
        m.bindPopup(`<b>${marker.name}</b><br>Click to select`);
        m.on('click', () => handleMapClick(marker.isCorrect, location));
        markers.push(m);
    });
    
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
}

function handleMapClick(isCorrect, location) {
    const dialogueContainer = document.getElementById('dialogueContainer');
    dialogueContainer.innerHTML = '';
    if (isCorrect) {
        updateScore(20);
        gameState.correctAnswers++;
        showFeedback('stage3Feedback', `Excellent! You found ${location.french}! 🎯`, 'success');
        setTimeout(() => {
            dialogueContainer.innerHTML = `
                <div style="margin-bottom:1rem;padding:1rem;background:#f0f0f0;border-radius:10px;">
                    <strong>Captain Martin:</strong> "${location.dialogue.answer}"
                </div>
                <div class="dialogue-option" onclick="completeMapMission()">
                    ${location.dialogue.correct}
                </div>
            `;
        }, 1000);
    } else {
        showFeedback('stage3Feedback', 'Not quite! Look at the map more carefully. 🗺️', 'error');
        setTimeout(() => document.getElementById('stage3Feedback').classList.remove('show'), 2000);
    }
}

function completeMapMission() {
    currentMapLocation++;
    document.getElementById('dialogueContainer').innerHTML = '';
    document.getElementById('stage3Feedback').classList.remove('show');
    if (currentMapLocation < mapLocations.length) {
        setTimeout(() => showMapMission(), 500);
    } else {
        completeStage3();
    }
}

function completeStage3() {
    gameState.stage3Completed = true;
    document.getElementById('stage3Complete').style.display = 'inline-flex';
    showFeedback('stage3Feedback', '🎉 Mission Complete! You\'ve navigated Rocket City like a pro!', 'success');
    const finalMarker = L.marker([48.8566, 2.3522]).addTo(map);
    finalMarker.bindPopup('<b>🏆 Rocket City Guide!</b><br>You did it!').openPopup();
}

// ===== NAVIGATION =====
function goToStage(stageNum) {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.stage-dot').forEach((dot, idx) => dot.classList.toggle('active', idx+1 === stageNum));
    const rocket = document.getElementById('rocket');
    const progressFill = document.getElementById('progressFill');
    const percent = ((stageNum-1)/2)*100;
    rocket.style.left = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    document.getElementById(`stage${stageNum}`).classList.add('active');
    gameState.currentStage = stageNum;
    if (stageNum === 3) {
        initStage3();
    }
}

function showVictory() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('victory').classList.add('active');
    const totalAttempts = 8 + gameState.totalQuestions + mapLocations.length;
    const accuracy = Math.round((gameState.correctAnswers / totalAttempts) * 100);
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    createConfetti();
}

function createConfetti() {
    const colors = ['#9d4edd', '#ffd60a', '#06d6a0', '#ff6b35'];
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            document.body.appendChild(confetti);
            const duration = Math.random() * 3 + 2;
            confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: duration * 1000, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }).onfinish = () => confetti.remove();
        }, i * 50);
    }
}

function restartGame() { location.reload(); }
function updateScore(points) {
    gameState.score += points;
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = gameState.score;
    scoreEl.style.transform = 'scale(1.3)';
    setTimeout(() => scoreEl.style.transform = 'scale(1)', 200);
}
function showFeedback(elementId, message, type) {
    const fb = document.getElementById(elementId);
    fb.textContent = message;
    fb.className = `feedback show ${type}`;
    if (type === 'error') setTimeout(() => fb.classList.remove('show'), 2500);
}
