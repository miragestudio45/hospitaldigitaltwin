/**
 * Shared GLTFLoader factory for BMS viewers.
 *
 * Some models (e.g. CRAH Unit) use Meshopt compression (EXT_meshopt_compression);
 * GLTFLoader needs a MeshoptDecoder registered or it throws
 *   "setMeshoptDecoder must be called before loading compressed files".
 *
 * The decoder is loaded via DYNAMIC import so it is NOT part of App.tsx's static
 * module graph — this keeps the Figma Make bundler's dependency pre-optimization
 * from choking on the wasm/worker module (which was crashing the whole app).
 * If the decoder ever fails to load we still return a working loader that can
 * open all uncompressed models.
 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let meshoptDecoderPromise: Promise<any> | null = null;

async function getMeshoptDecoder(): Promise<any | null> {
  if (!meshoptDecoderPromise) {
    meshoptDecoderPromise = import("three/examples/jsm/libs/meshopt_decoder.module.js")
      .then((m) => m.MeshoptDecoder)
      .catch((err) => {
        console.warn("[BMS] MeshoptDecoder failed to load — compressed models may not open.", err);
        return null;
      });
  }
  return meshoptDecoderPromise;
}

/**
 * Create a GLTFLoader with the Meshopt decoder registered.
 * Async because the decoder is dynamically imported.
 */
export async function createBmsGltfLoader(): Promise<GLTFLoader> {
  const loader = new GLTFLoader();
  const decoder = await getMeshoptDecoder();
  if (decoder) loader.setMeshoptDecoder(decoder);
  return loader;
}
