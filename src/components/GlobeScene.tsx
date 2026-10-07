import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLOBE_ROUTE } from "../domain/checkIn";
import "./GlobeScene.css";

type GlobeSceneProps = { reducedMotion?: boolean };
type Position = readonly [longitude: number, latitude: number];
type RotationControl = {
  x: number;
  y: number;
  invalidate: (() => void) | null;
};

const GLOBE_RADIUS = 1.22;
const INITIAL_ROTATION = { x: 0.58, y: -THREE.MathUtils.degToRad(85) };
const PETERSBURG: Position = [
  GLOBE_ROUTE.originLongitude,
  GLOBE_ROUTE.originLatitude,
];
const HANEDA: Position = [
  GLOBE_ROUTE.destinationLongitude,
  GLOBE_ROUTE.destinationLatitude,
];
const ROUTE_SEGMENTS = 96;
const ROUTE_RADIAL_SEGMENTS = 6;
const ROUTE_DURATION = 2.8;
type RouteProgress = { value: number };

// Simplified coastlines drawn locally: the illustration needs no model or texture requests.
const CONTINENTS: readonly (readonly Position[])[] = [
  [
    [-168, 71],
    [-150, 70],
    [-140, 60],
    [-131, 56],
    [-124, 48],
    [-124, 40],
    [-117, 31],
    [-108, 29],
    [-102, 23],
    [-97, 16],
    [-87, 15],
    [-83, 9],
    [-78, 9],
    [-81, 18],
    [-87, 21],
    [-90, 28],
    [-82, 25],
    [-80, 32],
    [-75, 36],
    [-67, 45],
    [-60, 46],
    [-56, 53],
    [-63, 60],
    [-76, 63],
    [-82, 69],
    [-95, 72],
    [-113, 74],
    [-134, 70],
  ],
  [
    [-52, 60],
    [-42, 61],
    [-25, 72],
    [-21, 80],
    [-37, 84],
    [-54, 80],
    [-62, 71],
  ],
  [
    [-80, 10],
    [-72, 12],
    [-62, 10],
    [-55, 5],
    [-48, -1],
    [-35, -6],
    [-38, -16],
    [-43, -23],
    [-51, -30],
    [-54, -38],
    [-66, -55],
    [-73, -52],
    [-75, -39],
    [-71, -29],
    [-75, -18],
    [-81, -5],
  ],
  [
    [-17, 34],
    [-6, 36],
    [9, 37],
    [22, 32],
    [33, 31],
    [35, 23],
    [43, 12],
    [51, 11],
    [44, 0],
    [40, -11],
    [33, -20],
    [28, -32],
    [18, -35],
    [11, -26],
    [13, -15],
    [8, -3],
    [-2, 5],
    [-12, 7],
    [-17, 15],
  ],
  [
    [-10, 36],
    [-9, 43],
    [-2, 44],
    [-5, 49],
    [4, 52],
    [8, 55],
    [8, 58],
    [4, 62],
    [14, 70],
    [27, 71],
    [34, 69],
    [44, 68],
    [58, 69],
    [71, 73],
    [93, 76],
    [112, 73],
    [128, 73],
    [145, 69],
    [165, 65],
    [178, 66],
    [180, 60],
    [169, 59],
    [161, 54],
    [156, 50],
    [146, 46],
    [141, 39],
    [129, 35],
    [123, 29],
    [121, 23],
    [113, 20],
    [108, 13],
    [104, 9],
    [101, 3],
    [98, 8],
    [95, 17],
    [91, 22],
    [87, 21],
    [80, 7],
    [77, 10],
    [72, 21],
    [67, 25],
    [59, 25],
    [57, 22],
    [51, 16],
    [44, 13],
    [40, 20],
    [36, 30],
    [29, 36],
    [23, 39],
    [22, 36],
    [16, 40],
    [13, 45],
    [7, 43],
    [3, 42],
  ],
  [
    [-8, 50],
    [-5, 50],
    [1, 52],
    [-2, 58],
    [-5, 59],
    [-7, 55],
  ],
  [
    [-11, 51],
    [-6, 51],
    [-6, 55],
    [-9, 56],
  ],
  [
    [-24, 64],
    [-14, 64],
    [-13, 66],
    [-19, 67],
  ],
  [
    [43, -12],
    [50, -14],
    [49, -23],
    [45, -26],
    [43, -20],
  ],
  [
    [130, 32],
    [134, 34],
    [137, 36],
    [141, 39],
    [142, 43],
    [145, 44],
    [143, 39],
    [139, 35],
    [135, 33],
  ],
  [
    [121, 25],
    [122, 22],
    [120, 21],
    [120, 24],
  ],
  [
    [120, 18],
    [123, 17],
    [126, 9],
    [123, 6],
    [121, 11],
  ],
  [
    [96, 5],
    [102, 1],
    [106, -6],
    [103, -6],
    [99, -2],
  ],
  [
    [109, 7],
    [119, 6],
    [118, -4],
    [112, -4],
    [109, 1],
  ],
  [
    [105, -6],
    [114, -7],
    [115, -9],
    [108, -8],
  ],
  [
    [131, -2],
    [142, -3],
    [150, -7],
    [143, -10],
    [135, -7],
  ],
  [
    [113, -22],
    [115, -16],
    [124, -13],
    [130, -12],
    [138, -15],
    [143, -11],
    [146, -18],
    [153, -26],
    [151, -34],
    [145, -39],
    [137, -35],
    [130, -32],
    [122, -34],
    [115, -29],
  ],
  [
    [166, -34],
    [174, -38],
    [177, -41],
    [174, -41],
    [170, -38],
  ],
  [
    [173, -41],
    [169, -45],
    [167, -47],
    [172, -46],
    [175, -43],
  ],
];

