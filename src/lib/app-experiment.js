const ESC_KEYCODE = 27;
const INTRO_KEYCODE = 13;

let _token_index_in_edition_DOM = -1;

function getTokenInEditionDivByIndex(index) {
  let controlsEdition = document.getElementsByClassName("token-panel-editor");
  if (index !== -1 && controlsEdition.length > index)
    return controlsEdition[index];
}

function getIndexInDOMCollection(el) {
  if (!el) return -1;
  var i = 0;
  do {
    i++;
  } while ((el = el.previousElementSibling));
  return i - 1;
}

function showTokenEdition() {
  // disable last selected token.
  if (_token_index_in_edition_DOM !== -1) {
    let panel_edition_div = getTokenInEditionDivByIndex(
      _token_index_in_edition_DOM
    );
    let parent_last_panel_edition = panel_edition_div.parentNode;
    let last_panel_presentation = parent_last_panel_edition.getElementsByClassName(
      "token-panel-presentation"
    )[0];
    last_panel_presentation.style.display = "block";
    panel_edition_div.style.display = "none";
  }
  let panel_presentation = this;
  let parent = panel_presentation.parentNode;
  let panel_edition = parent.getElementsByClassName("token-panel-editor")[0];
  panel_edition.style.display = "block";
  panel_presentation.style.display = "none";
  panel_presentation.focus();
  _token_index_in_edition_DOM = getIndexInDOMCollection(parent);
}

function getActionFromTokenLabel(label) {
  let action_char = label.trim()[0];
  let action_text, action_class, parameters_items, parameters = [];
  parameters_items = label.substring(1).trim().split(' ');
  switch (action_char) {
    case "M":
      action_text = "move";
      action_class = "action-label-move";
      parameters.push({ label: "x", value: parameters_items[0] });
      parameters.push({ label: "y", value: parameters_items[1] });
      parameters.push({ label: "z", value: parameters_items[2] });
      parameters.push({ label: "direction", value: parameters_items[3] });
      break;
    case "F":
      action_text = "forward";
      action_class = "action-label-forward";
      parameters.push({ label: "length", value: parameters_items[0] });
      break;
    case "V":
      action_text = "vertical";
      action_class = "action-label-vertical";
      parameters.push({ label: "length", value: parameters_items[0] });
      parameters.push({ label: "degrees", value: parameters_items[1] });
      break;
    case "H":
      action_text = "horizontal";
      action_class = "action-label-horizontal";
      parameters.push({ label: "length", value: parameters_items[0] });
      parameters.push({ label: "degrees", value: parameters_items[1] });
      break;
    case "R":
      action_text = "right";
      action_class = "action-label-right";
      break;
    case "L":
      action_text = "left";
      action_class = "action-label-left";
      break;
  }
  return [action_text, action_class, parameters];
}

function addActionToDropDownHtmlControl(drop_down, text, value) {
  let item = document.createElement("OPTION");
  item.textContent = text;
  item.value = value;
  drop_down.appendChild(item);
}

function addTokenContainerHandler() {
  let main_node = this.parentNode.parentNode;
  let index = getIndexInDOMCollection(main_node);
  let parent_element = main_node.parentNode;
  let token = "F 10";
  parent_element.insertBefore(createTokenContainer(token), main_node.nextSibling);
  // let circuit = circuitHandler.getSelectedCircuit();
  // circuit.tokens.splice(index + 1, 0, token);
}

function removeTokenContainerHandler() {
  let main_node = this.parentNode.parentNode;
  let index = getIndexInDOMCollection(main_node);
  main_node.remove();
  // let circuit = circuitHandler.getSelectedCircuit();
  // circuit.tokens.splice(index, 1);
}

function createDOMInputElement(value) {
  let element = document.createElement("INPUT");
  element.className = "token-parameters-text parameters-text-editor";
  element.value = value;
  return element;
}

