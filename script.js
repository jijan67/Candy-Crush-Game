// Game variables
const candies = ["Blue", "Green", "Orange", "Purple", "Red", "Yellow"];
const candyImages = {
    "Blue": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/blue-candy.png",
    "Green": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/green-candy.png",
    "Orange": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/orange-candy.png",
    "Purple": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/purple-candy.png",
    "Red": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/red-candy.png",
    "Yellow": "https://raw.githubusercontent.com/kubowania/candy-crush/master/images/yellow-candy.png",
    "blank": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
};

let board = [];
const rows = 9;
const columns = 9;
let score = 0;
let highScore = localStorage.getItem('candyCrushHighScore') || 0;
let currTile;
let otherTile;
let gameInterval;
let timeLeft = 60; // 1 minute game
let gameActive = false;
let combo = 0;
let playerInitiatedMove = false; // Flag to track if move was initiated by player

// Touch variables
let touchStartTile = null;

// Sounds
const matchSound = document.getElementById("matchSound");
const swapSound = document.getElementById("swapSound");
const invalidSound = document.getElementById("invalidSound");
const gameOverSound = document.getElementById("gameOverSound");
const highScoreSound = document.getElementById("highScoreSound");
const buttonClickSound = document.getElementById("buttonClickSound");

// DOM elements
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const timerDisplay = document.getElementById("timer");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const playAgainButton = document.getElementById("playAgainButton");
const finalScoreDisplay = document.getElementById("finalScore");
const finalHighScoreDisplay = document.getElementById("finalHighScore");
const gameOverTitle = document.getElementById("gameOverTitle");
const congratsAnimation = document.getElementById("congratsAnimation");

// Initialize the game
window.onload = function() {
    // Display high score
    highScoreDisplay.textContent = highScore;
    
    // Set up event listeners
    startButton.addEventListener("click", startGame);
    playAgainButton.addEventListener("click", restartGame);
    
    // Create the initial board
    createBoard();
};

// Create the game board
function createBoard() {
    const boardElement = document.getElementById("board");
    boardElement.innerHTML = '';
    board = [];
    
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("img");
            tile.id = r.toString() + "-" + c.toString();
            
            // Random candy
            let candyType = randomCandy();
            tile.src = candyImages[candyType];
            
            // Drag functionality
            tile.addEventListener("dragstart", dragStart);
            tile.addEventListener("dragover", dragOver);
            tile.addEventListener("dragenter", dragEnter);
            tile.addEventListener("dragleave", dragLeave);
            tile.addEventListener("drop", dragDrop);
            tile.addEventListener("dragend", dragEnd);
            tile.setAttribute("draggable", true);
            
            // Touch functionality
            tile.addEventListener("touchstart", touchStart, { passive: false });
            tile.addEventListener("touchmove", touchMove, { passive: false });
            tile.addEventListener("touchend", touchEnd, { passive: false });
            
            // Add visual style to make it more polished
            tile.classList.add("candy-tile");
            
            boardElement.append(tile);
            row.push(tile);
        }
        board.push(row);
    }
    
    // Remove any matches from the initial board
    let hasMatches = true;
    while (hasMatches) {
        // Check and resolve any matches before game starts
        hasMatches = resolveInitialMatches();
    }
}

// Touch event handlers
function touchStart(e) {
    if (!gameActive) return;
    
    e.preventDefault();
    touchStartTile = this;
    this.classList.add("dragging");
}

function touchMove(e) {
    if (!gameActive || !touchStartTile) return;
    
    e.preventDefault();
}

function touchEnd(e) {
    if (!gameActive || !touchStartTile) return;
    
    e.preventDefault();
    
    // Get touch position
    const touch = e.changedTouches[0];
    // Get element at touch position
    const endElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Remove visual feedback
    touchStartTile.classList.remove("dragging");
    
    // If touch ended on another candy tile
    if (endElement && endElement.classList.contains("candy-tile") && endElement !== touchStartTile) {
        // Check if the tiles are adjacent
        let startCoords = touchStartTile.id.split("-");
        let startRow = parseInt(startCoords[0]);
        let startCol = parseInt(startCoords[1]);
        
        let endCoords = endElement.id.split("-");
        let endRow = parseInt(endCoords[0]);
        let endCol = parseInt(endCoords[1]);
        
        // Check if the move is to an adjacent tile
        let rowDiff = Math.abs(startRow - endRow);
        let colDiff = Math.abs(startCol - endCol);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Set up for swap
            currTile = touchStartTile;
            otherTile = endElement;
            
            // Perform the swap
            dragEnd();
        }
    }
    
    // Reset touch start tile
    touchStartTile = null;
}

