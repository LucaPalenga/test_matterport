import { computeYaw, distance3D, debugDrawDirection, pointAt, calculateYawAngle } from './utils.js';
import { createGraph } from './graph_utils.js';

// Global variables
const buttonPath = document.getElementById('path');
const buttonPath1 = document.getElementById('startPath1');
const buttonPath2 = document.getElementById('startPath2');
const iframe = document.getElementById('showcase');
const container = document.getElementById('path-buttons-container');

let sdk = null;
let modelData = null;
let sweepGraph = null;
let initialSweep = null;

let mattertags = null;

let currentPose = null;

// Map that associates mattertag -> closest sweep
const endSweepsMap = new Map();

// Initialize the application when the iframe loads
window.initializeApp = async () => {
    buttonPath.disabled = true;

    try {
        console.log('Connecting SDK...');
        sdk = await window.MP_SDK.connect(iframe, 'beyaptx90idi0amgighxdu00a', '2.5');
        console.log('SDK connected');

        modelData = await sdk.Model.getData();
        mattertags = await sdk.Mattertag.getData();
        console.log('Mattertags retrieved:', mattertags);

        // Create graph
        // sweepGraph = await sdk.Sweep.createDirectedGraph();
        // sweepGraph = await sdk.Sweep.createGraph();
        sweepGraph = await createGraph(sdk);
        console.log('Sweep graph created:', sweepGraph);

        sdk.Camera.pose.subscribe(function (pose) {
            // Changes to the Camera pose have occurred.
            // console.log('Current position is ', pose.position);
            // console.log('Rotation angle is ', pose.rotation);
            // console.log('View mode is ', pose.mode);
            currentPose = pose;
        });


        sdk.Sweep.current.subscribe(function (currentSweep) {
            // Change to the current sweep has occurred.
            if (currentSweep.sid === '') {
                // console.log('Not currently stationed at a sweep position');
            } else {
                console.log('Current sweep:', currentSweep);
                // Save initial position
                // if (!initialSweep) {
                initialSweep = currentSweep;
                // console.log('Initial position saved:', initialSweep);
                // Unlock path button
                buttonPath.disabled = false;

                // }
            }
        });


        buttonPath.addEventListener('click', async function () {
            mattertags.forEach((mattertag) => {
                let closestSweep = findClosestSweep(mattertag);
                console.log(`Closest sweep for mattertag "${mattertag.label}":`, closestSweep);
                endSweepsMap.set(mattertag, closestSweep);
            });

            console.log('Mappa mattertag -> sweep più vicino:', endSweepsMap);

            // For each end sweep find the shortest path
            const pathsTags = new Map();
            let pathButtonsCount = 0;

            for (const [tag, endSweep] of endSweepsMap.entries()) {
                console.log(`--- Percorso verso Mattertag: ${tag.label} ---`);
                console.log('INITIAL SWEEP:', initialSweep);
                console.log('END SWEEP:', endSweep);

                const startVertex = getVertexById(sweepGraph, initialSweep.sid);
                const endVertex = getVertexById(sweepGraph, endSweep.sid);

                console.log('START VERTEX:', startVertex);
                console.log('END VERTEX:', endVertex);

                const path = findPath(startVertex, endVertex, tag);
                if (path) {
                    pathsTags.set(tag, path);
                    createPathButtons(path, tag, pathButtonsCount);
                    pathButtonsCount++;
                }
            }

            console.log('Paths:', pathsTags);
        });

        buttonPath2.addEventListener('click', async function () {
            const initialVertex = getVertexById(sweepGraph, 'h04mrb8euskemttx9ysdkqyhb');
            // const initialVertex = getVertexById(sweepGraph, initialSweep.sid);
            const endVertex = getVertexById(sweepGraph, findClosestSweep(mattertags[0]).sid);
            console.log('INITIAL SWEEP:', initialVertex);
            console.log('END SWEEP:', endVertex);
            console.log('TAG:', mattertags[0]);

            // Move to initial sweep
            sdk.Sweep.moveTo(initialVertex.id, {
                transition: sdk.Sweep.Transition.FLY,
                transitionTime: 2000,
            });

            const path = findPath(initialVertex, endVertex, mattertags[0]);
            console.log('PATH:', path);

            runTour(path, mattertags[0]);
        });

        // buttonPath1.addEventListener('click', async function () {
        //     runTour(pathsTags.get(endSweepsMap.get('Scaffale')));
        // });

    } catch (e) {
        console.error('Error connecting SDK:', e);
    }
};

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

