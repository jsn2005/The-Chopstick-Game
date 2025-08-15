let gameState = {
    currentPlayer: 1,
    selectedAttackingHand: null, // 'left' or 'right'
    isSplitting: false,
    hands: {
        1: { top: 1, bottom: 1 },
        2: { top: 1, bottom: 1 }
    }
};

// Event Listeners

document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.btn.attack').forEach(button => {
        button.addEventListener('click', handleAttackWith);
    });

    document.querySelectorAll('.btn.target').forEach(button => {
        button.addEventListener('click', handleAttackTarget);
    });

    document.querySelectorAll('.btn.split').forEach(button => {
        button.addEventListener('click', handleSplit);
    });

    document.getElementById('reset-btn').addEventListener('click', resetGame);

    updateTurnDisplay();
    showAttackButtonsForCurrentPlayer();
});

function updateTurnDisplay() {
    const status = document.getElementById('statusBox');
    status.textContent = `Player ${gameState.currentPlayer}'s Turn`;
}

function updateHandImage(player, hand, value) {
    const img = document.getElementById(`p${player}-${hand}`);
    img.src = `images/${value}.png`;
}

function showAttackButtonsForCurrentPlayer() {
    // Attack buttons
    document.querySelectorAll('.btn.attack').forEach(btn => {
        const handDiv = btn.closest('.hand');
        const player = parseInt(handDiv.dataset.player);
        const hand = handDiv.dataset.hand;
        if (player === gameState.currentPlayer) {
            const handValue = gameState.hands[player][hand];
            btn.style.display = (handValue > 0) ? 'inline-block' : 'none';
        } else {
            btn.style.display = 'none';
        }
    });
    // Split buttons
    document.querySelectorAll('.btn.split').forEach(btn => {
        const player = parseInt(btn.closest('.hand').dataset.player);
        if (player === gameState.currentPlayer && canSplit(player)) {
            btn.style.display = 'inline-block';
        } else {
            btn.style.display = 'none';
        }
    });
}

function isPlayerEliminated(player) {
    const top = gameState.hands[player].top;
    const bottom = gameState.hands[player].bottom;
    return top === 0 && bottom === 0;
}

function canSplit(player) {
    const top = gameState.hands[player].top;
    const bottom = gameState.hands[player].bottom;
    const total = top + bottom;

    // Cannot split if player is dead
    if (top === 0 && bottom === 0) {
        return false;
    }

    if (top === 1 && bottom === 1) {
        return false;
    }

    // Only allow splitting for totals 2 through 6 inclusive
    if (total < 2 || total > 6) {
        return false;
    }

    // Try all possible splits
    for (let i = 0; i <= total; i++) {
        const splitTop = i;
        const splitBottom = total - i;

        // Skip invalid hands
        if (splitTop > 4 || splitBottom > 4) {
            continue;
        }
        if (splitTop === 0 || splitBottom === 0) {
            continue;
        }

        // Skip is the split is the same as the current configuration
        const sameOrder = (splitTop === top && splitBottom === bottom);
        const reversedOrder = (splitTop === bottom && splitBottom === top);
        if (sameOrder || reversedOrder) continue;

        if (!sameOrder && !reversedOrder)
            return true; // Found a valid alternative split
    }
    return false;
}

function handleAttackWith(event) {
    const btn = event.target;
    const hand = btn.dataset.hand;
    const attacker = parseInt(btn.closest('.hand').dataset.player);

    gameState.selectedAttackingHand = hand;
    gameState.currentPlayer = attacker;

    const defender = attacker === 1 ? 2 : 1;

    // Hide all attack buttons
    document.querySelectorAll('.btn.attack').forEach(b => b.style.display = 'none');

    // Show ONLY defender target buttons
    document.querySelectorAll('.btn.target').forEach(b => {
        const btnPlayer = parseInt(b.closest('.hand').dataset.player);
        b.style.display = (btnPlayer === defender) ? 'inline-block' : 'none';
    });
}