// Check and resolve any matches in the initial board setup
function resolveInitialMatches() {
    let hasMatches = false;
    
    // Check rows for matches
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-2; c++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r][c+1].src);
            let candy3 = getImageName(board[r][c+2].src);
            
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                // Found a match, change one candy
                let newCandy;
                do {
                    newCandy = randomCandy();
                } while (newCandy === candy1);
                
                board[r][c+1].src = candyImages[newCandy];
                hasMatches = true;
            }
        }
    }
    
    // Check columns for matches
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-2; r++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r+1][c].src);
            let candy3 = getImageName(board[r+2][c].src);
            
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                // Found a match, change one candy
                let newCandy;
                do {
                    newCandy = randomCandy();
                } while (newCandy === candy1);
                
                board[r+1][c].src = candyImages[newCandy];
                hasMatches = true;
            }
        }
    }
    
    return hasMatches;
}

// Helper function to extract candy name from image URL
function getImageName(src) {
    for (const [name, url] of Object.entries(candyImages)) {
        if (src.includes(name.toLowerCase()) || src === url) {
            return name;
        }
    }
    return "blank";
}

// Start the game
function startGame() {
    buttonClickSound.play();
    startScreen.style.display = "none";
    gameActive = true;
    score = 0;
    timeLeft = 60;
    combo = 0;
    scoreDisplay.textContent = score;
    updateTimer();
    
    // Add a subtle animation to all candies at start
    animateAllCandies("candy-start");
    
    // Game loop
    gameInterval = setInterval(function() {
        if (gameActive) {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// Animate all candies with a specific class
function animateAllCandies(className) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            board[r][c].classList.add(className);
            setTimeout(() => {
                board[r][c].classList.remove(className);
            }, 500);
        }
    }
}

// Update the timer display
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Flash timer when low on time
    if (timeLeft <= 10) {
        timerDisplay.classList.add("timer-warning");
    } else {
        timerDisplay.classList.remove("timer-warning");
    }
}

// End the game
function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    
    // Check for high score
    finalScoreDisplay.textContent = score;
    finalHighScoreDisplay.textContent = highScore;
    
    const newHighScore = score > highScore;
    if (newHighScore) {
        highScore = score;
        localStorage.setItem('candyCrushHighScore', highScore);
        highScoreDisplay.textContent = highScore;
        finalHighScoreDisplay.textContent = highScore;
        gameOverTitle.textContent = "Congratulations!";
        congratsAnimation.classList.remove("hidden");
        highScoreSound.play();
    } else {
        gameOverSound.play();
        gameOverTitle.textContent = "Game Over!";
        congratsAnimation.classList.add("hidden");
    }
    
    // Show game over screen with a smooth animation
    gameOverScreen.classList.add("show");
}

// Restart the game
function restartGame() {
    buttonClickSound.play();
    gameOverScreen.classList.remove("show");
    createBoard(); // Recreate board for a fresh start
    startGame();
}

// Generate a random candy
function randomCandy() {
    return candies[Math.floor(Math.random() * candies.length)];
}

// Drag functions
function dragStart() {
    if (!gameActive) return;
    currTile = this;
    
    // Add visual feedback
    this.classList.add("dragging");
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    // Add hover effect to show valid drop target
    if (gameActive) {
        this.classList.add("drag-over");
    }
}

function dragLeave() {
    // Remove hover effect
    this.classList.remove("drag-over");
}

function dragDrop() {
    if (!gameActive) return;
    otherTile = this;
    this.classList.remove("drag-over");
}