function locationVector(
  [longitude, latitude]: Position,
  radius = GLOBE_RADIUS,
) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude);
  const longitudeRadians = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(
    radius * Math.cos(latitudeRadians) * Math.sin(longitudeRadians),
    radius * Math.sin(latitudeRadians),
    radius * Math.cos(latitudeRadians) * Math.cos(longitudeRadians),
  );
}

function createGlobeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const project = ([longitude, latitude]: Position): [number, number] => [
    ((longitude + 180) / 360) * canvas.width,
    ((90 - latitude) / 180) * canvas.height,
  ];

  context.fillStyle = "#edf2f3";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#7ca7b7";
  context.strokeStyle = "#729daf";
  context.lineWidth = 0.8;

  for (const continent of CONTINENTS) {
    context.beginPath();
    continent.forEach((coordinate, index) => {
      const [x, y] = project(coordinate);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fill();
    context.stroke();
  }

  context.strokeStyle = "#c5d5dc";
  context.globalAlpha = 0.6;
  context.lineWidth = 0.65;
  for (let longitude = -180; longitude <= 180; longitude += 30) {
    const [x] = project([longitude, 0]);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const [, y] = project([0, latitude]);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  // SphereGeometry's seam is 90° west of our longitude vectors.
  // The quarter-turn aligns each airport with the hand-drawn map.
  texture.offset.x = 0.25;
  texture.anisotropy = 2;
  return texture;
}

function createRoute() {
  const start = locationVector(PETERSBURG, 1);
  const end = locationVector(HANEDA, 1);
  const angle = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1));
  const sine = Math.sin(angle);
  const points: THREE.Vector3[] = [];

  for (let index = 0; index <= ROUTE_SEGMENTS; index += 1) {
    const progress = index / ROUTE_SEGMENTS;
    const elevation = Math.sin(progress * Math.PI);
    const point = start
      .clone()
      .multiplyScalar(Math.sin((1 - progress) * angle) / sine)
      .addScaledVector(end, Math.sin(progress * angle) / sine)
      .normalize();
    point.multiplyScalar(GLOBE_RADIUS + 0.024 + elevation * 0.25);
    points.push(point);
  }

  return new THREE.CatmullRomCurve3(points);
}

