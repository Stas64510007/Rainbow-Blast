const SIZE = 10;

const boardElement = document.getElementById("board");
const piecesElement = document.getElementById("pieces");
const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const messageElement = document.getElementById("message");

let board = [];
let score = 0;
let best = Number(localStorage.getItem("rainbowBest")) || 0;
let pieces = [];
let selectedPiece = null;
let busy = false;

bestElement.textContent = best;

// 20 різних форм блоків

const SHAPES = [
    [[0,0]],

    [[0,0],[0,1]],
    [[0,0],[1,0]],

    [[0,0],[0,1],[0,2]],
    [[0,0],[1,0],[2,0]],

    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[3,0]],

    [[0,0],[0,1],[1,0],[1,1]],

    [[0,0],[0,1],[0,2],[1,0]],
    [[0,0],[1,0],[1,1],[1,2]],

    [[0,0],[1,0],[2,0],[2,1]],
    [[0,0],[0,1],[1,1],[2,1]],

    [[0,0],[1,0],[1,1],[2,1]],
    [[0,1],[1,0],[1,1],[2,0]],

    [[0,0],[0,1],[0,2],[1,1],[2,1]],

    [[0,0],[1,0],[2,0],[1,1],[1,2]],

    [[0,0],[0,1],[0,2],[1,0],[1,2]],

    [[0,0],[1,0],[2,0],[2,1],[2,2]],

    [[0,0],[0,1],[0,2],[1,2],[2,2]],

    [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],

    [[0,0],[1,0],[2,0],[3,0],[4,0]],

    [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3]]
];

// Створення поля

function createBoard() {
    boardElement.innerHTML = "";
    board = Array.from({length: SIZE}, () =>
        Array(SIZE).fill(0)
    );

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener("click", () => {
                placePiece(r, c);
            });

            boardElement.appendChild(cell);
        }
    }
}

// Оновлення поля

function renderBoard() {
    const cells = boardElement.children;

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = cells[r * SIZE + c];
            cell.classList.toggle("filled", board[r][c] === 1);
        }
    }
}

// Генерація блоків

function generatePieces() {
    pieces = [];

    for (let i = 0; i < 3; i++) {
        const shape = SHAPES[
            Math.floor(Math.random() * SHAPES.length)
        ];

        pieces.push({
            shape: shape,
            used: false
        });
    }

    selectedPiece = null;
    renderPieces();
}

// Відображення блоків

function renderPieces() {
    piecesElement.innerHTML = "";

    pieces.forEach((piece, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "piece";

        if (piece.used) wrapper.classList.add("used");

        if (selectedPiece === index) {
            wrapper.classList.add("selected");
        }

        const maxRow = Math.max(...piece.shape.map(p => p[0]));
        const maxCol = Math.max(...piece.shape.map(p => p[1]));

        wrapper.style.gridTemplateColumns =
            `repeat(${maxCol + 1}, 19px)`;

        for (let r = 0; r <= maxRow; r++) {
            for (let c = 0; c <= maxCol; c++) {
                const mini = document.createElement("div");

                const exists = piece.shape.some(
                    p => p[0] === r && p[1] === c
                );

                mini.className = exists
                    ? "mini-cell"
                    : "mini-cell empty";

                wrapper.appendChild(mini);
            }
        }

        wrapper.addEventListener("click", () => {
            if (busy || piece.used) return;

            selectedPiece = index;
            messageElement.textContent = "PLACE YOUR BLOCK";
            renderPieces();
        });

        piecesElement.appendChild(wrapper);
    });
}

// Перевірка можливості поставити блок

function canPlace(shape, row, col) {
    return shape.every(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;

        return (
            r >= 0 &&
            r < SIZE &&
            c >= 0 &&
            c < SIZE &&
            board[r][c] === 0
        );
    });
}

// Розміщення блоку

function placePiece(row, col) {
    if (busy || selectedPiece === null) return;

    const piece = pieces[selectedPiece];

    if (!piece || piece.used) return;

    if (!canPlace(piece.shape, row, col)) {
        messageElement.textContent = "INVALID POSITION!";
        return;
    }

    piece.shape.forEach(([dr, dc]) => {
        board[row + dr][col + dc] = 1;
    });

    score += piece.shape.length;

    piece.used = true;

    renderBoard();
    renderPieces();
    updateScore();

    clearLines();
}

// Очищення рядків та стовпців

function clearLines() {
    let rows = [];
    let cols = [];

    for (let r = 0; r < SIZE; r++) {
        if (board[r].every(cell => cell === 1)) {
            rows.push(r);
        }
    }

    for (let c = 0; c < SIZE; c++) {
        if (board.every(row => row[c] === 1)) {
            cols.push(c);
        }
    }

    const positions = new Set();

    rows.forEach(r => {
        for (let c = 0; c < SIZE; c++) {
            positions.add(r * SIZE + c);
        }
    });

    cols.forEach(c => {
        for (let r = 0; r < SIZE; r++) {
            positions.add(r * SIZE + c);
        }
    });

    if (positions.size > 0) {
        busy = true;

        positions.forEach(index => {
            boardElement.children[index].classList.add("clear");
        });

        score += positions.size + (rows.length + cols.length) * 10;
        updateScore();

        messageElement.textContent = "✨ AMAZING!";

        setTimeout(() => {
            positions.forEach(index => {
                const r = Math.floor(index / SIZE);
                const c = index % SIZE;
                board[r][c] = 0;
            });

            renderBoard();
            busy = false;
            afterMove();
        }, 400);

    } else {
        afterMove();
    }
}

// Після ходу

function afterMove() {
    if (pieces.every(p => p.used)) {
        generatePieces();
    }

    renderPieces();

    if (!hasPossibleMove()) {
        gameOver();
    } else {
        messageElement.textContent = "CHOOSE YOUR BLOCK";
    }
}

// Перевірка чи є доступні ходи

function hasPossibleMove() {
    return pieces.some(piece => {
        if (piece.used) return false;

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (canPlace(piece.shape, r, c)) {
                    return true;
                }
            }
        }

        return false;
    });
}

// Рахунок

function updateScore() {
    scoreElement.textContent = score;

    if (score > best) {
        best = score;
        localStorage.setItem("rainbowBest", best);
        bestElement.textContent = best;
    }
}

// Програш

function gameOver() {
    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOver").classList.remove("hidden");
}

// Рестарт

function restartGame() {
    score = 0;
    selectedPiece = null;
    busy = false;

    scoreElement.textContent = 0;

    document.getElementById("gameOver").classList.add("hidden");

    createBoard();
    generatePieces();

    messageElement.textContent = "CHOOSE YOUR BLOCK";
}

document.getElementById("restart").addEventListener("click", restartGame);

// Запуск гри

restartGame();