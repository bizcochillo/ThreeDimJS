var circuitHandler;

function loadCircuit(circuit) {
    let element = document.getElementsByClassName('editor')[0];
    element.innerHTML = '';
    if (!circuit.code) return;
    let tokens = circuit.code.split(',');
    for (let token of tokens) {
        element.innerHTML += `<div class="editor-tokens"><div class="editor-buttons"><button class="editor-button">+</button><button class="editor-button">x</button></div>${token}</div>`;
    }
}

function addCircuit(circuit) {
    let newElement = false;
    if (!circuit) {
        circuit = new Circuit('M 0 0 0 N');
        circuit.name = 'New circuit';
        circuitHandler.setCircuit(circuit);
        newElement = true;
    }
    let element = document.getElementsByClassName('picker')[0];
    let circuitBtn = document.createElement("BUTTON");
    circuitBtn.className = 'circuit-button';
    circuitBtn.addEventListener("click", selectCircuitHandler);
    circuitBtn.innerHTML = circuit.name;
    element.appendChild(circuitBtn);
    loadCircuit(circuit.code);
    if (newElement)
        selectCircuit(circuitBtn);
}

class Circuit {

    constructor(code, isPattern = false) {
        this.code = code;
        this.isPattern = isPattern;
        this.name = '';
    }
}

class CircuitHandler {
    initialize() {
        // fill with the two patterns.
        let pattern1 = new Circuit(
            'M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10',
            true);
        pattern1.name = 'Example 1';
        this.circuits.push(pattern1);
        addCircuit(pattern1); // TODO: Remove UI interaction

        let pattern2 = new Circuit(
            'M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15',
            true);
        pattern2.name = 'Example 2';
        this.circuits.push(pattern2);
        addCircuit(pattern2); // TODO: Remove UI interaction
    }

    setCircuit(circuit) {
        this.circuits.push(circuit);
    }

    getCircuit(index) {
        return this.circuits[index];
    }

    removeCircuit(index) {
        this.circuits.splice(index, 1);
    }

    getNumCircuits() {
        return this.circuits.length;
    }

    constructor() {
        this.circuits = [];
        this.initialize();
    }
}

function index(el) {
    if (!el) return -1;
    var i = 0;
    do {
        i++;
    } while (el = el.previousElementSibling);
    return i - 1;
}

function selectCircuit(element) {
    let current = document.getElementsByClassName("active");
    if (current.length > 0)
        current[0].className = current[0].className.replace(" active", "");
    element.className += " active";
    let circuitIdx = index(element);
    loadCircuit(circuitHandler.getCircuit(circuitIdx));
}

function removeCircuit() {
    let current = document.getElementsByClassName("active");
    if (current.length === 0) return;
    let circuitIdx = index(current[0]);
    //update UI
    let currentElement = current[0];
    currentElement.parentNode.removeChild(currentElement);
    circuitHandler.removeCircuit(circuitIdx);
    let newIndex = Math.max(circuitIdx - 1, 0);
    let elements = document.getElementsByClassName("circuit-button");
    elements[newIndex].className += " active";
    loadCircuit(circuitHandler.getCircuit(newIndex));
}

function selectCircuitHandler() {
    selectCircuit(this);
}

window.onload = function() {
    circuitHandler = new CircuitHandler;

    // Add active class to the current button (highlight it)
    var header = document.getElementsByClassName("picker")[0];
    var btns = header.getElementsByClassName("circuit-button");
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", selectCircuitHandler);
    }
};