function handleAttackTarget(event) {
    const btn = event.target;
    const targetHand = btn.dataset.hand;
    const attacker = gameState.currentPlayer;
    const defender = attacker === 1 ? 2 : 1;

    const attackValue = gameState.hands[attacker][gameState.selectedAttackingHand];
    let newValue = gameState.hands[defender][targetHand] + attackValue;

    if (newValue >= 5) newValue = 0;

    gameState.hands[defender][targetHand] = newValue;
    updateHandImage(defender, targetHand, newValue);

    // Hide all target buttons
    document.querySelectorAll('.btn.target').forEach(b => b.style.display = 'none');

    if (isPlayerEliminated(defender)) {
        document.getElementById('statusBox').textContent = `Game Over - Player ${attacker} Wins!`;
        document.querySelectorAll('.btn.attack, .btn.target, .btn.split').forEach(b => b.disabled = true);
        document.getElementById('reset-btn').style.display = 'block';
        return;
    }

    gameState.currentPlayer = defender;
    gameState.selectedAttackingHand = null;

    updateTurnDisplay();
    showAttackButtonsForCurrentPlayer();
}

function handleSplit(event) {
    const player = parseInt(event.target.closest('.hand').dataset.player);
    gameState.isSplitting = true;

    // Hide all buttons first
    document.querySelectorAll('.btn.attack, .btn.split, .btn.target').forEach(btn => btn.style.display = 'none');

    // Clear UI for old options
    const container = document.getElementById('split-options');
    container.innerHTML = '';

    // Get the current hand values
    const top = gameState.hands[player].top;
    const bottom = gameState.hands[player].bottom;
    const total = top + bottom;

    // If both hands are zero, no split
    if (top === 0 && bottom === 0)
        return;

    // Loop through all possible split combinations
    for (let i = 0; i <= total; i++) {
        const splitTop = i;
        const splitBottom = total - i;

        // Skip invalid hands
        if (splitTop > 4 || splitBottom > 4)
            continue;
        if (splitTop === 0 || splitBottom === 0)
            continue;

        // Skip if result is exactly the same as current hands (order doesn't matter)
        const sameOrder = (splitTop === top && splitBottom === bottom);
        const reversedOrder = (splitTop === bottom && splitBottom === top);
        if (sameOrder || reversedOrder) continue;

        // Create a button for this valid split
        const btn = document.createElement('button');
        btn.textContent = `${splitTop} || ${splitBottom}`;
        btn.addEventListener('click', () => {
            // Apply the chosen split
            gameState.hands[player].top = splitTop;
            gameState.hands[player].bottom = splitBottom;

            // Update the images
            updateHandImage(player, 'top', splitTop);
            updateHandImage(player, 'bottom', splitBottom);

            // Clear options and show next turn
            container.innerHTML = '';
            gameState.isSplitting = false;
            gameState.currentPlayer = (player === 1 ? 2 : 1);
            updateTurnDisplay();
            showAttackButtonsForCurrentPlayer();
        });

        container.appendChild(btn);
    }
}

function resetGame(){
    gameState.currentPlayer = 1;
    gameState.selectedAttackingHand = null;
    gameState.isSplitting = false;
    gameState.hands = { 1: {top: 1, bottom: 1}, 2: {top: 1, bottom: 1}};

    updateHandImage(1, 'top', 1);
    updateHandImage(1, 'bottom', 1);
    updateHandImage(2, 'top', 1);
    updateHandImage(2, 'bottom', 1);

    document.getElementById('statusBox').textContent = 'Welcome to Chopsticks. Player 1 starts.';

    document.getElementById('reset-btn').style.display = 'none';

    document.querySelectorAll('button').forEach(btn => btn.disabled = false);

    document.getElementById('split-options').innerHTML = '';

    updateTurnDisplay();
    showAttackButtonsForCurrentPlayer();
}
