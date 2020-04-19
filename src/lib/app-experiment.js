function loadCircuit(circuit) {
    let element = document.getElementsByClassName('editor')[0];
    let tokens = circuit.split(',');
    element.innerHTML = '';
    for (let token of tokens) {
        element.innerHTML += `<div class="editor-tokens"><div class="editor-buttons"><button class="editor-button">+</button><button class="editor-button">x</button></div>${token}</div>`;
    }
}

function loadPattern1() {
    let pattern = 'M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10';
    loadCircuit(pattern);
}

function loadPattern2() {
    let pattern = "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15";
    loadCircuit(pattern);
}

function addCircuit() {
    let element = document.getElementsByClassName('picker')[0];
    element.innerHTML += `<button class="tablinks">newCircuit</button>`;
}