// Create buttons for each path
function createPathButtons(path, destinationTag, pathButtonsCount) {
    console.log('Creo pulsanti');
    console.log('PATH:', path);
    console.log('DESTINATION TAG:', destinationTag);

    console.log('Creo pulsante ' + pathButtonsCount);
    const btn = document.createElement('button');
    btn.className = 'path-button';
    btn.textContent = `Vai a ${destinationTag.label}`;
    btn.style.position = 'absolute';
    btn.style.height = '30px';
    btn.style.top = `${50 + pathButtonsCount * 40}px`; // Vertical position with spacing
    btn.style.left = '10px'; // Fixed horizontal position

    // Add click event to the button
    btn.addEventListener('click', () => {
        if (path && path.length > 0) {
            runTour(path, destinationTag);
        }
    });

    container.appendChild(btn);
}

// Get sweepGraph vertices
function getSweepGraphVertices() {
    let vertices = [];

    if (!sweepGraph) {
        console.warn("Grafo sweep non ancora inizializzato.");
        return [];
    }

    // Get all graph vertices
    for (const vertex of sweepGraph.vertices) {
        console.log(`*** vertex: ${vertex.id}`);
        vertices.push(vertex);
    }

    console.log('Totale vertici nel grafo:', vertices.length);
    return vertices;
}

