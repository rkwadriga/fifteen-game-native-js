class Fifteen {
    constructor(containerID, gameSize = 4, complicity = 100) {
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
        this.emptySquare = null;
        this.gameNode = null;
        this.congratulationsNode = null;
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
        this.shiftPressed = false;
        this.isShuffling = false;
        this.isStarted = false;
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
        this.shiftUp = this.shiftUp.bind(this);
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

        // Add "Congratulations" block
        this.congratulationsNode = createElement('p', this.classPrefix + 'congratulations');
        this.congratulationsNode.classList.add(this.hiddenClass);
        this.personalRecordNode.appendChild(this.congratulationsNode);

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

    addCongratulationsBlock(movesUpgraded, timeUpgraded) {
        // Create "congratulations" content block
        const congratulationsContentBlock = createElement('div', this.classPrefix + 'congratulations-block-content');
        congratulationsContentBlock.appendChild(
            createElement('h4', this.classPrefix + 'congratulations-title', 'Congratulations, you won!')
        );

        // Add statistics elements
        let movesCountText = 'Moves: ' + this.movesCount;
        if (movesUpgraded > 0) {
            movesCountText += ` (+${movesUpgraded}%)`
        }
        let timeText = 'Time: ' + this.time;
        if (timeUpgraded > 0) {
            timeText += ` (+${timeUpgraded}%)`
        }
        congratulationsContentBlock.appendChild(createElement('p', this.classPrefix + 'record-improved', movesCountText));
        congratulationsContentBlock.appendChild(createElement('p', this.classPrefix + 'record-improved', timeText));

        // Clear block content adn add the "congratulations" content
        this.congratulationsNode.innerHTML = '';
        this.congratulationsNode.appendChild(congratulationsContentBlock);
        this.congratulationsNode.classList.remove(this.hiddenClass);
    }
    // <!--- /HTML modifications -->

    // <!--- Event handlers -->
    setEventHandlers() {
        this.eventListeners = [
            {name: 'click', callback: this.clickSquare, target: this.gameNode},
            {name: 'keydown', callback: this.clickArrow, target: window},
            {name: 'keyup', callback: this.shiftUp, target: window},
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

        // Get clicked square coordinates
        const [x, y] = [Number(square.dataset.x), Number(square.dataset.y)];

        // If it's not possible to move the square - try to move the group of them
        if (!this.moveSquare(x, y)) {
            this.moveSquaresGroup(x, y);
        }
    }

    clickArrow(event) {
        // Do not move the squares if it's shuffling
        if (this.isShuffling) {
            return;
        }
        // If this is "Shift" key = remember the shift is pressed and return
        if (event.key.toLowerCase() === 'shift') {
            this.shiftPressed = true;
            return;
        }
        // Get pressed arrow direction
        const direction = event.key.match(/arrow(left|right|up|down)/i);
        if (direction === null) {
            return;
        }

        // Get the blank square item coordinates
        let [x, y] = [this.emptySquare.x, this.emptySquare.y];

        // Calculate the moved square item coordinates and find this item
        switch (direction[1].toLowerCase()) {
            case 'left':
                x++;
                break;
            case 'right':
                x--;
                break;
            case 'up':
                y++;
                break;
            case 'down':
                y--;
                break;
        }

        // Try to move the square or row if "Shift" button is pressed
        if (this.shiftPressed) {
            this.moveSquaresGroup(x, y);
        } else {
            this.moveSquare(x, y, false);
        }
    }

    shiftUp(event) {
        if (event.key.toLowerCase() === 'shift') {
            this.shiftPressed = false;
        }
    }

    clickShuffleButton() {
        // Do not start the next shuffle if it's shuffling
        if (this.isShuffling) {
            return;
        }
        this.isShuffling = true;

        // Stop the game process to block any user actions on shuffling
        this.isStarted = false;

        // Shuffle squares
        this.shuffleSquares();

        // Remove all "updated" classes from page
        this.gameNode.classList.remove(this.wonClass);
        this.stepsCountNode.classList.remove(this.updatedValueClass);
        this.timeNode.classList.remove(this.updatedValueClass);
        this.bestMovesCountNode.classList.remove(this.updatedValueClass);
        this.bestTimeNode.classList.remove(this.updatedValueClass);
        // Stop the timer
        this.stopTimer();

        // Hide the congratulations block
        this.congratulationsNode.classList.add(this.hiddenClass);
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
                // If this is is the last move - disable the shuffling and start the game
                if (i === this.complicity - 1) {
                    this.isShuffling = false;
                    this.isStarted = true;
                    // Refresh the timer and the moves count
                    this.setMovesCount(0);
                    this.setTime(0);
                }
            }, i * 100);
        }
    }

    startTimer() {
        this.startTime = (new Date()).valueOf();
        this.timer = setInterval(() => {
            this.setTime();
        }, 100);
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
                return false;
            }
        }
        if (this.squares[x][y] === undefined) {
            if (throwNotFoundException) {
                throw new Error(`Invalid column number: ${y}`);
            } else {
                return false;
            }
        }

        // Check is it possible to move the square
        if (Math.abs(this.emptySquare.x - x) + Math.abs(this.emptySquare.y - y) !== 1) {
            return false;
        }

        // Swap the square and the empty one
        this.swap(x, y);

        // If this is shuffling move or move before shuffling - do not calculate the steps and do not check the game finish
        if (!this.isStarted) {
            return true;
        }

        this.incrementMove();
        return true;
    }

    moveSquaresGroup(x, y) {
        const [deltaX, deltaY] = [x - this.emptySquare.x, y - this.emptySquare.y];

        // Check if selected square in the same line as an empty one
        if (deltaX !== 0 && deltaY !== 0) {
            return;
        }

        let [x1, y1, x2, y2] = [x, y, 0, 0];
        if (deltaY === 0) {
            // Move the row
            if (deltaX < 0) {
                // Move to the right
                x1 = this.emptySquare.x - 1;
                if (deltaX !== -1) {
                    x2 = x;
                }
                for (let i = x1; i >= x2; i--) {
                    this.swap(i, y);
                }
            } else {
                // Move to the left
                x2 = this.size - 1;
                if (deltaX !== 1) {
                    x1 = this.emptySquare.x + 1;
                    x2 = x;
                }
                for (let i = x1; i <= x2; i++) {
                    this.swap(i, y);
                }
            }
        } else {
            // Move the column
            if (deltaY < 0) {
                // Move to the down
                y1 = this.emptySquare.y - 1;
                if (deltaY !== -1) {
                    y2 = y;
                }
                for (let i = y1; i >= y2; i--) {
                    this.swap(x, i);
                }
            } else {
                // Move to the top
                y2 = this.size - 1;
                if (deltaY !== 1) {
                    y1 = this.emptySquare.y + 1;
                    y2 = y;
                }
                for (let i = y1; i <= y2; i++) {
                    this.swap(x, i);
                }
            }
        }

        if (this.isStarted) {
            this.incrementMove();
        }
    }

    swap(x, y) {
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
    }

    incrementMove() {
        // Start the timer if ti's not
        if (this.timer === null) {
            this.startTimer();
        }

        // Increment Moves count
        this.setMovesCount();

        // If this is the user's move - check if the game is over
        if (this.isWon()) {
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
        const oldRecord = this.personalRecord;
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
                if (oldRecord.moves === 0 || oldRecord.moves > this.personalRecord.moves) {
                    this.bestMovesCountNode.classList.add(this.updatedValueClass);
                }
                if (oldRecord.time === 0 || oldRecord.time > this.personalRecord.time) {
                    this.bestTimeNode.classList.add(this.updatedValueClass);
                }
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

    isWon() {
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

        // If this is a best moves count or time - set a new personal record
        let [movesUpgraded, timeUpgraded] = [0, 0];
        if (this.personalRecord.moves === 0 || this.movesCount < this.personalRecord.moves || this.time < this.personalRecord.time) {
            const record = this.personalRecord;
            if (record.moves === 0 || this.movesCount < record.moves) {
                if (record.moves !== 0) {
                    movesUpgraded = getPercents(record.moves - this.movesCount, record.moves);
                }
                record.moves = this.movesCount;
            }
            if (record.time === 0 || this.time < record.time) {
                if (record.time !== 0) {
                    const [oldTime, newTime] = [parseTimeString(record.time), parseTimeString(this.time)];
                    timeUpgraded = getPercents(oldTime - newTime, oldTime);
                }
                record.time = this.time;
            }
            this.setPersonalRecord(record, true);
        }

        // Add "congratulations" block
        this.addCongratulationsBlock(movesUpgraded, timeUpgraded);

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

function parseTimeString(timeStr) {
    const timeParts = timeStr.split(':');
    const hours = timeParts.length === 4 ? Number(timeParts.shift()) : 0;
    const minutes = Number(timeParts.shift());
    const seconds = Number(timeParts.shift());
    const milliseconds = Number(timeParts.shift());

    return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds * 10;
}

function getPercents(num, from) {
    if (num === 0 || from === 0) {
        return 100;
    }
    return (num / from * 100).toFixed(2);
}