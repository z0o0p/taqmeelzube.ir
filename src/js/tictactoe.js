let gameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  gameActive: true,
  aiThinking: false
};
const winConditions = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const gameStatus = document.getElementById('gameStatus');

function toggleGame() {
  const game = document.getElementById('game');
  const btn = document.getElementById('bored-button');
  const active = game.classList.toggle('active');
  btn.setAttribute('aria-expanded', active);
  btn.classList.toggle('hidden', active);
  if (active) setTimeout(() => game.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
}

function getCellPosition(index) {
  return `Row ${Math.floor(index/3)+1}, Column ${index%3+1}`;
}

function updateGameStatus(message) {
  gameStatus.textContent = message;
}

function makeMove(element, index) {
  const player = gameState.currentPlayer;
  gameState.board[index] = player;
  element.textContent = player;
  element.classList.add(player.toLowerCase());
  element.setAttribute('aria-label', `${getCellPosition(index)}, played ${player}`);
  checkGameEnd();
}

function checkGameEnd() {
  const winner = checkWinner();
  if (winner) return endGame(winner);
  if (gameState.board.every(c => c)) return endGame('draw');
  gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
  updateGameStatus(gameState.currentPlayer === 'X' ? 'Your turn! You are X' : "AI's turn");
}

function checkWinner() {
  for (const [a,b,c] of winConditions) {
    const val = gameState.board[a];
    if (val && val === gameState.board[b] && val === gameState.board[c]) {
      [a,b,c].forEach(index => document.querySelector(`[data-index="${index}"]`).classList.add('win'));
      return val;
    }
  }
  return null;
}

function endGame(result) {
  gameState.gameActive = false;
  updateGameStatus(result === 'draw' ? "It's a draw! Good game!" : result === 'X' ? "What! How?" : "You lose!");
}

function handleCellClick(event) {
  const index = +event.target.dataset.index;
  if (gameState.board[index] || !gameState.gameActive || gameState.aiThinking) return;
  makeMove(event.target, index);
  if (gameState.gameActive && gameState.currentPlayer === 'O') {
    gameState.aiThinking = true;
    updateGameStatus('AI is thinking...');
    setTimeout(() => {
      makeAIMove();
      gameState.aiThinking = false;
    }, 800);
  }
}

function makeAIMove() {
  const index = getBestMove();
  makeMove(document.querySelector(`[data-index="${index}"]`), index);
}

function getBestMove() {
  let best = -Infinity, move = 0;
  gameState.board.forEach((v, index) => {
    if (!v) {
      gameState.board[index] = 'O';
      const score = minimax(gameState.board, 0, false);
      gameState.board[index] = '';
      if (score > best) best = score, move = index;
    }
  });
  return move;
}

function minimax(board, depth, isMax) {
  const w = evaluateBoard(board);
  if (w === 'O') return 10 - depth;
  if (w === 'X') return depth - 10;
  if (board.every(c => c)) return 0;

  let best = isMax ? -Infinity : Infinity;
  for (let index = 0; index < 9; index++) {
    if (!board[index]) {
      board[index] = isMax ? 'O' : 'X';
      const score = minimax(board, depth + 1, !isMax);
      board[index] = '';
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
}

function evaluateBoard(board) {
  for (const [a,b,c] of winConditions)
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return null;
}

function resetGame() {
  gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameActive: true,
    aiThinking: false
  };
  updateGameStatus('Your turn! You are X');
  document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'win');
    cell.setAttribute('aria-label', getCellPosition(index));
  });
}

function initializeGame() {
  document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.addEventListener('click', handleCellClick);
    cell.setAttribute('aria-label', getCellPosition(index));
    cell.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cell.click();
      }
    });
  });
}
