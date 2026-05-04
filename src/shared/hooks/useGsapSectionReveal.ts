import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealTarget = {
  /** Selector GSAP, vd. ".section2-title" */
  selector: string;
  /** start của ScrollTrigger, vd. "top 80%" */
  start: string;
};

/** Mục tiêu reveal mặc định — homepage section 2 */
export const HOMEPAGE_SECTION2_REVEAL_TARGETS: RevealTarget[] = [
  { selector: ".section2-title", start: "top 80%" },
  { selector: ".section2-slide", start: "top 60%" },
];

/**
 * GSAP + ScrollTrigger reveal cho section (homepage section2 titles + slides).
 */
export function useGsapSectionReveal(
  triggerRef: RefObject<HTMLElement | null>,
  targets: RevealTarget[] = HOMEPAGE_SECTION2_REVEAL_TARGETS,
) {
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || targets.length === 0) return;

    const ctx = gsap.context(() => {
      for (const { selector, start } of targets) {
        gsap.fromTo(
          selector,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 3,
            ease: "power3.out",
            scrollTrigger: {
              trigger,
              start,
              toggleActions: "play none none none",
            },
          },
        );
      }
    }, trigger);

    return () => {
      ctx.revert();
    };
    // targets mặc định là hằng module — ref đủ để khởi tạo lại khi section mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRef]);
}
