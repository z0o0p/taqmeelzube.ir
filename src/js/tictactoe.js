const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
let gameState = createInitialGameState();
let gameStatus;
let allowAIStart;
let cells;

function createInitialGameState() {
  return { board: Array(9).fill(''), currentPlayer: 'X', gameActive: true, aiThinking: false };
}

function getCellPosition(index) {
  return `Row ${Math.floor(index / 3) + 1}, Column ${index % 3 + 1}`;
}

function updateGameStatus(message) {
  gameStatus.textContent = message;
}

function updateCellAvailability() {
  cells.forEach((cell, index) => {
    const unavailable = Boolean(gameState.board[index]) || !gameState.gameActive || gameState.aiThinking;
    cell.setAttribute('aria-disabled', String(unavailable));
  });
}

function makeMove(index) {
  const player = gameState.currentPlayer;
  gameState.board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase());
  cell.setAttribute('aria-label', `${getCellPosition(index)}, played ${player}`);
  checkGameEnd();
}

function checkGameEnd() {
  const winner = checkWinner();
  if (winner) return endGame(winner);
  if (gameState.board.every(Boolean)) return endGame('draw');
  gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
  updateGameStatus(gameState.currentPlayer === 'X' ? 'Your turn! You are X' : "AI's turn! They are O");
  updateCellAvailability();
}

function checkWinner() {
  for (const [a, b, c] of winConditions) {
    const value = gameState.board[a];
    if (value && value === gameState.board[b] && value === gameState.board[c]) {
      [a, b, c].forEach(index => cells[index].classList.add('win'));
      return value;
    }
  }
  return null;
}

function endGame(result) {
  gameState.gameActive = false;
  gameState.aiThinking = false;
  if (result === 'draw') {
    updateGameStatus("It's a draw! Good game!");
    requestPortraitExpression('draw');
  } else if (result === 'X') {
    updateGameStatus('What! How?');
    requestPortraitExpression('surprised');
  } else {
    updateGameStatus('You lose!');
    requestPortraitExpression('playful');
  }
  updateCellAvailability();
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (gameState.board[index] || !gameState.gameActive || gameState.aiThinking) return;
  allowAIStart.hidden = true;
  makeMove(index);
  if (gameState.gameActive && gameState.currentPlayer === 'O') queueAIMove();
}

function queueAIMove(delay = 700, announceTurn = false) {
  gameState.aiThinking = true;
  updateGameStatus(announceTurn ? "AI's turn! They are O" : 'AI is thinking...');
  requestPortraitExpression('thinking');
  updateCellAvailability();
  window.setTimeout(() => {
    if (!gameState.gameActive) return;
    if (announceTurn) updateGameStatus('AI is thinking...');
    makeAIMove();
    gameState.aiThinking = false;
    if (gameState.gameActive) requestPortraitExpression('attentive');
    updateCellAvailability();
  }, delay);
}

function makeAIMove() {
  const index = getBestMove();
  if (index >= 0) makeMove(index);
}

function getBestMove() {
  let bestScore = -Infinity;
  let move = -1;
  gameState.board.forEach((value, index) => {
    if (!value) {
      gameState.board[index] = 'O';
      const score = minimax(gameState.board, 0, false);
      gameState.board[index] = '';
      if (score > bestScore) { bestScore = score; move = index; }
    }
  });
  return move;
}

function minimax(board, depth, isMaximizing) {
  const winner = evaluateBoard(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (board.every(Boolean)) return 0;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  for (let index = 0; index < board.length; index += 1) {
    if (!board[index]) {
      board[index] = isMaximizing ? 'O' : 'X';
      const score = minimax(board, depth + 1, !isMaximizing);
      board[index] = '';
      bestScore = isMaximizing ? Math.max(score, bestScore) : Math.min(score, bestScore);
    }
  }
  return bestScore;
}

function evaluateBoard(board) {
  for (const [a, b, c] of winConditions) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function resetGame() {
  gameState = createInitialGameState();
  updateGameStatus('Your turn! You are X');
  allowAIStart.hidden = false;
  cells.forEach((cell, index) => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'win');
    cell.setAttribute('aria-label', getCellPosition(index));
  });
  updateCellAvailability();
  requestPortraitExpression('attentive');
}

function initializeGame() {
  gameStatus = document.getElementById('gameStatus');
  allowAIStart = document.getElementById('allowAIStart');
  cells = [...document.querySelectorAll('.cell')];
  if (!gameStatus || !allowAIStart || !cells.length) return;
  cells.forEach((cell, index) => {
    cell.setAttribute('aria-label', getCellPosition(index));
    cell.addEventListener('click', handleCellClick);
  });
  allowAIStart.addEventListener('click', () => {
    if (!gameState.gameActive || gameState.board.some(Boolean)) return;
    allowAIStart.hidden = true;
    gameState.currentPlayer = 'O';
    queueAIMove(1000, true);
  });
  document.getElementById('reset-game').addEventListener('click', resetGame);
  updateCellAvailability();
}
