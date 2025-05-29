import * as THREE from '../bundle/vendors/three/0.171.0/three.module.min.js';

class Tour {
    constructor(sdk, name, path, finalTag) {
        this.sdk = sdk;
        this.name = name;
        this.path = path;
        this.finalTag = finalTag;
        this.currentIndex = 0;
    }

    // Path visualization
    sceneObject = null;
    visualNodes = [];
    sphereCount = 7;
    sphereColor = { r: 1, g: 1, b: 1 }; // White
    sphereUrl = '/matterport-workspace/assets/the_sphere.glb';

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

        // Move to initial sweep
        this.sdk.Sweep.moveTo(vertex.id, {
            transition: this.sdk.Sweep.Transition.INSTANT,
            transitionTime: 2000,
        });

        this.rotateCameraBetween(vertex.data.position, nextVertex.data.position);
    }

    async goTo(vertex) {
        const nextVertex = this.path[this.currentIndex + 1];

        if (vertex.id === nextVertex.id) {
            console.log('Sweep already occupied');
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

        console.log(`Moved to sweep ${vertex.id}`);
    }

    async goToNext() {
        const currentVertex = this.getCurrentStep();
        const nextVertex = this.path[this.currentIndex + 1];
        const nextNextVertex = this.path[this.currentIndex + 2];

        if (!nextVertex) {
            console.log('Next step: no next step (last)');
            return;
        }

        if (currentVertex.id === nextVertex.id) {
            console.log('Sweep already occupied');
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

        console.log(`Moved to NEXT sweep ${nextVertex.id}`);
        this.currentIndex++;
    }

    async goToPrevious() {
        const currentVertex = this.getCurrentStep();
        const previousVertex = this.path[this.currentIndex - 1];
        const previousPreviousVertex = this.path[this.currentIndex - 2];

        if (!previousVertex) {
            console.log('Previous step: no previous step (first)');
            return;
        }

        if (currentVertex.id === previousVertex.id) {
            console.log('Sweep already occupied');
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

        console.log(`Moved to PREVIOUS sweep ${previousVertex.id}`);
        this.currentIndex--;
    }

    rotateCameraBetween(fromPos, toPos) {
        if (!fromPos || !toPos) {
            console.warn('Positions not valid for rotation');
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

        console.log('Camera Rotation: pitch:', pitch.toFixed(2), 'yaw:', yaw.toFixed(2));

        this.sdk.Camera.setRotation({ x: pitch, y: yaw }, { speed: 200 });
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

    // Draw entire path
    async drawPath() {
        const [sceneObject] = await this.sdk.Scene.createObjects(1);
        this.sceneObject = sceneObject;

        for (let i = 0; i < this.path.length - 1; i++) {
            const from = this.path[i].data.position;
            const to = this.path[i + 1].data.position;
            this.drawSpheres(this.sceneObject, from, to);
        }
    }

    drawSpheres(sceneObject, from, to) {
        for (let i = 0; i <= this.sphereCount; i++) {
            const t = i / this.sphereCount;

            const x = from.x * (1 - t) + to.x * t;
            // const y = from.y * (1 - t) + to.y * t;
            const z = from.z * (1 - t) + to.z * t;

            const node = sceneObject.addNode();

            node.obj3D.position.set(x, 0.5, z);

            node.addComponent('mp.gltfLoader', {
                url: this.sphereUrl,
                localScale: { x: .03, y: .03, z: .03 },
                localPosition: {
                    x: 0.03, y: 0, z: 0.03
                },
                visible: true,

            });

            node.addComponent('mp.ambientLight', {
                enabled: true,
                color: this.sphereColor,
            });

            node.start();
            this.visualNodes.push(node);
        }
    }

    async reset() {
        this.currentIndex = 0;

        for (const node of this.visualNodes) {
            await node.stop();
        }
        this.visualNodes = [];
    }
}

export default Tour;

