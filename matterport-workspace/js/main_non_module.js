

//////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////

let buttonPath1;
let buttonPath2;
let buttonRemovePath;
let buttonReturnToPath;

let iframe;

let sdk = null;
let scene = null;
let modelData = null;
let sweepGraph = null;
let initialSweep = null;

let mattertags = null;

let currentSweep = null;
let currentPose = null;
let currentTour = null;

// Navigation buttons
let nextButton = null;
let prevButton = null;

let wasOutOfPath = false;
let debugMode = false;


const key = 'x02q4mq2nsac7euge3234nhec';


// Initialize the application when the iframe loads
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
        console.log('Scene:', scene);
        console.dir(scene);
        modelData = await sdk.Model.getData();
        mattertags = await sdk.Mattertag.getData();
        sweepGraph = createCustomGraph(sdk);

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

                    console.log('In path');
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
        buttonPath1.addEventListener('click', function () {
            startReceptionNavigation();
        });

        buttonPath2.addEventListener('click', async function () {
            startPCRoomNavigation();
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
            alert(`Debug ${debugMode ? 'attivo' : 'disattivato'}`);

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

function createCustomGraph(sdk) {
    console.log("Creating custom graph");
    const graph = sdk.Graph.createDirectedGraph();

    for (let i = 0; i < modelData.sweeps.length; i++) {
        var sweep = modelData.sweeps[i];
        console.log('Adding sweep: ' + sweep.sid);
        graph.addVertex({ id: sweep.sid, data: sweep });
    }

    graph.setEdge(
        {
            src: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("gaqergp0bmzw5sebb8hzf9cid"),
            weight: 1,
        },
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        },
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        // To First Room
        {
            src: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            weight: 1,
        },
        {
            src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            dst: graph.vertex("c4kusa7zp8spb10wtsg9iqtcd"),
            weight: 1,
        },
        {
            src: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            weight: 1,
        },
        {
            src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            dst: graph.vertex("1puw182uiun0fm35aniyfc7sd"),
            weight: 1,
        },
        {
            src: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            weight: 1,
        },
        {
            src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            dst: graph.vertex("aqnqd9rf5he8x0ixk79dganwd"),
            weight: 1,
        },
        {
            src: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            weight: 1,
        },
        {
            src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            dst: graph.vertex("x61ftsf5ghps23nqnwxei5aqc"),
            weight: 1,
        },
        {
            src: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            weight: 1,
        },
        {
            src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            dst: graph.vertex("fw67acz8d7e1iradgw4n2hq0a"),
            weight: 1,
        },
        {
            src: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            weight: 1,
        },
        {
            src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            dst: graph.vertex("sn3dy11xeiukdcq9k9ch0i18c"),
            weight: 1,
        },
        {
            src: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            weight: 1,
        },
        {
            src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            dst: graph.vertex("94zph3p4ad2aqhp1zukwq483c"),
            weight: 1,
        },
        {
            src: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            weight: 1,
        },
        {
            src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            dst: graph.vertex("qa6kk5196g9g6n3d0775s04rd"),
            weight: 1,
        },
        {
            src: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            dst: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
            weight: 1,
        },
        {
            src: graph.vertex("6rcqhhm01788w21shgq5xbifc"),
            dst: graph.vertex("h04mrb8euskemttx9ysdkqyhb"),
            weight: 1,
        },
        // To Second Room
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            weight: 1,
        },
        {
            src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        },
        {
            src: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            dst: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
            weight: 1,
        },
        {
            src: graph.vertex("br8bi09wrtaiudwx3uhmqia5c"),
            dst: graph.vertex("ygarfp05zs5sf4atwxc08fbib"),
            weight: 1,
        },
        {
            src: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            dst: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
            weight: 1,
        },
        {
            src: graph.vertex("ah16yng1ddssb8hxqas1kc2hd"),
            dst: graph.vertex("5g8mwk5t8tksqmruus36fraka"),
            weight: 1,
        }
    );
    return graph;
}

// Returns the vertex by ID from the graph
function getVertexById(graph, id) {
    return graph.vertices.find(v => v.id === id);
}

// Find the closest sweep to a mattertag
function findClosestSweep(tag) {
    let closestSweep = null;
    let minDistance = Infinity;

    for (const sweep of modelData.sweeps) {
        const distance = distance3D(sweep.position, tag.anchorPosition);

        if (distance < minDistance) {
            minDistance = distance;
            closestSweep = sweep;
        }
    }

    console.log(`Sweep più vicino a ${tag.label}: ${closestSweep.sid}`);
    return closestSweep;
}