function dragEnd() {
    if (!gameActive) return;
    
    // Remove visual feedback
    if (currTile) {
        currTile.classList.remove("dragging");
    }
    
    if (!currTile || !otherTile || 
        currTile.src.includes("blank") || 
        otherTile.src.includes("blank")) {
        return;
    }

    let currCoords = currTile.id.split("-");
    let r = parseInt(currCoords[0]);
    let c = parseInt(currCoords[1]);

    let otherCoords = otherTile.id.split("-");
    let r2 = parseInt(otherCoords[0]);
    let c2 = parseInt(otherCoords[1]);

    let moveLeft = c2 == c-1 && r == r2;
    let moveRight = c2 == c+1 && r == r2;
    let moveUp = r2 == r-1 && c == c2;
    let moveDown = r2 == r+1 && c == c2;
    let isAdjacent = moveLeft || moveRight || moveUp || moveDown;

    if (isAdjacent) {
        // Flag that this is a player-initiated move
        playerInitiatedMove = true;
        
        // Swap images with animation
        let currImg = currTile.src;
        let otherImg = otherTile.src;
        
        // Add swap animation before changing src
        currTile.classList.add("candy-pre-swap");
        otherTile.classList.add("candy-pre-swap");
        
        setTimeout(() => {
            currTile.src = otherImg;
            otherTile.src = currImg;
            
            currTile.classList.remove("candy-pre-swap");
            otherTile.classList.remove("candy-pre-swap");
            
            // Check if the move is valid
            let validMove = checkValidMove();
            if (validMove) {
                swapSound.play();
                // Animation for successful swap
                currTile.classList.add("candy-swap");
                otherTile.classList.add("candy-swap");
                
                setTimeout(() => {
                    currTile.classList.remove("candy-swap");
                    otherTile.classList.remove("candy-swap");
                    
                    // Process the matches made by player
                    let matchesMade = crushCandy();
                    
                    if (matchesMade) {
                        setTimeout(() => {
                            slideCandy();
                            setTimeout(() => {
                                generateCandy();
                                playerInitiatedMove = false; // Reset the flag after cascade completes
                            }, 500);
                        }, 300);
                    } else {
                        playerInitiatedMove = false;
                    }
                    
                }, 300);
            } else {
                // If not valid, swap back with animation
                invalidSound.play();
                
                setTimeout(() => {
                    currTile.classList.add("invalid-swap");
                    otherTile.classList.add("invalid-swap");
                    
                    setTimeout(() => {
                        currTile.src = currImg;
                        otherTile.src = otherImg;
                        currTile.classList.remove("invalid-swap");
                        otherTile.classList.remove("invalid-swap");
                        playerInitiatedMove = false;
                    }, 200);
                }, 100);
            }
        }, 150);
    }
}

// Check if there are any valid matches after swapping
function checkValidMove() {
    // Check rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-2; c++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r][c+1].src);
            let candy3 = getImageName(board[r][c+2].src);
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                return true;
            }
        }
    }

    // Check columns
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-2; r++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r+1][c].src);
            let candy3 = getImageName(board[r+2][c].src);
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                return true;
            }
        }
    }

    return false;
}

