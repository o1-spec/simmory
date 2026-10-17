import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SimmoryIntro } from "@/components/branding/simmory-intro";

describe("SimmoryIntro Component", () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
  });

  it("renders the 3D-inspired chef hat SVG, wordmark, tagline, and skip intro button", () => {
    const html = renderToString(<SimmoryIntro forcePlay={true} />);

    // Brand wordmark and tagline
    expect(html).toContain("simmory");
    expect(html).toContain("The way they made it, remembered.");

    // Accessible dialog role and label
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Welcome to Simmory"');

    // Skip intro button with keyboard indicator
    expect(html).toContain("Skip Intro");
    expect(html).toContain("ESC");

    // Colors matching brand palette
    expect(html).toContain("#2E4742"); // Forest green
    expect(html).toContain("#F5B726"); // Saffron ochre
    expect(html).toContain("#F2F2EB"); // Warm cream backdrop

    // SVG elements: Crown, Band, Stitches, Steam
    expect(html).toContain("intro-hat-crown-stroke");
    expect(html).toContain("intro-hat-band-stroke");
    expect(html).toContain("intro-hat-creases-stroke");
    expect(html).toContain("intro-hat-fills");
    expect(html).toContain("intro-steam-group");
  });

  it("includes 3D perspective styling on stage and transform containers", () => {
    const html = renderToString(<SimmoryIntro forcePlay={true} />);

    expect(html).toContain("perspective:1000px");
    expect(html).toContain("transform-style:preserve-3d");
  });

  it("renders within a fixed z-[10000] viewport overlay", () => {
    const html = renderToString(<SimmoryIntro forcePlay={true} />);

    expect(html).toContain("fixed inset-0 z-[10000]");
  });
});
