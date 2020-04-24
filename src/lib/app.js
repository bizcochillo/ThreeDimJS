const SEGMENT_YMAX = 5;
const SEGMENT_ZMAX = 2;
const CURVED_RADIUS = 7;

let renderer,
    scene,
    camera,
    controls,
    headerPosition = [-30, 0, 4, "E"],
    raycaster = new THREE.Raycaster(),
    mouse = new THREE.Vector2(),
    INTERSECTED,
    elementsLoaded = [],
    circuitHandler;


//TODO: for refactoring.
class HeadPosition {
  constructor(x, y, z, orientation) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.orientation = orientation;
  }
}

function createLinearXSegment(x, y, z, length) {
  var segmentGeo = new THREE.BoxBufferGeometry(length, 5, 2);
  var segmentMesh = new THREE.Mesh(
    segmentGeo,
    new THREE.MeshLambertMaterial({ color: 0x0000ff })
  );
  segmentMesh.position.x = x;
  segmentMesh.position.y = y;
  segmentMesh.position.z = z;
  segmentMesh.Descriptor = "LinearSegment";
  return segmentMesh;
};

//wow! this smells!
function createLinearYSegment(x, y, z, length) {
  var segmentGeo = new THREE.BoxBufferGeometry(5, length, 2);
  var segmentMesh = new THREE.Mesh(
    segmentGeo,
    new THREE.MeshLambertMaterial({ color: 0x0000ff })
  );
  segmentMesh.position.x = x;
  segmentMesh.position.y = y;
  segmentMesh.position.z = z;
  segmentMesh.Descriptor = "LinearSegment";
  return segmentMesh;
};

function init() {
  var container = document.getElementById("container");

  //

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb0b0b0);

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 200);

  //

  var group = new THREE.Group();
  scene.add(group);

  //

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0.75, 0.75, 1.0).normalize();
  scene.add(directionalLight);

  var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
  scene.add(ambientLight);

  //
  var segmentCount = 64,
    radius = 100,
    circleGeometry = new THREE.Geometry(),
    material = new THREE.LineBasicMaterial({ color: 0xffffff });

  for (let i = 0; i <= segmentCount; i++) {
    var theta = (i / segmentCount) * Math.PI * 2;
    circleGeometry.vertices.push(
      new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0)
    );
  }
  scene.add(new THREE.Line(circleGeometry, material));
  //

  var helper = new THREE.GridHelper(360, 10);
  helper.rotation.x = Math.PI / 2;
  group.add(helper);

  // Axis
  var axes = new THREE.AxesHelper(50);
  scene.add(axes);

  var linearSegmentX = createLinearXSegment(0, 0, 5, 50);

  var linearSegmentY = createLinearYSegment(25 + 10, 25 + 10, 5, 50);

  var angleSlope = 45.0;
  var linearSlopeXZ = createSlopeXZSegment(0, 0, 0, 40, angleSlope);

  var angleSlopeXY = -20.0;
  var linearSlopeXY = createSlopeXYSegment(20, 0, 0, 20, angleSlopeXY);

  var lengthSegment2 = 200;
  var linearSegmentX2 = createLinearXSegment(
    40 * Math.cos(((2 * Math.PI) / 360) * angleSlope) + lengthSegment2 / 2,
    0,
    40 * Math.sin(((2 * Math.PI) / 360) * angleSlope),
    lengthSegment2
  );

  var curvedSegmentPos = createCurvedSegment(
    40 * Math.cos(((2 * Math.PI) / 360) * angleSlope) - CURVED_RADIUS,
    CURVED_RADIUS,
    40 * Math.sin(((2 * Math.PI) / 360) * angleSlope) + 10,
    0,
    0,
    (3 * Math.PI) / 2
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  //

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
};

function animate() {
  requestAnimationFrame(animate);

  render();
};

