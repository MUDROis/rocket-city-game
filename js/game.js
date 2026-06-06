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
    maxUnlockedStage: 1
};

// ===== STAGE 1: VOCABULARY (15 words, 2 rows) =====
const vocabularyStage1 = [
    { french: "Le parc", building: "parc", icon: "🌳", label: "Park" },
    { french: "L'aire de jeu", building: "aire_de_jeu", icon: "🎠", label: "Playground" },
    { french: "Le poste de police", building: "poste_de_police", icon: "🚓", label: "Police Station" },
    { french: "La maison", building: "maison", icon: "🏠", label: "House" },
    { french: "Le supermarché", building: "supermarche", icon: "🛒", label: "Supermarket" },
    { french: "Le restaurant", building: "restaurant", icon: "🍽️", label: "Restaurant" },
    { french: "L'école", building: "ecole", icon: "🏫", label: "School" },
    { french: "La bibliothèque", building: "bibliotheque", icon: "📚", label: "Library" },
    { french: "La boulangerie", building: "boulangerie", icon: "🥖", label: "Bakery" },
    { french: "La boucherie", building: "boucherie", icon: "🥩", label: "Butcher's Shop" },
    { french: "Le primeur", building: "primeur", icon: "🍎", label: "Greengrocer's" },
    { french: "Le glacier", building: "glacier", icon: "🍦", label: "Ice Cream Shop" },
    { french: "Le stade", building: "stade", icon: "🏟️", label: "Stadium" }
];
// Note: 13 words total (we'll use all, add extra slots)

// ===== STAGE 2: DIALOGUES (with map on right) =====
const dialogues = [
    {
        question: "Excusez-moi, où est le glacier ?",
        correct: "Allez tout droit. Le glacier est à côté du parc du Soleil.",
        wrong: ["Tournez à gauche, le glacier est loin.", "Le glacier est fermé aujourd'hui."],
        englishHint: "Go straight. The ice cream shop is next to Soleil Park."
    },
    {
        question: "Où est l'école, s'il vous plaît ?",
        correct: "Tournez à droite. L'école est en face du stade.",
        wrong: ["Allez tout droit, l'école est à gauche.", "L'école n'existe pas."],
        englishHint: "Turn right. The school is opposite the stadium."
    },
    {
        question: "Excusez-moi, je cherche la maison de Simon.",
        correct: "Allez tout droit. C'est entre la boulangerie et le stade.",
        wrong: ["Tournez à gauche, c'est près du parc.", "La maison est loin d'ici."],
        englishHint: "Go straight. It's between the bakery and the stadium."
    },
    {
        question: "Où est le supermarché ?",
        correct: "Tournez à gauche. Le supermarché est au coin de la rue.",
        wrong: ["Allez tout droit, puis tournez à droite.", "Le supermarché est fermé."],
        englishHint: "Turn left. The supermarket is on the corner of the street."
    },
    {
        question: "Excusez-moi, où est la bibliothèque ?",
        correct: "Allez tout droit. Tournez à droite. C'est à côté du poste de police.",
        wrong: ["Tournez à gauche deux fois.", "La bibliothèque est à Paris."],
        englishHint: "Go straight. Turn right. It's next to the police station."
    }
];

// ===== STAGE 3: ROUTE LOCATIONS (Paris) =====
const routeLocations = [
    { name: "Tour Eiffel", french: "la Tour Eiffel", lat: 48.8584, lng: 2.2945, type: "start" },
    { name: "Restaurant", french: "le restaurant", lat: 48.8600, lng: 2.2970, type: "restaurant" },
    { name: "Supermarché", french: "le supermarché", lat: 48.8620, lng: 2.3000, type: "supermarket" },
    { name: "Boulangerie", french: "la boulangerie", lat: 48.8640, lng: 2.3030, type: "bakery" }
];

let map;
let markers = [];
let currentLocationIndex = 0;
let routePolyline;

