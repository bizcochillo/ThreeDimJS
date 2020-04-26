const SEGMENT_YMAX = 5;
const SEGMENT_ZMAX = 2;
const CURVED_RADIUS = 7;
const ESC_KEYCODE = 27;
const INTRO_KEYCODE = 13;

let _token_index_in_edition_DOM = -1;
let _circuit_index_selected = -1;

let _renderer,
    _scene,
    _camera,
    _controls,
    _header_position = [-30, 0, 4, "E"],
    _raycaster = new THREE.Raycaster(),
    _mouse = new THREE.Vector2(),
    _intersected,
    _elements_loaded = [],
    _circuits;

function createLinearXSegment(x, y, z, length) {
    let segment_geo = new THREE.BoxBufferGeometry(length, 5, 2);
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

function initCircuitViewEngine() {
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

function animateCircuitViewEngine() {
    requestAnimationFrame(animateCircuitViewEngine);

    renderViewEngine();
};

function renderViewEngine() {
    // update the picking ray with the camera and mouse position
    _raycaster.setFromCamera(_mouse, _camera);
    // calculate objects intersecting the picking ray
    var intersects = _raycaster.intersectObjects(_scene.children);
    if (intersects.length > 0) {
        var i;
        var min_distance = Number.MAX_SAFE_INTEGER;
        var minIntersectedObject = null;
        for (i = 0; i < intersects.length; i++) {
            if (
                minIntersectedObject == null ||
                min_distance > intersects[i].distance
            ) {
                minIntersectedObject = intersects[i].object;
                min_distance = intersects[i].distance;
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

function addCurvedSESegment(next_direction) {
    let x = _header_position[0];
    let y = _header_position[1];
    let z = _header_position[2];

    let modif = next_direction === "W" ? -1 : 1;
    _header_position[0] = _header_position[0] + modif * CURVED_RADIUS;
    _header_position[1] = _header_position[1] + modif * CURVED_RADIUS;
    let curvedSegmentSE;
    if (next_direction === "N")
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
    let x = _header_position[0],
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

function loadCircuitInViewEngine(circuit) {
    window.requestAnimationFrame(renderViewEngine);
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
            segmentLength * Math.cos(angle), -SEGMENT_YMAX / 2,
            segmentLength * Math.sin(angle) - SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle), +SEGMENT_YMAX / 2,
            segmentLength * Math.sin(angle) - SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle), -SEGMENT_YMAX / 2,
            segmentLength * Math.sin(angle) + SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle), +SEGMENT_YMAX / 2,
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
            segmentLength * Math.sin(angle) - SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle),
            segmentLength * Math.sin(angle) - SEGMENT_YMAX / 2, +SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle),
            segmentLength * Math.sin(angle) + SEGMENT_YMAX / 2, -SEGMENT_ZMAX / 2
        ),
        new THREE.Vector3(
            segmentLength * Math.cos(angle),
            segmentLength * Math.sin(angle) + SEGMENT_YMAX / 2, +SEGMENT_ZMAX / 2
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

function loadCircuitRepresentation(circuit) {
    //Initialize the tokens list to emtpy in DOM. 
    let element = document.getElementsByClassName("token-panel")[0];
    element.innerHTML = "";

    //remove the circuit previously load in the View Engine
    removeCircuitFromScene();

    //load tokens
    for (let token of circuit.tokens) {
        let container = createTokenContainer(token, circuit.isPattern);
        element.appendChild(container);
    }

    //Load the circuit in the View Engine. 
    loadCircuitInViewEngine(circuit.tokens.join());
}

function addNewCircuit() {
    circuit = new Circuit("M 0 0 0 N");
    circuit.name = "New circuit";
    _circuits.addCircuit(circuit);
    addCircuitToPickerDOMControl(circuit);
    selectCircuitFromPickerDOM(_circuits.total() - 1);
}

function copyCircuit() {
    //let circuits_DOM = document.getElementsByClassName("picker")[0];
    let circuit_to_copy = _circuits.getCircuit(_circuit_index_selected);
    let new_circuit = circuit_to_copy.copy();
    new_circuit.name += " (copy)";
    _circuits.addCircuit(new_circuit);
    addCircuitToPickerDOMControl(new_circuit);
    selectCircuitFromPickerDOM(_circuits.total() - 1);
}

function saveCircuit() {
    let circuit_to_save = _circuits.getCircuit(_circuit_index_selected);
    circuit_to_save.save();
}

function addCircuitToPickerDOMControl(circuit) {
    let element = document.getElementsByClassName("picker")[0];
    let circuit_button = document.createElement("BUTTON");
    circuit_button.className = "circuit-button";
    circuit_button.addEventListener("click", selectCircuitClickHandler);
    circuit_button.innerHTML = circuit.name;
    element.appendChild(circuit_button);
}

function getIndexInCollection(el) {
    if (!el) return -1;
    var i = 0;
    do {
        i++;
    } while ((el = el.previousElementSibling));
    return i - 1;
}

function selectCircuitFromPickerDOM(index) {
    _circuit_index_selected = index;
    let circuit = _circuits.getCircuit(index);
    // update picker
    let current = document.getElementsByClassName("active");
    if (current.length > 0)
        current[0].className = current[0].className.replace(" active", "");
    let elements = document.getElementsByClassName("circuit-button");
    let element = elements[index];
    element.className += " active";
    // update picker options    
    document.getElementById("buttonSaveCircuit").disabled = false || circuit.isPattern;
    document.getElementById("buttonRenameCircuit").disabled = false || circuit.isPattern;
    document.getElementById("buttonCopyCircuit").disabled = false;
    document.getElementById("buttonRemoveCircuit").disabled = false || circuit.isPattern;
    // update View Engine
    loadCircuitRepresentation(circuit);
}

function removeCircuit() {
    let current = document.getElementsByClassName("active");
    if (current.length === 0) return;
    let circuit_idx = getIndexInCollection(current[0]);
    //update UI
    let current_element = current[0];
    current_element.parentNode.removeChild(current_element);
    //update local storage if apply
    let circuit_to_remove = _circuits.getCircuit(circuit_idx);
    circuit_to_remove.remove();
    //update model
    _circuits.removeCircuit(circuit_idx);
    let new_index = Math.max(circuit_idx - 1, 0);
    selectCircuitFromPickerDOM(new_index);
}

function selectCircuitClickHandler() {
    let circuit_button_idx = getIndexInCollection(this);
    selectCircuitFromPickerDOM(circuit_button_idx);
}

// functions to open/close side panel
function openSidePanel() {
    document.getElementById("circuitPickerSidePanel").style.width = "360px";
}

function closeSidePanel() {
    document.getElementById("circuitPickerSidePanel").style.width = "0";
}

/* integration of token management */
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
            parameters.push({ label: "dir", value: parameters_items[3] });
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
    let circuit = _circuits.getCircuit(_circuit_index_selected);
    circuit.tokens.splice(index + 1, 0, token);
    loadCircuitRepresentation(circuit);
}

function removeTokenContainerHandler() {
    let main_node = this.parentNode.parentNode;
    let index = getIndexInDOMCollection(main_node);
    main_node.remove();
    let circuit = _circuits.getCircuit(_circuit_index_selected);
    circuit.tokens.splice(index, 1);
    loadCircuitRepresentation(circuit);
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
            // update circuit model
            let circuit = _circuits.getCircuit(_circuit_index_selected);
            circuit.updateToken(new_token, _token_index_in_edition_DOM);
            // update view engine
            loadCircuitRepresentation(circuit)
            break;
        case ESC_KEYCODE: //ESC
            break;
    }
    //hide edition panel and show presentation panel.
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

function createTokenContainer(token, is_pattern = false) {
    let main_container = document.createElement("DIV");
    main_container.className = "token-panel-item";

    //DIV presentation
    let presentation_div = document.createElement("DIV");
    presentation_div.className = "token-panel-presentation";
    updatePresentationDiv(presentation_div, token);

    let editor_div, buttons_div;
    if (!is_pattern) {
        editor_div = document.createElement("DIV");
        buttons_div = document.createElement("DIV");
        editor_div.className = "token-panel-editor";
        buttons_div.className = "token-panel-editor-options";

        main_container.appendChild(buttons_div);
    }

    main_container.appendChild(presentation_div);

    if (!is_pattern) {
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
    }
    return main_container;
}

window.onload = function() {
    initCircuitViewEngine();
    animateCircuitViewEngine();

    _circuits = new CircuitsCollection();

    for (let i = 0; i < _circuits.total(); i++) {
        addCircuitToPickerDOMControl(_circuits.getCircuit(i));
    }
};

class Circuit {
    constructor(code, isPattern = false) {
        this.code = code;
        this.tokens = code.split(",");
        this.isPattern = isPattern;
        this.name = "";
        this.guid = null;
    }

    copy() {
        let newCircuit = new Circuit(this.code);
        newCircuit.name = this.name;
        return newCircuit;
    }

    updateToken(new_token, index) {
        this.tokens[index] = new_token;
        this.code = this.tokens.join();
    }

    save() {
        if (this.guid == null) {
            this.guid = this.uuidv4();
        }
        window.localStorage.setItem(this.guid, `${this.name}|${this.tokens.join()}`);
        let circuits = window.localStorage.getItem("_circuits");
        if (!circuits) {
            circuits = this.guid;
        } else {
            let circuits_guids_tokens = circuits.split('|');
            let exists_token = false;
            for (let circuit_guid of circuits_guids_tokens) {
                if (circuit_guid == this.guid) {
                    exists_token = true;
                    break;
                }
            }
            if (!exists_token) {
                circuits += "|" + this.guid
            };
        }
        window.localStorage.setItem("_circuits", circuits);
    }

    remove() {
        if (this.guid) {
            window.localStorage.removeItem(this.guid);
            let circuit_guids = window.localStorage.getItem("_circuits");
            if (!circuit_guids) return;
            let guids_tokens = circuit_guids.split('|');
            let new_guids = "";
            for (let circuit_guid of guids_tokens) {
                if (circuit_guid != this.guid) {
                    if (new_guids != "") new_guids += "|";
                    new_guids += circuit_guid;
                }
            }
            window.localStorage.setItem("_circuits", new_guids);
        }
    }

    static load(guid) {
        var circuit_str = window.localStorage.getItem(guid);
        if (!circuit_str) {
            return null;
        }
        var circuit_tokens = circuit_str.split('|');
        var circuit = new Circuit(circuit_tokens[1], false);
        circuit.name = circuit_tokens[0];
        circuit.guid = guid;
        return circuit;
    }

    // from https://stackoverflow.com/questions/105034/how-to-create-guid-uuid
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

class CircuitsCollection {

    getCircuit(index) {
        return this.circuits[index];
    }

    removeCircuit(index) {
        this.circuits.splice(index, 1);
    }

    addCircuit(circuit) {
        this.circuits.push(circuit);
    }

    total() {
        return this.circuits.length;
    }

    constructor() {
        this.circuits = [];
        // Add pattern circuits.
        // fill with the two patterns.
        let pattern1 = new Circuit(
            "M -5 -60 1 E,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 20,H 15 15,F 10,L,F 10,H 15 -15,F 10,V 15 30,F 20,V 15 -30,F 10,H 15 15,F 10,L,F 10,H 15 -15,F 10",
            true
        );
        pattern1.name = "Example 1";
        this.addCircuit(pattern1);


        let pattern2 = new Circuit(
            "M -30 0 4 E,F 30,V 10 13,L,F 7,V 6 -27,F 5,R,F 4,L,F 29,R,F 16,R,F 40,V 15 25,F 23,R,F 23,L,F 13,R,V 6 -80,F 32,H 17 -23,F 7,R,F 9,L,F 25,R,F 13,R,F 20,M -47 -6 10 E    ,F 57,M -49 -6 4 E,F 60,M -34 -8.5 4 S,V 7 -15,M -21 -8.5 4 S,V 7 -15,M -3 -8.5 4 S,V 7 -15,M 6 -8.5 4 S,V 7 -15,M -34 -8.5 10 S,V 7 -15,M -21 -8.5 10 S,V 7 -15,M -3 -8.5 10 S,V 7 -15,M 6 -8.5 10 S,V 7 -15",
            true
        );
        pattern2.name = "Example 2";
        this.addCircuit(pattern2);

        // load circuits from local storage;
        let circuit_guids = window.localStorage.getItem("_circuits");
        if (circuit_guids) {
            let guids = circuit_guids.split("|");
            for (let guid of guids) {
                let circuit_info = window.localStorage.getItem(guid);
                if (circuit_info) {
                    let circuit_obj = Circuit.load(guid);
                    this.addCircuit(circuit_obj);
                }
            }
        }
    }
}