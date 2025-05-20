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

    goToNext() {
        const vertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];  // Prossimo sweep (se esiste)

        console.log('Current index:', this.currentIndex);
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
        const nextVertex = this.path[this.currentIndex - 1];  // Prossimo sweep (se esiste)

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
        return this.currentIndex === this.path.length - 1;
    }

    isFirstStep() {
        return this.currentIndex === 0;
    }

    async reset() {
        this.currentIndex = 0;
        this.sensor.showDebug(false)
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


export { Tour };
