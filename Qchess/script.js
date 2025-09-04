 /**
         * Quantum Chess Game - Modern Implementation
         * Author: AI Assistant
         * Features: Player vs Player, Basic AI, Move History, Themes
         */

        // Game State Management
        class GameState {
            constructor() {
                this.board = this.initializeBoard();
                this.currentPlayer = 'white';
                this.selectedSquare = null;
                this.moveHistory = [];
                this.capturedPieces = { white: [], black: [] };
                this.gameMode = 'pvp'; // 'pvp' or 'ai'
                this.gameOver = false;
                this.winner = null;
                this.historyIndex = -1; // For undo/redo
            }

            initializeBoard() {
                const board = Array(8).fill().map(() => Array(8).fill(null));
                
                // Place pieces in starting positions
                const pieceOrder = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
                
                // Black pieces
                for (let i = 0; i < 8; i++) {
                    board[0][i] = { type: pieceOrder[i], color: 'black' };
                    board[1][i] = { type: '♟', color: 'black' };
                }
                
                // White pieces  
                const whitePieces = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
                for (let i = 0; i < 8; i++) {
                    board[6][i] = { type: '♙', color: 'white' };
                    board[7][i] = { type: whitePieces[i], color: 'white' };
                }
                
                return board;
            }

            makeMove(fromRow, fromCol, toRow, toCol) {
                const piece = this.board[fromRow][fromCol];
                const capturedPiece = this.board[toRow][toCol];
                
                // Store move for history
                const move = {
                    from: { row: fromRow, col: fromCol },
                    to: { row: toRow, col: toCol },
                    piece: { ...piece },
                    captured: capturedPiece ? { ...capturedPiece } : null,
                    boardState: this.board.map(row => row.map(cell => cell ? { ...cell } : null))
                };

                // Remove any future moves if we're not at the end of history
                if (this.historyIndex < this.moveHistory.length - 1) {
                    this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
                }

                this.moveHistory.push(move);
                this.historyIndex++;
                
                // Handle capture
                if (capturedPiece) {
                    this.capturedPieces[capturedPiece.color].push(capturedPiece.type);
                }
                
                // Move piece
                this.board[toRow][toCol] = piece;
                this.board[fromRow][fromCol] = null;
                
                // Switch players
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                
                // Check for game over
                this.checkGameOver();
            }

            undoMove() {
                if (this.historyIndex >= 0) {
                    const move = this.moveHistory[this.historyIndex];
                    this.board = move.boardState.map(row => row.map(cell => cell ? { ...cell } : null));
                    
                    // Restore captured pieces
                    if (move.captured) {
                        const capturedArray = this.capturedPieces[move.captured.color];
                        const index = capturedArray.lastIndexOf(move.captured.type);
                        if (index > -1) {
                            capturedArray.splice(index, 1);
                        }
                    }
                    
                    this.historyIndex--;
                    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                    this.gameOver = false;
                    this.winner = null;
                }
            }

            redoMove() {
                if (this.historyIndex < this.moveHistory.length - 1) {
                    this.historyIndex++;
                    const move = this.moveHistory[this.historyIndex];
                    
                    // Handle capture
                    if (move.captured) {
                        this.capturedPieces[move.captured.color].push(move.captured.type);
                    }
                    
                    // Move piece
                    this.board[move.to.row][move.to.col] = move.piece;
                    this.board[move.from.row][move.from.col] = null;
                    
                    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                    this.checkGameOver();
                }
            }

            checkGameOver() {
                // Simple checkmate detection - can be expanded
                const hasValidMoves = this.hasValidMovesForPlayer(this.currentPlayer);
                if (!hasValidMoves) {
                    this.gameOver = true;
                    this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
                }
            }

            hasValidMovesForPlayer(player) {
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.board[row][col];
                        if (piece && piece.color === player) {
                            const moves = this.getValidMoves(row, col);
                            if (moves.length > 0) return true;
                        }
                    }
                }
                return false;
            }

            getValidMoves(row, col) {
                const piece = this.board[row][col];
                if (!piece) return [];

                const moves = [];
                const pieceType = piece.type;
                const color = piece.color;

                switch (pieceType) {
                    case '♙': case '♟': // Pawn
                        moves.push(...this.getPawnMoves(row, col, color));
                        break;
                    case '♖': case '♜': // Rook
                        moves.push(...this.getRookMoves(row, col, color));
                        break;
                    case '♗': case '♝': // Bishop
                        moves.push(...this.getBishopMoves(row, col, color));
                        break;
                    case '♘': case '♞': // Knight
                        moves.push(...this.getKnightMoves(row, col, color));
                        break;
                    case '♕': case '♛': // Queen
                        moves.push(...this.getQueenMoves(row, col, color));
                        break;
                    case '♔': case '♚': // King
                        moves.push(...this.getKingMoves(row, col, color));
                        break;
                }

                return moves.filter(move => this.isValidMove(row, col, move.row, move.col));
            }

            getPawnMoves(row, col, color) {
                const moves = [];
                const direction = color === 'white' ? -1 : 1;
                const startRow = color === 'white' ? 6 : 1;

                // Forward move
                if (row + direction >= 0 && row + direction < 8 && !this.board[row + direction][col]) {
                    moves.push({ row: row + direction, col });
                    
                    // Double move from starting position
                    if (row === startRow && !this.board[row + 2 * direction][col]) {
                        moves.push({ row: row + 2 * direction, col });
                    }
                }

                // Diagonal captures
                for (const dcol of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + dcol;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = this.board[newRow][newCol];
                        if (target && target.color !== color) {
                            moves.push({ row: newRow, col: newCol });
                        }
                    }
                }

                return moves;
            }

            getRookMoves(row, col, color) {
                const moves = [];
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

                for (const [dr, dc] of directions) {
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;

                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

                        const target = this.board[newRow][newCol];
                        if (!target) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (target.color !== color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                    }
                }

                return moves;
            }

            getBishopMoves(row, col, color) {
                const moves = [];
                const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

                for (const [dr, dc] of directions) {
                    for (let i = 1; i < 8; i++) {
                        const newRow = row + dr * i;
                        const newCol = col + dc * i;

                        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

                        const target = this.board[newRow][newCol];
                        if (!target) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (target.color !== color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                    }
                }

                return moves;
            }

            getKnightMoves(row, col, color) {
                const moves = [];
                const knightMoves = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                ];

                for (const [dr, dc] of knightMoves) {
                    const newRow = row + dr;
                    const newCol = col + dc;

                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = this.board[newRow][newCol];
                        if (!target || target.color !== color) {
                            moves.push({ row: newRow, col: newCol });
                        }
                    }
                }

                return moves;
            }

            getQueenMoves(row, col, color) {
                return [...this.getRookMoves(row, col, color), ...this.getBishopMoves(row, col, color)];
            }

            getKingMoves(row, col, color) {
                const moves = [];
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];

                for (const [dr, dc] of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;

                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const target = this.board[newRow][newCol];
                        if (!target || target.color !== color) {
                            moves.push({ row: newRow, col: newCol });
                        }
                    }
                }

                return moves;
            }

            isValidMove(fromRow, fromCol, toRow, toCol) {
                // Basic validation - can be expanded with check detection
                if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
                
                const target = this.board[toRow][toCol];
                const piece = this.board[fromRow][fromCol];
                
                return !target || target.color !== piece.color;
            }
        }

        // AI Player Implementation
        class AIPlayer {
            constructor(color, difficulty = 'easy') {
                this.color = color;
                this.difficulty = difficulty;
            }

            makeMove(gameState) {
                const allMoves = this.getAllPossibleMoves(gameState);
                if (allMoves.length === 0) return null;

                // Simple AI - prioritize captures, then random moves
                const captureMoves = allMoves.filter(move => {
                    const target = gameState.board[move.to.row][move.to.col];
                    return target && target.color !== this.color;
                });

                let selectedMove;
                if (captureMoves.length > 0) {
                    selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
                } else {
                    selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
                }

                return selectedMove;
            }

            getAllPossibleMoves(gameState) {
                const moves = [];
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = gameState.board[row][col];
                        if (piece && piece.color === this.color) {
                            const validMoves = gameState.getValidMoves(row, col);
                            for (const move of validMoves) {
                                moves.push({
                                    from: { row, col },
                                    to: { row: move.row, col: move.col }
                                });
                            }
                        }
                    }
                }
                return moves;
            }
        }

        // Game Controller
        class ChessGame {
            constructor() {
                this.gameState = new GameState();
                this.ai = new AIPlayer('black');
                this.ui = new GameUI(this);
                this.initialize();
            }

            initialize() {
                this.ui.renderBoard();
                this.ui.updateGameStatus();
                this.ui.updateMoveHistory();
                this.ui.updateCapturedPieces();
            }

            handleSquareClick(row, col) {
                if (this.gameState.gameOver) return;
                
                // If AI mode and it's AI's turn, ignore clicks
                if (this.gameState.gameMode === 'ai' && this.gameState.currentPlayer === 'black') {
                    return;
                }

                const clickedPiece = this.gameState.board[row][col];

                if (this.gameState.selectedSquare) {
                    const { row: fromRow, col: fromCol } = this.gameState.selectedSquare;
                    
                    // If clicking the same square, deselect
                    if (fromRow === row && fromCol === col) {
                        this.gameState.selectedSquare = null;
                        this.ui.renderBoard();
                        return;
                    }

                    // Check if move is valid
                    const validMoves = this.gameState.getValidMoves(fromRow, fromCol);
                    const isValidMove = validMoves.some(move => move.row === row && move.col === col);

                    if (isValidMove) {
                        // Make the move
                        this.gameState.makeMove(fromRow, fromCol, row, col);
                        this.gameState.selectedSquare = null;
                        
                        this.ui.renderBoard();
                        this.ui.updateGameStatus();
                        this.ui.updateMoveHistory();
                        this.ui.updateCapturedPieces();

                        // Check for game over
                        if (this.gameState.gameOver) {
                            setTimeout(() => this.ui.showGameOver(), 500);
                            return;
                        }

                        // AI move
                        if (this.gameState.gameMode === 'ai' && this.gameState.currentPlayer === 'black') {
                            setTimeout(() => this.makeAIMove(), 1000);
                        }
                    } else if (clickedPiece && clickedPiece.color === this.gameState.currentPlayer) {
                        // Select new piece
                        this.gameState.selectedSquare = { row, col };
                        this.ui.renderBoard();
                    } else {
                        // Invalid move, deselect
                        this.gameState.selectedSquare = null;
                        this.ui.renderBoard();
                    }
                } else if (clickedPiece && clickedPiece.color === this.gameState.currentPlayer) {
                    // Select piece
                    this.gameState.selectedSquare = { row, col };
                    this.ui.renderBoard();
                }
            }

            makeAIMove() {
                if (this.gameState.gameOver) return;

                const aiMove = this.ai.makeMove(this.gameState);
                if (aiMove) {
                    this.gameState.makeMove(
                        aiMove.from.row, aiMove.from.col,
                        aiMove.to.row, aiMove.to.col
                    );

                    this.ui.renderBoard();
                    this.ui.updateGameStatus();
                    this.ui.updateMoveHistory();
                    this.ui.updateCapturedPieces();

                    if (this.gameState.gameOver) {
                        setTimeout(() => this.ui.showGameOver(), 500);
                    }
                }
            }

            newGame() {
                this.gameState = new GameState();
                this.gameState.gameMode = document.getElementById('toggleModeBtn').textContent === 'vs AI' ? 'pvp' : 'ai';
                this.initialize();
                this.ui.hideGameOver();
            }

            toggleGameMode() {
                const btn = document.getElementById('toggleModeBtn');
                if (this.gameState.gameMode === 'pvp') {
                    this.gameState.gameMode = 'ai';
                    btn.textContent = 'vs Player';
                } else {
                    this.gameState.gameMode = 'pvp';
                    btn.textContent = 'vs AI';
                }
                this.ui.updateGameStatus();
            }

            undo() {
                // In AI mode, undo twice to get back to player's turn
                const undoCount = this.gameState.gameMode === 'ai' && this.gameState.moveHistory.length > 0 ? 2 : 1;
                
                for (let i = 0; i < undoCount && this.gameState.historyIndex >= 0; i++) {
                    this.gameState.undoMove();
                }

                this.ui.renderBoard();
                this.ui.updateGameStatus();
                this.ui.updateMoveHistory();
                this.ui.updateCapturedPieces();
                this.ui.hideGameOver();
            }

            redo() {
                this.gameState.redoMove();
                this.ui.renderBoard();
                this.ui.updateGameStatus();
                this.ui.updateMoveHistory();
                this.ui.updateCapturedPieces();
            }
        }

        // UI Controller
        class GameUI {
            constructor(game) {
                this.game = game;
                this.setupEventListeners();
                this.setupThemeToggle();
            }

            setupEventListeners() {
                document.getElementById('newGameBtn').addEventListener('click', () => this.game.newGame());
                document.getElementById('toggleModeBtn').addEventListener('click', () => this.game.toggleGameMode());
                document.getElementById('undoBtn').addEventListener('click', () => this.game.undo());
                document.getElementById('redoBtn').addEventListener('click', () => this.game.redo());
                document.getElementById('playAgainBtn').addEventListener('click', () => this.game.newGame());
                document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
                document.getElementById('exportBtn').addEventListener('click', () => this.exportGame());
            }

            setupThemeToggle() {
                const themeToggle = document.getElementById('themeToggle');
                themeToggle.addEventListener('click', () => {
                    const body = document.body;
                    const currentTheme = body.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    
                    body.setAttribute('data-theme', newTheme);
                    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
                });
            }

            renderBoard() {
                const boardElement = document.getElementById('chessBoard');
                boardElement.innerHTML = '';

                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const square = document.createElement('div');
                        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                        square.addEventListener('click', () => this.game.handleSquareClick(row, col));

                        // Add piece if exists
                        const piece = this.game.gameState.board[row][col];
                        if (piece) {
                            const pieceElement = document.createElement('span');
                            pieceElement.className = `piece ${piece.color}`;
                            pieceElement.textContent = piece.type;
                            square.appendChild(pieceElement);
                        }

                        // Highlight selected square
                        if (this.game.gameState.selectedSquare && 
                            this.game.gameState.selectedSquare.row === row && 
                            this.game.gameState.selectedSquare.col === col) {
                            square.classList.add('selected');
                        }

                        // Highlight legal moves
                        if (this.game.gameState.selectedSquare) {
                            const { row: fromRow, col: fromCol } = this.game.gameState.selectedSquare;
                            const validMoves = this.game.gameState.getValidMoves(fromRow, fromCol);
                            if (validMoves.some(move => move.row === row && move.col === col)) {
                                square.classList.add('legal-move');
                            }
                        }

                        boardElement.appendChild(square);
                    }
                }
            }

            updateGameStatus() {
                const currentPlayerElement = document.getElementById('currentPlayer');
                const gameModeElement = document.getElementById('gameMode');

                if (this.game.gameState.gameOver) {
                    currentPlayerElement.textContent = `${this.game.gameState.winner} Wins!`;
                } else {
                    currentPlayerElement.textContent = `${this.game.gameState.currentPlayer} to move`;
                }

                gameModeElement.textContent = this.game.gameState.gameMode === 'pvp' ? 'Player vs Player' : 'Player vs AI';
            }

            updateMoveHistory() {
                const movesListElement = document.getElementById('movesList');
                movesListElement.innerHTML = '';

                this.game.gameState.moveHistory.forEach((move, index) => {
                    if (index <= this.game.gameState.historyIndex) {
                        const moveElement = document.createElement('div');
                        moveElement.className = 'move-item';
                        
                        const moveNumber = Math.floor(index / 2) + 1;
                        const player = index % 2 === 0 ? 'W' : 'B';
                        const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
                        const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
                        
                        moveElement.innerHTML = `
                            <span class="move-number">${moveNumber}${player}</span>
                            <span>${move.piece.type} ${from}-${to}</span>
                        `;
                        
                        movesListElement.appendChild(moveElement);
                    }
                });

                // Auto scroll to bottom
                movesListElement.scrollTop = movesListElement.scrollHeight;
            }

            updateCapturedPieces() {
                const capturedWhiteElement = document.getElementById('capturedWhite');
                const capturedBlackElement = document.getElementById('capturedBlack');

                capturedWhiteElement.innerHTML = this.game.gameState.capturedPieces.white
                    .map(piece => `<span class="captured-piece">${piece}</span>`).join('');

                capturedBlackElement.innerHTML = this.game.gameState.capturedPieces.black
                    .map(piece => `<span class="captured-piece">${piece}</span>`).join('');
            }

            showGameOver() {
                const modal = document.getElementById('gameOverModal');
                const title = document.getElementById('victoryTitle');
                const subtitle = document.getElementById('victorySubtitle');

                title.textContent = 'CHECKMATE';
                subtitle.textContent = `${this.game.gameState.winner} Wins!`;

                modal.classList.add('show');
            }

            hideGameOver() {
                const modal = document.getElementById('gameOverModal');
                modal.classList.remove('show');
            }

            clearHistory() {
                // Only clear display, keep actual game history
                document.getElementById('movesList').innerHTML = '';
            }

            exportGame() {
                const gameData = {
                    moves: this.game.gameState.moveHistory.map(move => ({
                        from: `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`,
                        to: `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`,
                        piece: move.piece.type,
                        captured: move.captured ? move.captured.type : null
                    })),
                    date: new Date().toISOString(),
                    result: this.game.gameState.winner ? `${this.game.gameState.winner} wins` : 'In progress'
                };

                const dataStr = JSON.stringify(gameData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `quantum-chess-game-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                
                URL.revokeObjectURL(url);
            }
        }

        // Initialize the game when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            window.chessGame = new ChessGame();
        });