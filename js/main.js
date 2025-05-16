import { distance3D } from './utils.js';
import { createGraph, getVertexById } from './graph_utils.js';
import { Tour } from './tour.js';

// Global variables
const buttonPath1 = document.getElementById('startPath1');
const buttonPath2 = document.getElementById('startPath2');
const iframe = document.getElementById('showcase');

let sdk = null;
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

// Map that associates mattertag -> closest sweep
const endSweepsMap = new Map();

// Initialize the application when the iframe loads
window.initializeApp = async () => {
    buttonPath1.disabled = true;
    buttonPath2.disabled = true;

    try {
        console.log('Connecting SDK...');
        sdk = await window.MP_SDK.connect(iframe, 'x02q4mq2nsac7euge3234nhec', '3.5');
        console.log('SDK connected');

        modelData = await sdk.Model.getData();
        mattertags = await sdk.Mattertag.getData();
        console.log('Mattertags retrieved:', mattertags);

        nextButton = document.getElementById('nextButton');
        prevButton = document.getElementById('prevButton');

        createMattertagsButtons();

        // Create graph
        // sweepGraph = await sdk.Sweep.createDirectedGraph();
        // sweepGraph = await sdk.Sweep.createGraph();
        sweepGraph = await createGraph(sdk);
        console.log('Sweep graph created:', sweepGraph);

        sdk.Camera.pose.subscribe(function (pose) {
            // Changes to the Camera pose have occurred.
            currentPose = pose;
            // console.log('Current rotation:', pose.rotation);
            if (initialSweep) {
                // console.log('Current position is ', pose.position);
                // console.log('Rotation angle is ', pose.rotation);
                // console.log('View mode is ', pose.mode);
            }
        });


        sdk.Sweep.current.subscribe(function (sweep) {
            // Change to the current sweep has occurred.
            if (sweep.sid === '') {
                // console.log('Not currently stationed at a sweep position');
            } else {
                // Save initial sweep
                if (!initialSweep) {
                    initialSweep = sweep;
                }

                // Updates current sweep
                currentSweep = sweep;
                console.log('Current sweep:', sweep);

                // Unlock path button
                buttonPath1.disabled = false;
                buttonPath2.disabled = false;

                // console.log('Current position is ', currentPose.position);
                // console.log('Rotation angle is ', currentPose.rotation);
                // console.log('View mode is ', currentPose.mode);
            }
        });

        buttonPath1.addEventListener('click', async function () {
            const destinationTag = mattertags[1];
            const initialVertex = getVertexById(sweepGraph, 'h04mrb8euskemttx9ysdkqyhb');
            // const initialVertex = getVertexById(sweepGraph, initialSweep.sid);
            const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
            console.log('INITIAL SWEEP:', initialVertex);
            console.log('END SWEEP:', endVertex);
            console.log('TAG:', mattertags[1]);

            // Move to initial sweep
            sdk.Sweep.moveTo(initialVertex.id, {
                transition: sdk.Sweep.Transition.FLY,
                transitionTime: 2000,
            });

            const path = findPath(initialVertex, endVertex, destinationTag);
            console.log('PATH:', path);

            if (path && path.length > 0) {
                showTourSteps(path, destinationTag);
            }
        });

        buttonPath2.addEventListener('click', async function () {
            const destinationTag = mattertags[0];
            const initialVertex = getVertexById(sweepGraph, 'gaqergp0bmzw5sebb8hzf9cid');
            // const initialVertex = getVertexById(sweepGraph, initialSweep.sid);
            const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
            console.log('INITIAL SWEEP:', initialVertex);
            console.log('END SWEEP:', endVertex);
            console.log('TAG:', mattertags[1]);

            // Move to initial sweep
            sdk.Sweep.moveTo(initialVertex.id, {
                transition: sdk.Sweep.Transition.FLY,
                transitionTime: 2000,
            });

            const path = findPath(initialVertex, endVertex, destinationTag);
            console.log('PATH:', path);

            showTourSteps(path, destinationTag);
        });

    } catch (e) {
        console.error('Error connecting SDK:', e);
    }
};

// Create mattertags tour buttons
function createMattertagsButtons() {
    const buttonsContainer = document.getElementById('buttons-container');
    buttonsContainer.innerHTML = ''; // Pulisce i bottoni esistenti

    mattertags.forEach((tag, index) => {
        const button = document.createElement('button');
        button.textContent = `Vai a ${tag.label || `Tappa ${index + 1}`}`;
        button.addEventListener('click', () => {
            const destinationTag = tag;
            const initialVertex = getVertexById(sweepGraph, currentSweep.sid);
            const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);

            sdk.Sweep.moveTo(initialVertex.id, {
                transition: sdk.Sweep.Transition.FLY,
                transitionTime: 2000,
            });

            const path = findPath(initialVertex, endVertex, destinationTag);
            console.log('PATH:', path);

            currentTour = createTour(path, destinationTag);
        });
        buttonsContainer.appendChild(button);
    });
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

// Create tour
function createTour(path, tag) {
    const tour = new Tour('Tour ' + tag.label, path, tag);

    nextButton.hidden = false;
    prevButton.hidden = false;

    // Aggiungi event listener ai bottoni
    nextButton.addEventListener('click', () => {
        tour.next();
        tour.navigateToCurrent(sdk);
    });

    prevButton.addEventListener('click', () => {
        tour.previous();
        tour.navigateToCurrent(sdk);
    });

    return tour;
}

