const SEGMENT_YMAX = 5;
const SEGMENT_ZMAX = 2;
const CURVED_RADIUS = 7;

let _renderer,
    _scene,
    _camera,
    _controls,
    _header_position = [-30, 0, 4, "E"],
    _raycaster = new THREE.Raycaster(),
    _mouse = new THREE.Vector2(),
    _intersected,
    _elements_loaded = [],
    _circuit_handler;

function createLinearXSegment(x, y, z, length) {
  let segmentGeo = new THREE.BoxBufferGeometry(length, 5, 2);
  let segmentMesh = new THREE.Mesh(
    segmentGeo,
    new THREE.MeshLambertMaterial({ color: 0x0000ff })
  );
  segmentMesh.position.x = x;
  segmentMesh.position.y = y;
  segmentMesh.position.z = z;
  segmentMesh.Descriptor = "LinearSegment";
  return segmentMesh;
};

function createLinearYSegment(x, y, z, length) {
  let segment_geo = new THREE.BoxBufferGeometry(5, length, 2);
  let segment_mesh = new THREE.Mesh(
    segment_geo,
    new THREE.MeshLambertMaterial({ color: 0x0000ff })
  );
  segment_mesh.position.x = x;
  segment_mesh.position.y = y;
  segment_mesh.position.z = z;
  segment_mesh.Descriptor = "LinearSegment";
  return segment_mesh;
};

function initCircuitRepresentationEngine() {
  let container = document.getElementById("container");

  //

  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0xb0b0b0);

  _camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  _camera.position.set(0, 0, 200);

  //

  let group = new THREE.Group();
  _scene.add(group);

  //

  let directional_light = new THREE.DirectionalLight(0xffffff, 0.6);
  directional_light.position.set(0.75, 0.75, 1.0).normalize();
  _scene.add(directional_light);

  let ambient_light = new THREE.AmbientLight(0xcccccc, 0.2);
  _scene.add(ambient_light);

  //
  let segment_count = 64,
    radius = 100,
    circle_geometry = new THREE.Geometry(),
    material = new THREE.LineBasicMaterial({ color: 0xffffff });

  for (let i = 0; i <= segment_count; i++) {
    let theta = (i / segment_count) * Math.PI * 2;
    circle_geometry.vertices.push(
      new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0)
    );
  }
  _scene.add(new THREE.Line(circle_geometry, material));
  //

  let helper = new THREE.GridHelper(360, 10);
  helper.rotation.x = Math.PI / 2;
  group.add(helper);

  // Axis
  let axes = new THREE.AxesHelper(50);
  _scene.add(axes);
  _renderer = new THREE.WebGLRenderer({ antialias: true });
  _renderer.setPixelRatio(window.devicePixelRatio);
  _renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(_renderer.domElement);

  //

  _controls = new THREE.OrbitControls(_camera, _renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
};

function animate() {
  requestAnimationFrame(animate);

  render();
};

function render() {
  // update the picking ray with the camera and mouse position
  _raycaster.setFromCamera(_mouse, _camera);
  // calculate objects intersecting the picking ray
  var intersects = _raycaster.intersectObjects(_scene.children);
  if (intersects.length > 0) {
    var i;
    var minDistance = Number.MAX_SAFE_INTEGER;
    var minIntersectedObject = null;
    for (i = 0; i < intersects.length; i++) {
      if (
        minIntersectedObject == null ||
        minDistance > intersects[i].distance
      ) {
        minIntersectedObject = intersects[i].object;
        minDistance = intersects[i].distance;
      }
    }
    if (_intersected) _intersected.material.color.setHex(_intersected.currentHex);
    // store reference to closest object as current intersection object
    _intersected = minIntersectedObject;
    // store color of closest object (for later restoration)
    _intersected.currentHex = _intersected.material.color.getHex();
    // set a new color for closest object
    _intersected.material.color.setHex(0xffff00);
  } // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if (_intersected) _intersected.material.color.setHex(_intersected.currentHex);
    // remove previous intersection object reference
    //     by setting current intersection object to "nothing"
    _intersected = null;
  }

  _renderer.render(_scene, _camera);
};

function addElementToScene(element) {
  _elements_loaded.push(element);
  _scene.add(element);
}