// Crush matched candies
function crushCandy() {
    let crushed = false;
    let pointsEarned = 0;

    // Check for five in a row
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-4; c++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r][c+1].src);
            let candy3 = getImageName(board[r][c+2].src);
            let candy4 = getImageName(board[r][c+3].src);
            let candy5 = getImageName(board[r][c+4].src);
            
            if (candy1 === candy2 && candy2 === candy3 && 
                candy3 === candy4 && candy4 === candy5 && 
                candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 5; i++) {
                    board[r][c+i].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r][c+i].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 5; i++) {
                    board[r][c+i].src = candyImages.blank;
                }
                
                // Higher score for five in a row
                if (playerInitiatedMove) {
                    pointsEarned += 75;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Check for five in a column
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-4; r++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r+1][c].src);
            let candy3 = getImageName(board[r+2][c].src);
            let candy4 = getImageName(board[r+3][c].src);
            let candy5 = getImageName(board[r+4][c].src);
            
            if (candy1 === candy2 && candy2 === candy3 && 
                candy3 === candy4 && candy4 === candy5 && 
                candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 5; i++) {
                    board[r+i][c].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r+i][c].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 5; i++) {
                    board[r+i][c].src = candyImages.blank;
                }
                
                // Higher score for five in a column
                if (playerInitiatedMove) {
                    pointsEarned += 75;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Check for four in a row
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-3; c++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r][c+1].src);
            let candy3 = getImageName(board[r][c+2].src);
            let candy4 = getImageName(board[r][c+3].src);
            
            if (candy1 === candy2 && candy2 === candy3 && 
                candy3 === candy4 && candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 4; i++) {
                    board[r][c+i].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r][c+i].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 4; i++) {
                    board[r][c+i].src = candyImages.blank;
                }
                
                // Higher score for four in a row
                if (playerInitiatedMove) {
                    pointsEarned += 50;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Check for four in a column
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-3; r++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r+1][c].src);
            let candy3 = getImageName(board[r+2][c].src);
            let candy4 = getImageName(board[r+3][c].src);
            
            if (candy1 === candy2 && candy2 === candy3 && 
                candy3 === candy4 && candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 4; i++) {
                    board[r+i][c].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r+i][c].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 4; i++) {
                    board[r+i][c].src = candyImages.blank;
                }
                
                // Higher score for four in a column
                if (playerInitiatedMove) {
                    pointsEarned += 50;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Check for three in a row
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns-2; c++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r][c+1].src);
            let candy3 = getImageName(board[r][c+2].src);
            
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 3; i++) {
                    board[r][c+i].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r][c+i].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 3; i++) {
                    board[r][c+i].src = candyImages.blank;
                }
                
                if (playerInitiatedMove) {
                    pointsEarned += 30;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Check for three in a column
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows-2; r++) {
            let candy1 = getImageName(board[r][c].src);
            let candy2 = getImageName(board[r+1][c].src);
            let candy3 = getImageName(board[r+2][c].src);
            
            if (candy1 === candy2 && candy2 === candy3 && candy1 !== "blank") {
                
                // Add crush animation
                for (let i = 0; i < 3; i++) {
                    board[r+i][c].classList.add("candy-crush");
                    setTimeout(() => {
                        board[r+i][c].classList.remove("candy-crush");
                    }, 300);
                }
                
                for (let i = 0; i < 3; i++) {
                    board[r+i][c].src = candyImages.blank;
                }
                
                if (playerInitiatedMove) {
                    pointsEarned += 30;
                    combo++;
                }
                
                crushed = true;
            }
        }
    }

    // Add combo bonus and update score if this was a player-initiated move
    if (crushed && playerInitiatedMove) {
        // Play match sound
        matchSound.play();
        
        // Add combo bonus for multiple matches
        if (combo > 1) {
            pointsEarned += (combo * 10); // Bonus points for combos
        }
        
        // Update score
        score += pointsEarned;
        
        // Display score with animation
        scoreDisplay.textContent = score;
        scoreDisplay.classList.add("score-update");
        setTimeout(() => {
            scoreDisplay.classList.remove("score-update");
        }, 500);
        
        // Check if current score is higher than high score
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            highScoreDisplay.classList.add("high-score-update");
            setTimeout(() => {
                highScoreDisplay.classList.remove("high-score-update");
            }, 500);
            localStorage.setItem('candyCrushHighScore', highScore);
        }
    } else if (!playerInitiatedMove) {
        // Reset combo if not player initiated
        combo = 0;
    }
    
    return crushed;
}

// Slide candies down when there are gaps
function slideCandy() {
    // Start from the bottom row and work upwards
    for (let c = 0; c < columns; c++) {
        let emptyCount = 0;
        
        // Count how many empty spaces in this column from bottom up
        for (let r = rows-1; r >= 0; r--) {
            if (board[r][c].src.includes("blank")) {
                emptyCount++;
            } else if (emptyCount > 0) {
                // If there's an empty space below, move this candy down
                board[r+emptyCount][c].src = board[r][c].src;
                board[r][c].src = candyImages.blank;
                
                // Add animation class
                board[r+emptyCount][c].classList.add("candy-drop");
                setTimeout(() => {
                    board[r+emptyCount][c].classList.remove("candy-drop");
                }, 500);
            }
        }
    }
}

// Generate new candies for empty spaces at the top
function generateCandy() {
    for (let c = 0; c < columns; c++) {
        let emptyCount = 0;
        
        // Count empty spaces at the top of the column
        for (let r = 0; r < rows; r++) {
            if (board[r][c].src.includes("blank")) {
                emptyCount++;
            }
        }
        
        // Fill empty spaces with new candies
        for (let i = 0; i < emptyCount; i++) {
            let candyType = randomCandy();
            board[i][c].src = candyImages[candyType];
            
            // Add animation
            board[i][c].classList.add("candy-drop");
            setTimeout(() => {
                board[i][c].classList.remove("candy-drop");
            }, 500);
        }
    }
    
    // After generating new candies, check for new matches
    // This creates chain reactions (cascade effect)
    setTimeout(() => {
        let hasMatches = crushCandy();
        if (hasMatches) {
            setTimeout(() => {
                slideCandy();
                setTimeout(() => {
                    generateCandy();
                }, 500);
            }, 300);
        }
    }, 500);
}