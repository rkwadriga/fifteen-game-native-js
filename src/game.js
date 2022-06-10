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
        this.bestMovesCountNode = null;
        this.bestTimeNode = null;
        this.personalRecordResetBtnNode = null;
        this.stepsCountNode = null;
        this.timeNode = null;
        this.shuffleBtnNode = null;
        this.movesCount = 0;
        this.time = 0;
        this.eventListeners = [];
        this.isMove = false;
        this.isStarted = false;
        this.isShuffling = false;
        this.correctValues = generateMatrix(this.size);
        this.wonSum = Math.pow(this.size, 2);
        this.controlSum = this.wonSum;
        this.startTime = null;
        this.timer = null;
        this.personalRecord = {
            moves: 0,
            time: 0
        }

        this.clickSquare = this.clickSquare.bind(this);
        this.clickArrow = this.clickArrow.bind(this);
        this.clickShuffleButton = this.clickShuffleButton.bind(this);
        this.clickResetPersonalRecordButton = this.clickResetPersonalRecordButton.bind(this);

        this.manageHTML();
        this.setEventHandlers();
        this.setPersonalRecord(localStorage.getItem(this.prsonalRecordStorageKey), false);
    }

    // <!--- HTML modifications -->
    manageHTML() {
        // Get main container
        const mainContainer = this.getElementByID(this.mainContainerID);
        mainContainer.classList.add(this.classPrefix + 'page');

        // Add "h1" title with game name
        mainContainer.appendChild(createElement('h1', this.classPrefix + 'main-title', 'Fifteen Game'));

        // Add "Personal record" block
        this.personalRecordNode = createElement('div', this.classPrefix + 'personal-record');

        // Add "Best moves count" block to page
        this.bestMovesCountNode = createElement('span', this.classPrefix + 'stats-record-value', this.personalRecord.moves);
        const bestMovesBlock = createElement('p', this.classPrefix + 'stats-record', 'Best moves count:&nbsp;');
        bestMovesBlock.appendChild(this.bestMovesCountNode);
        this.personalRecordNode.appendChild(bestMovesBlock);

        // Add "Best time" block to page
        this.bestTimeNode = createElement('span', this.classPrefix + 'stats-record-value', this.personalRecord.time);
        const bestTimeBlock = createElement('p', this.classPrefix + 'stats-record', 'Best time:&nbsp;');
        bestTimeBlock.appendChild(this.bestTimeNode);
        this.personalRecordNode.appendChild(bestTimeBlock);

        // Add "reset personal record" button to page
        this.personalRecordResetBtnNode = createElement('button', this.classPrefix + 'button', 'Reset personal record');
        this.personalRecordNode.appendChild(this.personalRecordResetBtnNode);
        mainContainer.appendChild(this.personalRecordNode);

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

        // Add "game process" block to page
        const gameProcessBlock = createElement('div', this.classPrefix + 'game-process');

        // Add "Moves count" block to page
        this.stepsCountNode = createElement('span', this.classPrefix + 'stats-record-value', this.movesCount);
        const movesCountBlock = createElement('p', this.classPrefix + 'stats-record', 'Moves count:&nbsp;');
        movesCountBlock.appendChild(this.stepsCountNode);
        gameProcessBlock.appendChild(movesCountBlock);

        // Add "time" block to page
        this.timeNode = createElement('span', this.classPrefix + 'stats-record-value', '00:00:00');
        const timeBlock = createElement('p', this.classPrefix + 'stats-record', 'Time:&nbsp;');
        timeBlock.appendChild(this.timeNode);
        gameProcessBlock.appendChild(timeBlock);

        // Add "shuffle" button to page
        this.shuffleBtnNode = createElement('button', this.classPrefix + 'button', 'Shuffle');
        gameProcessBlock.appendChild(this.shuffleBtnNode);
        mainContainer.appendChild(gameProcessBlock);

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
        // Remove all "updated" classes from page
        this.gameNode.classList.remove(this.wonClass);
        this.stepsCountNode.classList.remove(this.updatedValueClass);
        this.timeNode.classList.remove(this.updatedValueClass);
        this.bestMovesCountNode.classList.remove(this.updatedValueClass);
        this.bestTimeNode.classList.remove(this.updatedValueClass);
        // Refresh the Moves count
        this.setMovesCount(0);
        // Stop the timer
        this.stopTimer();
        this.setTime(0);
    }

    clickResetPersonalRecordButton() {
        if (confirm('Are you sure you want to rest your personal record?')) {
            this.setPersonalRecord({moves: 0, time: 0});
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
                    // Disable shuffling
                    this.isShuffling = false;
                }
            }, i * 200);
        }
    }

    startTimer() {
        if (this.timer === null) {
            this.startTime = (new Date()).valueOf();
            this.timer = setInterval(() => {
                this.setTime();
            }, 100);
        }
    }

    stopTimer() {
        if (this.timer !== null) {
            clearInterval(this.timer);
        }
        this.timer = null;
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

        // Start the timer if ti's not
        this.startTimer();

        // Increment Moves count
        this.setMovesCount();

        // If this is the user's move - check if the game is over
        if (this.checkIsWon()) {
            this.won();
        }
    }

    setMovesCount(count = null) {
        // Do not calculate the Moves count before the squares was shuffled
        if (!this.isStarted) {
            return;
        }
        if (count === null) {
            count = this.movesCount + 1;
        }
        this.movesCount = count;
        this.stepsCountNode.innerText = this.movesCount;
    }

    setTime(time = null) {
        if (time === 0) {
            time = '00:00:00';
        } else {
            if (this.startTime === null) {
                this.startTime = (new Date()).valueOf();
            }
            time = getTimeSpend(this.startTime);
        }
        this.time = time;
        this.timeNode.innerText = this.time;
    }

    setPersonalRecord(record, isNew = true) {
        if (typeof record === 'string') {
            record = JSON.parse(record);
        }
        if (record !== null) {
            this.personalRecord = record;
        }
        this.bestMovesCountNode.classList.remove(this.updatedValueClass);
        this.bestTimeNode.classList.remove(this.updatedValueClass);

        if (this.personalRecord.moves === 0 && this.personalRecord.time === 0) {
            if (isNew) {
                localStorage.removeItem(this.prsonalRecordStorageKey);
            }
            this.personalRecordNode.classList.add(this.hiddenClass);
        } else {
            if (isNew) {
                localStorage.setItem(this.prsonalRecordStorageKey, JSON.stringify(this.personalRecord));
                this.bestMovesCountNode.classList.add(this.updatedValueClass);
                this.bestTimeNode.classList.add(this.updatedValueClass);
            }
            this.bestMovesCountNode.innerText = this.personalRecord.moves;
            this.bestTimeNode.innerText = this.personalRecord.time;
            this.personalRecordNode.classList.remove(this.hiddenClass);
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
        // Stop the timer
        this.stopTimer();
        // Make a new game impossible before the new shuffle
        this.isStarted = false;
        this.gameNode.classList.add(this.wonClass);
        if (this.personalRecord.moves === 0 || this.movesCount < this.personalRecord.moves || this.time < this.personalRecord.time) {
            this.setPersonalRecord({
                moves: this.personalRecord.moves === 0 || this.movesCount < this.personalRecord.moves ? this.movesCount : this.personalRecord.moves,
                time: this.personalRecord.time === 0 || this.time < this.personalRecord.time ? this.time : this.personalRecord.time
            }, true);
        }
        // Add "updated" class to "moves count" and "time" blocks
        this.stepsCountNode.classList.add(this.updatedValueClass);
        this.timeNode.classList.add(this.updatedValueClass);
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

function getTimeSpend(startTime) {
    const timeDiff = (new Date()).valueOf() - startTime;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let milliseconds = Math.floor(timeDiff / 10);
    if (milliseconds < 100) {
        return formatTime(hours, minutes, seconds, milliseconds);
    }

    seconds = Math.floor(timeDiff / 1000);
    milliseconds -= seconds * 100;
    if (seconds < 60) {
        return formatTime(hours, minutes, seconds, milliseconds);
    }

    minutes = Math.floor(timeDiff / 60000);
    seconds -= minutes * 60;
    if (minutes < 60) {
        return formatTime(hours, minutes, seconds, milliseconds);
    }

    hours = Math.floor(timeDiff / 3600000);
    minutes -= hours * 60;

    return formatTime(hours, minutes, seconds, milliseconds);
}

function formatTime(hours, minutes, seconds, milliseconds) {
    const numberToString = (num) => {
        let str = String(num);
        if (str.length === 2) {
            return str;
        }
        if (str.length < 2) {
            return '0' + str;
        }
        return str.substring(0, 2);
    };

    const minutesStr = [numberToString(minutes), numberToString(seconds), numberToString(milliseconds)].join(':');
    return hours === 0 ? minutesStr : numberToString(hours) + ':' + minutesStr;
}