function addLinearXSegment(size, direction) {
  x = _header_position[0];
  y = _header_position[1];
  z = _header_position[2];
  var modif = direction === "E" ? 1 : -1;

  addElementToScene(createLinearXSegment(x + (modif * size) / 2, y, z, size));

  // calculate new position
  _header_position[0] = _header_position[0] + modif * size;
}

function addLinearYSegment(size, direction) {
  x = _header_position[0];
  y = _header_position[1];
  z = _header_position[2];
  var modif = direction === "N" ? 1 : -1;
  _header_position[1] = _header_position[1] + modif * size;
  var elementToAdd = createLinearYSegment(x, y + (modif * size) / 2, z, size);
  addElementToScene(elementToAdd);
}

function addSlopeXZSegment(size, angle) {
  var angleInRad = ((2 * Math.PI) / 360) * angle;

  var x = _header_position[0];
  var y = _header_position[1];
  var z = _header_position[2];

  _header_position[0] = _header_position[0] + size * Math.cos(angleInRad);
  _header_position[2] = _header_position[2] + size * Math.sin(angleInRad);
  addElementToScene(createSlopeXZSegment(x, y, z, size, angle));
}

function addSlopeXYSegment(size, angle) {
  var angleInRad = ((2 * Math.PI) / 360) * angle;
  var x = 0,
    y = 0,
    z = 0;
  if (_header_position) {
    x = _header_position[0];
    y = _header_position[1];
    z = _header_position[2];
  } else {
    _header_position = [0, 0, 0];
  }
  _header_position[0] = _header_position[0] + size * Math.cos(angleInRad);
  _header_position[1] = _header_position[2] + size * Math.sin(angleInRad);
  addElementToScene(createSlopeXYSegment(x, y, z, size, angle));
}

function addCurvedSESegment(nextDirection) {
  var x = _header_position[0];
  var y = _header_position[1];
  var z = _header_position[2];

  var modif = nextDirection === "W" ? -1 : 1;
  _header_position[0] = _header_position[0] + modif * CURVED_RADIUS;
  _header_position[1] = _header_position[1] + modif * CURVED_RADIUS;
  var curvedSegmentSE;
  if (nextDirection === "N")
    curvedSegmentSE = createCurvedSegment(
      x - CURVED_RADIUS,
      y + CURVED_RADIUS,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      (3 * Math.PI) / 2
    );
  else
    curvedSegmentSE = createCurvedSegment(
      x - CURVED_RADIUS * 2,
      y,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      (3 * Math.PI) / 2
    );

  addElementToScene(curvedSegmentSE);
}

function addCurvedSWSegment(nextDirection) {
  var x = _header_position[0],
    y = _header_position[1],
    z = _header_position[2];

  var modifX = nextDirection === "E" ? 1 : -1;
  var modifY = nextDirection === "E" ? -1 : 1;
  _header_position[0] = _header_position[0] + modifX * CURVED_RADIUS;
  _header_position[1] = _header_position[1] + modifY * CURVED_RADIUS;

  var curvedSegment3;
  if (nextDirection === "E")
    curvedSegment3 = createCurvedSegment(
      x + CURVED_RADIUS,
      y + CURVED_RADIUS,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      Math.PI
    );
  else
    curvedSegment3 = createCurvedSegment(
      x,
      y + CURVED_RADIUS * 2,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      Math.PI
    );
  addElementToScene(curvedSegment3);
}

function addCurvedNESegment(nextDirection) {
  x = _header_position[0];
  y = _header_position[1];
  z = _header_position[2];

  var modifX = nextDirection === "W" ? -1 : 1;
  var modifY = nextDirection === "S" ? -1 : 1;
  _header_position[0] = _header_position[0] + modifX * CURVED_RADIUS;
  _header_position[1] = _header_position[1] + modifY * CURVED_RADIUS;
  var curvedSegment;
  if (nextDirection === "W")
    curvedSegment = createCurvedSegment(
      x - CURVED_RADIUS,
      y - CURVED_RADIUS,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      0
    );
  else
    curvedSegment = createCurvedSegment(
      x,
      y - CURVED_RADIUS * 2,
      z - SEGMENT_ZMAX / 2,
      0,
      0,
      0
    );
  addElementToScene(curvedSegment);
}

