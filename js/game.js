// ===== GAME STATE =====
const gameState = {
    currentStage: 1,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    stage1Completed: false,
    stage2Completed: false,
    stage3Completed: false,
    currentDialogueIndex: 0,
    maxUnlockedStage: 1
};

// ===== STAGE 1: VOCABULARY (13 words) =====
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

// ===== STAGE 2: DIALOGUES (5 dialogues, each with 2-3 lines) =====
const dialogues = [
    {
        lines: [
            { french: "— Excusez-moi, où est le glacier ?", english: "Excuse me, where is the ice cream shop?" },
            { french: "— Allez tout droit. Le glacier est à côté du parc du Soleil.", english: "Go straight. The ice cream shop is next to Soleil Park." },
            { french: "— Merci !", english: "Thank you!" }
        ]
    },
    {
        lines: [
            { french: "— Où est l'école, s'il vous plaît ?", english: "Where is the school, please?" },
            { french: "— Tournez à droite. L'école est en face du stade.", english: "Turn right. The school is opposite the stadium." },
            { french: "— Merci beaucoup !", english: "Thank you very much!" }
        ]
    },
    {
        lines: [
            { french: "— Excusez-moi, je cherche la maison de Simon.", english: "Excuse me, I'm looking for Simon's house." },
            { french: "— Allez tout droit. C'est entre la boulangerie et le stade.", english: "Go straight. It's between the bakery and the stadium." },
            { french: "— Merci !", english: "Thank you!" }
        ]
    },
    {
        lines: [
            { french: "— Où est le supermarché ?", english: "Where is the supermarket?" },
            { french: "— Tournez à gauche. Le supermarché est au coin de la rue.", english: "Turn left. The supermarket is on the corner of the street." },
            { french: "— Merci !", english: "Thank you!" }
        ]
    },
    {
        lines: [
            { french: "— Excusez-moi, où est la bibliothèque ?", english: "Excuse me, where is the library?" },
            { french: "— Allez tout droit. Tournez à droite. C'est à côté du poste de police.", english: "Go straight. Turn right. It's next to the police station." },
            { french: "— Merci beaucoup !", english: "Thank you very much!" }
        ]
    }
];

// ===== STAGE 3: EIFFEL TOWER ONLY =====
const eiffelLocation = { name: "Tour Eiffel", french: "la Tour Eiffel", lat: 48.8584, lng: 2.2945 };

let map;
let eiffelMarker;

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

