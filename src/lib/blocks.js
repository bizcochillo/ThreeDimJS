const SEGMENT_YMAX = 5;
const SEGMENT_ZMAX = 2;
const CURVED_RADIUS = 7;

var renderer, stats, scene, camera;
var newPosition = [-30, 0, 4, "E"];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var INTERSECTED;
var elementsLoaded = [];

var createLinearXSegment = function (x, y, z, length) {
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
var createLinearYSegment = function (x, y, z, length) {
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

var init = function() {
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

  for (var i = 0; i <= segmentCount; i++) {
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

  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
}

var animate = function() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

var render = function() {
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    var i;
    var minDistance = Number.MAX_SAFE_INTEGER;
    var minIntersectedObject = null;
    for (i = 0; i < intersects.length; i++) {
      console.log(intersects[i].distance);
      if (
        minIntersectedObject == null ||
        minDistance > intersects[i].distance
      ) {
        minIntersectedObject = intersects[i].object;
        minDistance = intersects[i].distance;
      }
    }
    if (INTERSECTED)
      INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
    // store reference to closest object as current intersection object
    INTERSECTED = minIntersectedObject;
    // store color of closest object (for later restoration)
    INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
    // set a new color for closest object
    INTERSECTED.material.color.setHex(0xffff00);
  } // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if (INTERSECTED)
      INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
    // remove previous intersection object reference
    //     by setting current intersection object to "nothing"
    INTERSECTED = null;
  }

  renderer.render(scene, camera);
}

var load = function (circuit) {

  function addElementToScene(element)
  {
    elementsLoaded.push(element);
    scene.add(element);
  }

  function addLinearXSegment(size, direction) {
    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];
    var modif = direction === "E" ? 1 : -1;

    addElementToScene(createLinearXSegment(x + (modif * size) / 2, y, z, size));

    // calculate new position
    newPosition[0] = newPosition[0] + modif * size;
  }

  //This smells. I'm not proud of it.
  function addLinearYSegment(size, direction) {
    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];
    var modif = direction === "N" ? 1 : -1;
    newPosition[1] = newPosition[1] + modif * size;
    var elementToAdd = createLinearYSegment(x, y + (modif * size) / 2, z, size);
    elementsLoaded.push(elementToAdd);
    addElementToScene(elementToAdd);
  }

  function addSlopeXZSegment(size, angle) {
    var angleInRad = ((2 * Math.PI) / 360) * angle;

    var x = newPosition[0];
    var y = newPosition[1];
    var z = newPosition[2];

    newPosition[0] = newPosition[0] + size * Math.cos(angleInRad);
    newPosition[2] = newPosition[2] + size * Math.sin(angleInRad);
    addElementToScene(createSlopeXZSegment(x, y, z, size, angle));
  }

  function addSlopeXYSegment(size, angle) {
    var angleInRad = ((2 * Math.PI) / 360) * angle;
    var x = 0,
      y = 0,
      z = 0;
    if (newPosition) {
      x = newPosition[0];
      y = newPosition[1];
      z = newPosition[2];
    } else {
      newPosition = [0, 0, 0];
    }
    newPosition[0] = newPosition[0] + size * Math.cos(angleInRad);
    newPosition[1] = newPosition[2] + size * Math.sin(angleInRad);
    addElementToScene(createSlopeXYSegment(x, y, z, size, angle));
  }

  function addCurvedSESegment(nextDirection) {
    var x = newPosition[0];
    var y = newPosition[1];
    var z = newPosition[2];

    var modif = nextDirection === "W" ? -1 : 1;
    newPosition[0] = newPosition[0] + modif * CURVED_RADIUS;
    newPosition[1] = newPosition[1] + modif * CURVED_RADIUS;
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
    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];

    var modifX = nextDirection === "E" ? 1 : -1;
    var modifY = nextDirection === "E" ? -1 : 1;
    newPosition[0] = newPosition[0] + modifX * CURVED_RADIUS;
    newPosition[1] = newPosition[1] + modifY * CURVED_RADIUS;

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
    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];

    var modifX = nextDirection === "W" ? -1 : 1;
    var modifY = nextDirection === "S" ? -1 : 1;
    newPosition[0] = newPosition[0] + modifX * CURVED_RADIUS;
    newPosition[1] = newPosition[1] + modifY * CURVED_RADIUS;
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
    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];

    var modif = nextDirection === "S" ? -1 : 1;
    newPosition[0] = newPosition[0] + modif * CURVED_RADIUS;
    newPosition[1] = newPosition[1] + modif * CURVED_RADIUS;
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
    var direction = newPosition[3];
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
    var startDirection = newPosition[3];
    var nextDirection = TurnToLeft(startDirection);
    if (startDirection === "N") addCurvedNESegment(nextDirection);
    if (startDirection === "E") addCurvedSESegment(nextDirection);
    if (startDirection === "S") addCurvedSWSegment(nextDirection);
    if (startDirection === "W") addCurvedNWSegment(nextDirection);
    newPosition[3] = nextDirection;
  }

  function addTurnToRight() {
    var startDirection = newPosition[3];
    var nextDirection = TurnToRight(startDirection);
    if (startDirection === "N") addCurvedNWSegment(nextDirection);
    if (startDirection === "E") addCurvedNESegment(nextDirection);
    if (startDirection === "S") addCurvedSESegment(nextDirection);
    if (startDirection === "W") addCurvedSWSegment(nextDirection);
    newPosition[3] = nextDirection;
  }

  function addSlopeVertical(size, angleInGrad) {
    var angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];

    addElementToScene(createSlopeXZSegment(x, y, z, size, angleInGrad));

    var deltaX, deltaY, deltaZ;
    var direction = newPosition[3];
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
    newPosition[0] = newPosition[0] + deltaX;
    newPosition[1] = newPosition[1] + deltaY;
    newPosition[2] = newPosition[2] + deltaZ;
  }

  function addSlopeHorizontal(size, angleInGrad) {
    var angleInRad = ((2 * Math.PI) / 360) * angleInGrad;

    x = newPosition[0];
    y = newPosition[1];
    z = newPosition[2];

    addElementToScene(createSlopeXYSegment(x, y, z, size, angleInGrad));

    var deltaX, deltaY, deltaZ;
    var direction = newPosition[3];
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
    newPosition[0] = newPosition[0] + deltaX;
    newPosition[1] = newPosition[1] + deltaY;
    newPosition[2] = newPosition[2] + deltaZ;
  }

  function circuit1() {
    addLinearSegment(10);
    addSlopeHorizontal(15, 15);
    addLinearSegment(10);
    addTurnToLeft();
    addLinearSegment(10);
    addSlopeHorizontal(15, -15);
    addLinearSegment(10);
    addSlopeVertical(15, 30);
    addLinearSegment(20);
    addSlopeVertical(15, -30);
    addLinearSegment(10);
    addSlopeHorizontal(15, 15);
    addLinearSegment(10);
    addTurnToLeft();
    addLinearSegment(10);
    addSlopeHorizontal(15, -15);
    addLinearSegment(20);
    addSlopeHorizontal(15, 15);
    addLinearSegment(10);
    addTurnToLeft();
    addLinearSegment(10);
    addSlopeHorizontal(15, -15);
    addLinearSegment(10);
    addSlopeVertical(15, 30);
    addLinearSegment(20);
    addSlopeVertical(15, -30);
    addLinearSegment(10);
    addSlopeHorizontal(15, 15);
    addLinearSegment(10);
    addTurnToLeft();
    addLinearSegment(10);
    addSlopeHorizontal(15, -15);
    addLinearSegment(10);
  }

  function circuit2() {
    addLinearSegment(30);
    addSlopeVertical(10, 13);
    addTurnToLeft();
    addLinearSegment(7);
    addSlopeVertical(6, -27);
    addLinearSegment(5);
    addTurnToRight();
    addLinearSegment(4);
    addTurnToLeft();
    addLinearSegment(29);
    addTurnToRight();
    addLinearSegment(16);
    addTurnToRight();
    addLinearSegment(40);
    addSlopeVertical(15, 25);
    addLinearSegment(23);
    addTurnToRight();
    addLinearSegment(23);
    addTurnToLeft();
    addLinearSegment(13);
    addTurnToRight();
    addSlopeVertical(6, -80);
    addLinearSegment(32);
    addSlopeHorizontal(17, -23);
    addLinearSegment(7);
    addTurnToRight();
    addLinearSegment(9);
    addTurnToLeft();
    addLinearSegment(25);
    addTurnToRight();
    addLinearSegment(13);
    addTurnToRight();
    addLinearSegment(20);

    newPosition = [-47, -6, 10, "E"];
    addLinearSegment(57);

    newPosition = [-49, -6, 4, "E"];
    addLinearSegment(60);

    newPosition = [-34, -8.5, 4, "S"];
    addSlopeVertical(7, -15);

    newPosition = [-21, -8.5, 4, "S"];
    addSlopeVertical(7, -15);

    newPosition = [-3, -8.5, 4, "S"];
    addSlopeVertical(7, -15);

    newPosition = [6, -8.5, 4, "S"];
    addSlopeVertical(7, -15);

    newPosition = [-34, -8.5, 10, "S"];
    addSlopeVertical(7, -15);

    newPosition = [-21, -8.5, 10, "S"];
    addSlopeVertical(7, -15);

    newPosition = [-3, -8.5, 10, "S"];
    addSlopeVertical(7, -15);

    newPosition = [6, -8.5, 10, "S"];
    addSlopeVertical(7, -15);
  }

  window.requestAnimationFrame(render);
  window.addEventListener("mousemove", onMouseMove, false);

  if (circuit===1){
    circuit1();
  }
  else {
    circuit2();
  }
};

var remove = function() {
  for (var i=0;i<elementsLoaded.length; i++)
  {
    scene.remove(elementsLoaded[i]);
  }
  elementsLoaded=[];
}

var onMouseMove = function (e) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

var onWindowResize = function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

var createSlopeXZSegment = function(x, y, z, length, angleInGrad) {
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

  var direction = newPosition[3];
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

var createCurvedSegment = function(x, y, z, rotX, rotY, rotZ) {
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

var createSlopeXYSegment = function(x, y, z, length, angleInGrad) {
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

  var direction = newPosition[3];
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

init();
animate();