function addCurvedNWSegment(nextDirection) {
  x = _header_position[0];
  y = _header_position[1];
  z = _header_position[2];

  var modif = nextDirection === "S" ? -1 : 1;
  _header_position[0] = _header_position[0] + modif * CURVED_RADIUS;
  _header_position[1] = _header_position[1] + modif * CURVED_RADIUS;
  if (nextDirection === "S")
    addElementToScene(
      createCurvedSegment(
        x + CURVED_RADIUS,
        y + modif * CURVED_RADIUS,
        z - SEGMENT_ZMAX / 2,
        0,
        0,
        Math.PI / 2
      )
    );
  else
    addElementToScene(
      createCurvedSegment(
        x + CURVED_RADIUS * 2,
        y,
        z - SEGMENT_ZMAX / 2,
        0,
        0,
        Math.PI / 2
      )
    );
}

function addLinearSegment(size) {
  var direction = _header_position[3];
  if (direction === "E" || direction === "W")
    addLinearXSegment(size, direction);
  else addLinearYSegment(size, direction);
}

function TurnToLeft(position) {
  if (position === "N") return "W";
  if (position === "E") return "N";
  if (position === "S") return "E";
  if (position === "W") return "S";
}

function TurnToRight(position) {
  if (position === "N") return "E";
  if (position === "E") return "S";
  if (position === "S") return "W";
  if (position === "W") return "N";
}

function addTurnToLeft() {
  var startDirection = _header_position[3];
  var nextDirection = TurnToLeft(startDirection);
  if (startDirection === "N") addCurvedNESegment(nextDirection);
  if (startDirection === "E") addCurvedSESegment(nextDirection);
  if (startDirection === "S") addCurvedSWSegment(nextDirection);
  if (startDirection === "W") addCurvedNWSegment(nextDirection);
  _header_position[3] = nextDirection;
}

function addTurnToRight() {
  var startDirection = _header_position[3];
  var nextDirection = TurnToRight(startDirection);
  if (startDirection === "N") addCurvedNWSegment(nextDirection);
  if (startDirection === "E") addCurvedNESegment(nextDirection);
  if (startDirection === "S") addCurvedSESegment(nextDirection);
  if (startDirection === "W") addCurvedSWSegment(nextDirection);
  _header_position[3] = nextDirection;
}

function addSlopeVertical(size, angleInGrad) {
  var angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

  x = _header_position[0];
  y = _header_position[1];
  z = _header_position[2];

  addElementToScene(createSlopeXZSegment(x, y, z, size, angleInGrad));

  var deltaX, deltaY, deltaZ;
  var direction = _header_position[3];
  if (direction === "N") {
    deltaX = 0;
    deltaY = size * Math.cos(angleInRad);
  }
  if (direction === "E") {
    deltaX = size * Math.cos(angleInRad);
    deltaY = 0;
  }
  if (direction === "S") {
    deltaX = 0;
    deltaY = -size * Math.cos(angleInRad);
  }
  if (direction === "W") {
    deltaX = -size * Math.cos(angleInRad);
    deltaY = 0;
  }
  deltaZ = size * Math.sin(angleInRad);
  _header_position[0] = _header_position[0] + deltaX;
  _header_position[1] = _header_position[1] + deltaY;
  _header_position[2] = _header_position[2] + deltaZ;
}

function addSlopeHorizontal(size, angleInGrad) {
  let angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

  let x = _header_position[0],
      y = _header_position[1],
      z = _header_position[2];

  addElementToScene(createSlopeXYSegment(x, y, z, size, angleInGrad));

  var deltaX, deltaY, deltaZ;
  var direction = _header_position[3];
  if (direction === "N") {
    deltaX = -size * Math.sin(angleInRad);
    deltaY = size * Math.cos(angleInRad);
  }
  if (direction === "E") {
    deltaX = size * Math.cos(angleInRad);
    deltaY = size * Math.sin(angleInRad);
  }
  if (direction === "S") {
    deltaX = size * Math.sin(angleInRad);
    deltaY = -size * Math.cos(angleInRad);
  }
  if (direction === "W") {
    deltaX = -size * Math.cos(angleInRad);
    deltaY = -size * Math.sin(angleInRad);
  }
  deltaZ = 0;
  _header_position[0] = _header_position[0] + deltaX;
  _header_position[1] = _header_position[1] + deltaY;
  _header_position[2] = _header_position[2] + deltaZ;
}

