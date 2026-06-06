// ===== GAME STATE =====
const gameState = {
    currentStage: 1,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    stage1Completed: false,
    stage2Completed: false,
    stage3Completed: false,
    currentQuestion: 0,
    maxUnlockedStage: 1  // для переключения по клику
};

// ===== STAGE 1: VOCABULARY (based on Stage 2 map – Paris/Twinklville) =====
const parisBuildings = [
    { icon: '🌳', label: 'Park', building: 'parc', french: 'le parc' },
    { icon: '🚆', label: 'Train Station', building: 'gare', french: 'la gare SNCF' },
    { icon: '🎬', label: 'Cinema', building: 'cinema', french: 'le cinéma' },
    { icon: '📮', label: 'Post Office', building: 'poste', french: 'la poste' },
    { icon: '🚓', label: 'Police Station', building: 'commissariat', french: 'le commissariat' },
    { icon: '⛪', label: 'Church', building: 'eglise', french: "l'église" },
    { icon: '🏟️', label: 'Stadium', building: 'stade', french: 'le stade' },
    { icon: '🏦', label: 'Bank', building: 'banque', french: 'la banque' }
];

// ===== STAGE 2: VRAI/FAUX QUESTIONS (with English hints) =====
const vraiFauxQuestions = [
    { text: "Le parc est à côté de la gare SNCF.", english: "The park is next to the SNCF train station.", isTrue: true, correction: "" },
    { text: "Il y a une usine entre le stade et la mosquée.", english: "There is a factory between the stadium and the mosque.", isTrue: true, correction: "" },
    { text: "Il n’y a pas de centre sportif à Paris.", english: "There is no sports centre in Paris.", isTrue: false, correction: "Il y a un centre sportif à Paris." },
    { text: "Le stade est en face de la poste.", english: "The stadium is opposite the post office.", isTrue: true, correction: "" },
    { text: "La banque est à gauche de l’hôtel.", english: "The bank is to the left of the hotel.", isTrue: false, correction: "La banque est à droite de l’hôtel. (L’hôtel est à gauche de la banque.)" },
    { text: "Le commissariat de police est à droite de l’église.", english: "The police station is to the right of the church.", isTrue: true, correction: "" },
    { text: "L’office de tourisme n’est pas loin du stade.", english: "The tourist office is not far from the stadium.", isTrue: true, correction: "" },
    { text: "L’église est à côté de la patinoire.", english: "The church is next to the ice rink.", isTrue: false, correction: "L’église est à côté du commissariat." },
    { text: "Il y a une bibliothèque à Paris.", english: "There is a library in Paris.", isTrue: false, correction: "Il n’y a pas de bibliothèque à Paris." },
    { text: "L’usine est en face du cinéma.", english: "The factory is opposite the cinema.", isTrue: true, correction: "" }
];

// ===== STAGE 3: DIALOGUES (5 locations in Paris) =====
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
    },
    {
        name: 'Le Musée du Louvre',
        french: 'le musée du Louvre',
        lat: 48.8606,
        lng: 2.3376,
        dialogue: {
            ask: 'Pardon, où se trouve le musée du Louvre?',
            answer: 'Le Louvre est dans le 1er arrondissement. Prenez la rue de Rivoli.',
            correct: 'Merci infiniment!'
        }
    },
    {
        name: 'Notre-Dame',
        french: 'la cathédrale Notre-Dame',
        lat: 48.8530,
        lng: 2.3499,
        dialogue: {
            ask: 'Excusez-moi, comment aller à Notre-Dame?',
            answer: 'Notre-Dame est sur l\'île de la Cité. Traversez le pont.',
            correct: 'C\'est parfait, merci!'
        }
    }
];

let map;
let markers = [];
let currentMapLocation = 0;

// ===== SPEECH SYNTHESIS =====
function speakFrench(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.8;
        window.speechSynthesis.cancel(); // avoid overlapping
        window.speechSynthesis.speak(utterance);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stage1')) {
        initStage1();
        initStage2(); // prepares data but map shown only when stage2 active
        updateScore(0);
        attachStageClickHandlers();
    }
});

// ===== CLICK ON STAGE INDICATORS =====
function attachStageClickHandlers() {
    const dots = document.querySelectorAll('.stage-dot');
    dots.forEach((dot, idx) => {
        const stageNum = idx + 1;
        dot.addEventListener('click', () => {
            if (stageNum <= gameState.maxUnlockedStage) {
                goToStage(stageNum);
            } else {
                showFeedback('stage1Feedback', `Complete Stage ${gameState.maxUnlockedStage} first! 🔒`, 'error');
                setTimeout(() => {
                    const fb = document.getElementById('stage1Feedback');
                    if (fb) fb.classList.remove('show');
                }, 1500);
            }
        });
    });
}

