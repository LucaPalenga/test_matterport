class Tour {
    constructor(sdk, name, steps, finalTag) {
        this.sdk = sdk;
        this.name = name;             // nome del tour
        this.steps = steps;           // array di vertex
        this.finalTag = finalTag;     // mattertag finale
        this.currentIndex = 0;        // indice attuale
    }

    getCurrentStep() {
        return this.steps[this.currentIndex];
    }

    hasNext() {
        return this.currentIndex < this.steps.length - 1;
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
        const vertex = this.getCurrentStep();
        const nextVertex = this.steps[this.currentIndex + 1];  // Prossimo sweep (se esiste)

        console.log('Current step:', vertex);
        console.log('Next step:', nextVertex);

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: 2000,
        });

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
    }

    goToNext() {
        const vertex = this.getCurrentStep();
        const nextVertex = this.steps[this.currentIndex + 1];  // Prossimo sweep (se esiste)

        console.log('Current step:', vertex);
        console.log('Next step:', nextVertex);

        if (!nextVertex) {
            console.log('Next step: nessun prossimo step (ultimo)');

            // PUNTA al mattertag invece che al prossimo vertex
            this.rotateCameraBetween(vertex.data.position, this.finalTag.anchorPosition);

            return;
        }

        if (vertex.id === nextVertex.id) {
            console.log('Sweep già occupato');
            return;
        }

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);

        this.sdk.Sweep.moveTo(nextVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

        console.log(`Spostato a sweep ${nextVertex.id}`);
        this.currentIndex++;
    }

    goToPrevious() {
        const vertex = this.getCurrentStep();
        const nextVertex = this.steps[this.currentIndex - 1];  // Prossimo sweep (se esiste)

        console.log('Current step:', vertex);
        console.log('Previous step:', nextVertex);

        if (!nextVertex) {
            console.log('Previous step: nessun prossimo step (sono al primo)');

            return;
        }

        if (vertex.id === nextVertex.id) {
            console.log('Sweep già occupato');
            // sdk.Camera.rotate(0, 0, { speed: 200 });
            return;
        }

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);

        this.sdk.Sweep.moveTo(nextVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

        console.log(`Spostato a sweep ${nextVertex.id}`);
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

        console.log('→ Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
    }


    previous() {
        if (this.hasPrevious()) {
            this.currentIndex--;
            return this.getCurrentStep();
        }
        return null;
    }

    isLastStep() {
        return this.currentIndex === this.steps.length - 1;
    }

    isFirstStep() {
        return this.currentIndex === 0;
    }

    reset() {
        this.currentIndex = 0;
    }

    // Naviga visivamente con Matterport SDK
    navigateToCurrent(sdk) {
        const currentVertex = this.getCurrentStep();


        sdk.Sweep.moveTo(currentVertex.id, {
            transition: sdk.Sweep.Transition.FLY,
            transitionTime: 1000
        });
    }

    navigateToFinalTag(sdk) {
        sdk.Camera.setRotation({ x: 0, y: 0 }, { speed: 200 });
        sdk.Mattertag.navigateToTag(this.finalTag.sid);
    }
}

export { Tour };