function moveHeader(position) {
  _header_position = position;
}

function load(circuit) {
  window.requestAnimationFrame(render);
  window.addEventListener("mousemove", onMouseMove, false);

  processCircuit(circuit);
}

/*
Establish header position (Parameters x, y, z, orientation). M x y z direction
Add linear segment in the direction of the header (Parameters length). F length
Add segment with horizontal slope (XY) (Parameters length, angleInGrads). H length degrees
Add segment with vertical slope (XZ) (Parameters length, angleInGrads). V length degrees
Add turn to left segment (No parameters). L
Add turn to right segment (No parameters). R For instance: M 0 0 0 N,F 30,L,F 100,V 30,F 100,H -30,F10
  */
function processCircuit(circuitInfo) {
  let tokens = circuitInfo.split(",");
  for (let token of tokens) {
    let fields = token.split(" ");
    switch (fields[0]) {
      case "M":
        moveHeader([
          parseInt(fields[1]),
          parseInt(fields[2]),
          parseInt(fields[3]),
          fields[4],
        ]);
        break;
      case "F":
        addLinearSegment(parseInt(fields[1]));
        break;
      case "H":
        addSlopeHorizontal(parseInt(fields[1]), parseInt(fields[2]));
        break;
      case "V":
        addSlopeVertical(parseInt(fields[1]), parseInt(fields[2]));
        break;
      case "L":
        addTurnToLeft();
        break;
      case "R":
        addTurnToRight();
        break;
      default:
        throw "Token not recognized: " + token;
    }
  }
}

function removeCircuitFromScene() {
  for (var i = 0; i < _elements_loaded.length; i++) {
    _scene.remove(_elements_loaded[i]);
  }
  _elements_loaded = [];
}

function onMouseMove(e) {
  _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  _camera.aspect = window.innerWidth / window.innerHeight;
  _camera.updateProjectionMatrix();

  _renderer.setSize(window.innerWidth, window.innerHeight);
}

function createSlopeXZSegment(x, y, z, length, angleInGrad) {
  var segmentLength = length;
  var angle = ((2 * Math.PI) / 360) * angleInGrad; // in radians

  var geoSlope = new THREE.Geometry();
  geoSlope.vertices.push(
    new THREE.Vector3(0, -SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, -SEGMENT_YMAX / 2, SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, SEGMENT_YMAX / 2, SEGMENT_ZMAX / 2),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      -SEGMENT_YMAX / 2,
      segmentLength * Math.sin(angle) - SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      +SEGMENT_YMAX / 2,
      segmentLength * Math.sin(angle) - SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      -SEGMENT_YMAX / 2,
      segmentLength * Math.sin(angle) + SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      +SEGMENT_YMAX / 2,
      segmentLength * Math.sin(angle) + SEGMENT_ZMAX / 2
    )
  );

  geoSlope.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(1, 2, 3),
    new THREE.Face3(0, 1, 4),
    new THREE.Face3(5, 4, 1),
    new THREE.Face3(4, 5, 7),
    new THREE.Face3(7, 6, 4),
    new THREE.Face3(2, 6, 3),
    new THREE.Face3(3, 6, 7),
    new THREE.Face3(0, 4, 6),
    new THREE.Face3(6, 2, 0),
    new THREE.Face3(1, 7, 5),
    new THREE.Face3(1, 3, 7)
  );

  geoSlope.computeBoundingSphere();
  geoSlope.computeVertexNormals();
  var geoSlopeMesh = new THREE.Mesh(
    geoSlope,
    new THREE.MeshLambertMaterial({ color: 0x0000ff })
  );
  geoSlopeMesh.position.x = x;
  geoSlopeMesh.position.y = y;
  geoSlopeMesh.position.z = z;
  geoSlopeMesh.Descriptor = "LinearSlopeXZSegment";

  var direction = _header_position[3];
  if (direction === "N") {
    geoSlopeMesh.rotation.set(0, 0, Math.PI / 2);
  }
  if (direction === "W") {
    geoSlopeMesh.rotation.set(0, 0, Math.PI);
  }
  if (direction === "S") {
    geoSlopeMesh.rotation.set(0, 0, (3 * Math.PI) / 2);
  }

  return geoSlopeMesh;
}

