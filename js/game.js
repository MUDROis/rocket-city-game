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

// ===== VOCABULARY FROM PDFs =====
const vocabulary = [
    { french: 'le cinéma', english: 'cinema', icon: '🎬', building: 'cinema' },
    { french: 'la gare SNCF', english: 'train station', icon: '🚆', building: 'gare' },
    { french: 'le supermarché', english: 'supermarket', icon: '🛒', building: 'supermarche' },
    { french: 'la boulangerie', english: 'bakery', icon: '🥖', building: 'boulangerie' },
    { french: 'le parc', english: 'park', icon: '🌳', building: 'parc' },
    { french: 'le poste de police', english: 'police station', icon: '🚓', building: 'police' },
    { french: 'la bibliothèque', english: 'library', icon: '📚', building: 'bibliotheque' },
    { french: 'le restaurant', english: 'restaurant', icon: '🍽️', building: 'restaurant' },
    { french: 'l\'école', english: 'school', icon: '🏫', building: 'ecole' },
    { french: 'l\'hôpital', english: 'hospital', icon: '🏥', building: 'hopital' },
    { french: 'le musée', english: 'museum', icon: '🏛️', building: 'musee' },
    { french: 'la piscine', english: 'swimming pool', icon: '🏊', building: 'piscine' }
];

// ===== DIRECTION QUESTIONS =====
const directionQuestions = [
    {
        question: 'Où est la boulangerie?',
        frenchHint: 'Where is the bakery?',
        correct: 'Elle est à côté de la gare SNCF',
        wrong: [
            'Elle est en face du cinéma',
            'Elle est loin du parc',
            'Elle est entre l\'hôpital et le musée'
        ],
        explanation: 'The bakery is next to the train station'
    },
    {
        question: 'Comment aller au parc?',
        frenchHint: 'How to get to the park?',
        correct: 'Allez tout droit, puis tournez à gauche',
        wrong: [
            'Tournez à droite deux fois',
            'Allez tout droit sans tourner',
            'Le parc est fermé'
        ],
        explanation: 'Go straight, then turn left'
    },
    {
        question: 'Où est le poste de police?',
        frenchHint: 'Where is the police station?',
        correct: 'Il est en face de l\'école',
        wrong: [
            'Il est à côté du restaurant',
            'Il est loin de la ville',
            'Il n\'existe pas'
        ],
        explanation: 'The police station is opposite the school'
    },
    {
        question: 'La bibliothèque est...',
        frenchHint: 'The library is...',
        correct: 'entre le cinéma et le musée',
        wrong: [
            'loin du centre-ville',
            'à droite de la piscine',
            'fermée aujourd\'hui'
        ],
        explanation: 'The library is between the cinema and museum'
    },
    {
        question: 'Pour aller à la gare...',
        frenchHint: 'To go to the station...',
        correct: 'tournez à droite après le supermarché',
        wrong: [
            'allez tout droit sans tourner',
            'tournez à gauche trois fois',
            'la gare est fermée'
        ],
        explanation: 'Turn right after the supermarket'
    }
];

// ===== STAGE 3: MAP LOCATIONS (Paris coordinates for realism) =====
const mapLocations = [
    {
        name: 'La Boulangerie',
        french: 'la boulangerie',
        address: 'Boulangerie, Paris',
        lat: 48.8566,
        lng: 2.3522,
        question: 'Find the bakery (la boulangerie)',
        dialogue: {
            ask: 'Excusez-moi, où est la boulangerie, s\'il vous plaît?',
            answer: 'La boulangerie est près de la tour Eiffel. Allez tout droit!',
            correct: 'Merci beaucoup!'
        }
    },
    {
        name: 'La Gare',
        french: 'la gare SNCF',
        address: 'Gare du Nord, Paris',
        lat: 48.8809,
        lng: 2.3553,
        question: 'Find the train station (la gare)',
        dialogue: {
            ask: 'Comment aller à la gare?',
            answer: 'La gare est au nord. Tournez à droite!',
            correct: 'Parfait, merci!'
        }
    },
    {
        name: 'Le Parc',
        french: 'le parc',
        address: 'Jardin du Luxembourg, Paris',
        lat: 48.8462,
        lng: 2.3372,
        question: 'Find the park (le parc)',
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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stage1')) {
        initStage1();
        initStage2();
        updateScore(0);
    }
});