function Plane({
  route,
  progress,
  reducedMotion,
}: {
  route: THREE.CatmullRomCurve3;
  progress: RefObject<RouteProgress>;
  reducedMotion: boolean;
}) {
  const plane = useRef<THREE.Group>(null);
  const pose = useMemo(() => new THREE.Object3D(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const geometry = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(0, 0.25);
    outline.lineTo(0.035, 0.12);
    outline.lineTo(0.245, -0.025);
    outline.lineTo(0.245, -0.075);
    outline.lineTo(0.04, -0.035);
    outline.lineTo(0.025, -0.175);
    outline.lineTo(0.085, -0.21);
    outline.lineTo(0.085, -0.24);
    outline.lineTo(0, -0.225);
    outline.lineTo(-0.085, -0.24);
    outline.lineTo(-0.085, -0.21);
    outline.lineTo(-0.025, -0.175);
    outline.lineTo(-0.04, -0.035);
    outline.lineTo(-0.245, -0.075);
    outline.lineTo(-0.245, -0.025);
    outline.lineTo(-0.035, 0.12);
    outline.closePath();

    return new THREE.ExtrudeGeometry(outline, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSize: 0.003,
      bevelThickness: 0.003,
      bevelSegments: 1,
      steps: 1,
    });
  }, []);

  const initialPose = useMemo(() => {
    const travel = reducedMotion ? 0.92 : 0.035;
    const point = route.getPointAt(travel);
    const orientation = new THREE.Object3D();
    orientation.position.copy(point);
    orientation.up.copy(point).normalize();
    orientation.lookAt(point.clone().add(route.getTangentAt(travel)));
    return { position: point, quaternion: orientation.quaternion };
  }, [route, reducedMotion]);

  useFrame(() => {
    if (!plane.current) return;
    const travel = 0.035 + progress.current.value * 0.885;
    route.getPointAt(travel, position);
    route.getTangentAt(travel, direction);
    pose.position.copy(position);
    pose.up.copy(position).normalize();
    pose.lookAt(target.copy(position).add(direction));
    plane.current.position.copy(position);
    plane.current.quaternion.copy(pose.quaternion);
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group
      ref={plane}
      position={initialPose.position}
      quaternion={initialPose.quaternion}
      scale={0.72}
    >
      <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#fffef9"
          roughness={0.38}
          metalness={0.14}
        />
      </mesh>
      <mesh position={[0, 0.021, 0.01]} scale={[0.035, 0.028, 0.22]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#14384c" roughness={0.5} />
      </mesh>
      {[-0.092, 0.092].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.008]} scale={[0.02, 0.018, 0.055]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#335365" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function RouteMarker({
  coordinate,
  progress,
  delay = 0,
  reducedMotion,
}: {
  coordinate: Position;
  progress: RefObject<RouteProgress>;
  delay?: number;
  reducedMotion: boolean;
}) {
  const marker = useRef<THREE.Group>(null);
  const position = locationVector(coordinate, GLOBE_RADIUS + 0.024);
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize(),
  );

  useFrame(() => {
    marker.current?.scale.setScalar(
      THREE.MathUtils.smoothstep(progress.current.value, delay, delay + 0.18),
    );
  });

  return (
    <group
      ref={marker}
      position={position}
      quaternion={orientation}
      scale={reducedMotion ? 1 : 0}
    >
      <mesh>
        <torusGeometry args={[0.035, 0.009, 8, 20]} />
        <meshBasicMaterial color="#caff56" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshBasicMaterial color="#193d51" />
      </mesh>
    </group>
  );
}