function render() {
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children);
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
    if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
    // store reference to closest object as current intersection object
    INTERSECTED = minIntersectedObject;
    // store color of closest object (for later restoration)
    INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
    // set a new color for closest object
    INTERSECTED.material.color.setHex(0xffff00);
  } // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
    // remove previous intersection object reference
    //     by setting current intersection object to "nothing"
    INTERSECTED = null;
  }

  renderer.render(scene, camera);
};

function addElementToScene(element) {
  elementsLoaded.push(element);
  scene.add(element);
}

function addLinearXSegment(size, direction) {
  x = headerPosition[0];
  y = headerPosition[1];
  z = headerPosition[2];
  var modif = direction === "E" ? 1 : -1;

  addElementToScene(createLinearXSegment(x + (modif * size) / 2, y, z, size));

  // calculate new position
  headerPosition[0] = headerPosition[0] + modif * size;
}

//This smells. I'm not proud of it.
function addLinearYSegment(size, direction) {
  x = headerPosition[0];
  y = headerPosition[1];
  z = headerPosition[2];
  var modif = direction === "N" ? 1 : -1;
  headerPosition[1] = headerPosition[1] + modif * size;
  var elementToAdd = createLinearYSegment(x, y + (modif * size) / 2, z, size);
  addElementToScene(elementToAdd);
}

function addSlopeXZSegment(size, angle) {
  var angleInRad = ((2 * Math.PI) / 360) * angle;

  var x = headerPosition[0];
  var y = headerPosition[1];
  var z = headerPosition[2];

  headerPosition[0] = headerPosition[0] + size * Math.cos(angleInRad);
  headerPosition[2] = headerPosition[2] + size * Math.sin(angleInRad);
  addElementToScene(createSlopeXZSegment(x, y, z, size, angle));
}

function addSlopeXYSegment(size, angle) {
  var angleInRad = ((2 * Math.PI) / 360) * angle;
  var x = 0,
    y = 0,
    z = 0;
  if (headerPosition) {
    x = headerPosition[0];
    y = headerPosition[1];
    z = headerPosition[2];
  } else {
    headerPosition = [0, 0, 0];
  }
  headerPosition[0] = headerPosition[0] + size * Math.cos(angleInRad);
  headerPosition[1] = headerPosition[2] + size * Math.sin(angleInRad);
  addElementToScene(createSlopeXYSegment(x, y, z, size, angle));
}

function addCurvedSESegment(nextDirection) {
  var x = headerPosition[0];
  var y = headerPosition[1];
  var z = headerPosition[2];

  var modif = nextDirection === "W" ? -1 : 1;
  headerPosition[0] = headerPosition[0] + modif * CURVED_RADIUS;
  headerPosition[1] = headerPosition[1] + modif * CURVED_RADIUS;
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
  var x = headerPosition[0],
    y = headerPosition[1],
    z = headerPosition[2];

  var modifX = nextDirection === "E" ? 1 : -1;
  var modifY = nextDirection === "E" ? -1 : 1;
  headerPosition[0] = headerPosition[0] + modifX * CURVED_RADIUS;
  headerPosition[1] = headerPosition[1] + modifY * CURVED_RADIUS;

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
  x = headerPosition[0];
  y = headerPosition[1];
  z = headerPosition[2];

  var modifX = nextDirection === "W" ? -1 : 1;
  var modifY = nextDirection === "S" ? -1 : 1;
  headerPosition[0] = headerPosition[0] + modifX * CURVED_RADIUS;
  headerPosition[1] = headerPosition[1] + modifY * CURVED_RADIUS;
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
  x = headerPosition[0];
  y = headerPosition[1];
  z = headerPosition[2];

  var modif = nextDirection === "S" ? -1 : 1;
  headerPosition[0] = headerPosition[0] + modif * CURVED_RADIUS;
  headerPosition[1] = headerPosition[1] + modif * CURVED_RADIUS;
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
  var direction = headerPosition[3];
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
  var startDirection = headerPosition[3];
  var nextDirection = TurnToLeft(startDirection);
  if (startDirection === "N") addCurvedNESegment(nextDirection);
  if (startDirection === "E") addCurvedSESegment(nextDirection);
  if (startDirection === "S") addCurvedSWSegment(nextDirection);
  if (startDirection === "W") addCurvedNWSegment(nextDirection);
  headerPosition[3] = nextDirection;
}

