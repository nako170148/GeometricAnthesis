export const Scene = {
  OPENING: "opening",
  COLOR: "colorSelect",
  SEED: "seedSelect",
  SOIL: "soilSelect",
  WATER: "waterSelect",
  GROW: "grow",
  BLOOM: "bloom",
};

export class SceneManager {
  constructor(initial = Scene.OPENING) {
    this.current = initial;
  }

  goTo(scene) {
    this.current = scene;
  }

  is(scene) {
    return this.current === scene;
  }
}

export const sceneManager = new SceneManager();