// ===== STAGE 1: WORD MATCH =====
function initStage1() {
    const wordBank = document.getElementById('wordBank');
    const cityMap = document.getElementById('cityMap');
    
    // Shuffle vocabulary
    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5).slice(0, 8);
    
    // Create word items
    shuffled.forEach((word, index) => {
        const wordEl = document.createElement('div');
        wordEl.className = 'word-item';
        wordEl.draggable = true;
        wordEl.textContent = word.french;
        wordEl.dataset.word = word.building;
        wordEl.dataset.index = index;
        
        wordEl.addEventListener('dragstart', handleDragStart);
        wordEl.addEventListener('dragend', handleDragEnd);
        
        wordBank.appendChild(wordEl);
    });
    
    // Create building slots
    const buildings = [
        { icon: '🎬', label: 'Cinema', building: 'cinema' },
        { icon: '🚆', label: 'Train Station', building: 'gare' },
        { icon: '🛒', label: 'Supermarket', building: 'supermarche' },
        { icon: '🥖', label: 'Bakery', building: 'boulangerie' },
        { icon: '🌳', label: 'Park', building: 'parc' },
        { icon: '🚓', label: 'Police', building: 'police' },
        { icon: '📚', label: 'Library', building: 'bibliotheque' },
        { icon: '🍽️', label: 'Restaurant', building: 'restaurant' }
    ];
    
    buildings.forEach(building => {
        const slot = document.createElement('div');
        slot.className = 'building-slot';
        slot.dataset.building = building.building;
        
        slot.innerHTML = `
            <div class="building-icon">${building.icon}</div>
            <div class="building-label">${building.label}</div>
        `;
        
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
        
        cityMap.appendChild(slot);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedElement && !this.classList.contains('filled')) {
        const wordBuilding = draggedElement.dataset.word;
        const slotBuilding = this.dataset.building;
        
        if (wordBuilding === slotBuilding) {
            // Correct match!
            this.classList.add('correct', 'filled');
            this.innerHTML += `<div style="margin-top:0.5rem;font-weight:bold;color:#06d6a0;">${draggedElement.textContent}</div>`;
            draggedElement.classList.add('matched');
            draggedElement.draggable = false;
            
            updateScore(10);
            showFeedback('stage1Feedback', 'Bravo! Correct match! 🎉', 'success');
            
            checkStage1Completion();
        } else {
            // Wrong match
            showFeedback('stage1Feedback', 'Try again! Regardez les icônes! 🤔', 'error');
            setTimeout(() => {
                document.getElementById('stage1Feedback').classList.remove('show');
            }, 2000);
        }
    }
}

function checkStage1Completion() {
    const matched = document.querySelectorAll('.building-slot.filled').length;
    if (matched >= 6) { // Need 6 out of 8 correct
        if (!gameState.stage1Completed) {
            gameState.stage1Completed = true;
            document.getElementById('stage1Next').style.display = 'inline-flex';
            showFeedback('stage1Feedback', 'Excellent! Stage 1 complete! Ready for Stage 2? 🚀', 'success');
        }
    }
}

// ===== STAGE 2: DIRECTION DECODER =====
function initStage2() {
    gameState.currentQuestion = 0;
    gameState.totalQuestions = directionQuestions.length;
    document.getElementById('totalQuestions').textContent = gameState.totalQuestions;
    showQuestion();
}

function showQuestion() {
    const q = directionQuestions[gameState.currentQuestion];
    document.getElementById('currentQuestion').textContent = gameState.currentQuestion + 1;
    document.getElementById('questionText').textContent = q.question;
    
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = '';
    
    // Combine correct and wrong answers, then shuffle
    const allAnswers = [
        { text: q.correct, isCorrect: true },
        ...q.wrong.map(w => ({ text: w, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);
    
    allAnswers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer.text;
        btn.onclick = () => checkAnswer(answer.isCorrect, q.explanation, btn);
        answersGrid.appendChild(btn);
    });
}

function checkAnswer(isCorrect, explanation, btnElement) {
    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    if (isCorrect) {
        btnElement.classList.add('correct');
        updateScore(15);
        gameState.correctAnswers++;
        showFeedback('stage2Feedback', `Correct! ${explanation} ✅`, 'success');
    } else {
        btnElement.classList.add('wrong');
        showFeedback('stage2Feedback', `Not quite. ${explanation} Try to remember for next time!`, 'error');
    }
    
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion < gameState.totalQuestions) {
        setTimeout(() => {
            document.getElementById('stage2Feedback').classList.remove('show');
            showQuestion();
        }, 2500);
    } else {
        gameState.stage2Completed = true;
        setTimeout(() => {
            document.getElementById('stage2Next').style.display = 'inline-flex';
            showFeedback('stage2Feedback', 'Amazing! You\'re ready for the final mission! 🌟', 'success');
        }, 1500);
    }
}

