

//////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////

let iframe;

// Debug buttons
let buttonPath1;
let buttonPath2;
let buttonRemovePath;
let buttonReturnToPath;
let nextButton = null;
let prevButton = null;

// SDK variables
let sdk = null;
let scene = null;
let modelData = null;
let sweepGraph = null;
let initialSweep = null;

// Points variables
let mattertags = null;
let currentSweep = null;
let currentPose = null;

// Navigation variables
let currentTour = null;
let initialVertex = null;
let endVertex = null;
let destinationMattertag = null;

let wasOutOfPath = false;
let debugMode = false;


const key = 'x02q4mq2nsac7euge3234nhec';


// Initialize the application loading sdk and matterport model
async function initializeApp() {
    buttonPath1 = document.getElementById('startPath1');
    buttonPath2 = document.getElementById('startPath2');
    iframe = document.getElementById('showcase');
    nextButton = document.getElementById('nextButton');
    prevButton = document.getElementById('prevButton');
    buttonRemovePath = document.getElementById('removePath');
    buttonReturnToPath = document.getElementById('returnToPath');
    debugToggle = document.getElementById('debugToggle');

    try {
        console.log('Connecting SDK...');

        sdk = await iframe.contentWindow.MP_SDK.connect(iframe, key);
        console.log('SDK connected');

        scene = await sdk.Scene;
        console.log('Scene:');
        console.dir(scene);
        modelData = await sdk.Model.getData();
        mattertags = await sdk.Mattertag.getData();
        console.log('Mattertags:');
        console.dir(mattertags);

        // sweepGraph = createCustomGraph(sdk);
        sweepGraph = createAutoGraph(sdk);

        // Log if WebGL is supported
        const supported = isWebGLAvailable();
        console.log('WebGL Supported:', supported);
        const jsonMessage = {
            type: 'webglSupport',
            data: supported,
        };

        sendAppMessage(jsonMessage);

        sdk.Camera.pose.subscribe(function (pose) {
            currentPose = pose;
        });

        sdk.Sweep.current.subscribe(function (sweep) {
            if (sweep.sid === '') {
                // Not at a sweep position
                return;
            } else {
                if (!initialSweep) {
                    initialSweep = sweep;
                }

                currentSweep = sweep;
                console.log('Current sweep:', sweep);

                buttonPath1.disabled = false;
                buttonPath2.disabled = false;
            }

            // if current tour doesn't contains the sweep
            if (currentTour && sweepGraph) {
                if (!currentTour.isSweepInPath(currentSweep.sid)) {
                    buttonReturnToPath.hidden = !debugMode;
                    wasOutOfPath = true;

                    const jsonMessageOutOfPath = {
                        type: 'outOfPath',
                    };

                    sendAppMessage(jsonMessageOutOfPath);
                } else {
                    buttonReturnToPath.hidden = true;

                    // Check if there is a misalignment between current step and the
                    // current step of the tour.
                    // This means that the user has moved manually in a step of the tour.
                    if (currentTour.getCurrentStep().id !== currentSweep.sid || wasOutOfPath) {
                        buttonReturnToPath.hidden = true;
                        let currentVertex = getVertexById(sweepGraph, currentSweep.sid);

                        const jsonMessage = {
                            type: 'updateCurrentStep',
                            data: currentTour.getPathIndexById(currentVertex.id),
                        };

                        sendAppMessage(jsonMessage);

                        // Adjust camera to the current step 
                        currentTour.adjustCameraTo(currentVertex);
                    }

                    wasOutOfPath = false;
                }
            }
        });

        // Path buttons listeners
        buttonPath1.addEventListener('click', async function () {
            await startReceptionNavigation();
        });

        buttonPath2.addEventListener('click', async function () {
            await startPCRoomNavigation();
        });

        // Navigation buttons
        nextButton.addEventListener('click', async function () {
            await navigateToNextStep();
        });

        prevButton.addEventListener('click', async function () {
            await navigateToPreviousStep();
        });

        buttonReturnToPath.addEventListener('click', async function () {
            await returnToPath();
        });

        buttonRemovePath.addEventListener('click', function () {
            resetNavigation();
        });

        debugToggle.addEventListener('click', () => {
            debugMode = !debugMode;
            alert(`Debug ${debugMode ? 'enabled' : 'disabled'}`);

            hideButtons(!debugMode);
        });

    } catch (e) {
        console.error('Error connecting SDK:', e);
    }
}