function createCurvedSegment(x, y, z, rotX, rotY, rotZ) {
  var curvedSegment2D = new THREE.Shape();
  curvedSegment2D.absarc(
    0,
    CURVED_RADIUS,
    CURVED_RADIUS - SEGMENT_YMAX / 2,
    Math.PI / 2,
    0,
    true
  );
  curvedSegment2D.absarc(
    0,
    CURVED_RADIUS,
    CURVED_RADIUS + SEGMENT_YMAX / 2,
    0,
    Math.PI / 2,
    false
  );

  var extrudeSettings = { depth: 2, bevelEnabled: false };
  var curvedSegmentGeo = new THREE.ExtrudeBufferGeometry(
    curvedSegment2D,
    extrudeSettings
  );

  var meshGeo = new THREE.Mesh(
    curvedSegmentGeo,
    new THREE.MeshLambertMaterial({ color: 0x0000ff, side: THREE.DoubleSide })
  );
  meshGeo.position.set(x, y, z);
  meshGeo.rotation.set(rotX, rotY, rotZ);
  meshGeo.Descriptor = "CurvedSegment";

  return meshGeo;
}

function createSlopeXYSegment(x, y, z, length, angleInGrad) {
  var segmentLength = length;
  var angle = ((2 * Math.PI) / 360) * angleInGrad; // in radians

  var geoSlope = new THREE.Geometry();
  geoSlope.vertices.push(
    new THREE.Vector3(0, -SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, -SEGMENT_YMAX / 2, SEGMENT_ZMAX / 2),
    new THREE.Vector3(0, SEGMENT_YMAX / 2, SEGMENT_ZMAX / 2),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      segmentLength * Math.sin(angle) - SEGMENT_YMAX / 2,
      -SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      segmentLength * Math.sin(angle) - SEGMENT_YMAX / 2,
      +SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      segmentLength * Math.sin(angle) + SEGMENT_YMAX / 2,
      -SEGMENT_ZMAX / 2
    ),
    new THREE.Vector3(
      segmentLength * Math.cos(angle),
      segmentLength * Math.sin(angle) + SEGMENT_YMAX / 2,
      +SEGMENT_ZMAX / 2
    )
  );

  geoSlope.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(1, 2, 3),
    new THREE.Face3(4, 0, 1),
    new THREE.Face3(1, 6, 4),
    new THREE.Face3(7, 5, 4),
    new THREE.Face3(4, 6, 7),
    new THREE.Face3(2, 5, 3),
    new THREE.Face3(5, 7, 3),
    new THREE.Face3(0, 5, 2),
    new THREE.Face3(5, 0, 4),
    new THREE.Face3(6, 1, 7),
    new THREE.Face3(3, 7, 1)
  );
  geoSlope.computeBoundingSphere();
  geoSlope.computeVertexNormals();
  var geoSlopeMesh = new THREE.Mesh(
    geoSlope,
    new THREE.MeshLambertMaterial({
      color: 0x0000ff,
      shading: THREE.FlatShading,
    })
  );
  geoSlopeMesh.position.x = x;
  geoSlopeMesh.position.y = y;
  geoSlopeMesh.position.z = z;
  geoSlopeMesh.Descriptor = "LinearSlopeXYSegment";

  var direction = _header_position[3];
  if (direction === "N") {
    geoSlopeMesh.rotation.set(0, 0, Math.PI / 2);
  }
  if (direction === "W") {
    geoSlopeMesh.rotation.set(0, 0, Math.PI);
  }
  if (direction === "S") {
    geoSlopeMesh.rotation.set(0, 0, (3 * Math.PI) / 2);
  }

  return geoSlopeMesh;
}

function loadCircuit(circuit) {
  let element = document.getElementsByClassName("editor")[0];
  element.innerHTML = "";
  if (!circuit.code) return;
  removeCircuitFromScene(); // remove the circuit previously load
  for (let token of circuit.tokens) {
    let container = createTokenContainer(token);
    element.appendChild(container);
  }
  load(circuit.tokens.join());
}