// ===== STAGE 1 =====
function initStage1() {
    const wordBank = document.getElementById('wordBank');
    const cityMap = document.getElementById('cityMap');
    wordBank.innerHTML = '';
    cityMap.innerHTML = '';
    
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

// ===== STAGE 2: DIALOGUES WITH ARROWS =====
function initStage2() {
    createDialogueLayout();
    if (document.getElementById('stage2').classList.contains('active')) {
        showDialogueAtIndex(gameState.currentDialogueIndex);
    }
}

function createDialogueLayout() {
    const container = document.getElementById('stage2-content');
    if (!container) return;
    container.innerHTML = `
        <div class="dialogue-layout">
            <div class="dialogue-left">
                <div class="dialogue-card">
                    <div class="dialogue-header">
                        <span class="dialogue-title">💬 Conversation</span>
                        <div class="dialogue-nav">
                            <button id="prevDialogue" class="nav-arrow" disabled>◀</button>
                            <span id="dialogueCounter">1 / 5</span>
                            <button id="nextDialogue" class="nav-arrow">▶</button>
                        </div>
                    </div>
                    <div id="dialogueLines" class="dialogue-lines"></div>
                </div>
            </div>
            <div class="dialogue-right">
                <div class="mini-map-container">
                    <h3>🗺️ Paris Map</h3>
                    <div class="map-image-wrapper">
                        <img id="mapImage" src="assets/map.png" alt="Paris Map" class="clickable-map">
                    </div>
                    <p class="map-legend"><small>Click on the map to enlarge it.</small></p>
                </div>
            </div>
        </div>
        <!-- Modal for enlarged map -->
        <div id="mapModal" class="modal">
            <span class="close-modal">&times;</span>
            <img class="modal-content" id="modalImage">
        </div>
    `;
    
    // Set up navigation
    document.getElementById('prevDialogue').addEventListener('click', () => changeDialogue(-1));
    document.getElementById('nextDialogue').addEventListener('click', () => changeDialogue(1));
    
    // Set up map click to enlarge
    const mapImg = document.getElementById('mapImage');
    const modal = document.getElementById('mapModal');
    const modalImg = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    
    mapImg.onclick = () => {
        modal.style.display = "flex";
        modalImg.src = mapImg.src;
    };
    closeModal.onclick = () => { modal.style.display = "none"; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    
    showDialogueAtIndex(gameState.currentDialogueIndex);
}

function changeDialogue(delta) {
    const newIndex = gameState.currentDialogueIndex + delta;
    if (newIndex >= 0 && newIndex < dialogues.length) {
        gameState.currentDialogueIndex = newIndex;
        showDialogueAtIndex(newIndex);
    }
}

function showDialogueAtIndex(index) {
    const dialogue = dialogues[index];
    const linesContainer = document.getElementById('dialogueLines');
    linesContainer.innerHTML = '';
    dialogue.lines.forEach(line => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'dialogue-line';
        lineDiv.innerHTML = `<div class="french-line">${line.french}</div><div class="english-line">📖 ${line.english}</div>`;
        linesContainer.appendChild(lineDiv);
    });
    
    // Update counter and button states
    document.getElementById('dialogueCounter').textContent = `${index+1} / ${dialogues.length}`;
    const prevBtn = document.getElementById('prevDialogue');
    const nextBtn = document.getElementById('nextDialogue');
    prevBtn.disabled = (index === 0);
    nextBtn.disabled = (index === dialogues.length - 1);
    
    // Mark stage 2 as completed after showing all? 
    // We'll consider stage 2 completed once user has seen all dialogues? 
    // But easier: after at least one dialogue, allow next stage? 
    // For simplicity, we'll auto-unlock when user clicks next stage button later.
}

// ===== STAGE 3: EIFFEL TOWER ONLY + USEFUL PHRASES =====
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
        
        // Add Eiffel Tower marker
        if (eiffelMarker) map.removeLayer(eiffelMarker);
        eiffelMarker = L.marker([eiffelLocation.lat, eiffelLocation.lng]).addTo(map);
        eiffelMarker.bindPopup(`<b>${eiffelLocation.name}</b><br>${eiffelLocation.french}`).openPopup();
        
        // Add useful phrases above map (already in HTML, but ensure content)
        const phrasesDiv = document.getElementById('usefulPhrases');
        if (phrasesDiv) {
            phrasesDiv.innerHTML = `
                <div class="phrases-container">
                    <span class="phrase">🚶 Allez tout droit (Go straight)</span>
                    <span class="phrase">👉 Tournez à droite (Turn right)</span>
                    <span class="phrase">👈 Tournez à gauche (Turn left)</span>
                    <span class="phrase">📌 à côté de (next to)</span>
                    <span class="phrase">🔄 en face de (opposite)</span>
                    <span class="phrase">🔀 entre (between)</span>
                </div>
            `;
        }
        
        // Auto-complete stage 3 after showing map
        setTimeout(() => {
            if (!gameState.stage3Completed) {
                gameState.stage3Completed = true;
                document.getElementById('stage3Complete').style.display = 'inline-flex';
                showFeedback('stage3Feedback', '🎉 You\'ve seen the Eiffel Tower! Ready to claim your badge?', 'success');
            }
        }, 2000);
    }, 300);
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
    
    if (stageNum === 2) {
        if (!document.getElementById('dialogueLines')) {
            createDialogueLayout();
        } else {
            showDialogueAtIndex(gameState.currentDialogueIndex);
        }
        // Unlock stage 2 completion after user has seen at least one dialogue? 
        // We'll set a flag when they click next button. For now, let the "Final Mission" button appear after they've clicked through all? 
        // Better: allow manual completion via button. We'll keep the next button as is.
    }
    if (stageNum === 3) {
        initStage3();
    }
}

function showVictory() {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById('victory').classList.add('active');
    const totalAttempts = 13 + 5; // 13 matches + 5 dialogues (no right/wrong answers now)
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
    if (!fb) return;
    fb.textContent = message;
    fb.className = `feedback show ${type}`;
    if (type === 'error') setTimeout(() => fb.classList.remove('show'), 2500);
}