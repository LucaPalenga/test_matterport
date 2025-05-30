import Tour from './tour.js';
import { createCustomGraph, getVertexById, distance3D } from './graph_utils.js';

//////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////

let buttonPath1;
let buttonPath2;
let buttonRemovePath;
let buttonReturnToPath;
let debugToggle = null;

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

window.initializeApp = async function initializeApp() {
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
        sweepGraph = await createCustomGraph(sdk, modelData);

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
                    buttonReturnToPath.hidden = false;
                    wasOutOfPath = true;

                    const jsonMessageOutOfPath = {
                        type: 'outOfPath',
                    };

                    // window.jslog.postMessage(JSON.stringify(jsonMessageOutOfPath));
                    window.postMessage(JSON.stringify(jsonMessageOutOfPath), '*');
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

                        // window.jslog.postMessage(JSON.stringify(jsonMessage));
                        window.postMessage(JSON.stringify(jsonMessage), '*');

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

    // window.jslog.postMessage(JSON.stringify(jsonMessage));
    window.postMessage(JSON.stringify(jsonMessage), '*');

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



//////////////////////////////////////////////////////////////////////
// App communication functions
//////////////////////////////////////////////////////////////////////

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
            // window.jslog.postMessage(JSON.stringify(jsonMessageNavPrev));
            window.postMessage(JSON.stringify(jsonMessageNavPrev), '*');

            await currentTour.goToPrevious();

            const jsonMessageArrPrev = {
                type: 'arrivedToPreviousStep',
            };
            // window.jslog.postMessage(JSON.stringify(jsonMessageArrPrev));
            window.postMessage(JSON.stringify(jsonMessageArrPrev), '*');
        }
    }
}

// navigateToNextStep(): si muove allo sweep successivo
async function navigateToNextStep() {
    if (currentTour) {
        const jsonMessageNavNext = {
            type: 'navigatingToNextStep',
        };
        // window.jslog.postMessage(JSON.stringify(jsonMessageNavNext));
        window.postMessage(JSON.stringify(jsonMessageNavNext), '*');

        await currentTour.goToNext();

        const jsonMessageArrNext = {
            type: 'arrivedToNextStep',
        };
        // window.jslog.postMessage(JSON.stringify(jsonMessageArrNext));
        window.postMessage(JSON.stringify(jsonMessageArrNext), '*');
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

// returnToPath(): torna al percorso
async function returnToPath() {
    if (currentTour) {

        const jsonMessageReturningToPath = {
            type: 'returningToPath',
        };
        // window.jslog.postMessage(JSON.stringify(jsonMessageReturningToPath));
        window.postMessage(JSON.stringify(jsonMessageReturningToPath), '*');


        await currentTour.goTo(currentTour.getCurrentStep());

        const jsonMessageReturnedToPath = {
            type: 'returnedToPath',
        };
        // window.jslog.postMessage(JSON.stringify(jsonMessageReturnedToPath));
        window.postMessage(JSON.stringify(jsonMessageReturnedToPath), '*');
    }
}