// Find the shortest path between two sweeps
function findPath(startVertex, endVertex, tag) {
    if (!startVertex || !endVertex) {
        console.warn('Start o end vertex non trovati nel grafo:', startVertex.id, endVertex.id);
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
        console.log(`Percorso più breve da ${startVertex.id} a ${endVertex.id}: ${pathIds.join(' -> ')}`);
        iframe.focus();
        return runner.path;
    } else {
        console.log(`Nessun percorso trovato da ${startVertex.id} a ${endVertex.id}.`);
        iframe.focus();
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

        console.log('Current step:', vertex);
        console.log('Next step:', nextVertex);

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: 2000,
        });

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
    }

    async goTo(vertex) {
        const nextVertex = this.path[this.currentIndex + 1];

        if (vertex.id === nextVertex.id) {
            console.log('Sweep already occupied');
            return;
        }

        await this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
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
            transitionTime: 1000,
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
            transitionTime: 1000,
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

        // Yaw (asse Y) + 180° per correggere direzione
        let yaw = Math.atan2(dx, dz) * (180 / Math.PI) + 180;
        yaw = ((yaw + 180) % 360) - 180;  // Normalizzazione tra -180 e 180

        // Pitch (asse X)
        const distanceXZ = Math.sqrt(dx * dx + dz * dz);
        const pitch = Math.atan2(dy, distanceXZ) * (180 / Math.PI);

        console.log('Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
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

            console.log('Sphere from:', from.x, from.y, from.z);
            console.log('Sphere to:', to.x, to.y, to.z);
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
                enabled: true,
                color: this.sphereColor,
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

// Navigation functions that will be called from Flutter
// startReceptionNavigation(): si aspetta che il Matterport carichi il percorso dal tavolino bianco della stanza 
// coi libri alla reception all'ingresso.
// Gli sweep del percorso dovrebbero essere 10, li ho hardcodati per ora
async function startReceptionNavigation() {
    resetNavigation();

    const destinationTag = mattertags[1];
    const initialVertex = getVertexById(sweepGraph, 'h04mrb8euskemttx9ysdkqyhb');
    const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
    console.log('INITIAL SWEEP:', initialVertex.id);
    console.log('END SWEEP:', endVertex.id);
    console.log('TAG:', destinationTag.label);

    const path = findPath(initialVertex, endVertex, destinationTag);
    if (path != null && path.length > 0) {
        console.log('PATH:', path);
        currentTour = createTour(path, destinationTag);
        currentTour.initialize();
        currentTour.drawPath();
        nextButton.hidden = !debugMode;
        prevButton.hidden = !debugMode;
    }
    else {
        console.log('No path found');
    }
}

// startPCRoomNavigation(): stesso comportamento del metodo sopra, che parte però dall'ingresso e arriva alla stanza coi PC. 
// Gli sweep sono 4 ma anche qui me li gestisco da solo
async function startPCRoomNavigation() {
    resetNavigation();

    const destinationTag = mattertags[0];
    const initialVertex = getVertexById(sweepGraph, 'gaqergp0bmzw5sebb8hzf9cid');
    const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
    console.log('INITIAL SWEEP:', initialVertex.id);
    console.log('END SWEEP:', endVertex.id);
    console.log('TAG:', destinationTag.label);

    const path = findPath(initialVertex, endVertex, destinationTag);
    if (path != null && path.length > 0) {
        console.log('PATH:', path);
        currentTour = createTour(path, destinationTag);
        currentTour.initialize();
        currentTour.drawPath();
        nextButton.hidden = !debugMode;
        prevButton.hidden = !debugMode;
    }
    else {
        console.log('No path found');
    }
}

// navigateToPreviousStep(): si muove allo sweep precedente (si aspetta che il percorso esista già, ma non dovrebbe preoccuparci)
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

// navigateToNextStep(): si muove allo sweep successivo
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

// resetNavigation(): resetta la navigazione, togliendo il percorso attuale
function resetNavigation() {
    if (currentTour) {
        currentTour.reset();
    }
    currentTour = null;

    nextButton.hidden = true;
    prevButton.hidden = true;
}

// Returns the camera to the path
async function returnToPath() {
    if (currentTour) {

        const jsonMessageReturningToPath = {
            type: 'returningToPath',
        };

        sendAppMessage(jsonMessageReturningToPath);

        await currentTour.goTo(currentTour.getCurrentStep());

        const jsonMessageReturnedToPath = {
            type: 'returnedToPath',
        };

        sendAppMessage(jsonMessageReturnedToPath);
    }
}