// ===== STAGE 1 =====
function initStage1() {
    const wordBank = document.getElementById('wordBank');
    const cityMap = document.getElementById('cityMap');
    wordBank.innerHTML = '';
    cityMap.innerHTML = '';
    
    // Shuffle buildings for word bank
    const shuffled = [...parisBuildings].sort(() => Math.random() - 0.5);
    shuffled.forEach((item) => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-item';
        wordEl.draggable = true;
        wordEl.textContent = item.french;
        wordEl.dataset.word = item.building;
        wordEl.addEventListener('dragstart', handleDragStart);
        wordEl.addEventListener('dragend', handleDragEnd);
        wordBank.appendChild(wordEl);
    });
    
    // Create building slots in fixed order
    const slotOrder = ['parc', 'gare', 'cinema', 'poste', 'commissariat', 'eglise', 'stade', 'banque'];
    slotOrder.forEach(buildingKey => {
        const building = parisBuildings.find(b => b.building === buildingKey);
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
            const matchedWord = draggedElement.textContent;
            this.innerHTML += `<div style="margin-top:0.5rem;font-weight:bold;color:#06d6a0;">${matchedWord}</div>`;
            draggedElement.classList.add('matched');
            draggedElement.draggable = false;
            updateScore(10);
            gameState.correctAnswers++;
            // French pronunciation
            speakFrench(matchedWord);
            showFeedback('stage1Feedback', 'Bravo! Correct match! 🎉', 'success');
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
        gameState.maxUnlockedStage = 2;
        document.getElementById('stage1Next').style.display = 'inline-flex';
        showFeedback('stage1Feedback', 'Excellent! Stage 1 complete! Ready for Stage 2? 🚀', 'success');
    }
}

// ===== STAGE 2 =====
function initStage2() {
    gameState.currentQuestion = 0;
    gameState.totalQuestions = vraiFauxQuestions.length;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    createStaticMap();
    if (document.getElementById('stage2').classList.contains('active')) {
        showVraiFauxQuestion();
    }
}

function createStaticMap() {
    const container = document.getElementById('miniMapContainer');
    container.innerHTML = `
        <h3>🗺️ Paris (Twinklville) Map - Plan de Paris</h3>
        <div style="text-align: center; margin: 1rem 0;">
            <img src="assets/map.png" alt="Paris Map" style="max-width:100%; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
        </div>
        <p class="map-legend"><small>Use this map to answer the questions (Vrai / Faux).</small></p>
    `;
}

function showVraiFauxQuestion() {
    const q = vraiFauxQuestions[gameState.currentQuestion];
    document.getElementById('currentQuestion').textContent = gameState.currentQuestion + 1;
    const questionBox = document.getElementById('questionText');
    questionBox.innerHTML = `${q.text}<br><span class="english-hint">📖 ${q.english}</span>`;
    
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = '';
    
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
        gameState.maxUnlockedStage = 3;
        setTimeout(() => {
            document.getElementById('stage2Next').style.display = 'inline-flex';
            showFeedback('stage2Feedback', 'Amazing! You\'re ready for the final mission! 🌟', 'success');
        }, 1500);
    }
}

// ===== STAGE 3 =====
function initStage3() {
    setTimeout(() => {
        if (map) {
            map.remove();
        }
        map = L.map('map', { center: [48.8566, 2.3522], zoom: 13, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | Paris Learning',
            maxZoom: 19
        }).addTo(map);
        setTimeout(() => map.invalidateSize(), 100);
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
    
    // Create one correct marker and two distractors
    const allMarkers = [
        { lat: location.lat, lng: location.lng, isCorrect: true, name: location.name, frenchName: location.french },
        { lat: location.lat + 0.02, lng: location.lng + 0.02, isCorrect: false, name: 'Café', frenchName: 'un café' },
        { lat: location.lat - 0.015, lng: location.lng + 0.01, isCorrect: false, name: 'Pharmacie', frenchName: 'une pharmacie' }
    ].sort(() => Math.random() - 0.5);
    
    allMarkers.forEach(marker => {
        const m = L.marker([marker.lat, marker.lng]).addTo(map);
        m.bindPopup(`<b>${marker.name}</b><br><i>${marker.frenchName}</i><br>Click to select`);
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
                    <strong>Tourist Martin:</strong> "${location.dialogue.answer}"
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
    showFeedback('stage3Feedback', '🎉 Mission Complete! You\'ve navigated Paris like a pro!', 'success');
    const finalMarker = L.marker([48.8566, 2.3522]).addTo(map);
    finalMarker.bindPopup('<b>🏆 Paris Guide!</b><br>You did it!').openPopup();
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
    if (stageNum === 2 && gameState.currentQuestion === 0) {
        showVraiFauxQuestion();
    }
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
