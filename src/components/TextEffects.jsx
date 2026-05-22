import React, { useState, useEffect, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import baffle from "baffle";
import Typed from "typed.js";

// Custom useInView hook
function useInView(ref, options = { once: true, margin: "0px" }) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (options.once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!options.once) {
          setIsInView(false);
        }
      },
      { rootMargin: options.margin },
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options.margin, options.once]);

  return isInView;
}

// A brutally extreme GSAP reveal that completely obliterates standard animation constraints
export const GalleryTextReveal = ({
  text,
  className = "",
  delay = 0,
  duration = 2.0,
  stagger = 0.05,
  splitBy = "char", // Force char by default for maximum chaos
}) => {
  const container = useRef(null);
  const isInView = useInView(container, { once: true, margin: "-5%" });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isInView]);

  const items = splitBy === "word" ? text.split(" ") : Array.from(text);

  useGSAP(() => {
    if (!shouldAnimate) return;
    const elements = container.current.querySelectorAll(".gallery-reveal-item");

    // Smooth, hardware-accelerated set-up for fluid interpolation
    gsap.set(elements, {
      yPercent: 120,
      opacity: 0,
      willChange: "transform, opacity",
    });

    gsap.to(elements, {
      yPercent: 0,
      opacity: 1,
      duration: duration,
      ease: "power3.out", // fluid continuous timing curve
      stagger: {
        each: stagger,
        from: "start",
      },
      delay: delay,
      onComplete: () => {
        // Clean up properties to prevent layout compositing jitter
        gsap.set(elements, { clearProps: "willChange,transform" });
      },
    });
  }, [shouldAnimate, duration, stagger, delay]);

  return (
    <span
      ref={container}
      className={`inline-block ${className}`}
      style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ perspective: "1000px" }}
        >
          <span
            className="gallery-reveal-item inline-block"
            style={{ paddingRight: splitBy === "word" ? "0.22em" : "0" }}
          >
            {item === " " ? "\u00A0" : item}
          </span>
        </span>
      ))}
    </span>
  );
};

// Baffle / Scramble Text Effect utilizing Baffle.js for extreme aggressive obfuscation
export const ScrambleText = ({
  text,
  className = "",
  scrambleCharacters = "█▓▒░<>/?\\|{}[]!@#$%^&*~+=-_01",
  duration = 800,
  delay = 0,
}) => {
  const scrambleRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView || !scrambleRef.current) return;

    const b = baffle(scrambleRef.current, {
      characters: scrambleCharacters,
      speed: 30,
    });

    // Start baffling immediately
    b.start();

    const initialDelay = setTimeout(() => {
      b.reveal(duration, delay);
    }, delay);

    return () => {
      clearTimeout(initialDelay);
      b.stop();
    };
  }, [isInView, text, duration, delay, scrambleCharacters]);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      <span className="opacity-0 pointer-events-none">{text}</span>
      <span ref={scrambleRef} className="absolute inset-0">
        {text}
      </span>
    </span>
  );
};