function addTurnToRight() {
  var startDirection = headerPosition[3];
  var nextDirection = TurnToRight(startDirection);
  if (startDirection === "N") addCurvedNWSegment(nextDirection);
  if (startDirection === "E") addCurvedNESegment(nextDirection);
  if (startDirection === "S") addCurvedSESegment(nextDirection);
  if (startDirection === "W") addCurvedSWSegment(nextDirection);
  headerPosition[3] = nextDirection;
}

function addSlopeVertical(size, angleInGrad) {
  var angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

  x = headerPosition[0];
  y = headerPosition[1];
  z = headerPosition[2];

  addElementToScene(createSlopeXZSegment(x, y, z, size, angleInGrad));

  var deltaX, deltaY, deltaZ;
  var direction = headerPosition[3];
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
  headerPosition[0] = headerPosition[0] + deltaX;
  headerPosition[1] = headerPosition[1] + deltaY;
  headerPosition[2] = headerPosition[2] + deltaZ;
}

function addSlopeHorizontal(size, angleInGrad) {
  let angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

  let x = headerPosition[0],
      y = headerPosition[1],
      z = headerPosition[2];

  addElementToScene(createSlopeXYSegment(x, y, z, size, angleInGrad));

  var deltaX, deltaY, deltaZ;
  var direction = headerPosition[3];
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
  headerPosition[0] = headerPosition[0] + deltaX;
  headerPosition[1] = headerPosition[1] + deltaY;
  headerPosition[2] = headerPosition[2] + deltaZ;
}

function moveHeader(position) {
  headerPosition = position;
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
  for (var i = 0; i < elementsLoaded.length; i++) {
    scene.remove(elementsLoaded[i]);
  }
  elementsLoaded = [];
}

function onMouseMove(e) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
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

  var direction = headerPosition[3];
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

  var direction = headerPosition[3];
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

function changeTextTokenHandler() {
  let mainNode = this;
  let index = getIndexInCollection(mainNode);
  let circuit = circuitHandler.getSelectedCircuit();
  circuit.tokens[index] = this.innerText
    .substring(0, this.innerText.length - 2)
    .trim();
  console.log(`content changed: ${this.innerText}`);
}

function addCircuit(circuit) {
  let newElement = false;
  if (!circuit) {
    circuit = new Circuit("M 0 0 0 N");
    circuit.name = "New circuit";
    circuitHandler.setCircuit(circuit);
    newElement = true;
  }
  let element = document.getElementsByClassName("picker")[0];
  let circuitBtn = document.createElement("BUTTON");
  circuitBtn.className = "circuit-button";
  circuitBtn.addEventListener("click", selectCircuitHandler);
  circuitBtn.innerHTML = circuit.name;
  element.appendChild(circuitBtn);
  loadCircuit(circuit.code);
  if (newElement) selectCircuit(circuitBtn);
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

//TODO: Replace better by a jQuery call.
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
  init();
  animate();

  circuitHandler = new CircuitHandler();
  // Add pattern circuits.
  // fill with the two patterns.
  let pattern1 = new Circuit(
    "M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10",
    true
  );
  pattern1.name = "Example 1";
  circuitHandler.setCircuit(pattern1);
  addCircuit(pattern1); // TODO: Remove UI interaction

  let pattern2 = new Circuit(
    "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15",
    true
  );
  pattern2.name = "Example 2";
  circuitHandler.setCircuit(pattern2);
  addCircuit(pattern2); // TODO: Remove UI interaction
  // Add active class to the current button (highlight it)
  var header = document.getElementsByClassName("picker")[0];
  var btns = header.getElementsByClassName("circuit-button");
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", selectCircuitHandler);
  }
};

function openNav() {
  document.getElementById("mySidepanel").style.width = "400px";
}

function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}
