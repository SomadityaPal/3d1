import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Outlines, Environment, useTexture, useProgress } from "@react-three/drei";
import { Physics, useSphere } from "@react-three/cannon";
import { ReactLenis } from "lenis/react";
import {
  EffectComposer,
  N8AO,
  SMAA,
  DepthOfField,
  Bloom,
} from "@react-three/postprocessing";
import { useState, useRef, useEffect, useMemo } from "react";
import { db, auth } from "./lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Shield,
  Globe,
  Zap,
  Eye,
  Compass,
  UserCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
  Mail,
  Smartphone,
  Check,
  Send,
  Calendar,
  Lock,
  Flame,
  User,
  ExternalLink,
  MapPin,
  Star,
} from "lucide-react";
import {
  SplitReveal,
  StylishTypewriter,
  TypedText,
  GalleryTextReveal,
  ScrambleText,
  GsapScrambleText,
  AutoBaffleText,
  HoverScrambleText,
} from "./components/TextEffects";
import { LoadingScreen } from "./components/LoadingScreen";

const rfs = THREE.MathUtils.randFloatSpread;
const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
const baubleMaterial = new THREE.MeshPhysicalMaterial({
  color: "#f5f5f5",
  roughness: 0.1,
  metalness: 0.05,
  transparent: true,
  transmission: 1.0,
  thickness: 2.0,
  ior: 1.5,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  envMapIntensity: 2.5,
  attenuationColor: "#d4af37",
  attenuationDistance: 2.5,
  specularColor: "#d4af37",
  specularIntensity: 2.0,
});

// Shared global mouse and scroll tracking coordinates
let globalMouse = { x: -999, y: -999 };
let globalScrollY = 0;

// 3D Canvas Background Component
function BallScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1]}
        camera={{ position: [0, 0, 18], fov: 35, near: 1, far: 40 }}
      >
        <ambientLight intensity={1.1} />
        {/* Transparent background to let the text show through */}
        <spotLight
          intensity={2.2}
          angle={0.25}
          penumbra={1}
          position={[30, 35, 30]}
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <Physics gravity={[0, 1.8, 0]} iterations={10}>
          <Pointer />
          <Clump />
        </Physics>
        <Environment preset="city" />
        <EffectComposer disableNormalPass multisampling={0}>
          <N8AO
            halfRes
            color="#000000"
            aoRadius={1.8}
            intensity={1.8}
            aoSamples={6}
            denoiseSamples={4}
          />
          <DepthOfField
            target={[0, 0, 0]}
            focalLength={0.4}
            bokehScale={2}
            height={700}
          />
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.8} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

function Clump({ mat = new THREE.Matrix4(), vec = new THREE.Vector3() }) {
  const ballData = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        size: Math.random() * 0.4 + 0.6,
        mass: 1.0 + Math.random() * 0.8,
      })),
    []
  );

  const [ref, api] = useSphere((index) => ({
    args: [ballData[index].size],
    mass: ballData[index].mass,
    angularDamping: 0.1,
    linearDamping: 0.65,
    position: [rfs(100), rfs(100), rfs(100)],
    rotation: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ],
  }));

  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  const pVec = useRef(new THREE.Vector3());
  const forceDir = useRef(new THREE.Vector3());
  const qVec = useRef(new THREE.Quaternion());
  const sVec = useRef(new THREE.Vector3());
  const orbitAxis = useRef(new THREE.Vector3(0.1, 1.0, 0.1).normalize());

  useFrame((state) => {
    const currentScrollY = globalScrollY;
    const scrollDiff = currentScrollY - lastScrollY.current;

    scrollVelocity.current = THREE.MathUtils.lerp(
      scrollVelocity.current,
      scrollDiff * 0.45,
      0.12
    );
    lastScrollY.current = currentScrollY;

    // Continual Spin + Scroll Reactivity
    const baseSwirl = 2.5; 
    const scrollSwirl = scrollVelocity.current * 1.5;
    const clampedScrollSwirl = THREE.MathUtils.clamp(scrollSwirl, -15.0, 15.0);
    const finalSwirl = baseSwirl + clampedScrollSwirl;

    const t = state.clock.getElapsedTime();
    const clusterRamp = Math.max(0, Math.min(1.0, t / 1.5));

    for (let i = 0; i < 40; i++) {
      ref.current.getMatrixAt(i, mat);
      
      // Update sizes perfectly
      mat.decompose(pVec.current, qVec.current, sVec.current);
      sVec.current.set(ballData[i].size, ballData[i].size, ballData[i].size);
      mat.compose(pVec.current, qVec.current, sVec.current);
      ref.current.setMatrixAt(i, mat);

      const hoverWave = Math.sin(t * 1.5 + i * 0.25) * 1.5;
      const buoyancy = (2.0 + hoverWave) * clusterRamp;

      const dist = pVec.current.length();
      
      // Pull securely to center (0,0,0) with anti-jitter
      let gravityFactor = 28.0;
      if (dist > 12) {
        gravityFactor = 38.0; // Gather fast
      } else if (dist < 5.0) {
        gravityFactor = 4.0 + 20.0 * (dist / 5.0); // Extremely stable inward pull 
      }

      // Stability dampening when fully clustered
      const stabilityDampener = Math.min(1.0, Math.max(0.2, dist / 2.0));

      let gravityX = -pVec.current.x * gravityFactor;
      let gravityY = -pVec.current.y * gravityFactor + (buoyancy * stabilityDampener);
      let gravityZ = -pVec.current.z * gravityFactor;

      // Clean vortex orbital rotation around center
      forceDir.current
        .crossVectors(orbitAxis.current, pVec.current)
        .normalize();
      
      const vortexX = forceDir.current.x * finalSwirl * 8.0 * stabilityDampener;
      const vortexY = forceDir.current.y * finalSwirl * 8.0 * stabilityDampener;
      const vortexZ = forceDir.current.z * finalSwirl * 8.0 * stabilityDampener;

      const fX = gravityX + vortexX;
      const fY = gravityY + vortexY;
      const fZ = gravityZ + vortexZ;

      api.at(i).applyForce([fX, fY, fZ], [0, 0, 0]);
    }
    
    // Commit adjustments
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[sphereGeometry, baubleMaterial, 40]}
    >
      <Outlines thickness={0.0} />
    </instancedMesh>
  );
}

function Pointer() {
  const viewport = useThree((state) => state.viewport);
  const [, api] = useSphere(() => ({
    type: "Kinematic",
    args: [3.2],
    position: [0, 0, 0],
  }));

  return useFrame(() => {
    if (globalMouse.x === -999) return; // Hide pointer off-screen initially
    // Kinematic helper reads our global mouse tracker instantly
    api.position.set(
      (globalMouse.x * viewport.width) / 2,
      (globalMouse.y * viewport.height) / 2,
      0,
    );
  });
}

