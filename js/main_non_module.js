// Global variables
let buttonPath1;
let buttonPath2;
let iframe;

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



// Initialize the application when the iframe loads
function initializeApp() {
    buttonPath1 = document.getElementById('startPath1');
    buttonPath2 = document.getElementById('startPath2');
    iframe = document.getElementById('showcase');
    nextButton = document.getElementById('nextButton');
    prevButton = document.getElementById('prevButton');
    buttonRemovePath = document.getElementById('removePath');

    buttonPath1.disabled = true;
    buttonPath2.disabled = true;

    try {
        console.log('Connecting SDK...');
        window.MP_SDK.connect(iframe, 'x02q4mq2nsac7euge3234nhec', 'latest')
            .then(function (mpSdk) {
                sdk = mpSdk;
                console.log('SDK connected');

                return sdk.Model.getData();
            })
            .then(function (data) {
                modelData = data;
                return sdk.Mattertag.getData();
            })
            .then(function (tags) {
                mattertags = tags;
                console.log('Mattertags retrieved:', mattertags);
                return createCustomGraph(sdk);
            })
            .then(function (graph) {
                sweepGraph = graph;
                console.log('Sweep graph created:', sweepGraph);

                sdk.Camera.pose.subscribe(function (pose) {
                    currentPose = pose;
                });

                sdk.Sweep.current.subscribe(function (sweep) {
                    if (sweep.sid === '') {
                        // Not at a sweep position
                    } else {
                        if (!initialSweep) {
                            initialSweep = sweep;
                        }

                        currentSweep = sweep;
                        console.log('Current sweep:', sweep);

                        buttonPath1.disabled = false;
                        buttonPath2.disabled = false;
                    }
                });

                // Path buttons listeners
                buttonPath1.addEventListener('click', function () {
                    startReceptionNavigation();
                });

                buttonPath2.addEventListener('click', function () {
                    startPCRoomNavigation();
                });

                // Navigation buttons
                nextButton.addEventListener('click', async function () {
                    await navigateToNextStep();
                });

                prevButton.addEventListener('click', async function () {
                    await navigateToPreviousStep();
                });

                buttonRemovePath.addEventListener('click', function () {
                    resetNavigation();
                });
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
function findPath(startVertex, endVertex) {
    if (!startVertex || !endVertex) {
        console.warn('Start o end vertex non trovati nel grafo:', startVertex.id, endVertex.id);
        return null;
    }

    const runner = sdk.Graph.createAStarRunner(sweepGraph, startVertex, endVertex).exec();

    // window.jslog.postMessage('stepsRetrieved');
    window.postMessage({
        type: 'stepsRetrieved',
        data: runner.path?.length || 0
    }, '*');

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

    // Sensor data
    sensor = null;
    sources = [];

    getCurrentStep() {
        return this.path[this.currentIndex];
    }

    hasNext() {
        return this.currentIndex < this.path.length - 1;
    }

    hasPrevious() {
        return this.currentIndex >= 0;
    }

    next() {
        if (this.hasNext()) {
            this.currentIndex++;
            return this.getCurrentStep();
        }
        return null;
    }

    initialize() {
        this.currentIndex = 0;
        const vertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];

        console.log('Current step:', vertex);
        console.log('Next step:', nextVertex);

        this.drawPath();

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: 2000,
        });

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
    }

    async goToNext() {
        const currentVertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];  // Prossimo sweep (se esiste)
        const nextNextVertex = this.path[this.currentIndex + 2];  // Prossimo sweep (se esiste)

        // Se non c'è prossimo sweep, esce
        if (!nextVertex) {
            console.log('Next step: nessun prossimo step (ultimo)');
            return;
        }

        if (currentVertex.id === nextVertex.id) {
            console.log('Sweep già occupato');
            return;
        }

        this.rotateCameraBetween(currentVertex.data.position, nextVertex.data.position);

        // window.jslog.postMessage('navigatingToNextStep');
        window.postMessage({ type: 'navigatingToNextStep' }, '*');

        await this.sdk.Sweep.moveTo(nextVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

        // window.jslog.postMessage('arrivedToNextStep');
        window.postMessage({ type: 'arrivedToNextStep' }, '*');


        if (nextNextVertex) {
            this.rotateCameraBetween(nextVertex.data.position, nextNextVertex.data.position);
        } else {
            this.rotateCameraBetween(nextVertex.data.position, this.finalTag.anchorPosition);
        }

        console.log(`Spostato a sweep ${nextVertex.id}`);
        this.currentIndex++;
    }

    async goToPrevious() {
        const currentVertex = this.getCurrentStep();
        const previousVertex = this.path[this.currentIndex - 1];  // Prossimo sweep (se esiste)
        const previousPreviousVertex = this.path[this.currentIndex - 2];  // Prossimo sweep (se esiste)

        // Se non c'è prossimo sweep, esce
        if (!previousVertex) {
            console.log('Previous step: nessun prossimo step (ultimo)');
            return;
        }

        if (currentVertex.id === previousVertex.id) {
            console.log('Sweep già occupato');
            return;
        }

        this.rotateCameraBetween(currentVertex.data.position, previousVertex.data.position);

        // window.jslog.postMessage('navigatingToPreviousStep');
        window.postMessage({ type: 'navigatingToPreviousStep' }, '*');


        await this.sdk.Sweep.moveTo(previousVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

        // window.jslog.postMessage('arrivedToPreviousStep');
        window.postMessage({ type: 'arrivedToPreviousStep' }, '*');

        if (previousPreviousVertex) {
            this.rotateCameraBetween(previousVertex.data.position, previousPreviousVertex.data.position);
        } else {
            this.rotateCameraBetween(previousVertex.data.position, currentVertex.data.position);
        }

        console.log(`Spostato a sweep ${previousVertex.id}`);
        this.currentIndex--;
    }

    rotateCameraBetween(fromPos, toPos) {
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

        console.log('? Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
    }

    async reset() {
        this.currentIndex = 0;
        this.sensor.showDebug(false)
    }

    /**
     * Draws a path using the Matterport SDK by creating a camera sensor
     * and subscribing to its readings.
     * This function iterates over a given path, creating a sensor source
     * for each vertex and adding it to the sensor.
     * @param {Object} sdk - The Matterport SDK instance.
     * @param {Array} path - An array of vertices representing the path to draw,
     * where each vertex contains an id and data with x, y, z coordinates.
     */
    async drawPath() {
        this.sensor = await this.sdk.Sensor.createSensor(this.sdk.Sensor.SensorType.CAMERA)
        this.sensor.showDebug(true)
        this.sensor.readings.subscribe({
            onUpdated(source, reading) {
                if (reading.inRange) {
                    console.log(source.userData.id, "is currently in range")
                    /*
                    if (reading.inView) {
                      console.log("... and currently visible on screen")
                    }
                    */
                }
            },
        })
        for (let i = 0; i < this.path.length; i++) {
            var position = {
                x: this.path[i].data.position.x,
                y: this.path[i].data.position.y - 1.0,
                z: this.path[i].data.position.z,
            }

            const source = await this.sdk.Sensor.createSource(
                this.sdk.Sensor.SourceType.SPHERE,
                {
                    origin: position,
                    radius: 0.1,
                    userData: {
                        id: this.path[i].id,
                    },
                },
            )

            this.sources.push(source);
            this.sensor.addSource(source)
        }

        console.log('Sensor created ' + this.sensor);
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

    const path = findPath(initialVertex, endVertex);
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


//////////////////////////////////////////////////////////////////////
// App communication functions
//////////////////////////////////////////////////////////////////////

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

    const path = findPath(initialVertex, endVertex);
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
async function navigateToPreviousStep() {
    if (currentTour) {
        if (currentTour.hasPrevious()) {
            await currentTour.goToPrevious();
        }
    }
}

// navigateToNextStep(): si muove allo sweep successivo
async function navigateToNextStep() {
    if (currentTour) {
        await currentTour.goToNext();
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
