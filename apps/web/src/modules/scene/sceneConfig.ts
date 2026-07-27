export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface LightingConfigState {
  hemiIntensity: number;
  hemiSky: string;
  hemiGround: string;
  sunIntensity: number;
  sunColor: string;
  fillIntensity: number;
  fillColor: string;
  lampIntensity: number;
  lampColor: string;
  rimIntensity: number;
  rimColor: string;
  background: string;
  envIntensity: number;
  exposure: number;
}

export interface SceneConfig {
  version: 1;
  day: LightingConfigState;
  night: LightingConfigState;
  lightPositions: {
    sun: Vec3Tuple;
    lamp: Vec3Tuple;
    rim: Vec3Tuple;
  };
  camera: {
    base: Vec3Tuple;
    lookAt: Vec3Tuple;
    fov: number;
  };
  model: {
    position: Vec3Tuple;
    scale: number;
  };
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  version: 1,
  day: {
    hemiIntensity: 0.42,
    hemiSky: '#bcd8ff',
    hemiGround: '#1c2a1a',
    sunIntensity: 1.2,
    sunColor: '#fff2d6',
    fillIntensity: 0.16,
    fillColor: '#4a6a4a',
    lampIntensity: 0.1,
    lampColor: '#ffb168',
    rimIntensity: 0.25,
    rimColor: '#8fd8c8',
    background: '#42533f',
    envIntensity: 0.4,
    exposure: 1.0,
  },
  night: {
    hemiIntensity: 0.05,
    hemiSky: '#1a2440',
    hemiGround: '#050805',
    sunIntensity: 0.0,
    sunColor: '#8899ff',
    fillIntensity: 0.06,
    fillColor: '#3a2a18',
    lampIntensity: 0.3,
    lampColor: '#ffb168',
    rimIntensity: 0.08,
    rimColor: '#8fd8c8',
    background: '#020402',
    envIntensity: 0.15,
    exposure: 0.95,
  },
  lightPositions: {
    sun: { x: -6, y: 9, z: 3 },
    lamp: { x: -2.1, y: 1.6, z: 1.4 },
    rim: { x: 2, y: 3, z: -6 },
  },
  camera: {
    base: { x: 2.6, y: 1.55, z: 5.1 },
    lookAt: { x: 0, y: 1.3, z: 0 },
    fov: 35,
  },
  model: {
    position: { x: 0, y: 1.15, z: 0.4 },
    scale: 1,
  },
};

/**
 * Runtime-tuned config takes priority over DEFAULT_SCENE_CONFIG when present: export from the
 * `?edit=1` editor and drop the downloaded file at `apps/web/public/config/sceneConfig.json` to
 * override the built-in defaults without a code change. Absent/invalid file silently falls back to
 * defaults.
 */
export async function loadRuntimeSceneConfig(baseUrl: string): Promise<SceneConfig | null> {
  try {
    const res = await fetch(`${baseUrl}config/sceneConfig.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SceneConfig;
  } catch {
    return null;
  }
}
