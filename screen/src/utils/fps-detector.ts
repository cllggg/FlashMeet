/**
 * FPS Detector for 3D/2D degradation strategy
 * Calculates average FPS over the first 10 frames.
 * If below 15 FPS, recommends 2D mode.
 */
export class FpsDetector {
  private frames: number[] = [];
  private isDetecting = false;
  private readonly SAMPLE_COUNT = 10;
  private readonly FPS_THRESHOLD = 15;

  startDetection(): Promise<boolean> {
    return new Promise((resolve) => {
      this.frames = [];
      this.isDetecting = true;

      let lastTime = performance.now();

      const measureFrame = () => {
        if (!this.isDetecting) return;

        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;

        if (delta > 0) {
          this.frames.push(1000 / delta);
        }

        if (this.frames.length >= this.SAMPLE_COUNT) {
          this.isDetecting = false;
          const avgFps =
            this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
          resolve(avgFps >= this.FPS_THRESHOLD);
          return;
        }

        requestAnimationFrame(measureFrame);
      };

      requestAnimationFrame(measureFrame);
    });
  }
}