function Earth({
  active,
  reducedMotion,
  getRotation,
  onInvalidateReady,
}: {
  active: boolean;
  reducedMotion: boolean;
  getRotation: () => RotationControl;
  onInvalidateReady: (invalidate: (() => void) | null) => void;
}) {
  const globe = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useMemo(() => createGlobeTexture(), []);
  const route = useMemo(() => createRoute(), []);
  const routeProgress = useRef<RouteProgress>({ value: reducedMotion ? 1 : 0 });
  const routeGeometry = useMemo(() => {
    const geometry = new THREE.TubeGeometry(
      route,
      ROUTE_SEGMENTS,
      0.012,
      ROUTE_RADIAL_SEGMENTS,
      false,
    );
    geometry.setDrawRange(0, 0);
    return geometry;
  }, [route]);
  const initialX = INITIAL_ROTATION.x;
  const initialY = INITIAL_ROTATION.y - (reducedMotion ? 0 : 0.13);

  useEffect(() => {
    onInvalidateReady(invalidate);
    if (active) invalidate();
    return () => {
      onInvalidateReady(null);
    };
  }, [active, onInvalidateReady, invalidate]);

  useEffect(() => () => texture?.dispose(), [texture]);
  useEffect(() => () => routeGeometry.dispose(), [routeGeometry]);
  useEffect(() => {
    if (reducedMotion) {
      routeProgress.current.value = 1;
    }
    routeGeometry.setDrawRange(
      0,
      Math.floor(routeProgress.current.value * ROUTE_SEGMENTS) *
        ROUTE_RADIAL_SEGMENTS *
        6,
    );
    invalidate();
  }, [invalidate, reducedMotion, routeGeometry]);

  useFrame((_state, delta) => {
    if (!globe.current || !active || reducedMotion) return;
    const progress = routeProgress.current;
    if (progress.value < 1) {
      progress.value = Math.min(
        1,
        progress.value + Math.min(delta, 0.05) / ROUTE_DURATION,
      );
      routeGeometry.setDrawRange(
        0,
        Math.floor(progress.value * ROUTE_SEGMENTS) * ROUTE_RADIAL_SEGMENTS * 6,
      );
    }
    const target = getRotation();
    const rotation = globe.current.rotation;
    const damping = 1 - Math.exp(-Math.min(delta, 0.05) * 9);
    rotation.x = THREE.MathUtils.lerp(rotation.x, target.x, damping);
    rotation.y = THREE.MathUtils.lerp(rotation.y, target.y, damping);
    const distance =
      Math.abs(rotation.x - target.x) + Math.abs(rotation.y - target.y);
    if (distance > 0.0006 || progress.value < 1) invalidate();
  });

  return (
    <>
      <ambientLight intensity={1.65} />
      <directionalLight position={[-3, 4, 5]} intensity={2.6} color="#fff8e8" />
      <directionalLight position={[4, -1, 2]} intensity={0.8} color="#c4deef" />
      <group
        ref={globe}
        rotation={[initialX, initialY, -0.14]}
        position={[0, -0.16, 0]}
      >
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 40]} />
          <meshStandardMaterial
            map={texture}
            color="#ffffff"
            roughness={0.88}
            metalness={0.02}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS + 0.018, 48, 32]} />
          <meshBasicMaterial
            color="#94bdcc"
            transparent
            opacity={0.07}
            side={THREE.BackSide}
          />
        </mesh>
        <mesh geometry={routeGeometry}>
          <meshBasicMaterial color="#c4fa52" />
        </mesh>
        <RouteMarker
          coordinate={PETERSBURG}
          progress={routeProgress}
          reducedMotion={reducedMotion}
        />
        <RouteMarker
          coordinate={HANEDA}
          progress={routeProgress}
          delay={0.78}
          reducedMotion={reducedMotion}
        />
        <Plane
          route={route}
          progress={routeProgress}
          reducedMotion={reducedMotion}
        />
      </group>
    </>
  );
}

