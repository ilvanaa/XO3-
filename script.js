//JS kod
document.addEventListener('DOMContentLoaded', function() {
    const gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameActive: true,
        xMoves: [], 
        oMoves: [],
        xMoveCount: 0,
        oMoveCount: 0,
        
        moveHistory: [],
        totalMoves: 0,
        
        gameMode: 'pvp', 
        playerSymbol: 'X', 
        
        soundEnabled: true,
        
        undoStack: [],
        
        timerSettings: {
            enabled: true,
            totalTime: 300, 
            timeRemaining: 300,
            currentTimer: null,
            lastUpdate: null,
            isRunning: false,
            gameStartTime: null,
            gameEndTime: null
        },
        
        gameId: null,
        savedAt: null
    };

    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const gameOverModal = document.getElementById('gameOverModal');
    
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const homeBtn = document.getElementById('homeBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    const saveGameBtn = document.getElementById('saveGameBtn');
    const loadGameBtn = document.getElementById('loadGameBtn');
    const loadGameBtn2 = document.getElementById('loadGameBtn2');
    const undoBtn = document.getElementById('undoBtn');
    const modalPlayAgain = document.getElementById('modalPlayAgain');
    const modalNewGame = document.getElementById('modalNewGame');
    
    const gameBoard = document.getElementById('gameBoard');
    const playerTurn = document.getElementById('playerTurn');
    const currentSymbol = document.getElementById('currentSymbol');
    
    const xMovesCount = document.getElementById('xMovesCount');
    const oMovesCount = document.getElementById('oMovesCount');
    
    const sharedTimerProgress = document.getElementById('sharedTimerProgress');
    const sharedTimerText = document.getElementById('sharedTimerText');
    const sharedTimerBar = document.getElementById('sharedTimerBar');
    const totalTimeDisplay = document.getElementById('totalTimeDisplay');
    const timeRemainingDisplay = document.getElementById('timeRemainingDisplay');
    const xPlayerIndicator = document.getElementById('xPlayerIndicator');
    const oPlayerIndicator = document.getElementById('oPlayerIndicator');
    
    const moveHistory = document.getElementById('moveHistory');
    
    const modeToggle = document.getElementById('modeToggle');
    const soundToggle = document.getElementById('soundToggle');
    
    const modeBtns = document.querySelectorAll('.mode-btn');
    const symbolBtns = document.querySelectorAll('.symbol-btn');
    const timerBtns = document.querySelectorAll('.timer-btn');
    const savedGameInfo = document.getElementById('savedGameInfo');
    
    const modalTitle = document.getElementById('modalTitle');
    const modalIcon = document.getElementById('modalIcon');
    const modalMessage = document.getElementById('modalMessage');
    const modalTotalMoves = document.getElementById('modalTotalMoves');
    const modalXMoves = document.getElementById('modalXMoves');
    const modalOMoves = document.getElementById('modalOMoves');
    const modalGameTime = document.getElementById('modalGameTime');

    const clickSound = document.getElementById('clickSound');
    const winSound = document.getElementById('winSound');
    const removeSound = document.getElementById('removeSound');

    function playSound(soundType) {
        if (!gameState.soundEnabled) return;
        
        let audioElement;
        
        switch(soundType) {
            case 'click':
                audioElement = clickSound;
                break;
            case 'win':
                audioElement = winSound;
                break;
            case 'remove':
                audioElement = removeSound;
                break;
            default:
                return;
        }
        
        if (audioElement) {
            try {
                audioElement.currentTime = 0;
                audioElement.play().catch(error => {
                    console.log("Audio play failed:", error);
                });
            } catch (error) {
                console.log("Audio error:", error);
            }
        }
    }

    function startTimer() {
        if (!gameState.timerSettings.enabled || !gameState.gameActive) return;
        
        clearInterval(gameState.timerSettings.currentTimer);
        gameState.timerSettings.isRunning = true;
        gameState.timerSettings.lastUpdate = Date.now();
        
        if (!gameState.timerSettings.gameStartTime) {
            gameState.timerSettings.gameStartTime = Date.now();
        }
        
        gameState.timerSettings.currentTimer = setInterval(() => {
            updateTimer();
        }, 1000);
    }

    function stopTimer() {
        if (gameState.timerSettings.currentTimer) {
            clearInterval(gameState.timerSettings.currentTimer);
            gameState.timerSettings.currentTimer = null;
        }
        gameState.timerSettings.isRunning = false;
    }

    function updateTimer() {
        if (!gameState.timerSettings.isRunning || !gameState.gameActive) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - gameState.timerSettings.lastUpdate) / 1000);
        
        if (elapsed > 0) {
            gameState.timerSettings.lastUpdate = now;
            gameState.timerSettings.timeRemaining -= elapsed;
            
            if (gameState.timerSettings.timeRemaining <= 0) {
                gameState.timerSettings.timeRemaining = 0;
                timeOut();
            }
            
            updateVisualTimerDisplay();
        }
    }

    function updateVisualTimerDisplay() {
        if (!sharedTimerProgress || !sharedTimerText) return;
        
        const percent = (gameState.timerSettings.timeRemaining / gameState.timerSettings.totalTime) * 100;
        
        sharedTimerProgress.style.width = `${percent}%`;
        sharedTimerText.textContent = formatTime(gameState.timerSettings.timeRemaining);
        
        if (totalTimeDisplay) {
            totalTimeDisplay.textContent = formatTime(gameState.timerSettings.totalTime);
        }
        if (timeRemainingDisplay) {
            timeRemainingDisplay.textContent = formatTime(gameState.timerSettings.timeRemaining);
        }
        
        if (sharedTimerBar) {
            sharedTimerBar.classList.toggle('critical', gameState.timerSettings.timeRemaining < 30);
        }
        
        if (xPlayerIndicator && oPlayerIndicator) {
            if (gameState.currentPlayer === 'X') {
                xPlayerIndicator.classList.add('active');
                oPlayerIndicator.classList.remove('active');
            } else {
                oPlayerIndicator.classList.add('active');
                xPlayerIndicator.classList.remove('active');
            }
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function timeOut() {
        stopTimer();
        gameState.timerSettings.gameEndTime = Date.now();
        
        if (gameState.soundEnabled) {
            playSound('win');
        }
        
        endGame("Time's Up! Game ends in a draw!");
    }

    function getGameDuration() {
        if (!gameState.timerSettings.gameStartTime) return 0;
        
        const endTime = gameState.timerSettings.gameEndTime || Date.now();
        const duration = Math.floor((endTime - gameState.timerSettings.gameStartTime) / 1000);
        return duration;
    }

    function initializeGame() {
        initializeBoard();
        checkForSavedGame();
        updatePlayerDisplay();
        initializeAudio();
        
        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', loadGame);
        }
        
        if (loadGameBtn2) {
            loadGameBtn2.addEventListener('click', loadGame);
        }
        
        if (timerBtns.length > 0) {
            timerBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active-timer'));
                    this.classList.add('active-timer');
                    
                    const timeInSeconds = parseInt(this.dataset.time);
                    gameState.timerSettings.totalTime = timeInSeconds;
                    gameState.timerSettings.timeRemaining = timeInSeconds;
                    
                    if (totalTimeDisplay) {
                        totalTimeDisplay.textContent = formatTime(timeInSeconds);
                    }
                    
                    if (gameState.gameActive) {
                        updateVisualTimerDisplay();
                        stopTimer();
                        startTimer();
                    }
                });
            });
        }
    }
    
    function initializeAudio() {
        document.addEventListener('click', function enableAudio() {
            try {
                const audio = new Audio();
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
                audio.play().then(() => {
                    console.log("Audio unlocked");
                }).catch(e => {
                    console.log("Audio unlock failed:", e);
                });
            } catch (error) {
                console.log("Audio initialization error:", error);
            }
            
            document.removeEventListener('click', enableAudio);
        }, { once: true });
    }

    function initializeBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', () => handleCellClick(i));
            gameBoard.appendChild(cell);
        }
    }

    function switchScreen(screenId) {
        document.querySelectorAll('.game-section').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'startScreen') {
            stopTimer();
            gameState.timerSettings.isRunning = false;
            gameState.timerSettings.currentTimer = null;
        }
        
        if (screenId === 'gameScreen' && gameBoard.children.length === 0) {
            initializeBoard();
            updateBoardDisplay();
        }
    }

    function showModal() {
        gameOverModal.style.display = 'flex';
        
        const duration = getGameDuration();
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        modalGameTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function hideModal() {
        gameOverModal.style.display = 'none';
    }

    function startNewGame() {
        resetGame();
        switchScreen('gameScreen');
        
        updateSymbolDisplay();
        updatePlayerDisplay();
        updateStatsDisplay();
        updateMoveHistoryDisplay();
        
        if (gameState.timerSettings.enabled) {
            gameState.timerSettings.timeRemaining = gameState.timerSettings.totalTime;
            updateVisualTimerDisplay();
            
            setTimeout(() => {
                if (gameState.gameActive) {
                    startTimer();
                }
            }, 1000);
        }
    }

    function handleCellClick(index) {
        if (!gameState.gameActive || gameState.board[index] !== '') {
            return;
        }
        
        playSound('click');
        makeMove(index);
    }

    function makeMove(index) {
        const player = gameState.currentPlayer;
        
        gameState.undoStack.push({
            player: player,
            index: index,
            boardSnapshot: [...gameState.board],
            xMoves: [...gameState.xMoves],
            oMoves: [...gameState.oMoves],
            xMoveCount: gameState.xMoveCount,
            oMoveCount: gameState.oMoveCount,
            timeRemaining: gameState.timerSettings.timeRemaining
        });
        
        gameState.board[index] = player;
        gameState.totalMoves++;
        
        if (player === 'X') {
            gameState.xMoveCount++;
            gameState.xMoves.push({index, moveNumber: gameState.xMoveCount});
            
            if (gameState.xMoves.length > 3) {
                const oldestMove = gameState.xMoves.shift();
                removeOldestMove(oldestMove.index, 'X');
            }
        } else {
            gameState.oMoveCount++;
            gameState.oMoves.push({index, moveNumber: gameState.oMoveCount});
            
            if (gameState.oMoves.length > 3) {
                const oldestMove = gameState.oMoves.shift();
                removeOldestMove(oldestMove.index, 'O');
            }
        }
        
        gameState.moveHistory.push({player, index});
        
        updateCellDisplay(index);
        updateStatsDisplay();
        updateMoveHistoryDisplay();
        
        if (checkWin()) {
            gameState.timerSettings.gameEndTime = Date.now();
            stopTimer();
            endGame(`${player} Wins!`);
        } else if (isBoardFull()) {
            gameState.timerSettings.gameEndTime = Date.now();
            stopTimer();
            endGame("It's a Draw!");
        } else {
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            updatePlayerDisplay();
            updateVisualTimerDisplay(); 
        }
    }

    function removeOldestMove(index, player) {
        gameState.board[index] = '';
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('fade-out');
            playSound('remove');
            
            setTimeout(() => {
                cell.textContent = '';
                cell.classList.remove('x', 'o', 'winning', 'fade-out', 'current-player');
            }, 500);
        }
    }

    function updateCellDisplay(index) {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) {
            cell.textContent = gameState.board[index];
            cell.className = 'cell';
            if (gameState.board[index]) {
                cell.classList.add(gameState.board[index].toLowerCase());
            }
        }
        highlightCurrentPlayerCells();
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (gameState.board[a] && 
                gameState.board[a] === gameState.board[b] && 
                gameState.board[a] === gameState.board[c]) {
                
                highlightWinningCells(pattern);
                return true;
            }
        }
        return false;
    }

    function highlightWinningCells(pattern) {
        pattern.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            if (cell) {
                cell.classList.add('winning');
            }
        });
    }

    function isBoardFull() {
        return gameState.board.every(cell => cell !== '');
    }

    function highlightCurrentPlayerCells() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('current-player');
        });
        
        const player = gameState.currentPlayer;
        let cellsToHighlight = [];
        
        if (player === 'X') {
            cellsToHighlight = gameState.xMoves.map(move => move.index);
        } else {
            cellsToHighlight = gameState.oMoves.map(move => move.index);
        }
        
        cellsToHighlight.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            if (cell && gameState.board[index] === player) {
                cell.classList.add('current-player');
            }
        });
    }

    function highlightPlayerTurn() {
        const isX = gameState.currentPlayer === 'X';
        playerTurn.classList.remove('highlight-x', 'highlight-o');
        
        if (isX) {
            playerTurn.classList.add('highlight-x');
        } else {
            playerTurn.classList.add('highlight-o');
        }
    }

    function endGame(message) {
        gameState.gameActive = false;
        
        localStorage.removeItem('xo3_saved_game');
        localStorage.removeItem('xo3_last_saved');
        checkForSavedGame();
        
        if (gameState.soundEnabled && message.includes('Wins')) {
            playSound('win');
        }
        
        showGameOverModal(message);
    }

    function showGameOverModal(message) {
        modalTitle.textContent = message.includes('Wins') ? 'Victory!' : 'Game Over';
        modalMessage.textContent = message;
        
        modalIcon.innerHTML = '';
        if (message.includes('X Wins')) {
            modalIcon.innerHTML = '<i class="fas fa-times modal-icon x"></i>';
        } else if (message.includes('O Wins')) {
            modalIcon.innerHTML = '<i class="far fa-circle modal-icon o"></i>';
        } else {
            modalIcon.innerHTML = '<i class="fas fa-handshake modal-icon draw"></i>';
        }
        
        modalTotalMoves.textContent = gameState.totalMoves;
        modalXMoves.textContent = gameState.xMoves.length;
        modalOMoves.textContent = gameState.oMoves.length;
        
        showModal();
    }

    function saveGame() {
        if (!gameState.gameActive) {
            showNotification('Cannot save a finished game!', 'error');
            return;
        }
        
        const gameData = {
            board: gameState.board,
            currentPlayer: gameState.currentPlayer,
            gameActive: gameState.gameActive,
            xMoves: gameState.xMoves,
            oMoves: gameState.oMoves,
            xMoveCount: gameState.xMoveCount,
            oMoveCount: gameState.oMoveCount,
            moveHistory: gameState.moveHistory,
            totalMoves: gameState.totalMoves,
            gameMode: gameState.gameMode,
            playerSymbol: gameState.playerSymbol,
            timerSettings: gameState.timerSettings,
            gameId: Date.now().toString(),
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('xo3_saved_game', JSON.stringify(gameData));
            localStorage.setItem('xo3_last_saved', new Date().toISOString());
            
            console.log('Game saved successfully!', gameData);
            showNotification('Game saved successfully!', 'success');
            checkForSavedGame();
        } catch (error) {
            console.error('Save error:', error);
            showNotification('Error saving game! Browser storage might be full.', 'error');
        }
    }

    function loadGame() {
        try {
            const savedGameJson = localStorage.getItem('xo3_saved_game');
            
            if (!savedGameJson) {
                showNotification('No saved game found!', 'error');
                return;
            }
            
            const gameData = JSON.parse(savedGameJson);
            
            console.log('Loading game data:', gameData);
            
            if (!gameData || !gameData.board || !Array.isArray(gameData.board)) {
                showNotification('Saved game data is corrupted!', 'error');
                return;
            }
            
            switchScreen('gameScreen');
            
            gameState.board = gameData.board;
            gameState.currentPlayer = gameData.currentPlayer || 'X';
            gameState.gameActive = gameData.gameActive !== false;
            gameState.xMoves = gameData.xMoves || [];
            gameState.oMoves = gameData.oMoves || [];
            gameState.xMoveCount = gameData.xMoveCount || 0;
            gameState.oMoveCount = gameData.oMoveCount || 0;
            gameState.moveHistory = gameData.moveHistory || [];
            gameState.totalMoves = gameData.totalMoves || 0;
            gameState.gameMode = gameData.gameMode || 'pvp';
            gameState.playerSymbol = gameData.playerSymbol || 'X';
            gameState.gameId = gameData.gameId;
            gameState.savedAt = gameData.savedAt;
            
            if (gameData.timerSettings) {
                gameState.timerSettings = {
                    ...gameState.timerSettings,
                    ...gameData.timerSettings,
                    currentTimer: null,
                    isRunning: false
                };
            }
            
            updateBoardDisplay();
            updateSymbolDisplay();
            updateStatsDisplay();
            updatePlayerDisplay();
            updateMoveHistoryDisplay();
            updateVisualTimerDisplay();
            
            showNotification('Game loaded successfully!', 'success');
            
            if (gameState.gameActive && gameState.timerSettings.enabled) {
                setTimeout(() => {
                    startTimer();
                }, 1000);
            }
            
        } catch (error) {
            console.error('Load error:', error);
            showNotification('Error loading saved game! Data might be corrupted.', 'error');
        }
    }

    function checkForSavedGame() {
        const savedGame = localStorage.getItem('xo3_saved_game');
        const lastSaved = localStorage.getItem('xo3_last_saved');
        
        console.log('Checking for saved game:', {
            hasSavedGame: !!savedGame,
            hasLastSaved: !!lastSaved
        });
        
        if (savedGame && lastSaved) {
            try {
                const date = new Date(lastSaved);
                const formattedDate = date.toLocaleDateString() + ' ' + 
                                     date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                savedGameInfo.style.display = 'block';
                
                console.log('Saved game found, last saved:', formattedDate);
            } catch (error) {
                console.error('Date parsing error:', error);
                savedGameInfo.style.display = 'none';
            }
        } else {
            savedGameInfo.style.display = 'none';
            console.log('No saved game found');
        }
    }

    function undoMove() {
        if (gameState.undoStack.length === 0 || !gameState.gameActive) {
            showNotification('No moves to undo!', 'error');
            return;
        }
        
        const lastMove = gameState.undoStack.pop();
        
        playSound('click');
        
        if (lastMove.player === 'X') {
            const idx = gameState.xMoves.findIndex(m => m.index === lastMove.index);
            if (idx > -1) {
                gameState.xMoves.splice(idx, 1);
                gameState.xMoveCount--;
            }
        } else {
            const idx = gameState.oMoves.findIndex(m => m.index === lastMove.index);
            if (idx > -1) {
                gameState.oMoves.splice(idx, 1);
                gameState.oMoveCount--;
            }
        }
        
        gameState.board[lastMove.index] = '';
        gameState.totalMoves--;
        gameState.moveHistory.pop();
        gameState.currentPlayer = lastMove.player;
        
        if (lastMove.timeRemaining !== undefined) {
            gameState.timerSettings.timeRemaining = lastMove.timeRemaining;
        }
        
        updateCellDisplay(lastMove.index);
        updateStatsDisplay();
        updatePlayerDisplay();
        updateMoveHistoryDisplay();
        updateVisualTimerDisplay();
        
        showNotification('Move undone!', 'success');
    }

    function updateBoardDisplay() {

        if (gameBoard.children.length === 0) {
            initializeBoard();
        }
        
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = gameState.board[index];
            cell.className = 'cell';
            if (gameState.board[index]) {
                cell.classList.add(gameState.board[index].toLowerCase());
            }
        });
        highlightCurrentPlayerCells();
    }

    function updateSymbolDisplay() {
        const colorClass = gameState.playerSymbol === 'X' ? 'x-color' : 'o-color';
        currentSymbol.innerHTML = `You are: <span class="${colorClass}">${gameState.playerSymbol}</span>`;
    }

    function updateStatsDisplay() {
        xMovesCount.textContent = gameState.xMoves.length;
        oMovesCount.textContent = gameState.oMoves.length;
    }

    function updatePlayerDisplay() {
        const isX = gameState.currentPlayer === 'X';
        
        let turnText = `Player ${gameState.currentPlayer}'s Turn`;
        
        playerTurn.innerHTML = `
            <span class="player-icon ${isX ? 'x-color' : 'o-color'}">${gameState.currentPlayer}</span>
            <span>${turnText}</span>
        `;
        
        playerTurn.className = 'player-turn';
        playerTurn.classList.add(isX ? 'active-x' : 'active-o');
        highlightPlayerTurn();
        highlightCurrentPlayerCells();
    }

    function updateMoveHistoryDisplay() {
        moveHistory.innerHTML = '';
        const recentMoves = [...gameState.moveHistory].slice(-5);
        
        recentMoves.forEach(move => {
            const item = document.createElement('div');
            item.className = `history-item ${move.player.toLowerCase()}`;
            
            const positions = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
            item.textContent = `${move.player} → ${positions[move.index]}`;
            
            moveHistory.appendChild(item);
        });
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const icon = modeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            modeToggle.title = 'Switch to light mode';
        } else {
            icon.className = 'fas fa-moon';
            modeToggle.title = 'Switch to dark mode';
        }
    }

    function toggleSound() {
        gameState.soundEnabled = !gameState.soundEnabled;
        const icon = soundToggle.querySelector('i');
        if (gameState.soundEnabled) {
            icon.className = 'fas fa-volume-up';
            soundToggle.innerHTML = '<i class="fas fa-volume-up"></i> Sound';
        } else {
            icon.className = 'fas fa-volume-mute';
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i> Sound';
        }
    }

    function setPlayerSymbol(symbol) {
        gameState.playerSymbol = symbol;
        updateSymbolDisplay();
        
        symbolBtns.forEach(btn => {
            btn.classList.remove('active-symbol');
            if (btn.dataset.symbol === symbol) {
                btn.classList.add('active-symbol');
            }
        });
    }

    function resetGame() {
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.currentPlayer = 'X';
        gameState.gameActive = true;
        gameState.xMoves = [];
        gameState.oMoves = [];
        gameState.xMoveCount = 0;
        gameState.oMoveCount = 0;
        gameState.moveHistory = [];
        gameState.totalMoves = 0;
        gameState.undoStack = [];
        gameState.gameId = null;
        gameState.savedAt = null;
        
        gameState.timerSettings.timeRemaining = gameState.timerSettings.totalTime;
        gameState.timerSettings.gameStartTime = null;
        gameState.timerSettings.gameEndTime = null;
        gameState.timerSettings.isRunning = false;
        stopTimer();
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning', 'fade-out', 'current-player');
        });
        
        if (xPlayerIndicator && oPlayerIndicator) {
            xPlayerIndicator.classList.add('active');
            oPlayerIndicator.classList.remove('active');
        }
        
        updateStatsDisplay();
        updatePlayerDisplay();
        updateMoveHistoryDisplay();
        updateVisualTimerDisplay();
    }

    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.save-confirmation');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `save-confirmation ${type}`;
        
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 3000);
    }

    startBtn.addEventListener('click', startNewGame);
    
    restartBtn.addEventListener('click', () => {
        resetGame();
        startNewGame();
    });
    
    homeBtn.addEventListener('click', () => {
        
        stopTimer();
        gameState.timerSettings.isRunning = false;
        gameState.timerSettings.currentTimer = null;
        switchScreen('startScreen');
    });
    
    playAgainBtn.addEventListener('click', () => {
        resetGame();
        startNewGame();
    });
    
    newGameBtn.addEventListener('click', () => {
        
        stopTimer();
        gameState.timerSettings.isRunning = false;
        gameState.timerSettings.currentTimer = null;
        switchScreen('startScreen');
    });
    
    saveGameBtn.addEventListener('click', saveGame);
    undoBtn.addEventListener('click', undoMove);
    modeToggle.addEventListener('click', toggleDarkMode);
    soundToggle.addEventListener('click', toggleSound);
    
    modalPlayAgain.addEventListener('click', () => {
        hideModal();
        resetGame();
        startNewGame();
    });
    
    modalNewGame.addEventListener('click', () => {
        hideModal();
        stopTimer();
        gameState.timerSettings.isRunning = false;
        gameState.timerSettings.currentTimer = null;
        switchScreen('startScreen');
    });
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modeBtns.forEach(b => b.classList.remove('active-mode'));
            this.classList.add('active-mode');
            gameState.gameMode = this.dataset.mode;
            gameState.currentPlayer = 'X';
        });
    });
    
    symbolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            setPlayerSymbol(this.dataset.symbol);
        });
    });

    window.debugSaveSystem = function() {
        console.log('=== SAVE SYSTEM DEBUG ===');
        console.log('LocalStorage contents:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`Key: "${key}"`);
            console.log(`Value:`, localStorage.getItem(key));
        }
        
        const savedGame = localStorage.getItem('xo3_saved_game');
        console.log('Saved game exists:', !!savedGame);
        
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                console.log('Parsed game data:', parsed);
            } catch (e) {
                console.error('Parse error:', e);
            }
        }
        console.log('========================');
    };

    initializeGame();
});