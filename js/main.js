import { distance3D } from './utils.js';
import { createGraph, getVertexById } from './graph_utils.js';
import { Tour } from './tour.js';
// import { setupSdk } from '@matterport/sdk'



// Global variables
const buttonPath1 = document.getElementById('startPath1');
const buttonPath2 = document.getElementById('startPath2');
const buttonRemovePath = document.getElementById('removePath');
const iframe = document.getElementById('showcase');

let sdk = null;
let modelData = null;
let sweepGraph = null;
let initialSweep = null;

let mattertags = null;

let currentSweep = null;
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
    buttonRemovePath.disabled = true;

    // taac key x02q4mq2nsac7euge3234nhec
    // dotbeyond key ifxi6dn2y34ur0gx8i404m91a

    try {
        console.log('Connecting SDK...');

        sdk = await window.MP_SDK.connect(
            iframe,
            'ifxi6dn2y34ur0gx8i404m91a',
            'latest', {
            sweep: true,
            scene: true,
        }
        );
        // sdk = await setupSdk(iframe, 'ifxi6dn2y34ur0gx8i404m91a', '3.5', {
        //     sdkModules: ['scene', 'camera', 'sweep', 'mattertag'], // scene incluso!
        // });
        console.log('SDK connected');
        // window.cameraManager = new CameraManager(sdk);

        console.log('Scene module:', sdk.Scene); // Deve stampare un oggetto, NON undefined

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

        /////////////////////////////////////////////////////////////////////
        // Path buttons listeners
        /////////////////////////////////////////////////////////////////////

        buttonPath1.addEventListener('click', function () {
            startPCRoomNavigation();
            buttonRemovePath.disabled = false;
        });

        buttonPath2.addEventListener('click', async function () {
            await startReceptionNavigation();
            buttonRemovePath.disabled = false;
        });

        buttonRemovePath.addEventListener('click', function () {
            resetNavigation();
            buttonRemovePath.disabled = true;
        });

        /////////////////////////////////////////////////////////////////////
        // Navigation buttons 
        /////////////////////////////////////////////////////////////////////

        nextButton = document.getElementById('nextButton');
        prevButton = document.getElementById('prevButton');

        nextButton.addEventListener('click', () => {
            navigateToNextStep();

            console.log('Tour index:', currentTour.currentIndex);
            // console.log('Tour current step:', tour.getCurrentStep());
            console.log('Tour hasNext:', currentTour.hasNext());
            console.log('Tour hasPrevious:', currentTour.hasPrevious());
        });

        prevButton.addEventListener('click', () => {
            navigateToPreviousStep();

            console.log('Tour index:', currentTour.currentIndex);
            // console.log('Tour current step:', tour.getCurrentStep());
            console.log('Tour hasNext:', currentTour.hasNext());
            console.log('Tour hasPrevious:', currentTour.hasPrevious());
        });

    } catch (e) {
        console.error('Error connecting SDK:', e);
    }
};

// // Create mattertags tour buttons
// function createMattertagsButtons() {
//     const buttonsContainer = document.getElementById('buttons-container');
//     buttonsContainer.innerHTML = ''; // Pulisce i bottoni esistenti

//     mattertags.forEach((tag, index) => {
//         const button = document.createElement('button');
//         button.textContent = `Vai a ${tag.label || `Tappa ${index + 1}`}`;
//         button.addEventListener('click', () => {
//             const destinationTag = tag;
//             const initialVertex = getVertexById(sweepGraph, currentSweep.sid);
//             const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);

//             sdk.Sweep.moveTo(initialVertex.id, {
//                 transition: sdk.Sweep.Transition.FLY,
//                 transitionTime: 2000,
//             });

//             const path = findPath(initialVertex, endVertex, destinationTag);
//             console.log('PATH:', path);

//             currentTour = createTour(path, destinationTag);
//         });
//         buttonsContainer.appendChild(button);
//     });
// }

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
    const tour = new Tour(
        sdk,
        'Tour ' + tag.label,
        path,
        tag,
    );

    console.log('Tour created:', tour);

    return tour;
}


// startReceptionNavigation(): si aspetta che il Matterport carichi il percorso dal tavolino bianco della stanza 
// coi libri alla reception all'ingresso.
// Il risultato dovrebbe essere l'utente che compare sullo sweep 1 del percorso 
// (magari sarebbe carino se poi venisse fatta una chiamata per girarlo al punto 2).
// Gli sweep del percorso dovrebbero essere 10, li ho hardcodati per ora
async function startReceptionNavigation() {
    resetNavigation();

    const destinationTag = mattertags[0];
    const initialVertex = getVertexById(sweepGraph, 'gaqergp0bmzw5sebb8hzf9cid');
    // const initialVertex = getVertexById(sweepGraph, initialSweep.sid);
    const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
    console.log('INITIAL SWEEP:', initialVertex);
    console.log('END SWEEP:', endVertex);
    console.log('TAG:', destinationTag);



    const path = findPath(initialVertex, endVertex, destinationTag);
    if (path != null && path.length > 0) {
        console.log('PATH:', path);
        currentTour = createTour(path, destinationTag);
        currentTour.initialize();

        nextButton.hidden = false;
        prevButton.hidden = false;
    }
    else {
        console.log('Nessun percorso trovato');
    }
}

// startPCRoomNavigation(): stesso comportamento del metodo sopra, che parte però dall'ingresso e arriva alla stanza coi PC. 
// Gli sweep sono 4 ma anche qui me li gestisco da solo
function startPCRoomNavigation() {
    resetNavigation();

    const destinationTag = mattertags[1];
    const initialVertex = getVertexById(sweepGraph, 'h04mrb8euskemttx9ysdkqyhb');
    // const initialVertex = getVertexById(sweepGraph, initialSweep.sid);
    const endVertex = getVertexById(sweepGraph, findClosestSweep(destinationTag).sid);
    console.log('INITIAL SWEEP:', initialVertex);
    console.log('END SWEEP:', endVertex);
    console.log('TAG:', destinationTag);

    const path = findPath(initialVertex, endVertex, destinationTag);
    if (path != null && path.length > 0) {
        console.log('PATH:', path);
        currentTour = createTour(path, destinationTag);
        currentTour.initialize();

        nextButton.hidden = false;
        prevButton.hidden = false;
    }
    else {
        console.log('Nessun percorso trovato');
    }
}

// navigateToPreviousStep(): si muove allo sweep precedente (si aspetta che il percorso esista già, ma non dovrebbe preoccuparci)
function navigateToPreviousStep() {
    if (currentTour) {
        if (currentTour.hasPrevious()) {
            currentTour.goToPrevious();
        }
    }
}

// navigateToNextStep(): si muove allo sweep successivo
function navigateToNextStep() {
    if (currentTour) {
        currentTour.goToNext();
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