// Create tour
function createTour(path, tag) {
    const tour = new Tour(
        sdk,
        'Tour ' + tag.label,
        path,
        tag,
    );

    console.log('Tour created:', tour);

    return tour;
}

// Show debug buttons
function hideButtons(hidden) {
    buttonPath1.hidden = hidden;
    buttonPath2.hidden = hidden;
    buttonRemovePath.hidden = hidden;
    // buttonReturnToPath.hidden = !debugVisible;
    nextButton.hidden = hidden;
    prevButton.hidden = hidden;
}

//////////////////////////////////////////////////////////////////////
// Graph utilities
//////////////////////////////////////////////////////////////////////

// function createCustomGraph(sdk) {
//     console.log("Creating custom graph");
//     const graph = sdk.Graph.createDirectedGraph();

//     for (let i = 0; i < modelData.sweeps.length; i++) {
//         var sweep = modelData.sweeps[i];
//         console.log('Adding sweep: ' + sweep.sid);
//         graph.addVertex({ id: sweep.sid, data: sweep });
//     }

//     graph.setEdge(
//         {
//             src: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
//             dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             dst: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             weight: 1,
//         },
//         // To First Room
//         {
//             src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
//             dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
//             dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
//             dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
//             dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
//             dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
//             dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
//             dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
//             dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
//             dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
//             dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
//             dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
//             dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
//             dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
//             dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
//             dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
//             dst: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
//             dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
//             weight: 1,
//         },
//         // To Second Room
//         {
//             src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
//             dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
//             dst: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
//             dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             dst: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
//             weight: 1,
//         },
//         {
//             src: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
//             dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
//             weight: 1,
//         }
//     );
//     return graph;
// }

// Create graph using MST
function createAutoGraph(sdk) {
    const graph = sdk.Graph.createDirectedGraph();
    const sweeps = modelData.sweeps;

    // Add all vertices
    for (const sweep of sweeps) {
        graph.addVertex({ id: sweep.sid, data: sweep });
    }

    const visited = new Set();
    const edges = [];

    const startSweep = sweeps[0];
    visited.add(startSweep.sid);

    // Find MST
    while (visited.size < sweeps.length) {
        let bestEdge = null;
        let bestDistance = Infinity;

        for (const sweepA of sweeps) {
            if (!visited.has(sweepA.sid)) continue;

            for (const neighborSid of sweepA.neighbors) {
                const sweepB = sweeps.find(s => s.sid === neighborSid);
                if (!sweepB || visited.has(sweepB.sid)) continue;

                // Make sure sweepB has sweepA as neighbor (reciprocal connection)
                if (!sweepB.neighbors.includes(sweepA.sid)) continue;

                const dist = distance3D(sweepA.position, sweepB.position);

                if (dist < bestDistance) {
                    bestDistance = dist;
                    bestEdge = { from: sweepA, to: sweepB, weight: dist };
                }
            }
        }

        if (bestEdge) {
            visited.add(bestEdge.to.sid);
            edges.push(bestEdge);
        } else {
            console.log('No valid edge found. Isolated sweep.');
            break;
        }
    }

    // Add edges (bidirectional)
    for (const edge of edges) {
        const srcVertex = graph.vertex(edge.from.sid);
        const dstVertex = graph.vertex(edge.to.sid);

        graph.setEdge({ src: srcVertex, dst: dstVertex, weight: edge.weight });
        graph.setEdge({ src: dstVertex, dst: srcVertex, weight: edge.weight });
    }

    return graph;
}

// Returns the vertex by ID from the graph
function getVertexById(graph, id) {
    return graph.vertices.find(v => v.id === id);
}

