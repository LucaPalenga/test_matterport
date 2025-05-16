class CameraManager {
    constructor(sdk) {
        if (CameraManager.instance) return CameraManager.instance;
        this.sdk = sdk;
        CameraManager.instance = this;
    }

    static getInstance() {
        if (!CameraManager.instance) {
            throw new Error("CameraManager non è ancora stato inizializzato.");
        }
        return CameraManager.instance;
    }

    navigateTo(vertex, nextVertex) {
        if (!nextVertex) {
            console.log('Previous step: nessun prossimo step');
            return;
        }

        if (vertex.id === nextVertex.id) {
            console.log('Sweep già occupato');
            return;
        }

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);

        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });
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

        console.log('→ Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
    }
}

// Export the class for use in other modules
export default CameraManager;


// avigateToNext() {
//     const vertex = this.getCurrentStep();
//     const nextVertex = this.steps[this.currentIndex + 1];  // Prossimo sweep (se esiste)

//     console.log('Current step:', vertex);

//     if (!nextVertex) {
//         console.log('Next step: nessun prossimo step (ultimo)');

//         // PUNTA al mattertag invece che al prossimo vertex
//         this.rotateCameraBetween(vertex.data.position, this.finalTag.anchorPosition);

//         this.sdk.Sweep.moveTo(vertex.id, {
//             transition: this.sdk.Sweep.Transition.FLY,
//             transitionTime: 1000,
//         });

//         return;
//     }

//     if (vertex.id === nextVertex.id) {
//         console.log('Sweep già occupato');
//         // sdk.Camera.rotate(0, 0, { speed: 200 });
//         return;
//     }

//     this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);

//     this.sdk.Sweep.moveTo(vertex.id, {
//         transition: this.sdk.Sweep.Transition.FLY,
//         transitionTime: 1000,
//     });

//     console.log(`Spostato a sweep ${vertex.id}`);
//     this.currentIndex++;
// }

// navigateToPrevious() {
//     const vertex = this.getCurrentStep();
//     const nextVertex = this.steps[this.currentIndex - 1];  // Prossimo sweep (se esiste)

//     console.log('Current step:', vertex);

//     if (!nextVertex) {
//         console.log('Previous step: nessun prossimo step (sono al primo)');

//         return;
//     }

//     if (vertex.id === nextVertex.id) {
//         console.log('Sweep già occupato');
//         // sdk.Camera.rotate(0, 0, { speed: 200 });
//         return;
//     }

//     console.log('Current rotation: ', this.currentPose?.rotation);
//     this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);

//     this.sdk.Sweep.moveTo(vertex.id, {
//         transition: this.sdk.Sweep.Transition.FLY,
//         transitionTime: 1000,
//     });

//     console.log(`Spostato a sweep ${vertex.id}`);
//     this.currentIndex--;
// }

// rotateCameraBetween(fromPos, toPos) {
//     if (!fromPos || !toPos) {
//         console.warn('Posizioni non valide per la rotazione');
//         return;
//     }

//     const dx = toPos.x - fromPos.x;
//     const dy = toPos.y - fromPos.y;
//     const dz = toPos.z - fromPos.z;

//     // Yaw (asse Y) + 180° per correggere direzione
//     let yaw = Math.atan2(dx, dz) * (180 / Math.PI) + 180;
//     yaw = ((yaw + 180) % 360) - 180;  // Normalizzazione tra -180 e 180

//     // Pitch (asse X)
//     const distanceXZ = Math.sqrt(dx * dx + dz * dz);
//     const pitch = Math.atan2(dy, distanceXZ) * (180 / Math.PI);

//     console.log('→ Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

//     this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
// }