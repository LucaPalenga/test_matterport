
class Tour {
    constructor(name, steps, finalTag) {
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
        return this.currentIndex > 0;
    }

    next() {
        if (this.hasNext()) {
            this.currentIndex++;
            return this.getCurrentStep();
        }
        return null;
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
