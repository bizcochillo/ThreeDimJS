function getIndexInDOMCollection(el) {
  if (!el) return -1;
  var i = 0;
  do {
    i++;
  } while ((el = el.previousElementSibling));
  return i - 1;
}

function showTokenEdition() {
  let panelPresentation = this;
  let parent = panelPresentation.parentNode;
  let panelEdition = parent.getElementsByClassName("token-panel-editor")[0];
  panelEdition.style.display = "block";
  panelPresentation.style.display = "none";

  var index = getIndexInDOMCollection(parent);
}

function getActionFromTokenLabel(label) {
  let actionChar = label.trim()[0];
  let actionText, actionClass, parameters;
  parameters = label.trim().substring(1);
  switch (actionChar) {
    case "M":
      actionText = "move";
      actionClass = "action-label-move";
      break;
    case "F":
      actionText = "forward";
      actionClass = "action-label-forward";
      break;
    case "V":
      actionText = "vertical";
      actionClass = "action-label-vertical";
      break;
    case "H":
      actionText = "horizontal";
      actionClass = "action-label-horizontal";
      break;
    case "R":
      actionText = "right";
      actionClass = "action-label-right";
      break;
    case "L":
      actionText = "left";
      actionClass = "action-label-left";
      break;
  }

  return [actionText, actionClass, parameters];
}

function addActionToDropDownHtmlControl(drop_down, text, value)
{
  let item = document.createElement("OPTION");
  item.textContent = text;
  item.value = value;
  drop_down.appendChild(item);
}

function createTokenContainer(token) {
  let main_container = document.createElement("DIV");
  main_container.className = "token-panel-item";

  //container.addEventListener("input", changeTextTokenHandler);
  //DIV presentation
  let presentation_div = document.createElement("DIV");
  presentation_div.className = "token-panel-presentation";
  //  action span (left, right, forward, move, horizontal, vertical)
  let action_span = document.createElement("SPAN");
  let [action_text, action_class, parameters] = getActionFromTokenLabel(token);
  let action_span_text = document.createTextNode(action_text);
  action_span.appendChild(action_span_text);
  action_span.className = `token-action-label ${action_class}`;
  presentation_div.appendChild(action_span);
  //  parameters span (x, y, z, length, degrees, direction)
  let parameters_span = document.createElement("SPAN");
  let parameters_span_text = document.createTextNode(parameters);
  parameters_span.className = "token-parameters-text";
  parameters_span.appendChild(parameters_span_text);
  presentation_div.appendChild(parameters_span);
  presentation_div.title = token;

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
  //  Select option.
  let drop_down_actions = document.createElement("SELECT");
  addActionToDropDownHtmlControl(drop_down_actions, "move", "M");
  addActionToDropDownHtmlControl(drop_down_actions, "forward", "F");
  addActionToDropDownHtmlControl(drop_down_actions, "horizontal", "H");
  addActionToDropDownHtmlControl(drop_down_actions, "vertical", "V");
  addActionToDropDownHtmlControl(drop_down_actions, "left", "L");
  addActionToDropDownHtmlControl(drop_down_actions, "right", "R");
  drop_down_actions.className = "select-css";
  drop_down_actions.value = token[0];
  editor_div.appendChild(drop_down_actions);
  //  Textbox
  let TEMP_input = document.createElement("INPUT");
  TEMP_input.className = "";
  TEMP_input.value = parameters;
  editor_div.appendChild(TEMP_input);
  /*
<input type = "text"
                 id = "myText"
                 value = "text here" />
  */

  //DIV options buttons
  let buttonRemove = document.createElement("BUTTON");
  buttonRemove.className = "token-panel-editor-button";
  buttonRemove.innerText = "x";
  //buttonRemove.addEventListener("click", removeTokenHandler);

  let buttonAdd = document.createElement("BUTTON");
  buttonAdd.className = "token-panel-editor-button";
  buttonAdd.innerText = "+";
  //buttonAdd.addEventListener("click", addTokenHandler);

  buttons_div.appendChild(buttonRemove);
  buttons_div.appendChild(buttonAdd);

  return main_container;
}

function loadTokens(tokenStr) {
  let tokens = tokenStr.split(",");
  let element = document.getElementsByClassName("token-panel")[0];
  element.innerHTML = "";
  for (let token of tokens) {
    let container = createTokenContainer(token);
    element.appendChild(container);
  }
}

window.onload = function () {
  let pattern2 =
    "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15";

  loadTokens(pattern2);
};