// Find the closest sweep to a mattertag
function findClosestSweep(mattertag) {
    let closestSweep = null;
    let minDistance = Infinity;

    for (const sweep of modelData.sweeps) {
        const distance = distance3D(sweep.position, mattertag.anchorPosition);

        if (distance < minDistance) {
            minDistance = distance;
            closestSweep = sweep;
        }
    }

    console.log(`Closest sweep to ${mattertag.label}: ${closestSweep.sid}`);
    return closestSweep;
}

// Find the shortest path between two sweeps
function findPath(startVertex, endVertex, tag) {
    if (!startVertex || !endVertex) {
        console.warn('Start or end vertex not found in the graph:', startVertex.id, endVertex.id);
        return null;
    }

    const runner = sdk.Graph.createAStarRunner(sweepGraph, startVertex, endVertex).exec();

    const jsonMessage = {
        type: 'stepsRetrieved',
        data: runner.path?.length || 0,
        tag: tag.label,
    };

    sendAppMessage(jsonMessage);

    if (runner.path && runner.path.length > 0) {
        const pathIds = runner.path.map(v => v.id);
        console.log(`Shortest path from ${startVertex.id} to ${endVertex.id}: ${pathIds.join(' -> ')}`);
        return runner.path;
    } else {
        console.log(`No path found from ${startVertex.id} to ${endVertex.id}.`);
        return null;
    }
}

/**
 * Calculate the Euclidean distance between two 3D points
 * @param {Object} p1 - First point with x, y, z coordinates
 * @param {Object} p2 - Second point with x, y, z coordinates
 * @returns {number} Distance between the points
 */
function distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

//////////////////////////////////////////////////////////////////////
// Tour class
//////////////////////////////////////////////////////////////////////

class Tour {
    constructor(sdk, name, path, finalTag) {
        this.sdk = sdk;
        this.name = name;
        this.path = path;
        this.finalTag = finalTag;
        this.currentIndex = 0;
    }

    // Path visualization
    sceneObject = null;
    visualNodes = [];
    sphereCount = 7;
    sphereColor = { r: 1, g: 1, b: 1 }; // White
    sphereUrl = '/matterport-workspace/assets/the_sphere.glb';

    // Camera transition
    transitionTime = 1000;
    rotationSpeed = 200;

    getCurrentStep() {
        return this.path[this.currentIndex];
    }

    hasNext() {
        return this.currentIndex < this.path.length - 1;
    }

    hasPrevious() {
        return this.currentIndex >= 0;
    }

    isSweepInPath(sid) {
        return this.path.some(vertex => vertex.id === sid);
    }

