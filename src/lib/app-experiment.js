var circuitHandler;

function loadCircuit(circuit) {
  let element = document.getElementsByClassName('editor')[0];
  element.innerHTML = '';
  if (!circuit.code) return;
  for (let token of circuit.tokens) {
    let container = createTokenContainer(token);
    element.appendChild(container);
  }
}

function createTokenContainer(token) {
  let container = document.createElement("DIV");
  container.className = "editor-tokens";
  container.contentEditable = true;
  container.addEventListener("input", changeTextTokenHandler);
  let editionOptions = document.createElement("DIV");
  editionOptions.className = "editor-buttons";
  editionOptions.contentEditable = false;
  let buttonRemove = document.createElement("BUTTON");
  buttonRemove.className = "editor-button";
  buttonRemove.innerText = "x";
  buttonRemove.addEventListener("click", removeTokenHandler);
  let buttonAdd = document.createElement("BUTTON");
  buttonAdd.className = "editor-button";
  buttonAdd.innerText = "+";
  buttonAdd.addEventListener("click", addTokenHandler);
  editionOptions.appendChild(buttonRemove);
  editionOptions.appendChild(buttonAdd);

  container.innerText = token;
  container.appendChild(editionOptions);
  return container;
}

function addTokenHandler() {
  let mainNode = this.parentNode.parentNode;
  let index = getIndexInCollection(mainNode);
  let parentElement = mainNode.parentNode;
  let token = "F 0";
  parentElement.insertBefore(createTokenContainer(token), mainNode.nextSibling);
  let circuit = circuitHandler.getSelectedCircuit();
  circuit.tokens.splice(index + 1, 0, token);
}

function removeTokenHandler() {
  let mainNode = this.parentNode.parentNode;
  let index = getIndexInCollection(mainNode);
  mainNode.remove();
  let circuit = circuitHandler.getSelectedCircuit();
  circuit.tokens.splice(index, 1);
}

function changeTextTokenHandler()
{
  let mainNode = this;
  let index = getIndexInCollection(mainNode);
  let circuit = circuitHandler.getSelectedCircuit();
  circuit.tokens[index] = this.innerText.substring(0, this.innerText.length-2).trim();
  console.log(`content changed: ${this.innerText}`);
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
    this.tokens = code.split(',');
    this.isPattern = isPattern;
    this.name = '';
  }
}

class CircuitHandler {
  setCircuit(circuit) {
    this.circuits.push(circuit);
  }

  getCircuit(index) {
    this.selectedCircuit = this.circuits[index];
    return this.circuits[index];
  }

  getSelectedCircuit() {
    return this.selectedCircuit;
  }

  removeCircuit(index) {
    this.circuits.splice(index, 1);
  }

  getNumCircuits() {
    return this.circuits.length;
  }

  constructor() {
    this.circuits = [];
    this.selectedCircuit = null;
  }
}

//TODO: Replace better by a jQuery call.
function getIndexInCollection(el) {
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
  let circuitIdx = getIndexInCollection(element); //TODO: implement with jQuery
  loadCircuit(circuitHandler.getCircuit(circuitIdx));
}

function removeCircuit() {
  let current = document.getElementsByClassName("active");
  if (current.length === 0) return;
  let circuitIdx = getIndexInCollection(current[0]);
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

window.onload = function () {
  circuitHandler = new CircuitHandler;
  // Add pattern circuits.
  // fill with the two patterns.
  let pattern1 = new Circuit(
    'M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10',
    true);
  pattern1.name = 'Example 1';
  circuitHandler.setCircuit(pattern1);
  addCircuit(pattern1); // TODO: Remove UI interaction

  let pattern2 = new Circuit(
    'M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15',
    true);
  pattern2.name = 'Example 2';
  circuitHandler.setCircuit(pattern2);
  addCircuit(pattern2);  // TODO: Remove UI interaction
  // Add active class to the current button (highlight it)
  var header = document.getElementsByClassName("picker")[0];
  var btns = header.getElementsByClassName("circuit-button");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", selectCircuitHandler);
  }
};

function openNav() {
  document.getElementById("mySidepanel").style.width = "350px";
}

function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}
