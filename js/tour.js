class Tour {
    constructor(sdk, name, path, finalTag) {
        this.sdk = sdk;
        this.name = name;
        this.path = path;
        this.finalTag = finalTag;
        this.currentIndex = 0;
        this.pathLine = null;
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

    isSweepInPath(sid) {
        return this.path.some(vertex => vertex.id === sid);
    }

    initialize() {
        this.currentIndex = 0;
        const vertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];

        console.log('Current step:', vertex);
        console.log('Next step:', nextVertex);

        // console.log("THREE.js :", THREE);
        // const scene = new THREE.Scene();
        // console.log('Scene:', scene);
        // const geometry = new THREE.PlaneGeometry(1, 1);
        // console.log('Geometry:', geometry);
        // const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        // console.log('Material:', material);
        // const plane = new THREE.Mesh(geometry, material);
        // console.log('Plane:', plane);
        // scene.add(plane);


        // this.drawPath();
        // this.drawPathAsLine(this.path);
        // this.drawPathAsLine2(this.path);

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: 2000,
        });

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
    }

    async goTo(vertex) {
        const nextVertex = this.path[this.currentIndex + 1];  // Prossimo sweep (se esiste)

        if (vertex.id === nextVertex.id) {
            console.log('Sweep già occupato');
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

        console.log(`Spostato a sweep ${vertex.id}`);
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


        await this.sdk.Sweep.moveTo(nextVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

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

        await this.sdk.Sweep.moveTo(previousVertex.id, {
            transition: this.sdk.Sweep.Transition.FLY,
            transitionTime: 1000,
        });

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

    // async drawPathAsLine2(path) {
    //     // Prima pulisci i sensori esistenti
    //     // await this.clearPathVisualization();

    //     this.sensor = await this.sdk.Sensor.createSensor(this.sdk.Sensor.SensorType.CAMERA);
    //     this.sensor.showDebug(true);

    //     // Crea punti più densi per una linea più continua
    //     for (let i = 0; i < path.length - 1; i++) {
    //         const from = path[i].data.position;
    //         const to = path[i + 1].data.position;

    //         // Crea più punti intermedi tra gli sweep
    //         const steps = 7; // Aumenta questo numero per una linea più densa
    //         const dx = (to.x - from.x) / steps;
    //         const dy = (to.y - from.y) / steps;
    //         const dz = (to.z - from.z) / steps;

    //         for (let j = 0; j <= steps; j++) {
    //             const pos = {
    //                 x: from.x + dx * j,
    //                 y: from.y + dy * j - 0.8, // Abbassa leggermente i punti per renderli visibili
    //                 z: from.z + dz * j
    //             };

    //             const source = await this.sdk.Sensor.createSource(
    //                 this.sdk.Sensor.SourceType.SPHERE,
    //                 {
    //                     origin: pos,
    //                     radius: 0,
    //                     userData: { id: `path-${i}-${j}` },
    //                     color: { r: 0, g: 255, b: 255 }
    //                 }
    //             );

    //             this.sources.push(source);
    //             this.sensor.addSource(source);
    //         }
    //     }
    // }


    // async clearPathVisualization() {
    //     if (this.sensor) {
    //         // Distruggi tutte le sorgenti
    //         for (const source of this.sources) {
    //             await source.destroy();
    //         }
    //         this.sources = [];

    //         // Distruggi il sensore
    //         await this.pathSensor.destroy();
    //         this.pathSensor = null;
    //     }
    // }

    async reset() {
        this.currentIndex = 0;
        this.sensor.showDebug(false)
        // await this.clearPathVisualization();
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

    /**
     * Draws a path using the Matterport SDK by creating a camera sensor
     * and subscribing to its readings.
     * This function iterates over a given path, creating a sensor source
     * for each vertex and adding it to the sensor.
     * @param {Object} sdk - The Matterport SDK instance.
     * @param {Array} path - An array of vertices representing the path to draw,
     * where each vertex contains an id and data with x, y, z coordinates.
     */
    // async drawPath() {
    //     this.sensor = await this.sdk.Sensor.createSensor(this.sdk.Sensor.SensorType.CAMERA)
    //     this.sensor.showDebug(true)
    //     this.sensor.readings.subscribe({
    //         onUpdated(source, reading) {
    //             if (reading.inRange) {
    //                 console.log(source.userData.id, "is currently in range")
    //                 /*
    //                 if (reading.inView) {
    //                   console.log("... and currently visible on screen")
    //                 }
    //                 */
    //             }
    //         },
    //     })
    //     for (let i = 0; i < this.path.length; i++) {
    //         var position = {
    //             x: this.path[i].data.position.x,
    //             y: this.path[i].data.position.y - 1.0,
    //             z: this.path[i].data.position.z,
    //         }

    //         const source = await this.sdk.Sensor.createSource(
    //             this.sdk.Sensor.SourceType.SPHERE,
    //             {
    //                 origin: position,
    //                 radius: 0.1,
    //                 userData: {
    //                     id: this.path[i].id,
    //                 },
    //             },
    //         )

    //         this.sources.push(source);
    //         this.sensor.addSource(source)
    //     }

    //     console.log('Sensor created ' + this.sensor);
    // }


    // async drawPathAsLine(path) {
    //     for (let i = 0; i < path.length - 1; i++) {
    //         const from = path[i].data.position;
    //         const to = path[i + 1].data.position;
    //         console.log('Drawing line between', from, to);
    //         await this.drawLineBetweenSweeps(from, to);
    //     }
    // }

    // async drawPath() {
    //     // Rimuovi la linea precedente se esiste
    //     // if (this.pathLine) {
    //     //     // Se la pathLine è stata già aggiunta alla scena, rimuoviamola
    //     //     this.sdk.Scene.removeObject(this.pathLine);
    //     //     this.pathLine = null;
    //     // }

    //     // Creare una geometria per i punti del percorso
    //     const points = this.path.map(vertex => {
    //         const position = vertex.data.position;
    //         console.log('Position:', position);
    //         return new THREE.Vector3(position.x, position.y - 1.0, position.z); // Abbassiamo leggermente i punti per visibilità
    //     });

    //     console.log('Points:', points);

    //     // Creare la geometria della linea da questi punti
    //     const geometry = new THREE.BufferGeometry().setFromPoints(points);

    //     // Creare un materiale per la linea (puoi personalizzare il colore e lo spessore)
    //     const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 5 });

    //     // Creare la linea
    //     this.pathLine = new THREE.Line(geometry, material);

    //     // Aggiungere la linea alla scena
    //     const scene = new THREE.Scene();
    //     console.log('Scene:', scene);
    //     scene.add(this.pathLine);
    //     // this.sdk.Scene.addObject(this.pathLine);

    //     console.log('Path line drawn');
    // }

    async drawPath() {
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const points = this.path.map(vertex => {
            const pos = vertex.data.position;
            return new THREE.Vector3(pos.x, pos.y - 0.3, pos.z);
        });

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);

        this.sdk.Scene.addObject(line);


        //     // Se non c'è già un renderer, crealo
        //     if (!this.renderer) {
        //         this.renderer = new THREE.WebGLRenderer();
        //         console.log('Renderer created ' + this.renderer);
        //         this.renderer.setSize(window.innerWidth, window.innerHeight); // Imposta le dimensioni del canvas
        //         document.body.appendChild(this.renderer.domElement); // Aggiungi il renderer al body del DOM
        //     }

        //     // Se non c'è già una telecamera, creala
        //     if (!this.camera) {
        //         this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        //         console.log('Camera created ' + this.camera);
        //         this.camera.position.z = 5; // Impostare la posizione della telecamera
        //     }

        //     // Creare una scena se non esiste
        //     if (!this.scene) {
        //         this.scene = new THREE.Scene();
        //         console.log('Scene created ' + this.scene);
        //     }

        //     // Creare una geometria per i punti del percorso
        //     const points = this.path.map(vertex => {
        //         const position = vertex.data.position;
        //         console.log('Position:', position);
        //         return new THREE.Vector3(position.x, position.y - 1.0, position.z); // Abbassiamo leggermente i punti per visibilità
        //     });

        //     console.log('Points:', points);

        //     // Creare un cubo invece della linea per il debug
        //     points.forEach((position, index) => {
        //         const geometry = new THREE.BoxGeometry(1, 1, 1); // Cubo di 1x1x1
        //         const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Colore verde
        //         const cube = new THREE.Mesh(geometry, material);
        //         cube.position.set(position.x, position.y, position.z);

        //         // Aggiungi il cubo alla scena
        //         this.scene.add(cube);

        //         console.log(`Cubo aggiunto alla posizione: ${position}`);
        //     });

        //     this.animate(); // Invece di usare bind qui direttamente

        //     console.log('Cubi aggiunti alla scena');

        // }

        // animate() {
        //     requestAnimationFrame(this.animate.bind(this)); // Loop di animazione
        //     this.renderer.render(this.scene, this.camera); // Renderizza la scena
    }

}

export { Tour };