function getTokenFromEditionPanel(div) {
  let token_type_node = div.firstElementChild;
  let token = token_type_node.value;
  if (token === "R" || token === "L") return token;

  let node_in_div = token_type_node.nextSibling;
  while (node_in_div) {
    token += ` ${node_in_div.value}`;
    node_in_div = node_in_div.nextSibling;
  }
  return token;
}

function validateTokenEdition(event) {
  event.stopPropagation();
  // Only INTRO(13) and ESC(27) keys allowed
  if (event.keyCode !== INTRO_KEYCODE && event.keyCode !== ESC_KEYCODE)
    return;
  let panel_edition_div = getTokenInEditionDivByIndex(
    _token_index_in_edition_DOM
  );
  let parent_last_panel_edition = panel_edition_div.parentNode;
  let last_panel_presentation = parent_last_panel_edition.getElementsByClassName(
    "token-panel-presentation"
  )[0];
  switch (event.keyCode) {
    case INTRO_KEYCODE:
      //get edited token from the edition panel
      let new_token = getTokenFromEditionPanel(panel_edition_div);
      //remove all elements from presentation panel.
      while (last_panel_presentation.lastElementChild) {
        last_panel_presentation.removeChild(
          last_panel_presentation.lastElementChild
        );
      }
      //update panel presentation
      updatePresentationDiv(last_panel_presentation, new_token);
      //hide edition panel and show presentation panel.
      break;
    case ESC_KEYCODE: //ESC
      break;
  }
  last_panel_presentation.style.display = "block";
  panel_edition_div.style.display = "none";
  _token_index_in_edition_DOM = -1;

}

function setInputDOMToNumberType(input, min, max, step) {
  input.max = max;
  input.min = min;
  input.step = step;
  input.type = "number";
  input.addEventListener("keyup", validateTokenEdition);
}

function addControlsToTokenEditionContainer(token, div) {
  let token_items = token.trim().split(" ");
  let size_input, slope_input, x_input, y_input, z_input;
  switch (token_items[0]) {
    case "F":
      size_input = createDOMInputElement(token_items[1]);
      setInputDOMToNumberType(size_input, 0, 100, 1);
      div.appendChild(size_input);
      break;
    case "M":
      x_input = createDOMInputElement(token_items[1]);
      setInputDOMToNumberType(x_input, -300, 300, 1);
      div.appendChild(x_input);
      y_input = createDOMInputElement(token_items[2]);
      setInputDOMToNumberType(y_input, -300, 300, 1);
      div.appendChild(y_input);
      z_input = createDOMInputElement(token_items[3]);
      setInputDOMToNumberType(z_input, -300, 300, 1);
      div.appendChild(z_input);
      // orientation_input = createDOMInputElement(token_items[4]);
      // div.appendChild(orientation_input);
      let select_orientation = document.createElement("SELECT");
      addActionToDropDownHtmlControl(select_orientation, "N", "N");
      addActionToDropDownHtmlControl(select_orientation, "S", "S");
      addActionToDropDownHtmlControl(select_orientation, "E", "E");
      addActionToDropDownHtmlControl(select_orientation, "W", "W");
      select_orientation.className = "select-css";
      select_orientation.value = token_items[4];
      select_orientation.style.margin = "3px 0 0 10px";
      select_orientation.addEventListener("keydown", validateTokenEdition);
      div.appendChild(select_orientation);
      break;
    case "H":
    case "V":
      size_input = createDOMInputElement(token_items[1]);
      setInputDOMToNumberType(size_input, 0, 100, 1);
      div.appendChild(size_input);
      slope_input = createDOMInputElement(token_items[2]);
      setInputDOMToNumberType(slope_input, -180, 180, 1);
      div.appendChild(slope_input);
      break;
  }
}

function changeDOMControlsInEditorPanel() {
  let ref_to_elements = [];
  let next_element = this.nextSibling;
  let parent = this.parentNode;
  while (next_element) {
    ref_to_elements.push(next_element);
    next_element = next_element.nextSibling;
  }
  for (let i = 0; i < ref_to_elements.length; i++) {
    parent.removeChild(ref_to_elements[i]);
  }
  addControlsToTokenEditionContainer(this.value + " 0 0 0 E", parent);
}