// ===== STAGE 3: LEAFLET MAP INTEGRATION =====
function initStage3() {
    // Initialize Leaflet map (centered on Paris)
    map = L.map('map').setView([48.8566, 2.3522], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | Rocket City Learning'
    }).addTo(map);
    
    showMapMission();
}

function showMapMission() {
    if (currentMapLocation >= mapLocations.length) {
        completeStage3();
        return;
    }
    
    const location = mapLocations[currentMapLocation];
    
    // Update mission text
    document.getElementById('missionText').innerHTML = 
        `"${location.dialogue.ask}"<br><br><strong>Task:</strong> Find ${location.french} on the map!`;
    
    // Clear previous markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add multiple markers (one correct, others wrong)
    const allMarkers = [
        { lat: location.lat, lng: location.lng, isCorrect: true, name: location.name },
        { lat: location.lat + 0.02, lng: location.lng + 0.02, isCorrect: false, name: 'Café' },
        { lat: location.lat - 0.015, lng: location.lng + 0.01, isCorrect: false, name: 'Pharmacie' }
    ].sort(() => Math.random() - 0.5);
    
    allMarkers.forEach((marker, index) => {
        const m = L.marker([marker.lat, marker.lng]).addTo(map);
        m.bindPopup(`<b>${marker.name}</b><br>Click to select`);
        
        m.on('click', () => {
            handleMapClick(marker.isCorrect, location);
        });
        
        markers.push(m);
    });
    
    // Fit bounds to show all markers
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
        
        // Show dialogue options
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
        setTimeout(() => {
            document.getElementById('stage3Feedback').classList.remove('show');
        }, 2000);
    }
}

function completeMapMission() {
    currentMapLocation++;
    document.getElementById('dialogueContainer').innerHTML = '';
    document.getElementById('stage3Feedback').classList.remove('show');
    
    if (currentMapLocation < mapLocations.length) {
        setTimeout(() => {
            showMapMission();
        }, 500);
    } else {
        completeStage3();
    }
}

function completeStage3() {
    gameState.stage3Completed = true;
    document.getElementById('stage3Complete').style.display = 'inline-flex';
    showFeedback('stage3Feedback', '🎉 Mission Complete! You\'ve navigated Rocket City like a pro!', 'success');
    
    // Add final marker
    const finalMarker = L.marker([48.8566, 2.3522]).addTo(map);
    finalMarker.bindPopup('<b>🏆 Rocket City Guide!</b><br>You did it!').openPopup();
}

// ===== NAVIGATION =====
function goToStage(stageNum) {
    // Hide all stages
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    
    // Update stage indicators
    document.querySelectorAll('.stage-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 === stageNum);
    });
    
    // Update rocket position
    const rocket = document.getElementById('rocket');
    const progressFill = document.getElementById('progressFill');
    const percentage = ((stageNum - 1) / 2) * 100;
    rocket.style.left = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    
    // Show target stage
    document.getElementById(`stage${stageNum}`).classList.add('active');
    gameState.currentStage = stageNum;
    document.getElementById('stageNumber').textContent = stageNum;
    
    // Initialize stage-specific content
    if (stageNum === 3) {
        setTimeout(() => {
            initStage3();
        }, 300);
    }
}

function showVictory() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('victory').classList.add('active');
    
    // Calculate accuracy
    const totalAttempts = gameState.totalQuestions + 8; // Stage 1 matches + Stage 2 questions
    const accuracy = Math.round((gameState.correctAnswers / totalAttempts) * 100);
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    // Confetti effect (simple CSS animation)
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
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => confetti.remove();
        }, i * 50);
    }
}

function restartGame() {
    location.reload();
}

// ===== UTILITY FUNCTIONS =====
function updateScore(points) {
    gameState.score += points;
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = gameState.score;
    
    // Animate score
    scoreEl.style.transform = 'scale(1.3)';
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
    }, 200);
}

function showFeedback(elementId, message, type) {
    const feedback = document.getElementById(elementId);
    feedback.textContent = message;
    feedback.className = `feedback show ${type}`;
    
    if (type === 'error') {
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2500);
    }
}

// Add CSS transition for score animation
document.addEventListener('DOMContentLoaded', () => {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        scoreEl.style.transition = 'transform 0.2s ease';
    }
});
