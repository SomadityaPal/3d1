import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const LoadingScreen = ({ isLoaded = false, onComplete }) => {
  const containerRef = useRef(null);
  const tlRef = useRef(null);
  const isLoadedRef = useRef(isLoaded);

  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);

  useGSAP(() => {
    tlRef.current = gsap.timeline({ 
      paused: false,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    
    // Animate the main lines
    tlRef.current.to(".loading-line", {
      scaleY: 1,
      duration: 1.5,
      ease: "expo.inOut",
      stagger: 0.1
    })
    // Reveal text
    .to(".loading-char", {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateZ: 0,
      filter: "blur(0px) brightness(100%)",
      duration: 1.5,
      ease: "expo.out",
      stagger: {
        amount: 0.2,
        from: "center" // explode from center
      }
    }, "-=0.8")
    .to(".loading-subtitle", {
      y: 0,
      opacity: 1,
      letterSpacing: "0.8em",
      scale: 1,
      filter: "blur(0px)",
      duration: 1.0,
      ease: "elastic.out(1, 0.3)"
    }, "-=1.2")
    .addLabel("hold")
    // Violent glitch in the middle
    .to(".loading-char", {
      x: () => (Math.random() - 0.5) * 40,
      y: () => (Math.random() - 0.5) * 40,
      skewX: () => (Math.random() - 0.5) * 60,
      opacity: 0.5,
      filter: "blur(4px) contrast(300%)",
      duration: 0.1,
      yoyo: true,
      repeat: 3,
      ease: "steps(1)"
    }, "+=0.2")
    .call(() => {
      // Check if we need to hold here
      if (!isLoadedRef.current) {
        tlRef.current.pause();
      }
    })
    // Keep it there for a bit, then violently explode out
    .to(".loading-char, .loading-subtitle", {
      scale: 3,
      opacity: 0,
      z: 500,
      filter: "blur(30px) brightness(400%) contrast(300%)",
      duration: 0.8,
      ease: "power4.in",
      stagger: {
        amount: 0.1,
        from: "center"
      },
    })
    .to(".loading-line", {
      scaleY: 0,
      duration: 1,
      ease: "expo.inOut",
      stagger: 0.1,
      transformOrigin: "top"
    }, "-=0.5")
    .to(containerRef.current, {
      opacity: 0,
      filter: "blur(10px)",
      duration: 1.5,
      ease: "power2.inOut"
    }, "-=0.5");
    
  }, { scope: containerRef });

  useEffect(() => {
    if (isLoaded && tlRef.current) {
      tlRef.current.play(); // Resume if it was paused
    }
  }, [isLoaded]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#020202] flex items-center justify-center pointer-events-none overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center gap-12 sm:gap-24 opacity-20">
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div 
            key={i} 
            className="loading-line w-[1px] h-[120vh] bg-neutral-100 transform origin-bottom scale-y-0"
          ></div>
        ))}
      </div>
      
      <div className="relative z-10 w-full flex flex-col items-center justify-center overflow-hidden">
        <h1 className="text-4xl sm:text-6xl md:text-[8vw] font-serif font-light text-white tracking-tight uppercase px-4 text-center flex justify-center perspective-[1000px]">
          {["I", "L", "L", "U", "S", "I", "O", "N"].map((char, i) => (
            <span key={i} className="loading-char inline-block opacity-0 transform translate-y-[100px] rotate-x-[45deg] scale-[1.5] blur-[20px] brightness-[200%]">{char}</span>
          ))}
        </h1>
        <div className="overflow-hidden mt-6">
          <p className="loading-subtitle text-[10px] sm:text-xs font-mono tracking-[0.2em] text-gold-50 uppercase transform translate-y-12 blur-[10px] opacity-0 mix-blend-screen">
            Absolute Conceirge
          </p>
        </div>
      </div>
    </div>
  );
};

