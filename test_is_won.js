const game = new Fifteen('__game', 4);

const containerNode = document.getElementById('__game');
const testBlock = createElement('div', '__testing-block');
testBlock.style.margin = '20px 0';

const testInputContainer = createElement('div', '__testing-input-container', 'Moves count:&nbsp;');
testInputContainer.style.margin = '5px 0';
const testInput = createElement('input', '__testing-input');
testInput.value = 1;
testInputContainer.appendChild(testInput);
testBlock.appendChild(testInputContainer);

const testShuffleButton = createElement('button', game.classPrefix + 'button', 'Shuffle');
testBlock.appendChild(testShuffleButton);

const testButton = createElement('button', game.classPrefix + 'button', 'Test');
testBlock.appendChild(testButton);

const resultsBlockContainer = createElement('p', '__testing-results-container', 'Results:&nbsp;');
resultsBlockContainer.style.margin = '5px 0';
const resultsBlock = createElement('span', '__testing-results-block');
resultsBlockContainer.appendChild(resultsBlock);
testBlock.appendChild(resultsBlockContainer);

containerNode.appendChild(testBlock);

const N = Math.pow(game.size, 2);

testShuffleButton.onclick = () => {
    shuffle();
};

testButton.onclick = () => {
    const startTime = (new Date()).valueOf() / 1000;
    const movesCount = Number(testInput.value);
    if (movesCount === 0) {
        alert('Write a correct moves count!');
        return;
    }

    for (let i = 0; i < movesCount; i++) {
        //game.lastMove = null;
        //game.randomMove();
        checkIsWonControlSum();
    }

    const newTime = (new Date()).valueOf() / 1000;
    const timeDiff = newTime - startTime;
    resultsBlock.innerText = `Finished test for ${movesCount} moves. Runtime: ${timeDiff}`;
}

function checkIsWonDirectCycle() {
    let lastValue = 1;
    for (let y = 0; y < game.size; y++) {
        for (let x = 0; x < game.size; x++) {
            if (game.squares[x][y].value !== lastValue++) {
                return false;
            }
        }
    }
    return true;
}

function checkIsWonReverseCycle() {
    let lastValue = N;
    const size = game.size - 1;
    for (let y = size; y >= 0; y--) {
        for (let x = size; x >= 0; x--) {
            if (game.squares[x][y].value !== lastValue--) {
                return false;
            }
        }
    }
    return true;
}

function checkIsWonControlSum() {
    return game.controlSum === game.wonSum;
}

function shuffle() {
    for (let i = 0; i < 50; i++) {
        game.randomMove();
    }
}