    initialize() {
        this.currentIndex = 0;
        const vertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: this.transitionTime,
        });

        if (nextVertex) {
            this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
        } else {
            this.rotateCameraBetween(vertex.data.position, this.finalTag.anchorPosition);
        }
    }

    async goTo(vertex) {
        const nextVertex = this.path[this.currentIndex + 1];

        await this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: this.transitionTime,
        });

        if (nextVertex) {
            this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
        } else {
            this.rotateCameraBetween(vertex.data.position, this.finalTag.anchorPosition);
        }

        console.log(`Moved to sweep ${vertex.id}`);
    }

    async goToNext() {
        const currentVertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];
        const nextNextVertex = this.path[this.currentIndex + 2];

        if (!nextVertex) {
            console.log('Next step: no next step (last)');
            return;
        }

        if (currentVertex.id === nextVertex.id) {
            console.log('Sweep already occupied');
            return;
        }

        this.rotateCameraBetween(currentVertex.data.position, nextVertex.data.position);

        await this.sdk.Sweep.moveTo(nextVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: this.transitionTime,
        });

        if (nextNextVertex) {
            this.rotateCameraBetween(nextVertex.data.position, nextNextVertex.data.position);
        } else {
            this.rotateCameraBetween(nextVertex.data.position, this.finalTag.anchorPosition);
        }

        console.log(`Moved to NEXT sweep ${nextVertex.id}`);
        this.currentIndex++;
    }

    async goToPrevious() {
        const currentVertex = this.getCurrentStep();
        const previousVertex = this.path[this.currentIndex - 1];
        const previousPreviousVertex = this.path[this.currentIndex - 2];

        if (!previousVertex) {
            console.log('Previous step: no previous step (first)');
            return;
        }

        if (currentVertex.id === previousVertex.id) {
            console.log('Sweep already occupied');
            return;
        }

        this.rotateCameraBetween(currentVertex.data.position, previousVertex.data.position);

        await this.sdk.Sweep.moveTo(previousVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: this.transitionTime,
        });

        if (previousPreviousVertex) {
            this.rotateCameraBetween(previousVertex.data.position, previousPreviousVertex.data.position);
        } else {
            this.rotateCameraBetween(previousVertex.data.position, currentVertex.data.position);
        }

        console.log(`Moved to PREVIOUS sweep ${previousVertex.id}`);
        this.currentIndex--;
    }

    rotateCameraBetween(fromPos, toPos) {
        if (!fromPos || !toPos) {
            console.warn('Positions not valid for rotation');
            return;
        }

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dz = toPos.z - fromPos.z;

        // Yaw (Y axis) + 180° to correct direction
        let yaw = Math.atan2(dx, dz) * (180 / Math.PI) + 180;
        yaw = ((yaw + 180) % 360) - 180;  // Normalization between -180 and 180

        // Pitch (X axis)
        const distanceXZ = Math.sqrt(dx * dx + dz * dz);
        const pitch = Math.atan2(dy, distanceXZ) * (180 / Math.PI);

        console.log('Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: this.rotationSpeed });
    }

    getPathIndexById(vertexId) {
        return this.path.findIndex(v => v.id === vertexId);
    }

    // Updates the current index and adjusts the camera position to the next vertex
    adjustCameraTo(vertex) {
        this.currentIndex = this.getPathIndexById(vertex.id);
        let nextVertex = this.path[this.currentIndex + 1];

        if (nextVertex) {
            this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
        } else {
            this.rotateCameraBetween(vertex.data.position, this.finalTag.anchorPosition);
        }
    }

    // Draw entire path
    async drawPath() {
        const [sceneObject] = await sdk.Scene.createObjects(1);
        this.sceneObject = sceneObject;

        for (let i = 0; i < this.path.length - 1; i++) {
            const from = this.path[i].data.position;
            const to = this.path[i + 1].data.position;

            this.drawSpheres(this.sceneObject, from, to);
        }
    }

    drawSpheres(sceneObject, from, to) {
        for (let i = 0; i <= this.sphereCount; i++) {
            const t = i / this.sphereCount;

            const x = from.x * (1 - t) + to.x * t;
            const y = from.y * (1 - t) + to.y * t;
            const z = from.z * (1 - t) + to.z * t;

            const node = sceneObject.addNode();

            node.obj3D.position.set(x, 0.5, z);

            node.addComponent('mp.gltfLoader', {
                url: this.sphereUrl,
                localScale: { x: .03, y: .03, z: .03 },
                localPosition: { x: -0.15, y: 0, z: 0.15 }, // Offset to center the sphere on the path
                visible: true,
            });

            node.addComponent('mp.ambientLight', {
                color: this.sphereColor,
                intensity: 2.0,
            });

            node.start();
            this.visualNodes.push(node);
        }
    }

    async reset() {
        this.currentIndex = 0;

        for (const node of this.visualNodes) {
            await node.stop();
        }
        this.visualNodes = [];
    }
}

//////////////////////////////////////////////////////////////////////
// App communication functions
//////////////////////////////////////////////////////////////////////
// Example of functions to be called from Flutter to start navigation
//
// webViewController
//  ..runJavaScript('setStartPosition("<sweepId>")') ex: "6rcqhhm01788w21shgq5xbifc"
//  ..runJavaScript('setEndPosition("<mattertagSid>")') ex: "hDLthVM3uCY"
//  ..runJavaScript('startNavigation()')
//////////////////////////////////////////////////////////////////////