function createTokenContainer(token) {
  let container = document.createElement("DIV");
  container.className = "editor-tokens";
  container.contentEditable = "true";
  container.addEventListener("input", changeTextTokenHandler);
  let editionOptions = document.createElement("DIV");
  editionOptions.className = "editor-buttons";
  editionOptions.contentEditable = "false";
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
  let circuit = _circuit_handler.getSelectedCircuit();
  circuit.tokens.splice(index + 1, 0, token);
}

function removeTokenHandler() {
  let mainNode = this.parentNode.parentNode;
  let index = getIndexInCollection(mainNode);
  mainNode.remove();
  let circuit = _circuit_handler.getSelectedCircuit();
  circuit.tokens.splice(index, 1);
}

function changeTextTokenHandler() {
  let mainNode = this;
  let index = getIndexInCollection(mainNode);
  let circuit = _circuit_handler.getSelectedCircuit();
  circuit.tokens[index] = this.innerText
    .substring(0, this.innerText.length - 2)
    .trim();
  console.log(`content changed: ${this.innerText}`);
}

function addCircuit(circuit) {
  let new_element = false;
  if (!circuit) {
    circuit = new Circuit("M 0 0 0 N");
    circuit.name = "New circuit";
    _circuit_handler.setCircuit(circuit);
    new_element = true;
  }
  let element = document.getElementsByClassName("picker")[0];
  let circuitBtn = document.createElement("BUTTON");
  circuitBtn.className = "circuit-button";
  circuitBtn.addEventListener("click", selectCircuitHandler);
  circuitBtn.innerHTML = circuit.name;
  element.appendChild(circuitBtn);
  loadCircuit(circuit.code);
  if (new_element) selectCircuit(circuitBtn);
}

class Circuit {
  constructor(code, isPattern = false) {
    this.code = code;
    this.tokens = code.split(",");
    this.isPattern = isPattern;
    this.name = "";
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

function getIndexInCollection(el) {
  if (!el) return -1;
  var i = 0;
  do {
    i++;
  } while ((el = el.previousElementSibling));
  return i - 1;
}

function selectCircuit(element) {
  let current = document.getElementsByClassName("active");
  if (current.length > 0)
    current[0].className = current[0].className.replace(" active", "");
  element.className += " active";
  let circuit_idx = getIndexInCollection(element); //TODO: implement with jQuery
  loadCircuit(_circuit_handler.getCircuit(circuit_idx));
}

function removeCircuit() {
  let current = document.getElementsByClassName("active");
  if (current.length === 0) return;
  let circuit_idx = getIndexInCollection(current[0]);
  //update UI
  let current_element = current[0];
  current_element.parentNode.removeChild(current_element);
  _circuit_handler.removeCircuit(circuit_idx);
  let new_index = Math.max(circuit_idx - 1, 0);
  let elements = document.getElementsByClassName("circuit-button");
  elements[new_index].className += " active";
  loadCircuit(_circuit_handler.getCircuit(new_index));
}

function selectCircuitHandler() {
  selectCircuit(this);
}

window.onload = function () {
  initCircuitRepresentationEngine();
  animate();

  _circuit_handler = new CircuitHandler();
  // Add pattern circuits.
  // fill with the two patterns.
  let pattern1 = new Circuit(
    "M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10",
    true
  );
  pattern1.name = "Example 1";
  _circuit_handler.setCircuit(pattern1);
  addCircuit(pattern1); // TODO: Remove UI interaction

  let pattern2 = new Circuit(
    "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15",
    true
  );
  pattern2.name = "Example 2";
  _circuit_handler.setCircuit(pattern2);
  addCircuit(pattern2); // TODO: Remove UI interaction
  // Add active class to the current button (highlight it)
  let picker_control = document.getElementsByClassName("picker")[0];
  let picker_control_buttons = picker_control.getElementsByClassName("circuit-button");
  for (let i = 0; i < picker_control_buttons.length; i++) {
    picker_control_buttons[i].addEventListener("click", selectCircuitHandler);
  }
};

// functions to open/close side panel
function openSidePanel() {
  document.getElementById("circuitPickerSidePanel").style.width = "400px";
}

function closeSidePanel() {
  document.getElementById("circuitPickerSidePanel").style.width = "0";
}
