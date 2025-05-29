/**
 * Calculate the yaw angle (rotation around Y axis) between two 3D points
 * @param {Object} from - Starting point with x, y, z coordinates
 * @param {Object} to - Ending point with x, y, z coordinates
 * @returns {number} Yaw angle in radians
 */
function computeYaw(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;

    // Calculate the angle in radians relative to the Z axis (north)
    const yaw = Math.atan2(dx, dz);

    return yaw;
}

function calculateYawAngle(x1, z1, x2, z2) {
    // Calcola le differenze tra le coordinate
    const deltaX = x2 - x1;
    const deltaZ = z2 - z1;

    // Calcola l'angolo di rotazione in radianti
    const yawRadians = Math.atan2(deltaX, deltaZ);

    // Converte l'angolo in gradi
    const yawDegrees = yawRadians * (180 / Math.PI);

    return yawDegrees;
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

function debugDrawDirection(sdk, from, to, label = 'Direzione') {
    if (!sdk) {
        console.error('SDK non inizializzato');
        return null;  // Se SDK non è inizializzato, restituisci null
    }

    // Calcola la direzione dal punto "from" al punto "to"
    const direction = {
        x: to.x - from.x,
        y: to.y - from.y,
        z: to.z - from.z
    };

    // Calcola il punto medio tra "from" e "to"
    const midPoint = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
        z: (from.z + to.z) / 2
    };

    // Normalizza la direzione
    const anchorNormal = normalizeVector(direction);

    // Crea il Mattertag
    const mattertag = sdk.Mattertag.add({
        label: label,
        description: 'Freccia di debug',
        anchorPosition: midPoint,
        anchorNormal: anchorNormal,
        stemVector: { x: 0, y: 0.2, z: 0 },
        color: { r: 255, g: 0, b: 0 },

        media: {
            type: 'photo',
            src: '../assets/arrow.png',
        }
    });

    // Restituisci il Mattertag creato
    return mattertag;
}


// Funzione di utilità per normalizzare un vettore
function normalizeVector(vec) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    return {
        x: vec.x / length,
        y: vec.y / length,
        z: vec.z / length
    };
}


function pointAt(from, to) {
    // Calcola la direzione
    const direction = {
        x: to.x - from.x,
        y: to.y - from.y,
        z: to.z - from.z
    };

    // Normalizza il vettore direzione
    const normalizedDirection = normalizeVector(direction);

    // Calcola l'angolo yaw (per esempio, sul piano X-Z)
    const yaw = Math.atan2(normalizedDirection.x, normalizedDirection.z);  // Angolo attorno all'asse Y

    // Puoi calcolare l'angolo pitch o roll se necessario, dipende dal tuo caso d'uso
    const pitch = Math.atan2(normalizedDirection.y, Math.sqrt(normalizedDirection.x * normalizedDirection.x + normalizedDirection.z * normalizedDirection.z));

    // Restituisce il risultato come oggetto con yaw e pitch
    return { yaw, pitch };
}


// Export the functions to make them available to other modules
export { computeYaw, distance3D, debugDrawDirection, pointAt, calculateYawAngle };