//  parameters span (x, y, z, length, degrees, direction)
function addParametersToPresentationDivDOM(div, params) {
  for (let item of params) {
    let title_span = document.createElement("SPAN");
    let title_span_text = document.createTextNode(`${item.label}: `);
    title_span.className = "token-parameters-label";
    title_span.appendChild(title_span_text);
    div.appendChild(title_span);

    let value_span = document.createElement("SPAN");
    let value_span_text = document.createTextNode(item.value);
    value_span.className = "token-parameters-value";
    value_span.appendChild(value_span_text);
    div.appendChild(value_span);
  }
}

function updatePresentationDiv(div, token) {
  //  action span (left, right, forward, move, horizontal, vertical)
  let action_span = document.createElement("SPAN");
  let [action_text, action_class, parameters] = getActionFromTokenLabel(token);
  let action_span_text = document.createTextNode(action_text);
  action_span.appendChild(action_span_text);
  action_span.className = `token-action-label ${action_class}`;
  div.appendChild(action_span);
  addParametersToPresentationDivDOM(div, parameters);
  div.title = token;
}

function createTokenContainer(token) {
  let main_container = document.createElement("DIV");
  main_container.className = "token-panel-item";

  //DIV presentation
  let presentation_div = document.createElement("DIV");
  presentation_div.className = "token-panel-presentation";
  updatePresentationDiv(presentation_div, token);

  let editor_div = document.createElement("DIV");
  let buttons_div = document.createElement("DIV");
  editor_div.className = "token-panel-editor";
  buttons_div.className = "token-panel-editor-options";

  main_container.appendChild(buttons_div);
  main_container.appendChild(presentation_div);
  main_container.appendChild(editor_div);
  presentation_div.addEventListener("click", showTokenEdition);

  //DIV edition
  editor_div.style.display = "none";
  editor_div.tabIndex = "0";
  //  Select option.
  let select_actions = document.createElement("SELECT");
  addActionToDropDownHtmlControl(select_actions, "move", "M");
  addActionToDropDownHtmlControl(select_actions, "forward", "F");
  addActionToDropDownHtmlControl(select_actions, "horizontal", "H");
  addActionToDropDownHtmlControl(select_actions, "vertical", "V");
  addActionToDropDownHtmlControl(select_actions, "left", "L");
  addActionToDropDownHtmlControl(select_actions, "right", "R");
  select_actions.className = "select-css";
  select_actions.value = token[0];
  select_actions.addEventListener("change", changeDOMControlsInEditorPanel);
  select_actions.addEventListener("keydown", validateTokenEdition);
  editor_div.appendChild(select_actions);
  //  Textbox
  addControlsToTokenEditionContainer(token, editor_div);
  editor_div.addEventListener("keyup", validateTokenEdition);
  //editor_div.focus();

  //DIV options buttons
  let button_remove = document.createElement("BUTTON");
  button_remove.className = "token-panel-editor-button";
  button_remove.innerText = "x";
  button_remove.addEventListener("click", removeTokenContainerHandler);

  let button_add = document.createElement("BUTTON");
  button_add.className = "token-panel-editor-button";
  button_add.innerText = "+";
  button_add.addEventListener("click", addTokenContainerHandler);

  buttons_div.appendChild(button_remove);
  buttons_div.appendChild(button_add);

  return main_container;
}

function loadTokens(token_str) {
  let tokens = token_str.split(",");
  let element = document.getElementsByClassName("token-panel")[0];
  element.innerHTML = "";
  for (let token of tokens) {
    let container = createTokenContainer(token);
    element.appendChild(container);
  }
}

window.onload = function () {
  let circuit_def =
    "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15";

  loadTokens(circuit_def);
};
