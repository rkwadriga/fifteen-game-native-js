class Fifteen {
    constructor(containerID, gameSize = 4, complicity = 50) {
        if (gameSize <= 0) {
            throw new Error(`Invalid game size: ${gameSize}`);
        }
        if (complicity <= 0) {
            throw new Error(`Invalid game complicity: ${complicity}`);
        }
        this.mainContainerID = containerID;
        this.classPrefix = '__fifteen_game_';
        this.wonClass = this.classPrefix + 'game_won';
        this.updatedValueClass = this.classPrefix + 'updated';
        this.hiddenClass = this.classPrefix + 'hidden';
        this.prsonalRecordStorageKey = `__fifteen_name_record_${gameSize}_${complicity}`;
        this.size = gameSize;
        this.complicity = complicity;
        this.squares = generateMatrix(this.size);
        this.gameNode = null;
        this.emptySquare = null;
        this.personalRecordNode = null;
        this.personalRecordResetBtnNode = null;
        this.stepsCountNode = null;
        this.shuffleBtnNode = null;
        this.personalRecord = 0;
        this.stepsCount = 0;
        this.eventListeners = [];
        this.isMove = false;
        this.isStarted = false;
        this.isShuffling = false;
        this.correctValues = generateMatrix(this.size);
        this.wonSum = Math.pow(this.size, 2);
        this.controlSum = this.wonSum;

        this.clickSquare = this.clickSquare.bind(this);
        this.clickArrow = this.clickArrow.bind(this);
        this.clickShuffleButton = this.clickShuffleButton.bind(this);
        this.clickResetPersonalRecordButton = this.clickResetPersonalRecordButton.bind(this);

        this.manageHTML();
        this.setEventHandlers();
        this.setPersonalRecord(Number(localStorage.getItem(this.prsonalRecordStorageKey)), false);
    }

    // <!--- HTML modifications -->
    manageHTML() {
        // Get main container
        const mainContainer = this.getElementByID(this.mainContainerID);
        mainContainer.classList.add(this.classPrefix + 'page');

        // Add "h1" title with game name
        mainContainer.appendChild(createElement('h1', this.classPrefix + 'main-title', 'Fifteen Game'));

        // Add "Personal record" block to page
        this.personalRecordNode = createElement('span', this.classPrefix + 'stats-record-value', this.personalRecord);
        const personalRecordBlock = createElement('p', this.classPrefix + 'stats-record', 'Personal record:&nbsp;');
        personalRecordBlock.appendChild(this.personalRecordNode);
        mainContainer.appendChild(personalRecordBlock);

        // Add "reset personal record" button to page
        this.personalRecordResetBtnNode = createElement('button', this.classPrefix + 'button', 'Reset personal record');
        mainContainer.appendChild(this.personalRecordResetBtnNode);

        // Create game container and add squares items
        const squareSize = (100 / this.size) + '%';
        this.gameNode = createElement('div', this.classPrefix + 'game');
        let value = 0;
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const squareNode = createElement('button', this.classPrefix + 'square');
                squareNode.appendChild(createElement('span', this.classPrefix + 'square-value', ++value));
                squareNode.dataset.x = String(x);
                squareNode.dataset.y = String(y);
                squareNode.style.width = squareSize;
                squareNode.style.height = squareSize;

                this.emptySquare = {
                    value,
                    x,
                    y,
                    node: squareNode
                };
                this.setSquarePosition(this.emptySquare, x, y);

                this.squares[x][y] = this.emptySquare;
                this.correctValues[x][y] = value;
                this.gameNode.appendChild(squareNode);
            }
        }

        // Add game container to page
        mainContainer.appendChild(this.gameNode);

        // Add "steps count" block to page
        this.stepsCountNode = createElement('span', this.classPrefix + 'stats-record-value', this.stepsCount);
        const pageCountBlock = createElement('p', this.classPrefix + 'stats-record', 'Steps count:&nbsp;');
        pageCountBlock.appendChild(this.stepsCountNode);
        mainContainer.appendChild(pageCountBlock);

        // Add "shuffle" button to page
        this.shuffleBtnNode = createElement('button', this.classPrefix + 'button', 'Shuffle');
        mainContainer.appendChild(this.shuffleBtnNode);

        // Hide the last square
        this.emptySquare.node.classList.add(this.hiddenClass);
    }

    setSquarePosition(square, x, y) {
        const shift = 100;
        square.node.style.transform = `translate3D(${x * shift}%, ${y * shift}%, 0)`;
    }
    // <!--- /HTML modifications -->

    // <!--- Event handlers -->
    setEventHandlers() {
        this.eventListeners = [
            {name: 'click', callback: this.clickSquare, target: this.gameNode},
            {name: 'keydown', callback: this.clickArrow, target: window},
            {name: 'click', callback: this.clickShuffleButton, target: this.shuffleBtnNode},
            {name: 'click', callback: this.clickResetPersonalRecordButton, target: this.personalRecordResetBtnNode}
        ];
        this.eventListeners.forEach(listener => {
            listener.target.addEventListener(listener.name, listener.callback);
        });
    }

    clickSquare(event) {
        // Do not move the squares if it's shuffling
        if (this.isShuffling) {
            return;
        }

        const square = event.target.closest('button');
        if (square === null) {
            return;
        }
        if (square.dataset.x === undefined || square.dataset.y === undefined) {
            throw new Error('Invalid game square dataset: items "x" and "y" are required');
        }

        // Move the square
        this.isMove = true;
        this.moveSquare(Number(square.dataset.x), Number(square.dataset.y));
    }

    clickArrow(event) {
        // Do not move the squares if it's shuffling
        if (this.isShuffling) {
            return;
        }

        const direction = event.key.match(/arrow(left|right|up|down)/i);
        if (direction === null) {
            return;
        }

        // Get the blank square item coordinates
        let [newX, newY] = [this.emptySquare.x, this.emptySquare.y];

        // Calculate the moved square item coordinates and find this item
        switch (direction[1].toLowerCase()) {
            case 'left':
                newX++;
                break;
            case 'right':
                newX--;
                break;
            case 'up':
                newY++;
                break;
            case 'down':
                newY--;
                break;
        }

        // Try to move the square
        this.isMove = this;
        this.moveSquare(newX, newY, false);
    }

    clickShuffleButton() {
        // Do not start the next shuffle if it's shuffling
        if (this.isShuffling) {
            return;
        }

        // Set "isMove" flag to false to disable game finishing checking
        this.isMove = false;

        // Block any user actions on shuffling
        this.isShuffling = true;

        // Shuffle squares
        this.shuffleSquares();

        // After the shuffle game can be started
        this.isStarted = true;
        // Remove all "game-finished" classes from page
        this.gameNode.classList.remove(this.wonClass);
        this.stepsCountNode.classList.remove(this.updatedValueClass);
        this.personalRecordNode.classList.remove(this.updatedValueClass);
        // Refresh the steps count
        this.setStepsCount(0);
    }

    clickResetPersonalRecordButton() {
        if (confirm('Are you sure you want to rest your personal record?')) {
            this.setPersonalRecord(0);
        }
    }

    destroyEvents() {
        this.eventListeners.forEach(listener => listener.target.removeEventListener(listener.name, listener.callback));
    }
    // <!--- /Event handlers -->

    // <!--- Game process --->
    shuffleSquares() {
        // Create variable for the last move (to not repeat the moves)
        this.lastMove = null;
        // Make the random moves
        for (let i = 0; i < this.complicity; i++) {
            setTimeout(() => {
                this.randomMove();
                if (i === this.complicity - 1) {
                    this.isShuffling = false;
                }
            }, i * 200);
        }
    }

    moveSquare(x, y, throwNotFoundException = true) {
        // Try to find the square by coordinates
        if (this.squares[x] === undefined) {
            if (throwNotFoundException) {
                throw new Error(`Invalid row number: ${x}`);
            } else {
                return;
            }
        }
        if (this.squares[x][y] === undefined) {
            if (throwNotFoundException) {
                throw new Error(`Invalid column number: ${y}`);
            } else {
                return;
            }
        }

        // Check is it possible to move the square
        if (Math.abs(this.emptySquare.x - x) + Math.abs(this.emptySquare.y - y) !== 1) {
            return;
        }

        // Remember the moved square and the empty square coordinates
        const movedSquare = this.squares[x][y];
        const [newX, newY] = [this.emptySquare.x, this.emptySquare.y];

        // Move the squares in page
        this.setSquarePosition(this.emptySquare, x, y);
        this.setSquarePosition(movedSquare, newX, newY);

        // Swap the squares in memory
        this.emptySquare.x = x;
        this.emptySquare.y = y;
        this.emptySquare.node.dataset.x = String(x);
        this.emptySquare.node.dataset.y = String(y);
        movedSquare.x = newX;
        movedSquare.y = newY;
        movedSquare.node.dataset.x = String(newX);
        movedSquare.node.dataset.y = String(newY);
        this.squares[x][y] = this.emptySquare;
        this.squares[newX][newY] = movedSquare;

        // Increment the control sum
        this.incrementControlSum(newX, newY);

        // If this is shuffling move - do not calculate the steps and do not check the game finish
        if (!this.isMove) {
            return;
        }

        // Increment steps count
        this.setStepsCount();

        // If this is the user's move - check if the game is over
        if (this.checkIsWon()) {
            this.won();
        }
    }

    setStepsCount(count = null) {
        // Do not calculate the steps count before the squares was shuffled
        if (!this.isStarted) {
            return;
        }
        if (count === null) {
            count = this.stepsCount + 1;
        }
        this.stepsCount = count;
        this.stepsCountNode.innerText = this.stepsCount;
    }

    setPersonalRecord(record, isNew = true) {
        this.personalRecord = record;
        this.personalRecordNode.innerText = record;
        if (isNew) {
            if (record <= 0) {
                localStorage.removeItem(this.prsonalRecordStorageKey)
                this.personalRecordNode.classList.remove(this.updatedValueClass);
            } else {
                localStorage.setItem(this.prsonalRecordStorageKey, String(record));
                this.personalRecordNode.classList.add(this.updatedValueClass);
            }
        }
        if (record <= 0) {
            this.personalRecordNode.parentNode.classList.add(this.hiddenClass);
            this.personalRecordResetBtnNode.classList.add(this.hiddenClass);
        } else {
            this.personalRecordNode.parentNode.classList.remove(this.hiddenClass);
            this.personalRecordResetBtnNode.classList.remove(this.hiddenClass);
        }
    }

    randomMove() {
        // Get the start blank item coordinates
        let [x, y] = [this.emptySquare.x, this.emptySquare.y];
        const maxVal = this.size - 1;
        const randomVal = Math.random();
        let shuffle = 0;

        if (randomVal < 0.25) {
            if (x < maxVal && this.lastMove !== 'x_m') {
                shuffle = 1;
            } else if (x === maxVal && this.lastMove !== 'x_p') {
                shuffle = -1;
            }
        } else if (randomVal < 0.5) {
            if (x > 0 && this.lastMove !=='x_p') {
                shuffle = -1;
            } else if (x === 0 && this.lastMove !== 'x_m') {
                shuffle = 1;
            }
        } else if (randomVal < 0.75) {
            if (y < maxVal && this.lastMove !== 'y_m') {
                shuffle = 1;
            } else if (x === maxVal && this.lastMove !== 'x_p') {
                shuffle = -1;
            }
        } else {
            if (y > 0 && this.lastMove !== 'y_p') {
                shuffle = -1;
            } else if (x === 0 && this.lastMove !== 'x_m') {
                shuffle = 1;
            }
        }

        // To not repeat the moves - try to find another move
        if (shuffle === 0) {
            return this.randomMove();
        }

        // Change target coordinates
        if (randomVal < 0.5) {
            x += shuffle;
            this.lastMove = shuffle === 1 ? 'x_p' : 'x_m';
        } else {
            y += shuffle;
            this.lastMove = shuffle === 1 ? 'y_p' : 'y_m';
        }

        // And make a move
        this.moveSquare(x, y, false);
    }

    incrementControlSum(x, y) {
        const movedItemValue = this.squares[x][y].value;

        // If moved square position was correct before move that means that it's now incorrect and control sum is changed
        if (movedItemValue === this.correctValues[this.emptySquare.x][this.emptySquare.y]) {
            this.controlSum--;
            return;
        }

        // If the square had incorrect position before move and now it has the correct one - control sum must be changed
        if (movedItemValue === this.correctValues[x][y]) {
            this.controlSum++;
        }
    }

    checkIsWon() {
        return this.controlSum === this.wonSum;
    }

    won() {
        // Impossible to win before the squares was shuffled
        if (!this.isStarted) {
            return;
        }
        // Make a new game impossible before the new shuffle
        this.isStarted = false;
        this.gameNode.classList.add(this.wonClass);
        this.stepsCountNode.classList.add(this.updatedValueClass);
        if (this.personalRecord === 0 || this.stepsCount < this.personalRecord) {
            this.setPersonalRecord(this.stepsCount);
        }
    }
    // <!--- /Game process --->

    getElementByID(elementID) {
        const element = document.getElementById(elementID);
        if (element === null) {
            throw new Error(`Element #${elementID} not found`);
        }
        return element;
    }
}

// Helpers
function createElement(type, className, content = '') {
    const element = document.createElement(type);
    element.classList.add(className);
    element.innerHTML = content;
    return element;
}

function generateMatrix(size, fillVal = undefined, depth = 0) {
    let arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(depth === 0 ? generateMatrix(size, fillVal, 1) : fillVal);
    }
    return arr;
}