function StaticGlobe() {
  return (
    <svg
      className="globe-scene__fallback"
      viewBox="0 0 440 360"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="globe-shading" cx="32%" cy="25%" r="78%">
          <stop offset="0" stopColor="#f9fbfa" />
          <stop offset="0.7" stopColor="#e1ebef" />
          <stop offset="1" stopColor="#b0c7d1" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx="220" cy="190" r="132" />
        </clipPath>
      </defs>
      <circle cx="220" cy="190" r="132" fill="url(#globe-shading)" />
      <g clipPath="url(#globe-clip)" fill="#82a9b8">
        <path d="M112 88 139 72 157 81 155 100 177 111 193 102 212 90 234 85 249 105 272 107 292 94 322 116 341 143 315 156 291 148 271 163 254 181 237 171 226 185 217 205 203 205 199 181 190 164 173 150 161 148 151 128 127 122Z" />
        <path d="M146 153 164 154 178 170 185 190 180 216 168 238 153 257 142 239 132 216 133 194 121 174Z" />
        <path d="M295 252 310 244 327 247 339 263 329 281 309 283 297 272Z" />
        <path d="M213 205 232 216 240 234 259 242 259 248 237 244 223 231Z" />
        <path d="M99 144 108 132 115 142 108 155Z" />
      </g>
      <g
        clipPath="url(#globe-clip)"
        fill="none"
        stroke="#b5cbd4"
        strokeWidth="0.8"
        opacity="0.55"
      >
        <ellipse cx="220" cy="190" rx="70" ry="132" />
        <ellipse cx="220" cy="190" rx="115" ry="132" />
        <ellipse cx="220" cy="190" rx="132" ry="43" />
        <ellipse cx="220" cy="190" rx="121" ry="78" />
        <path d="M220 58V322M88 190H352" />
      </g>
      <path
        d="M159 118C186 48 281 52 302 164"
        fill="none"
        stroke="#c4fa52"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="159"
        cy="118"
        r="4"
        fill="#193d51"
        stroke="#c4fa52"
        strokeWidth="2"
      />
      <circle
        cx="302"
        cy="164"
        r="4"
        fill="#193d51"
        stroke="#c4fa52"
        strokeWidth="2"
      />
      <g transform="translate(280 106) rotate(139)">
        <path
          d="M0-21 4-5 22 6 22 11 4 6 3 17 9 21 9 24 0 21-9 24-9 21-3 17-4 6-22 11-22 6-4-5Z"
          fill="#fffef9"
          stroke="#24465a"
          strokeWidth="1.5"
        />
        <path
          d="M0-16V19"
          stroke="#24465a"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <g fill="#24465a" fontFamily="sans-serif" fontSize="11" fontWeight="700">
        <text x="136" y="107">
          {GLOBE_ROUTE.originCode}
        </text>
        <text x="310" y="177">
          {GLOBE_ROUTE.destinationCode}
        </text>
      </g>
    </svg>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <StaticGlobe /> : this.props.children;
  }
}

export default function GlobeScene({ reducedMotion = false }: GlobeSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const control = useRef<RotationControl>({
    ...INITIAL_ROTATION,
    invalidate: null,
  });
  const [active, setActive] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const getRotation = useCallback(() => control.current, []);
  const onInvalidateReady = useCallback((invalidate: (() => void) | null) => {
    control.current.invalidate = invalidate;
  }, []);

  useEffect(() => {
    let inView = true;
    const updateActivity = () =>
      setActive(inView && document.visibilityState !== "hidden");
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              if (!entry) return;
              inView = entry.isIntersecting;
              updateActivity();
            },
            { rootMargin: "60px" },
          );
    if (container.current) observer?.observe(container.current);
    document.addEventListener("visibilitychange", updateActivity);
    updateActivity();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", updateActivity);
    };
  }, []);

  const resetRotation = () => {
    control.current.x = INITIAL_ROTATION.x;
    control.current.y = INITIAL_ROTATION.y;
    if (active && !reducedMotion) control.current.invalidate?.();
  };

  return (
    <div
      className="globe-scene"
      ref={container}
      role="img"
      aria-label={`Трёхмерный глобус с маршрутом ${GLOBE_ROUTE.originCity} (${GLOBE_ROUTE.originCode}) — ${GLOBE_ROUTE.destinationCity} (${GLOBE_ROUTE.destinationCode})`}
      onPointerMove={(event) => {
        if (reducedMotion || !active || event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        control.current.x =
          INITIAL_ROTATION.x +
          ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.12;
        control.current.y =
          INITIAL_ROTATION.y +
          ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.24;
        control.current.invalidate?.();
      }}
      onPointerLeave={resetRotation}
    >
      <div className="globe-scene__shadow" />
      <SceneBoundary>
        {contextLost ? (
          <StaticGlobe />
        ) : (
          <Canvas
            className="globe-scene__canvas"
            aria-hidden="true"
            frameloop="demand"
            dpr={[1, 1.5]}
            camera={{ position: [0, 0.22, 5], fov: 37 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            fallback={<StaticGlobe />}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                "webglcontextlost",
                (event) => {
                  event.preventDefault();
                  setContextLost(true);
                },
                { once: true },
              );
            }}
          >
            <Earth
              active={active}
              reducedMotion={reducedMotion}
              getRotation={getRotation}
              onInvalidateReady={onInvalidateReady}
            />
          </Canvas>
        )}
      </SceneBoundary>
    </div>
  );
}