// async function runAutomaticTour(path, tag) {
//     if (!Array.isArray(path) || path.length === 0) {
//         console.warn('Percorso vuoto o non valido.');
//         return;
//     }

//     if (!tag || !tag.anchorPosition) {
//         console.error('Tag non valido o senza anchorPosition');
//         return;
//     }

//     for (let i = 0; i < path.length; i++) {
//         const vertex = path[i];
//         const nextVertex = path[i + 1];

//         const currentPos = vertex.data.position;

//         if (nextVertex) {
//             const nextPos = nextVertex.data.position;
//             console.log(`Step ${i + 1}: ruoto verso prossimo sweep`);
//             rotateCameraBetween(currentPos, nextPos);
//         } else {
//             console.log(`Ultimo step: ruoto verso Mattertag`);
//             rotateCameraBetween(currentPos, tag.anchorPosition);
//         }

//         sdk.Sweep.moveTo(vertex.id, {
//             transition: sdk.Sweep.Transition.FLY,
//             transitionTime: 1000,
//         });

//         await delay(2000); // Attendi per la transizione
//     }

//     console.log("Tour automatico completato.");
// }




// function showTourSteps(path, tag) {
//     // const stepsContainer = document.getElementById('tour-steps-container');
//     // stepsContainer.innerHTML = ''; // Pulisce la lista precedente
//     let currentStepIndex = 0;  // Indice del passo corrente

//     // Mostra il primo passo del tour
//     const currentStep = path[currentStepIndex];
//     console.log('Current step:', currentStep);

//     // Crea il bottone per il passo successivo
//     const nextButton = document.createElement('button');
//     nextButton.className = 'step-button';
//     nextButton.textContent = 'Avanti';

//     nextButton.addEventListener('click', () => {
//         if (currentStepIndex < path.length - 1) {
//             currentStepIndex++;
//             const nextStep = path[currentStepIndex];
//             console.log('Next step:', nextStep);

//             // Muove la telecamera al prossimo passo
//             rotateCameraBetween(currentStep.data.position, nextStep.data.position);
//             sdk.Sweep.moveTo(nextStep.id, {
//                 transition: sdk.Sweep.Transition.FLY,
//                 transitionTime: 1000,
//             });
//         } else {
//             console.log('Hai raggiunto l\'ultimo passo!');
//             // Puntare al Mattertag finale
//             rotateCameraBetween(currentStep.data.position, tag.anchorPosition);
//             sdk.Sweep.moveTo(currentStep.id, {
//                 transition: sdk.Sweep.Transition.FLY,
//                 transitionTime: 1000,
//             });
//         }
//     });

//     // Crea il bottone per il passo precedente
//     const prevButton = document.createElement('button');
//     prevButton.className = 'step-button';
//     prevButton.textContent = 'Indietro';

//     prevButton.addEventListener('click', () => {
//         if (currentStepIndex > 0) {
//             currentStepIndex--;
//             const prevStep = path[currentStepIndex];
//             console.log('Previous step:', prevStep);

//             // Muove la telecamera al passo precedente
//             rotateCameraBetween(currentStep.data.position, prevStep.data.position);
//             sdk.Sweep.moveTo(prevStep.id, {
//                 transition: sdk.Sweep.Transition.FLY,
//                 transitionTime: 1000,
//             });
//         } else {
//             console.log('Sei già al primo passo!');
//         }
//     });

//     // Contenitore per i bottoni di navigazione
//     const navContainer = document.createElement('div');
//     navContainer.id = 'nav-buttons-container';
//     navContainer.appendChild(prevButton);
//     navContainer.appendChild(nextButton);

//     // Aggiungi il contenitore dei bottoni sopra l'iframe
//     document.body.appendChild(navContainer);
// }


function showTourSteps(path, tag) {
    const stepsContainer = document.getElementById('tour-steps-container');
    stepsContainer.innerHTML = ''; // Pulisce la lista precedente

    path.forEach((vertex, index) => {
        const stepButton = document.createElement('button');
        stepButton.className = 'step-button';
        stepButton.textContent = `Tappa ${index + 1}`;

        stepButton.addEventListener('click', () => {
            const nextVertex = path[index + 1];  // Prossimo sweep (se esiste)

            console.log('Current step:', vertex);

            if (!nextVertex) {
                console.log('Next step: nessun prossimo step (ultimo)');

                // PUNTA al mattertag invece che al prossimo vertex
                rotateCameraBetween(vertex.data.position, tag.anchorPosition);

                sdk.Sweep.moveTo(vertex.id, {
                    transition: sdk.Sweep.Transition.FLY,
                    transitionTime: 1000,
                });

                return;
            }

            if (vertex.id === nextVertex.id) {
                console.log('Sweep già occupato');
                // sdk.Camera.rotate(0, 0, { speed: 200 });
                return;
            }

            console.log('Current rotation: ', currentPose.rotation);
            rotateCameraBetween(vertex.data.position, nextVertex.data.position);

            sdk.Sweep.moveTo(vertex.id, {
                transition: sdk.Sweep.Transition.FLY,
                transitionTime: 1000,
            });

            console.log(`Spostato a sweep ${vertex.id}`);
        });

        stepsContainer.appendChild(stepButton);
    });
}

function rotateCameraBetween(fromPos, toPos) {
    if (!fromPos || !toPos) {
        console.warn('Posizioni non valide per la rotazione');
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

    console.log('→ Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

    sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
}