// Set start position
function setStartPosition(sweepId) {
    initialVertex = getVertexById(sweepGraph, sweepId);
    console.log('Initial sweep:', initialVertex.id);
}

// Set end position
function setEndPosition(mattertagSid) {
    destinationMattertag = mattertags.find(m => m.sid === mattertagSid);
    endVertex = getVertexById(sweepGraph, findClosestSweep(destinationMattertag).sid);
    console.log('Destination sweep:', endVertex.id);
}

// Start navigation
function startNavigation() {
    console.log('Start navigation');

    if (!initialVertex || !endVertex || !destinationMattertag) {
        console.log('Missing navigation data');
        return;
    }

    const path = findPath(initialVertex, endVertex, destinationMattertag);
    if (path != null && path.length > 0) {
        console.log('Path found:', path);
        currentTour = createTour(path, destinationMattertag);
        currentTour.initialize();
        currentTour.drawPath();
        nextButton.hidden = !debugMode;
        prevButton.hidden = !debugMode;
    }
    else {
        console.log('No path found');
    }
}

// Reset navigation, removing the current path
function resetNavigation() {
    initialVertex = null;
    endVertex = null;
    destinationMattertag = null;

    if (currentTour) {
        currentTour.reset();
    }
    currentTour = null;

    nextButton.hidden = true;
    prevButton.hidden = true;

    console.log('Navigation reset');
}

// Moves to the previous sweep (it waits for the path to exist already, but it shouldn't worry about it)
async function navigateToPreviousStep() {
    if (currentTour) {
        if (currentTour.hasPrevious()) {
            const jsonMessageNavPrev = {
                type: 'navigatingToPreviousStep',
            };

            sendAppMessage(jsonMessageNavPrev);

            await currentTour.goToPrevious();

            const jsonMessageArrPrev = {
                type: 'arrivedToPreviousStep',
            };

            sendAppMessage(jsonMessageArrPrev);
        }
    }
}

// Moves to the next sweep
async function navigateToNextStep() {
    if (currentTour) {
        const jsonMessageNavNext = {
            type: 'navigatingToNextStep',
        };

        sendAppMessage(jsonMessageNavNext);

        await currentTour.goToNext();

        const jsonMessageArrNext = {
            type: 'arrivedToNextStep',
        };

        sendAppMessage(jsonMessageArrNext);
    }
}

// Returns the camera to the path
async function returnToPath() {
    if (currentTour) {

        const jsonMessageReturningToPath = {
            type: 'returningToPath',
        };

        sendAppMessage(jsonMessageReturningToPath);

        console.log('Returning to path', currentTour.getCurrentStep());
        await currentTour.goTo(currentTour.getCurrentStep());

        const jsonMessageReturnedToPath = {
            type: 'returnedToPath',
        };

        sendAppMessage(jsonMessageReturnedToPath);
    }
}

// Send app message jslog
function sendAppMessage(jsonMessage) {
    if (window.jslog) {
        window.jslog.postMessage(JSON.stringify(jsonMessage));
    }
    window.postMessage(JSON.stringify(jsonMessage), '*');
}

// Check if WebGL is available
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (
            canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        ));
    } catch (e) {
        return false;
    }
}

// Test navigation to the reception
async function startReceptionNavigation() {
    resetNavigation();

    // setStartPosition("ah16yng1ddssb8hxqas1kc2hd");
    // setStartPosition('h04mrb8euskemttx9ysdkqyhb');
    // setStartPosition('fw67acz8d7e1iradgw4n2hq0a');
    setStartPosition("5g8mwk5t8tksqmruus36fraka");
    setEndPosition(mattertags[1].sid);
    startNavigation();
}

// Test navigation to the room with the PCs
async function startPCRoomNavigation() {
    resetNavigation();

    // setStartPosition('gaqergp0bmzw5sebb8hzf9cid');
    setStartPosition('6rcqhhm01788w21shgq5xbifc');
    setEndPosition(mattertags[0].sid);
    startNavigation();
}