// ===== SPEECH SYNTHESIS =====
function speakFrench(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.8;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stage1')) {
        initStage1();
        initStage2();
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

// ===== STAGE 1: 13 WORDS, ADD EXTRA SLOTS =====
function initStage1() {
    const wordBank = document.getElementById('wordBank');
    const cityMap = document.getElementById('cityMap');
    wordBank.innerHTML = '';
    cityMap.innerHTML = '';
    
    // Shuffle words
    const shuffled = [...vocabularyStage1].sort(() => Math.random() - 0.5);
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
    
    // Create building slots (13 slots)
    const slotOrder = [
        'parc', 'aire_de_jeu', 'poste_de_police', 'maison', 'supermarche',
        'restaurant', 'ecole', 'bibliotheque', 'boulangerie', 'boucherie',
        'primeur', 'glacier', 'stade'
    ];
    slotOrder.forEach(buildingKey => {
        const building = vocabularyStage1.find(b => b.building === buildingKey);
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
    const filled = document.querySelectorAll('.building-slot.filled').length;
    if (filled >= 10 && !gameState.stage1Completed) {
        gameState.stage1Completed = true;
        gameState.maxUnlockedStage = 2;
        document.getElementById('stage1Next').style.display = 'inline-flex';
        showFeedback('stage1Feedback', 'Excellent! Stage 1 complete! Ready for Stage 2? 🚀', 'success');
    }
}

// ===== STAGE 2: DIALOGUES WITH MAP ON RIGHT =====
function initStage2() {
    gameState.currentQuestion = 0;
    gameState.totalQuestions = dialogues.length;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    createDialogueLayout();
    if (document.getElementById('stage2').classList.contains('active')) {
        showDialogue();
    }
}

function createDialogueLayout() {
    const container = document.getElementById('stage2-content');
    if (!container) return;
    container.innerHTML = `
        <div class="dialogue-layout">
            <div class="dialogue-left">
                <div class="dialogue-card">
                    <div class="dialogue-question" id="dialogueQuestion"></div>
                    <div class="answers-grid" id="answersGrid"></div>
                </div>
            </div>
            <div class="dialogue-right">
                <div class="mini-map-container">
                    <h3>🗺️ Paris Map</h3>
                    <img src="assets/map.png" alt="Paris Map" style="max-width:100%; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                    <p class="map-legend"><small>Use the map to understand the directions.</small></p>
                </div>
            </div>
        </div>
    `;
    showDialogue();
}

function showDialogue() {
    const d = dialogues[gameState.currentQuestion];
    document.getElementById('currentQuestion').textContent = gameState.currentQuestion + 1;
    const questionDiv = document.getElementById('dialogueQuestion');
    questionDiv.innerHTML = `<span class="question-icon">🗣️</span> <strong>${d.question}</strong><br><span class="english-hint">📖 ${d.englishHint}</span>`;
    
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = '';
    const allAnswers = [
        { text: d.correct, isCorrect: true },
        ...d.wrong.map(w => ({ text: w, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);
    
    allAnswers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer.text;
        btn.onclick = () => checkDialogueAnswer(answer.isCorrect, d);
        answersGrid.appendChild(btn);
    });
}

function checkDialogueAnswer(isCorrect, dialogue) {
    document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);
    if (isCorrect) {
        updateScore(15);
        gameState.correctAnswers++;
        showFeedback('stage2Feedback', `Correct! ✅ ${dialogue.correct}`, 'success');
    } else {
        showFeedback('stage2Feedback', `Incorrect! ❌ The correct answer is: ${dialogue.correct}`, 'error');
    }
    gameState.currentQuestion++;
    if (gameState.currentQuestion < gameState.totalQuestions) {
        setTimeout(() => {
            document.getElementById('stage2Feedback').classList.remove('show');
            showDialogue();
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

// ===== STAGE 3: ROUTE ON MAP (no task text) =====
function initStage3() {
    setTimeout(() => {
        if (map) {
            map.remove();
        }
        map = L.map('map', { center: [48.8584, 2.2945], zoom: 15, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | Paris Learning',
            maxZoom: 19
        }).addTo(map);
        setTimeout(() => map.invalidateSize(), 100);
        
        // Clear previous markers and polyline
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        if (routePolyline) map.removeLayer(routePolyline);
        
        // Add markers for each location with labels
        routeLocations.forEach((loc, idx) => {
            const marker = L.marker([loc.lat, loc.lng]).addTo(map);
            marker.bindPopup(`<b>${loc.name}</b><br>${loc.french}`).openPopup();
            markers.push(marker);
            // Add label via tooltip or popup
        });
        
        // Draw polyline route from start to end
        const latlngs = routeLocations.map(loc => [loc.lat, loc.lng]);
        routePolyline = L.polyline(latlngs, { color: '#ff6b35', weight: 4, opacity: 0.7 }).addTo(map);
        map.fitBounds(routePolyline.getBounds());
        
        // Remove "Task" text from mission briefing
        const missionText = document.getElementById('missionText');
        if (missionText) {
            missionText.innerHTML = `"Follow the route from the Eiffel Tower to the restaurant, then to the supermarket, and finally to the bakery!"`;
        }
        
        // Mark stage as complete after showing route (no interaction needed)
        setTimeout(() => {
            if (!gameState.stage3Completed) {
                completeStage3();
            }
        }, 2000);
    }, 300);
}

function completeStage3() {
    gameState.stage3Completed = true;
    document.getElementById('stage3Complete').style.display = 'inline-flex';
    showFeedback('stage3Feedback', '🎉 Route complete! You\'ve navigated Paris like a pro!', 'success');
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
        createDialogueLayout();
    }
    if (stageNum === 3) {
        initStage3();
    }
}

function showVictory() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('victory').classList.add('active');
    const totalAttempts = 13 + gameState.totalQuestions + routeLocations.length;
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