export const AutoBaffleText = ({
  text,
  className = "",
  scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  duration = 800,
  interval = 5000,
}) => {
  const scrambleRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView || !scrambleRef.current) return;

    const b = baffle(scrambleRef.current, {
      characters: scrambleCharacters,
      speed: 30,
    });

    const triggerBaffle = () => {
      b.start();
      setTimeout(() => {
        b.reveal(duration);
      }, duration / 2);
    };

    // Initial baffle is optional, let's just do it on interval
    const intervalId = setInterval(triggerBaffle, interval);

    return () => {
      clearInterval(intervalId);
      b.stop();
    };
  }, [isInView, text, duration, interval, scrambleCharacters]);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      <span className="opacity-0 pointer-events-none">{text}</span>
      <span ref={scrambleRef} className="absolute inset-0">
        {text}
      </span>
    </span>
  );
};
export const GsapScrambleText = ({
  text,
  className = "",
  scrambleCharacters = "█▓▒░<>/?\\|{}[]!@#$%^&*~+=-_01ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  duration = 1.2,
  delay = 0,
}) => {
  const containerRef = useRef(null);
  const charsRef = useRef([]);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isInView]);

  useGSAP(() => {
    const chars = charsRef.current;
    if (!chars || chars.length === 0) return;

    if (!shouldAnimate) {
      // Reset to original hidden state when out of view
      for (let i = 0; i < text.length; i++) {
        const el = chars[i];
        if (el) {
          el.textContent = text[i];
          el.style.opacity = "0";
        }
      }
      return;
    }

    const obj = { p: 0 };
    gsap.to(obj, {
      p: 1,
      duration: duration,
      delay: Math.max(0.1, delay),
      ease: "power2.out", // smooth deceleration
      onUpdate: () => {
        const progress = obj.p;
        const revealCount = Math.floor(text.length * progress);
        const tailLength = 4; // number of scrambled characters ahead

        for (let i = 0; i < text.length; i++) {
          const el = chars[i];
          if (!el) continue;

          if (text[i] === " ") {
            el.textContent = " ";
            el.style.opacity = "1";
            continue;
          }

          if (i < revealCount) {
            // Decoded character
            el.textContent = text[i];
            el.style.opacity = "1";
          } else if (i < revealCount + tailLength) {
            // Scrambled tail
            el.textContent =
              scrambleCharacters[
                Math.floor(Math.random() * scrambleCharacters.length)
              ];
            el.style.opacity = "0.8"; // slightly faded
          } else {
            // Unrevealed character (keep it identical but hidden for perfect layout)
            el.textContent = text[i];
            el.style.opacity = "0";
          }
        }
      },
      onComplete: () => {
        for (let i = 0; i < text.length; i++) {
          const el = chars[i];
          if (el) {
            el.textContent = text[i];
            el.style.opacity = "1";
          }
        }
      },
    });
  }, [shouldAnimate, duration, delay, text, scrambleCharacters]);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      <span className="opacity-0 pointer-events-none">{text}</span>
      <span className="absolute inset-0 top-0 left-0">
        {text.split("").map((char, index) => (
          <span
            key={index}
            ref={(el) => (charsRef.current[index] = el)}
            className="opacity-0 whitespace-pre-wrap"
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
};

// Hover Scramble Text Effect utilizing Baffle.js
export const HoverScrambleText = ({
  text,
  className = "",
  scrambleCharacters = "█▓▒░<>/?\\|{}[]!@#$%^&*~+=-_01",
  duration = 400,
}) => {
  const scrambleRef = useRef(null);
  const containerRef = useRef(null);
  const bRef = useRef(null);

  useEffect(() => {
    if (!scrambleRef.current) return;
    bRef.current = baffle(scrambleRef.current, {
      characters: scrambleCharacters,
      speed: 40,
    });

    return () => {
      bRef.current?.stop();
    };
  }, [scrambleCharacters]);

  const handleMouseEnter = () => {
    if (bRef.current) {
      bRef.current.start();
      bRef.current.reveal(duration);
    }
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      <span className="opacity-0 pointer-events-none">{text}</span>
      <span ref={scrambleRef} className="absolute inset-0">
        {text}
      </span>
    </span>
  );
};

// Extravagant GSAP Staggered word reveal - violently explosive and glitchy
export const SplitReveal = ({
  text,
  className = "",
  delay = 0,
  duration = 1.0,
}) => {
  const words = text.split(" ");
  const container = useRef(null);

  const isInView = useInView(container, { once: true, margin: "-10%" });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isInView]);

  useGSAP(() => {
    if (!shouldAnimate) return;
    const items = container.current.querySelectorAll(".reveal-word-inner");

    // Smooth, hardware-accelerated set-up for fluid interpolation
    gsap.set(items, {
      yPercent: 120,
      opacity: 0,
      willChange: "transform, opacity",
    });

    gsap.to(items, {
      yPercent: 0,
      opacity: 1,
      duration: duration,
      ease: "power3.out", // fluid continuous timing curve
      stagger: 0.05,
      delay: delay,
      onComplete: () => {
        // Clean up properties to prevent layout compositing jitter
        gsap.set(items, { clearProps: "willChange,transform" });
      },
    });
  }, [shouldAnimate, duration, delay]);

  return (
    <span
      ref={container}
      className={`inline-block ${className}`}
      style={{ perspective: "800px" }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden mr-[0.25em] align-baseline"
        >
          <span className="reveal-word-inner inline-block opacity-0">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

// Aggressive Typed.js implementation
export const TypedText = ({
  sequence,
  className = "",
  wrapper = "span",
  cursor = true,
  repeat = 0,
}) => {
  const el = useRef(null);
  const typed = useRef(null);
  const isInView = useInView(el, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView || !el.current) return;

    const strings = sequence.filter((s) => typeof s === "string");

    typed.current = new Typed(el.current, {
      strings: strings,
      typeSpeed: 30,
      backSpeed: 50,
      backDelay: 2000,
      loop: repeat > 0 || repeat === Infinity,
      showCursor: cursor,
      cursorChar: "▋",
      autoInsertCss: true,
    });

    return () => {
      typed.current?.destroy();
    };
  }, [isInView, sequence, repeat, cursor]);

  return <span ref={el} className={className} />;
};

// Actual Cinematic Typewriter - brutally aggressive
export const StylishTypewriter = ({
  text,
  className = "",
  delay = 0,
  typingSpeed = 20,
}) => {
  const el = useRef(null);
  const typed = useRef(null);
  const isInView = useInView(el, { once: true, margin: "-10%" });

  useEffect(() => {
    if (!isInView || !el.current) return;

    typed.current = new Typed(el.current, {
      strings: [text],
      typeSpeed: typingSpeed,
      startDelay: delay * 1000,
      showCursor: true,
      cursorChar: "█",
      autoInsertCss: true,
      onComplete: (self) => {
        // Aggressive flash when done
        gsap.to(self.cursor, {
          opacity: 0,
          duration: 0.1,
          repeat: -1,
          yoyo: true,
          ease: "steps(1)",
        });

        gsap.fromTo(
          el.current,
          { textShadow: "0 0 10px rgba(251,191,36,1)" },
          {
            textShadow: "0 0 0px rgba(251,191,36,0)",
            duration: 0.5,
            ease: "power2.out",
          },
        );
      },
    });

    return () => {
      typed.current?.destroy();
    };
  }, [isInView, delay, text, typingSpeed]);

  return <span ref={el} className={`inline-block ${className}`} />;
};