// Find the shortest path between two sweeps
function findPath(startVertex, endVertex, tag) {
    if (!startVertex || !endVertex) {
        console.warn('Start o end vertex non trovati nel grafo:', startVertex.id, endVertex.id);
        return null;
    }

    const runner = sdk.Graph.createAStarRunner(sweepGraph, startVertex, endVertex).exec();

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

// Get vertex by ID from the graph
function getVertexById(graph, id) {
    return graph.vertices.find(v => v.id === id);
}

// async function runTour(path, tag) {
//     for (let i = 0; i < path.length; i++) {
//         const vertex = path[i];
//         const nextVertex = path[i + 1];

//         const currentPos = vertex.data.position;
//         const nextPos = nextVertex ? nextVertex.data.position : null;

//         let rotation = vertex.data.rotation;
//         if (nextPos) {
//             rotation = {
//                 x: rotation.x,
//                 y: computeYaw(currentPos, nextPos),
//                 z: rotation.z
//             };
//         }

//         sdk.Sweep.moveTo(vertex.id, {
//             transition: sdk.Sweep.Transition.FLY,
//             transitionTime: 1000,
//             rotation: rotation,
//         });

//         await delay(2000); // Attendi meno, così è più fluido
//     }

// async function runTour(path, tag) {
//     for (let i = 0; i < path.length; i++) {
//         const vertex = path[i];
//         const nextVertex = path[i + 1];

//         const currentPos = vertex.data.position;
//         const nextPos = nextVertex ? nextVertex.data.position : null;

//         if (nextPos) {
//             const yaw = computeYaw(currentPos, nextPos);
//             sdk.Camera.rotate(yaw, 0, { speed: 2 }); // Ruota verso il prossimo sweep
//             await debugDrawDirection(sdk, currentPos, nextPos, 'Verso prossimo sweep');

//             await delay(500); // Attendi un attimo per rendere fluida la rotazione
//         }

//         let rotation = vertex.data.rotation;
//         if (nextPos) {
//             rotation = {
//                 x: rotation.x,
//                 y: computeYaw(currentPos, nextPos),
//                 z: rotation.z
//             };
//         }

//         sdk.Sweep.moveTo(vertex.id, {
//             transition: sdk.Sweep.Transition.FLY,
//             transitionTime: 1000,
//             rotation: rotation,
//         });

//         await delay(2000);
//     }

//     // Alla fine del tour, punta la camera verso il Mattertag
//     if (tag && tag.anchorPosition) {
//         pointCameraToTag(path[path.length - 1].data.position, tag);
//     }

//     console.log("Tour completato");
// }

async function runTour(path, tag) {
    // Assicurati che il tag sia valido
    if (!tag || !tag.anchorPosition) {
        console.error('Tag non valido o senza posizione anchor');
        return;
    }

    // Per ogni "vertex" nel percorso, spostiamo la camera
    for (let i = 0; i < path.length; i++) {
        const vertex = path[i];
        const nextVertex = path[i + 1];

        const currentPos = vertex.data.position;
        const currentRotation = vertex.data.rotation;
        const nextPos = nextVertex ? nextVertex.data.position : null;

        let arrow = null;

        // if (nextPos) {
        //     // Ruotiamo la fotocamera verso il prossimo sweep
        //     // const yaw = computeYaw(currentPos, nextPos);
        //     // sdk.Camera.rotate(yaw, 0, { speed: 2 });

        //     // Disegna la direzione della freccia di debug
        //     arrow = await debugDrawDirection(sdk, currentPos, nextPos, 'Verso prossimo sweep');
        //     await delay(500); // Attendi un attimo per rendere fluida la rotazione
        // }

        // // Imposta la rotazione della fotocamera per il prossimo sweep
        // let rotation = vertex.data.rotation;
        // if (nextPos) {
        //     rotation = {
        //         x: rotation.x,
        //         y: computeYaw(currentPos, nextPos),
        //         z: rotation.z
        //     };
        // }

        // Alla fine di ogni spostamento, punta la fotocamera verso il Mattertag di debug
        // pointCameraToTag(vertex.data.position, arrow);
        // Calcola gli angoli di rotazione
        // const { yaw, pitch } = pointAt(currentPos, nextPos);

        // Applica la rotazione
        // sdk.Camera.rotate(yaw, pitch, { speed: 2 });

        console.log('Current rotation:', currentRotation);

        const yawAngle = calculateYawAngle(currentPos.x, currentPos.z, nextPos.x, nextPos.z);

        console.log('Angolo di rotazione lungo l\'asse Y (gradi):', yawAngle);

        // sdk.Camera.rotate(yawAngle, 0, { speed: 20 });
        sdk.Camera.setRotation({ x: currentPos.x, y: currentPos.y + yawAngle }, { speed: 2000 })

        // Spostati al prossimo sweep
        sdk.Sweep.moveTo(vertex.id, {
            transition: sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
            // rotation: rotation,
        });

        await delay(2000);
    }

    console.log("Tour completato");
    // pointCameraToTag(tag.anchorPosition, tag);
}

// Funzione per puntare la fotocamera al Mattertag
function pointCameraToTag(position, tag) {
    if (!tag || !tag.anchorPosition) return;

    const tagPosition = tag.anchorPosition;  // Posizione del Mattertag

    console.log("Tag position: ", tagPosition);

    // Calcola la direzione per ruotare la fotocamera verso il Mattertag
    const yaw = computeYaw(position, tagPosition);

    console.log("Yaw: ", yaw);

    // Ruota la fotocamera verso il Mattertag
    sdk.Camera.rotate(yaw, 0, { speed: 2 });
}


// function pointCameraToTag(fromPosition, tag) {
//     const yaw = computeYaw(fromPosition, tag.anchorPosition);
//     sdk.Camera.rotate(yaw, 0, { speed: 2 });
//     console.log("Point to tag: ", tag.label);
// }


// // Run a tour through a path of sweeps
// async function runTour(path) {
//     // Starts from 1 because first vertex is the initial position
//     for (let i = 1; i < path.length; i++) {
//         const vertex = path[i];
//         const nextVertex = path[i + 1];

//         const currentPos = vertex.data.position;
//         const nextPos = nextVertex ? nextVertex.data.position : null;

//         let rotation = { x: vertex.data.rotation.x, y: vertex.data.rotation.y, z: vertex.data.rotation.z };
//         if (nextPos) {
//             // Calculate the rotation on the Y axis
//             rotation.y = computeYaw(currentPos, nextPos);
//         }

//         // sdk.Camera.rotate(rotation.y, rotation.x, { speed: 2 });

//         sdk.Sweep.moveTo(vertex.id, {
//             transition: sdk.Sweep.Transition.SLIDE,
//             rotation: rotation,
//             transitionTime: 2000,
//         });

//         // Wait 3 seconds before moving to the next vertex
//         await delay(3000);
//     }

//     console.log("Tour completed!");
// }

// Utility function to create a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Make functions available globally for HTML event handlers
// window.findClosestSweep = findClosestSweep;
// window.createPathButtons = createPathButtons;
// window.getSweepGraphVertices = getSweepGraphVertices;
// window.findPath = findPath;
// window.getVertexById = getVertexById;
// window.runTour = runTour;
// window.delay = delay;