// Experience items structured into filter categories
const EXPERIENCE_ITEMS = [
  // Row 1
  {
    category: "Travel",
    title: "A private sunrise at the Colosseum",
    detail: "Doors opened privately at 4 AM for family stay",
    tier: "Phantom",
  },
  {
    category: "Acquisition",
    title: "A Patek Philippe 5230G limited",
    detail: "Sourced with full provenance and delivered in 48 hours",
    tier: "Cipher",
  },
  {
    category: "Dining",
    title: "Chef's table at a 3-star Tokyo venue",
    detail: "Secured priority table booking in the same week",
    tier: "Cipher",
  },
  {
    category: "Aviation",
    title: "A Gulfstream G650 repositioned",
    detail: "Flown from LA to Dubai in under 6 hours notice",
    tier: "Phantom",
  },
  {
    category: "Event",
    title: "Backstage access at the Royal Opera House",
    detail: "Private stage walk and lead artists conversation",
    tier: "Cipher",
  },
  {
    category: "Property",
    title: "A private island in the Maldives",
    detail: "Leased exclusively with bespoke staff for one month",
    tier: "Sovereign",
  },
  {
    category: "Health",
    title: "Air ambulance and specialist escort",
    detail: "Transcontinental route & surgeon prep completed within 4 hours",
    tier: "Phantom",
  },
  {
    category: "Art",
    title: "A private Art Basel preview",
    detail: "VIP tour arranged before any public doors opened",
    tier: "Cipher",
  },
  // Row 2
  {
    category: "Sport",
    title: "A Formula 1 garage walk",
    detail: "Bespoke engineering team meet details on race day",
    tier: "Phantom",
  },
  {
    category: "Fashion",
    title: "A private Hermès atelier access",
    detail: "Bespoke Birkin commission with zero waitlist",
    tier: "Sovereign",
  },
  {
    category: "Experience",
    title: "Dinner atop an Arctic iceberg",
    detail: "Award-winning chef flown in, table carved for two",
    tier: "Sovereign",
  },
  {
    category: "Security",
    title: "Discreet close-protection detail",
    detail: "Synchronized safety arranged across 9 countries securely",
    tier: "Phantom",
  },
  {
    category: "Culture",
    title: "Bespoke private audiences",
    detail: "Curated introduction with key heads of state in 6 weeks",
    tier: "Sovereign",
  },
  {
    category: "Marine",
    title: "A 70m superyacht charter",
    detail: "Impeccable crew, route, and menu prepared in 72 hours",
    tier: "Phantom",
  },
  {
    category: "Wellness",
    title: "A state-of-the-art longevity retreat",
    detail: "Full clinical team on location, completely undisclosed",
    tier: "Sovereign",
  },
  {
    category: "Space",
    title: "Suborbital space flight registration",
    detail: "Managed logistics from application to pre-launch",
    tier: "Sovereign",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I said I wanted to propose on a bridge, at midnight, with an orchestra. I named a specific bridge. They made it happen in eleven days. I don't ask how — I just ask.",
    author: "Phantom Member, Technology Founder",
    location: "Singapore",
  },
  {
    quote:
      "My Director responded to my message at 3 AM from a different continent and had my cabin configured, my preferred chef booked, and my itinerary filed before I woke up. This is not service. This is architecture.",
    author: "Sovereign Member, Principal, Private Equity",
    location: "Dubai",
  },
  {
    quote:
      "They sourced a Birkin in a colourway that Hermès told me categorically did not exist in any market. It arrived in four days. In perfect condition. With a letter.",
    author: "Cipher Member, Creative Director",
    location: "Milan",
  },
  {
    quote:
      "I needed a cardiologist who was on holiday in New Zealand. They reached him, arranged a video consultation, and had a local specialist standing by — within two hours. I have never trusted anyone with my life the way I trust Illusion.",
    author: "Phantom Member, Family Office Principal",
    location: "Geneva",
  },
  {
    quote:
      "We wanted to celebrate our anniversary on a private beach with a specific chef, a specific wine, and a specific constellation visible overhead. They checked the astronomy. Everything was exactly right.",
    author: "Cipher Member, Director, Global Media Group",
    location: "London",
  },
  {
    quote:
      "The word impossible has not entered a conversation with my Director once in three years. I have tested this. Every time. They have not failed me once.",
    author: "Sovereign Member, Confidential",
    location: "Zurich",
  },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { active } = useProgress();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsLoaded(true);
    }
  }, [active]);

  // ... (rest of states)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("Phantom — Signature");
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    // Timeout is handled inside LoadingScreen now
  }, []);

  const scrollRef = useRef(null);

  const sections = [
    "hero",
    "services",
    "private-companionship",
    "pillars",
    "experiences",
    "membership",
    "contact",
  ];

  // Custom contact form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    interest: "",
    notes: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth states
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(
          auth,
          authForm.email,
          authForm.password,
        );
      } else {
        await createUserWithEmailAndPassword(
          auth,
          authForm.email,
          authForm.password,
        );
      }
      setShowAuthModal(false);
      setAuthForm({ email: "", password: "" });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Track window coordinates globally for 3D sphere tracker
  useEffect(() => {
    const handleMouseMove = (e) => {
      globalMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      globalMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        globalMouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        globalMouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
    };
  }, []);

  // Track absolute scroll position & active page indicator
  useEffect(() => {
    let scrollPositions = [];
    
    const updatePositions = () => {
      scrollPositions = sections.map((id) => {
        const el = document.getElementById(id);
        return el ? el.offsetTop - window.innerHeight / 2.5 : 0;
      });
    };
    
    // Initial calculation (wrapped in timeout to ensure DOM is ready)
    setTimeout(updatePositions, 500);
    window.addEventListener("resize", updatePositions);

    let ticking = false;
    const handleScroll = () => {
      globalScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const top = globalScrollY;
          let current = "hero";
          for (let i = 0; i < sections.length; i++) {
            if (top >= scrollPositions[i]) {
              current = sections[i];
            }
          }
          setActiveSection((prev) => (prev !== current ? current : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Auto-slide testimonials every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleTierEnquire = (tierName) => {
    let internalTier = "Cipher — Foundation";
    if (tierName === "PHANTOM") internalTier = "Phantom — Signature";
    if (tierName === "SOVEREIGN") internalTier = "Sovereign — Ultimate";

    setSelectedTier(internalTier);
    setFormData((prev) => ({ ...prev, interest: internalTier }));
    scrollToSection("contact");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "formSubmissions"), {
        ...formData,
        userId: currentUser ? currentUser.uid : null,
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("An error occurred preserving your dossier. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExperiences =
    selectedCategory === "All"
      ? EXPERIENCE_ITEMS
      : EXPERIENCE_ITEMS.filter((item) => item.category === selectedCategory);

  const categories = [
    "All",
    "Travel",
    "Acquisition",
    "Dining",
    "Aviation",
    "Experience",
    "Sport",
    "Security",
  ];

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true, syncTouch: true }}>
    <div
      id="illusion-root"
      className="relative w-full min-h-screen select-none bg-[#050505]"
    >
      {isLoading && <LoadingScreen isLoaded={isLoaded} onComplete={() => setIsLoading(false)} />}

      {/* Massive Background Text behind 3D Canvas */}
      <div className="fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] sm:w-[95vw] z-0 flex flex-col items-center justify-center pointer-events-none select-none px-4">
        <h1 className="w-full text-center flex flex-col opacity-[0.75]">
          <span className="text-[14vw] font-serif font-black text-neutral-400 tracking-tighter leading-[0.8] mb-2 whitespace-nowrap">
            <GalleryTextReveal
              text="IF YOU CAN"
              delay={4.2}
              duration={2.0}
              stagger={0.1}
            />
          </span>
          <span className="text-[16vw] font-serif italic text-gold-400/80 tracking-tight leading-[0.7] transform -translate-y-[2vw] whitespace-nowrap">
            <GalleryTextReveal
              text="DREAM IT,"
              delay={4.6}
              duration={2.0}
              stagger={0.1}
            />
          </span>
          <span className="text-[4.5vw] sm:text-[3vw] font-sans font-bold text-neutral-400 tracking-widest mt-6 uppercase whitespace-nowrap">
            <GalleryTextReveal
              text="WE HAVE ALREADY ARRANGED IT"
              delay={5.0}
              duration={1.5}
              stagger={0.04}
            />
          </span>
        </h1>
      </div>

      {/* 3D Interactive Background Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BallScene />
      </div>

      {/* Main scrolling wrapper - transparent so background balloons are perfectly visible */}
      <div className="relative w-full z-10 flex flex-col">
        {/* Navigation Bar */}
        <header className="sticky top-0 w-full z-50 transition-all duration-300">
          {/* Gradual glass background element */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/40 to-transparent backdrop-blur-lg [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]" />
          <div className="relative z-10 w-full mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
            {/* Logo */}
            <div
              onClick={() => scrollToSection("hero")}
              className="cursor-pointer group flex flex-col items-start"
            >
              <span className="text-xl md:text-2xl font-display tracking-[0.25em] text-white group-hover:text-gold-50 transition-colors">
                <AutoBaffleText text="ILLUSION" interval={5000} duration={800} />
              </span>
              <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-gold-50">
                <AutoBaffleText text="Global Concierge" interval={5000} duration={800} />
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-mono tracking-widest uppercase text-white">
              <button
                onClick={() => scrollToSection("services")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Services" duration={400} />
              </button>
              <button
                onClick={() => scrollToSection("private-companionship")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Companionship" duration={400} />
              </button>
              <button
                onClick={() => scrollToSection("experiences")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Experiences" duration={400} />
              </button>
              <button
                onClick={() => scrollToSection("pillars")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Philosophy" duration={400} />
              </button>
              <button
                onClick={() => scrollToSection("membership")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Membership" duration={400} />
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="hover:text-gold-50 hover:scale-105 transition-all cursor-pointer"
              >
                <HoverScrambleText text="Contact" duration={400} />
              </button>
            </nav>

            {/* CTA Request Access */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gold-50 border border-gold-500/20 px-3 py-1.5">
                    {currentUser.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-mono tracking-widest uppercase text-white hover:text-white transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-xs font-mono tracking-widest uppercase text-white hover:text-white transition-colors cursor-pointer"
                >
                  Client Login
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedTier("Phantom — Signature");
                  scrollToSection("contact");
                }}
                className="px-6 py-3 border border-gold-500/40 text-gold-50 text-xs font-mono tracking-widest uppercase hover:bg-gold-500 hover:text-black transition-all cursor-pointer rounded-none"
              >
                <HoverScrambleText
                  text="Request Access"
                  duration={400}
                  scrambleCharacters="<>/?\\|{}[]!@#$%^&*~+=-_01"
                />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full z-40 bg-luxe-blur border-b border-neutral-900 flex flex-col p-8 space-y-6 text-center shadow-lg">
            <button
              onClick={() => scrollToSection("services")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("private-companionship")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Companionship
            </button>
            <button
              onClick={() => scrollToSection("experiences")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Experiences
            </button>
            <button
              onClick={() => scrollToSection("pillars")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Philosophy
            </button>
            <button
              onClick={() => scrollToSection("membership")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Membership
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-mono tracking-widest uppercase text-white py-2 hover:text-gold-50"
            >
              Contact
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="w-full py-3 bg-gold-500 text-black text-xs font-mono tracking-widest uppercase cursor-pointer hover:bg-gold-600 transition-colors"
            >
              Request Access
            </button>
          </div>
        )}

        {/* Hero Section Container with Transparent Background to Show Core Balloons */}
        <section
          id="hero"
          className="relative min-h-[92vh] flex flex-col justify-between px-6 pt-16 md:pt-24 pb-12"
        >
          {/* Accent decoration */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none text-center">
            <GalleryTextReveal
              className="text-[10px] font-mono tracking-[0.5em] uppercase text-gold-50 block mb-2"
              text="ESTABLISHED FOR THE EXTRAORDINARY"
              duration={1.2}
              delay={4.2}
            />
          </div>

          <div className="max-w-5xl mx-auto w-full my-auto text-center z-10">
            <div className="space-y-8">
              <h2 className="text-xs md:text-sm font-mono tracking-[0.45em] uppercase text-white">
                <GalleryTextReveal
                  text="GLOBAL CONCIERGE · EST. FOR THE EXTRAORDINARY"
                  duration={1.8}
                  delay={4.2}
                />
              </h2>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-6 pt-10">
                <button
                  onClick={() => scrollToSection("membership")}
                  className="w-full sm:w-auto px-10 py-4 bg-white/[0.04] text-white border border-white/[0.12] hover:bg-white/20 hover:border-white/30 backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98] text-xs font-mono tracking-[0.2em] uppercase transition-all shadow-[0_8px_24px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer flex items-center justify-center gap-3 font-medium rounded-xl"
                >
                  Apply for Membership <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => scrollToSection("services")}
                  className="w-full sm:w-auto px-10 py-4 bg-black/40 text-white hover:text-white border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20 backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98] text-xs font-mono tracking-[0.2em] uppercase transition-all shadow-[0_8px_24px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer flex items-center justify-center gap-3 font-medium rounded-xl"
                >
                  Discover Illusion
                </button>
              </div>
            </div>
          </div>

          {/* Bottom aligned elements within Hero */}
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-end md:justify-end pb-8 z-10 px-6">
            <div className="text-right max-w-md hidden md:block">
              <p className="text-sm font-light text-white leading-relaxed font-sans border-r-2 border-gold-400/30 pr-4">
                <SplitReveal
                  text="The world's most absolute concierge service."
                  delay={4.5}
                />
                <br />
                <SplitReveal
                  text="No request too impossible. No detail beneath our attention."
                  delay={4.8}
                />
              </p>
            </div>
          </div>
        </section>

        {/* Marquee Bar Section */}
        <section
          id="marquee"
          className="relative w-full overflow-hidden bg-white/[0.02] backdrop-blur-3xl text-gold-50 py-5 border-y border-white/[0.08] z-20 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          <div className="animate-marquee whitespace-nowrap flex items-center text-xs sm:text-sm font-serif tracking-[0.2em] uppercase">
            <span>
              · Private Island Procurement · Classified Global Access ·
              Ultra-Rare Collectibles · Medical Evacuation · Superyacht Charter
              · Michelin Tables in Hours · Bespoke Private Aviation · Security &
              Discretion · Diplomatic Access · Art & Estate Advisory
            </span>
            <span>
              · Private Island Procurement · Classified Global Access ·
              Ultra-Rare Collectibles · Medical Evacuation · Superyacht Charter
              · Michelin Tables in Hours · Bespoke Private Aviation · Security &
              Discretion · Diplomatic Access · Art & Estate Advisory
            </span>
          </div>
        </section>

        {/* Services Section */}
        <section
          id="services"
          className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 z-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Left side static context info */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-36 bg-white/[0.02] backdrop-blur-3xl p-8 md:p-12 border border-white/[0.08] rounded-2xl relative shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <GalleryTextReveal
                className="text-[10px] font-mono tracking-[0.3em] uppercase text-white block"
                text="WHAT WE DO /"
              />
              <h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight text-white leading-tight min-h-[4em] md:min-h-[2em] flex items-center justify-start text-left">
                <ScrambleText
                  text="Beyond the conceivable."
                  delay={100}
                  duration={800}
                />
              </h2>
              <div className="space-y-4 font-sans text-white leading-relaxed font-light text-sm md:text-base">
                <p>
                  <SplitReveal
                    text="Illusion is not a concierge service. It is the elimination of every limitation you have ever accepted as real. Our team of 200 specialists across 45 countries operates in permanent readiness — so that when your desire materialises, the answer is already waiting."
                    delay={0.2}
                    duration={1.2}
                  />
                </p>
                <p className="font-serif italic text-gold-50 pt-2 font-medium">
                  <StylishTypewriter
                    text="We do not say no. We say: give us a moment."
                    delay={0.5}
                  />
                </p>
              </div>
              <div className="pt-4 border-t border-gold-500/20">
                <button
                  onClick={() => scrollToSection("contact")}
                  className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-white hover:text-gold-50 transition-colors"
                >
                  Schedule Initial Consultation{" "}
                  <ArrowRight size={14} className="text-gold-50" />
                </button>
              </div>
            </div>

            {/* Right side catalog list */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Lifestyle & Concierge",
                  desc: "Your dedicated Illusion Director — a single, named individual who knows your life, your preferences, and your standards. Available every hour of every day, across every time zone.",
                },
                {
                  title: "Private Aviation & Yachts",
                  desc: "From Gulfstream G700 charters to full superyacht management, configured exactly as you require — including crew selection, itinerary, and provisioning to Michelin-star standard.",
                },
                {
                  title: "Rare Acquisitions",
                  desc: "Hermès Birkins before they exist. Patek Philippes with provenance. First-edition manuscripts. We source, authenticate, and deliver what cannot be purchased through ordinary means.",
                },
                {
                  title: "Global Events & Access",
                  desc: "Centre Court at Wimbledon. Front row at Paris Fashion Week. The Cannes Film Festival yacht pier. Grand Prix garages. Not the ticket — the experience no ticket could ever buy.",
                },
                {
                  title: "Private Travel Architecture",
                  desc: "Entire countries reimagined as your itinerary. We close beaches, arrange private museum openings at midnight, and place you in residences that have never appeared on a booking platform.",
                },
                {
                  title: "Wealth & Estate Services",
                  desc: "Property acquisition on six continents. Staff placement. Art advisory from acquisition to provenance. A silent infrastructure managing every dimension of your life and legacy.",
                },
                {
                  title: "Health & Longevity",
                  desc: "Bespoke medical concierge. Access to the world's leading specialists before anyone else. Executive health programmes. Air ambulance. Global insurance structuring. Your wellbeing, protected.",
                },
                {
                  title: "Elite Networking",
                  desc: "Private summits. Intimate dinners with heads of industry, culture, and influence. Curated access to the conversations that actually shape the world — behind closed doors.",
                },
              ].map((service, index) => (
                <div
                  key={index}
                  className="bg-transparent hover:bg-white/[0.02] border-b border-white/[0.08] transition-all p-8 md:p-10 group flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <span className="text-[10px] font-mono tracking-widest text-white">
                      <GsapScrambleText text={`0${index + 1}`} duration={1.5} delay={0.2} scrambleCharacters="0123456789" />
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-light text-white group-hover:text-white transition-colors">
                      <SplitReveal text={service.title} />
                    </h3>
                    <p className="text-xs font-sans font-light leading-relaxed text-white group-hover:text-white">
                      <GsapScrambleText text={service.desc} duration={2.0} delay={0.4} />
                    </p>
                  </div>
                  <div className="pt-10">
                    <button
                      onClick={() => {
                        setSelectedTier(
                          index % 3 === 0
                            ? "Cipher — Foundation"
                            : index % 3 === 1
                              ? "Phantom — Signature"
                              : "Sovereign — Ultimate",
                        );
                        scrollToSection("contact");
                      }}
                      className="text-[9px] font-mono tracking-widest uppercase text-white group-hover:text-white flex items-center gap-2 transition-colors cursor-crosshair"
                    >
                      Enquire Access{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Private Companionship Section */}
        <section
          id="private-companionship"
          className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 md:pb-32 z-20"
        >
          <div className="bg-white/[0.02] p-10 md:p-20 border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-xl text-center max-w-5xl mx-auto space-y-8 rounded-3xl">
            <GalleryTextReveal
              className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block"
              text="EXCLUSIVE COMPANIONSHIP"
            />
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-white leading-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
              <ScrambleText
                text="Discreet & Elegant Accompaniment."
                delay={100}
                duration={800}
              />
            </h2>
            <div className="h-[1px] w-24 bg-gold-400/40 mx-auto my-6"></div>
            <p className="text-sm md:text-lg font-light text-white leading-relaxed font-sans max-w-3xl mx-auto">
              <SplitReveal
                text="We specialize in exclusive private services and luxury travel companionship. Offering discreet and elegant accompaniment tailored for all occasions anywhere."
                delay={0.2}
                duration={0.8}
              />
            </p>
            <div className="pt-8">
              <button
                onClick={() => {
                  setSelectedTier("Phantom — Signature");
                  scrollToSection("contact");
                }}
                className="inline-flex items-center gap-4 px-8 py-4 border border-gold-500/40 text-gold-50 text-xs font-mono tracking-widest uppercase hover:bg-gold-500 hover:text-black transition-all cursor-pointer rounded-none"
              >
                Inquire Discretely <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section
          id="pillars"
          className="relative text-white py-24 md:py-32 z-20"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
              <span className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block">
                <GsapScrambleText text="OUR PHILOSOPHY" duration={1.5} />
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
                <ScrambleText
                  text="The pillars of Illusion"
                  delay={100}
                  duration={800}
                />
              </h2>
              <div className="h-[1px] w-24 bg-gold-400/40 mx-auto my-4"></div>
              <p className="text-sm md:text-base font-light text-white leading-relaxed font-sans max-w-xl mx-auto">
                <SplitReveal
                  text="Every interaction, every arrangement, every silence — governed by these absolutes."
                  delay={0.3}
                  duration={1.0}
                />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  num: "01",
                  title: "Absolute Discretion",
                  desc: "Your identity, your requests, your life — protected by a covenant of silence that no circumstance can dissolve. Our team signs NDAs of the highest international standing. We have never disclosed a client's name. We never will.",
                  badge: "Non-Negotiable",
                },
                {
                  num: "02",
                  title: "Infinite Reach",
                  desc: "200+ specialists. 45 countries. Relationships with 6,000 vetted partners — from palace hoteliers to Michelin chefs to private island owners. Our network exists in places no other service has ever thought to cultivate.",
                  badge: "Truly Global",
                },
                {
                  num: "03",
                  title: "Zero Limitations",
                  desc: "We do not maintain a list of things we cannot do. We maintain a team whose sole purpose is to find a way. Sold out, closed, private, classified... these are starting points, not conclusions.",
                  badge: "Without Compromise",
                },
                {
                  num: "04",
                  title: "Anticipatory Intelligence",
                  desc: "We do not wait to be asked. We learn how you live and we act before the need surfaces. Your table is already reserved. Your aircraft is already positioned. Your preference is already noted.",
                  badge: "Always Ahead",
                },
                {
                  num: "05",
                  title: "Immaculate Execution",
                  desc: "Precision is not a feature. It is a baseline. From the temperature of the cabin to the alignment of a dinner placement, every detail is managed with a standard that most consider exceptional and we consider minimum.",
                  badge: "Flawless Always",
                },
                {
                  num: "06",
                  title: "Singular Accountability",
                  desc: "You have one Illusion Director. One number. One point of contact who owns your world entirely. No departments, no transfers, no repeating yourself. They know you — and they act accordingly.",
                  badge: "One Person, Everything",
                },
              ].map((pillar, idx) => (
                <div
                  key={idx}
                  className="border border-white/[0.08] p-8 flex flex-col justify-between hover:border-gold-500/50 transition-all duration-300 bg-white/[0.02] backdrop-blur-3xl relative group rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl font-serif text-neutral-800 group-hover:text-gold-50/30 transition-colors font-bold uppercase">
                        <GsapScrambleText text={pillar.num} duration={1.2} delay={0.1} scrambleCharacters="0123456789" />
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-gold-50 bg-gold-900/60 px-2 py-1 rounded-sm uppercase">
                        <GsapScrambleText text={pillar.badge} duration={1.8} delay={0.3} />
                      </span>
                    </div>

                    <h3 className="text-xl font-serif tracking-wide text-white group-hover:text-gold-50 transition-colors">
                      <SplitReveal text={pillar.title} />
                    </h3>
                    <p className="text-xs md:text-sm font-sans font-light text-white leading-relaxed md:min-h-[100px]">
                      <GsapScrambleText text={pillar.desc} duration={2.5} delay={0.3} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Experiences Section with Dynamic Category Filtering */}
        <section
          id="experiences"
          className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 z-20"
        >
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <GalleryTextReveal
              className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block"
              text="THE IMPOSSIBLE, DELIVERED"
            />
            <h2 className="text-3xl md:text-5xl font-serif font-light text-white tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
              <ScrambleText
                text="Things we have actually arranged."
                delay={100}
                duration={800}
              />
            </h2>
            <p className="text-xs md:text-sm text-white font-mono tracking-widest mt-4 min-h-[20px]">
              <TypedText
                sequence={[
                  "Verified accounts · Names redacted under discretion",
                  2000,
                ]}
                cursor={false}
                repeat={1}
              />
            </p>
          </div>

          {/* Interactive filter buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto mb-12">
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase cursor-pointer transition-all border ${
                  selectedCategory === cat
                    ? "bg-gold-500 text-black border-gold-500 font-medium"
                    : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5 text-white backdrop-blur-md rounded-md"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Art Gallery Style Catalog List */}
          <div className="w-full max-w-5xl mx-auto flex flex-col mt-8 border-t border-neutral-800/50">
            {filteredExperiences.map((exp, idx) => (
              <div
                key={`${exp.title}-${idx}`}
                className="group relative border-b border-white/[0.08] py-8 md:py-12 transition-colors duration-700 hover:bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-crosshair overflow-hidden"
              >
                {/* Background Reveal Block */}
                <div className="absolute inset-x-2 inset-y-1 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-700 ease-out z-0 pointer-events-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)]" />

                {/* Left Column: Number & Category */}
                <div className="flex flex-col gap-2 md:w-1/4 relative z-10 transition-colors duration-500">
                  <span className="text-xs font-mono text-white group-hover:text-white">
                    {(idx + 1).toString().padStart(2, "0")} /{" "}
                    <HoverScrambleText
                      text={exp.tier}
                      duration={500}
                      scrambleCharacters="01"
                    />
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase text-gold-50 group-hover:text-gold-50 transition-colors">
                    <HoverScrambleText text={exp.category} duration={600} />
                  </span>
                </div>

                {/* Center Column: Title */}
                <div className="md:w-1/2 relative z-10 text-left transition-colors duration-500">
                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-serif font-light text-white group-hover:text-white transition-colors duration-500 leading-tight md:leading-none">
                    <SplitReveal text={exp.title} delay={idx * 0.1} />
                  </h4>
                </div>

                {/* Right Column: Details & CTA */}
                <div className="md:w-1/4 flex flex-col items-start md:items-end gap-4 relative z-10 transition-colors duration-500">
                  <p className="text-xs font-sans font-light text-white group-hover:text-white transition-colors text-left md:text-right line-clamp-3">
                    <SplitReveal
                      text={exp.detail}
                      delay={idx * 0.1 + 0.2}
                      duration={0.8}
                    />
                  </p>
                  <button
                    onClick={() => handleTierEnquire(exp.tier.toUpperCase())}
                    className="text-[10px] font-mono tracking-widest uppercase text-white group-hover:text-white flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <HoverScrambleText text="Enquire" duration={400} />{" "}
                    <ArrowRight
                      size={12}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <span className="text-xs text-white font-mono italic">
              <GsapScrambleText text="And countess others, structured dynamically within minutes across indices." duration={1.5} />
            </span>
          </div>
        </section>

        {/* Discretion Section Container */}
        <section
          id="promise"
          className="relative text-white py-24 md:py-32 z-20"
        >
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left side Quote panel */}
            <div className="lg:col-span-6 space-y-8 bg-white/[0.02] backdrop-blur-3xl p-8 md:p-12 border border-white/[0.08] rounded-2xl relative shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <span className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block mb-2">
                <GsapScrambleText text="OUR PROMISE" duration={1.5} />
              </span>
              <h2 className="text-2xl md:text-4xl font-serif italic text-gold-50 leading-relaxed font-light min-h-[4.5em] md:min-h-[2em] flex items-center justify-center text-center">
                <StylishTypewriter
                  text={
                    '"Everything you can only dream of, we will provide. With absolute discretion, and all."'
                  }
                  delay={0.2}
                />
              </h2>
              <div className="space-y-4">
                <div className="h-[1px] w-20 bg-gold-400"></div>
                <p className="text-white font-light text-xs md:text-sm font-mono tracking-wide leading-relaxed">
                  <SplitReveal
                    text="Illusion exists for the individual who has reached the point where the ordinary world can no longer meet them. We were built for this moment."
                    delay={0.4}
                  />
                </p>
              </div>
            </div>

            {/* Right side Illusion standard rules ledger */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block">
                  <GsapScrambleText text="THE ILLUSION STANDARD" duration={1.5} />
                </span>
                <h3 className="text-2xl md:text-4xl font-serif text-white tracking-tight">
                  <SplitReveal
                    text="Our Absolute Operational Absolute"
                    delay={0.2}
                    duration={1.2}
                  />
                </h3>
              </div>

              <div className="space-y-6 text-white text-xs md:text-sm font-sans font-light">
                {[
                  "Your Director is available 24 hours, 365 days. No exceptions, no voicemail, no delays.",
                  "Every request is protected by a multi-jurisdictional NDA. Your name is never shared with any third party without explicit permission.",
                  "We maintain parallel networks so that if one route is unavailable, three others are already in motion.",
                  "Our average response time to any request is under four minutes, regardless of complexity.",
                  "We accept fewer than 200 active members globally, ensuring every client receives the full attention of our team.",
                  "There is no public membership application. Every member arrives by private invitation or personal referral.",
                ].map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 items-start border-b border-neutral-800 pb-4"
                  >
                    <span className="text-gold-50 font-mono text-xs md:text-sm font-medium">
                      <GsapScrambleText
                        text={`0${idx + 1}`}
                        scrambleCharacters="0123456789"
                        delay={idx * 0.1}
                      />
                    </span>
                    <p className="leading-relaxed">
                      <SplitReveal text={rule} delay={idx * 0.1} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Membership Section Dashboard */}
        <section
          id="membership"
          className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 z-20"
        >
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <GalleryTextReveal
              className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block"
              text="MEMBERSHIP"
            />
            <h2 className="text-3xl md:text-5xl font-serif font-light text-white tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
              <ScrambleText text="Three tiers. One standard." duration={500} />
            </h2>
            <p className="text-sm md:text-base font-light text-white leading-relaxed max-w-2xl mx-auto mt-4">
              <SplitReveal
                text="Regardless of tier, the word 'no' does not exist in our vocabulary. The tiers reflect depth of integration, not quality of service."
                delay={0.5}
                duration={0.8}
              />
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TIER 1 - CIPHER */}
            <div className="bg-white/[0.02] backdrop-blur-3xl p-8 md:p-10 border border-white/[0.08] hover:border-white/20 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] rounded-3xl">
              <div className="space-y-8">
                <div className="space-y-2 border-b border-neutral-800 pb-6">
                  <span className="text-[10px] font-mono tracking-widest text-white uppercase">
                    <GsapScrambleText text="TIER 01 / STAGE" duration={1.2} />
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-wide text-white">
                    <GalleryTextReveal
                      text="CIPHER"
                      delay={0}
                      duration={0.05}
                    />
                  </h3>
                  <p className="text-xs font-mono text-gold-50 tracking-wider">
                    <GsapScrambleText text="Foundation" duration={1.5} />
                  </p>
                  <p className="text-xs text-white font-sans italic mt-2">
                    <SplitReveal text="For those beginning their relationship with the impossible" />
                  </p>
                </div>

                <ul className="space-y-4 text-xs md:text-sm font-sans font-light text-white leading-relaxed">
                  {[
                    "Dedicated Illusion Director, 24/7 access",
                    "Global dining, travel & event management",
                    "Rare acquisition sourcing (fashion, watches, art)",
                    "Private aviation charter management",
                    "VIP access to Tier 1 global events",
                    "Household & personal affairs management",
                    "Emergency medical concierge & air ambulance",
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <Check size={14} className="text-gold-50 flex-shrink-0" />
                      <span className="w-full">
                        <SplitReveal text={item} delay={idx * 0.05} />
                      </span>
                    </li>
                  ))}
                  <li className="flex gap-2 items-center text-white">
                    <Check size={14} className="text-gold-50/30 flex-shrink-0" />
                    <span className="w-full">
                      <SplitReveal text="Quarterly curated experience surprises" delay={0.35} />
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-10">
                <button
                  onClick={() => handleTierEnquire("CIPHER")}
                  className="w-full py-4 text-center border border-gold-500/30 text-gold-50 text-xs font-mono tracking-widest uppercase hover:bg-gold-505 hover:bg-gold-500 hover:text-black cursor-pointer transition-all font-semibold"
                >
                  <GsapScrambleText text="Enquire CIPHER" duration={1.5} />
                </button>
              </div>
            </div>

            {/* TIER 2 - PHANTOM */}
            <div className="bg-white/[0.04] backdrop-blur-3xl p-8 md:p-10 border border-gold-500/40 hover:border-gold-500 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between shadow-[0_12px_40px_rgba(251,191,36,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative rounded-3xl">
              {/* Most Popular/Recommended badge */}
              <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-gold-500 text-black text-[9px] font-mono tracking-[0.25em] px-4 py-1.5 uppercase font-medium">
                <GsapScrambleText text="SIGNATURE STATUS" duration={1.5} />
              </div>

              <div className="space-y-8">
                <div className="space-y-2 border-b border-gold-500/30 pb-6">
                  <span className="text-[10px] font-mono tracking-widest text-gold-50 uppercase">
                    <GsapScrambleText text="TIER 02 / PRESTIGE" duration={1.2} />
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-wide text-white flex items-center gap-2">
                    <GalleryTextReveal
                      text="PHANTOM"
                      delay={0}
                      duration={0.05}
                    />{" "}
                    <Star size={16} className="text-gold-50 fill-gold-500" />
                  </h3>
                  <p className="text-xs font-mono text-gold-50 tracking-wider">
                    <GsapScrambleText text="Signature" duration={1.5} />
                  </p>
                  <p className="text-xs text-white font-sans italic mt-2">
                    <SplitReveal text="For those who require a life entirely managed at the highest level" />
                  </p>
                </div>

                <ul className="space-y-4 text-xs md:text-sm font-sans font-light text-white leading-relaxed">
                  <li className="flex gap-2 items-center font-medium text-white">
                    <Check size={14} className="text-gold-50 flex-shrink-0" />
                    <span className="w-full">
                      <SplitReveal text="Everything in Cipher, amplified" delay={0.0} />
                    </span>
                  </li>
                  {[
                    "Full estate & property management globally",
                    "Dedicated security & close-protection network",
                    "Private island & villa procurement",
                    "Superyacht charter & full crew management",
                    "Bespoke investment & art advisory",
                    "Diplomatic & government-level facilitation",
                    "Priority access to Illusion private summits",
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <Check size={14} className="text-gold-50 flex-shrink-0" />
                      <span className="w-full">
                        <SplitReveal text={item} delay={(idx + 1) * 0.05} />
                      </span>
                    </li>
                  ))}
                  <li className="flex gap-2 items-center text-white">
                    <Check size={14} className="text-gold-50/30 flex-shrink-0" />
                    <span className="w-full">
                      <SplitReveal text="Space & expedition experience management" delay={0.4} />
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-10">
                <button
                  onClick={() => handleTierEnquire("PHANTOM")}
                  className="w-full py-4 text-center bg-gold-500 text-black text-xs font-mono tracking-widest uppercase hover:bg-gold-600 cursor-pointer shadow-md transition-all font-semibold"
                >
                  <GsapScrambleText text="Enquire PHANTOM" duration={1.5} />
                </button>
              </div>
            </div>

            {/* TIER 3 - SOVEREIGN */}
            <div className="bg-white/[0.02] backdrop-blur-3xl p-8 md:p-10 border border-white/[0.08] hover:border-white/20 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] rounded-3xl">
              <div className="space-y-8">
                <div className="space-y-2 border-b border-neutral-800 pb-6">
                  <span className="text-[10px] font-mono tracking-widest text-white uppercase">
                    <GsapScrambleText text="TIER 03 / ZENITH" duration={1.2} />
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-wide text-white block">
                    <GalleryTextReveal
                      text="SOVEREIGN"
                      delay={0}
                      duration={0.05}
                    />
                  </h3>
                  <p className="text-xs font-mono text-gold-50 tracking-wider">
                    <GsapScrambleText text="Ultimate Legacy" duration={1.5} />
                  </p>
                  <p className="text-xs text-white font-sans italic mt-2">
                    <SplitReveal text="Total life management. Offered to twelve individuals worldwide." />
                  </p>
                </div>

                <ul className="space-y-4 text-xs md:text-sm font-sans font-light text-white leading-relaxed">
                  <li className="flex gap-2 items-center font-medium text-gold-50">
                    <Check size={14} className="text-gold-50 flex-shrink-0" />
                    <span className="w-full">
                      <SplitReveal text="Everything in Phantom, without ceiling" delay={0.0} />
                    </span>
                  </li>
                  {[
                    "Embedded Director who travels with you",
                    "A dedicated team of eight specialists",
                    "Legacy & generational wealth strategy",
                    "Unlimited classified access & facilitation",
                    "Family office integration & management",
                    "Private intelligence briefings & advisory",
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-center">
                      <Check size={14} className="text-gold-50 flex-shrink-0" />
                      <span className="w-full">
                        <SplitReveal text={item} delay={(idx + 1) * 0.05} />
                      </span>
                    </li>
                  ))}
                  <li className="flex gap-2 items-center text-gold-50">
                    <Check size={14} className="text-gold-50 flex-shrink-0" />
                    <span className="w-full">
                      <SplitReveal text="A permanent suite in our global safe houses" delay={0.35} />
                    </span>
                  </li>
                  <li className="font-mono text-white text-[10px] pt-2 italic">
                    <SplitReveal text="* Available to twelve members. Currently: three positions open." delay={0.4} />
                  </li>
                </ul>
              </div>

              <div className="pt-10">
                <button
                  onClick={() => handleTierEnquire("SOVEREIGN")}
                  className="w-full py-4 text-center border border-gold-400 text-gold-50 text-xs font-mono tracking-widest uppercase hover:bg-gold-500 hover:text-white cursor-pointer transition-all"
                >
                  <GsapScrambleText text="Enquire SOVEREIGN" duration={1.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section Layer */}
        <section
          id="testimonials"
          className="relative max-w-7xl mx-auto px-6 py-24 z-20"
        >
          <div className="bg-white/[0.02] p-8 md:p-16 border border-white/[0.08] rounded-3xl max-w-5xl mx-auto shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-6 left-12 pointer-events-none">
              <span className="text-9xl font-serif text-gold-50/10 font-black">
                “
              </span>
            </div>

            <div className="space-y-6 text-center max-w-3xl mx-auto">
              <GalleryTextReveal
                className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block"
                text="IN THEIR WORDS"
              />
              <h2 className="text-lg md:text-2xl font-serif text-white italic min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
                <ScrambleText
                  text="What our members never say publicly."
                  delay={100}
                  duration={800}
                />
              </h2>
              <p className="text-[10px] text-white tracking-wider font-mono min-h-[28px] md:min-h-[20px]">
                <TypedText
                  sequence={[
                    "Testimonials shared with consent. Identities protected by covenant.",
                    2000,
                  ]}
                  cursor={false}
                  repeat={1}
                />
              </p>

              <div className="h-[1px] w-20 bg-gold-500/30 mx-auto"></div>

              {/* Quotes container */}
              <div className="min-h-[160px] md:min-h-[120px] flex items-center justify-center">
                <div key={testimonialIndex} className="space-y-6">
                  <p className="text-lg sm:text-xl md:text-2xl font-serif font-light text-white leading-relaxed italic max-w-4xl mx-auto">
                    "
                    <SplitReveal
                      text={TESTIMONIALS[testimonialIndex].quote}
                      delay={0}
                      duration={0.05}
                    />
                    "
                  </p>
                  <div className="text-xs font-mono tracking-widest text-white uppercase">
                    <SplitReveal
                      text={`— ${TESTIMONIALS[testimonialIndex].author}, ${TESTIMONIALS[testimonialIndex].location}`}
                      delay={0.02}
                      duration={0.05}
                    />
                  </div>
                </div>
              </div>

              {/* Slider Dots */}
              <div className="flex items-center justify-center gap-3 pt-6">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIndex(idx)}
                    className={`h-2 rounded-full cursor-pointer transition-all ${
                      idx === testimonialIndex
                        ? "w-8 bg-gold-450 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section Box */}
        <section
          id="contact"
          className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 z-20"
        >
          <div className="max-w-4xl mx-auto bg-white/[0.02] p-8 md:p-14 border border-white/[0.08] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl">
            <div className="text-center space-y-4 mb-12">
              <GalleryTextReveal
                className="text-xs font-mono tracking-[0.3em] uppercase text-gold-50 block"
                text="BEGIN YOUR JOURNEY"
              />
              <h2 className="text-3xl md:text-5xl font-serif font-light text-white tracking-tight min-h-[4em] md:min-h-[2em] flex items-center justify-center text-center">
                <ScrambleText
                  text="Request an introduction."
                  delay={100}
                  duration={800}
                />
              </h2>
              <p className="text-sm font-sans font-light text-white max-w-2xl mx-auto leading-relaxed mt-4">
                <SplitReveal
                  text="Membership at Illusion is by private introduction or curated application. Every submission is reviewed personally. We respond to every enquiry within 24 hours — even if the answer is simply that we are not yet the right moment for one another."
                  delay={0}
                  duration={0.05}
                />
              </p>
              <p className="text-xs font-mono text-gold-50 italic mt-4">
                <StylishTypewriter
                  text="We accept fewer than 200 active members globally. At this time, limited security and tier positions remain."
                  delay={0.8}
                />
              </p>
            </div>

            {isSubmitted ? (
              <div className="bg-white/[0.02] border border-gold-500/30 p-8 text-center space-y-6 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto text-black">
                  <Check size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-white flex justify-center w-full">
                    <SplitReveal text="Submission Received Under NDA" />
                  </h3>
                  <div className="text-xs font-mono text-white uppercase tracking-widest pt-1 flex justify-center items-center gap-2 w-full">
                    <GsapScrambleText text="Receipt Hash:" />{" "}
                    <ScrambleText
                      text={Math.random()
                        .toString(36)
                        .substring(3, 10)
                        .toUpperCase()}
                      duration={1500}
                    />
                  </div>
                  <div className="text-sm text-white font-sans font-light max-w-md mx-auto leading-relaxed pt-2 text-center">
                    <StylishTypewriter text="Thank you. Your dossier is now secured. An Illusion Director will establish contact through your preferred secure method within 24 hours. Keep this correspondence confidential." />
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        mobile: "",
                        interest: selectedTier,
                        notes: "",
                      });
                    }}
                    className="px-6 py-2.5 bg-gold-500 text-black text-xs font-mono tracking-widest uppercase cursor-pointer hover:bg-gold-600 font-semibold"
                  >
                    Submit New Dossier
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleFormSubmit}
                className="space-y-6 text-xs md:text-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-white uppercase tracking-widest">
                      <ScrambleText text="First Name" />
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="e.g., Charles"
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-white uppercase tracking-widest">
                      <ScrambleText text="Last Name" />
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="e.g., Sterling"
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
                      <Mail size={12} className="text-gold-50" />
                      <ScrambleText text="Email Address" />
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="secure@example.com"
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
                      <Smartphone size={12} className="text-gold-50" />
                      <ScrambleText text="Mobile (incl. code)" />
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="+1 (415) 555-0199"
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-white uppercase tracking-widest">
                    <TypedText
                      sequence={["Select Membership Interest", 1000]}
                      cursor={false}
                    />
                  </label>
                  <select
                    value={formData.interest || selectedTier}
                    onChange={(e) => {
                      setFormData({ ...formData, interest: e.target.value });
                      setSelectedTier(e.target.value);
                    }}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans font-mono uppercase tracking-wider text-xs"
                  >
                    <option
                      value="Cipher — Foundation"
                      className="bg-neutral-950 text-white"
                    >
                      Cipher — Foundation Tier
                    </option>
                    <option
                      value="Phantom — Signature"
                      className="bg-neutral-950 text-white"
                    >
                      Phantom — Signature Tier
                    </option>
                    <option
                      value="Sovereign — Ultimate"
                      className="bg-neutral-950 text-white"
                    >
                      Sovereign — Ultimate Tier
                    </option>
                    <option
                      value="I am not yet certain"
                      className="bg-neutral-950 text-white"
                    >
                      I am not yet certain
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-white uppercase tracking-widest h-4">
                    <TypedText
                      sequence={["Tell us what you are looking for...", 3000]}
                      cursor={true}
                    />
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Share as much or as little as you wish. Everything remains completely confidential under strict NDA rules."
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] focus:border-white/30 focus:outline-none focus:bg-white/[0.04] backdrop-blur-3xl rounded-xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] shadow-[inset_0_0_1px_rgba(255,255,255,0.1)] transition-all text-white text-sans text-xs md:text-sm placeholder:italic"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gold-500 text-black hover:bg-gold-600 text-xs font-mono tracking-widest uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 rounded-none disabled:opacity-75 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <ScrambleText text="Securing Connection..." />
                      </>
                    ) : (
                      <>
                        <ScrambleText text="Submit Introduction" />{" "}
                        <Send size={12} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Footer Container */}
        <footer className="relative bg-white/[0.02] backdrop-blur-3xl text-white py-16 md:py-24 border-t border-white/[0.08] z-20 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-4 space-y-4">
                <span className="text-xl md:text-2xl font-display tracking-[0.25em] text-white block">
                  <GsapScrambleText text="ILLUSION GLOBAL" duration={1.5} />
                </span>
                <p className="text-xs font-serif italic text-gold-50 leading-relaxed max-w-sm">
                  <SplitReveal text="Everything you can only dream of, we will provide — with absolute discretion, and all." />
                </p>
                <div className="flex items-center gap-1.5 pt-2 text-[10px] font-mono whitespace-nowrap bg-gold-950/40 text-gold-50 inline-flex px-3 py-1 text-center font-medium">
                  <Lock size={10} /> <GsapScrambleText text="PARALLEL SECURITIES ACTIVE" />
                </div>
              </div>

              <div className="md:col-span-3 space-y-4">
                <h4 className="text-xs font-mono tracking-widest text-white uppercase">
                  <GsapScrambleText text="Services" />
                </h4>
                <ul className="space-y-2 text-xs font-sans font-light text-white">
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Lifestyle & Concierge
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Private Aviation
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Rare Acquisitions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Global Events
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Estate & Wealth Advisory
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("services")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Health & Longevity
                    </button>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-3 space-y-4">
                <h4 className="text-xs font-mono tracking-widest text-white uppercase">
                  <GsapScrambleText text="Membership" />
                </h4>
                <ul className="space-y-2 text-xs font-sans font-light text-white">
                  <li>
                    <button
                      onClick={() => handleTierEnquire("CIPHER")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Cipher Tier
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleTierEnquire("PHANTOM")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Phantom Tier
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleTierEnquire("SOVEREIGN")}
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Sovereign Tier
                    </button>
                  </li>
                  <li>
                    <span className="text-neutral-400 block">
                      Corporate Accounts
                    </span>
                  </li>
                  <li>
                    <span className="text-neutral-400 block">
                      Bespoke Gifting
                    </span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-mono tracking-widest text-white uppercase">
                  <GsapScrambleText text="Connect" />
                </h4>
                <ul className="space-y-2 text-xs font-sans font-light text-white">
                  <li>
                    <button
                      onClick={() =>
                        console.log("Instagram: Not yet implemented")
                      }
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Instagram
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        console.log("LinkedIn: Not yet implemented")
                      }
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      LinkedIn
                    </button>
                  </li>
                  <li>
                    <span className="cursor-not-allowed text-neutral-400 flex items-center justify-start gap-1">
                      Private Newsroom <Lock size={10} />
                    </span>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        console.log("Press Enquiries: Not yet implemented")
                      }
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Press Enquiries
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        console.log("Referral Programme: Not yet implemented")
                      }
                      className="hover:text-gold-50 transition-colors cursor-pointer text-left"
                    >
                      Referral Programme
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-12 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-mono text-neutral-400 uppercase tracking-widest text-center md:text-left">
              <div className="space-y-1">
                <p>
                  <SplitReveal text="© 2026 Illusion Global. All rights reserved. All client information protected under strict NDA." />
                </p>
                <p className="text-[10px] text-neutral-500 font-light">
                  Last Secure Authentication: 2026-05-20 UTC
                </p>
              </div>
              <div className="flex gap-6">
                <span className="cursor-not-allowed hover:text-gold-50 transition-colors">
                  Privacy
                </span>
                <span className="cursor-not-allowed hover:text-gold-50 transition-colors">
                  Discretion Policy
                </span>
                <span className="cursor-not-allowed hover:text-gold-50 transition-colors">
                  Terms
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative rounded-3xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-2 mb-8">
              <GalleryTextReveal
                className="text-xl font-serif text-white block"
                text={
                  authMode === "login"
                    ? "CLIENT PORTAL LOGIN"
                    : "REQUEST CIPHER ACCESS"
                }
              />
              <p className="text-xs font-mono tracking-widest uppercase text-gold-50">
                <GsapScrambleText text="Secure Authentication" duration={1.5} />
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs font-mono tracking-wide text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-white uppercase tracking-widest">
                  <GsapScrambleText text="Client Email" duration={1.2} />
                </label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-neutral-800 focus:border-gold-500 focus:outline-none text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-white uppercase tracking-widest">
                  <GsapScrambleText text="Passphrase" duration={1.2} />
                </label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-neutral-800 focus:border-gold-500 focus:outline-none text-white text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 mt-4 bg-gold-500 text-black hover:bg-gold-600 text-xs font-mono tracking-widest uppercase disabled:opacity-50 transition-colors font-semibold shadow-lg"
              >
                {authLoading
                  ? "Authenticating..."
                  : authMode === "login"
                    ? "Initiate Session"
                    : "Establish Profile"}
              </button>
            </form>

            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-neutral-900 px-2 text-white">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full py-3 mt-4 bg-white/[0.04] hover:bg-white/20 text-white border border-white/[0.08] text-xs font-mono tracking-widest uppercase disabled:opacity-50 transition-colors flex items-center justify-center gap-3 backdrop-blur-md rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-xs font-mono tracking-wide text-white hover:text-gold-50 transition-colors underline decoration-neutral-800 underline-offset-4"
              >
                {authMode === "login"
                  ? "Apply for new credentials"
                  : "Return to existing session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ReactLenis>
  );
}
