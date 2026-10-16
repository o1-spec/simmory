import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { InitialLoader } from "@/components/ui/initial-loader";
import Loading from "@/app/loading";

describe("InitialLoader Component", () => {
  it("renders the chef hat SVG, wordmark, and tagline", () => {
    const html = renderToString(<InitialLoader fullscreen={true} />);

    // Brand and tagline
    expect(html).toContain("simmory.");
    expect(html).toContain("The way they made it, remembered.");

    // Accessible status role
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Forest green and ochre accent colors
    expect(html).toContain("#2E4742");
    expect(html).toContain("#F5B726");

    // Stroke animation classes
    expect(html).toContain("simmory-hat-stroke-crown");
    expect(html).toContain("simmory-hat-stroke-band");
    expect(html).toContain("simmory-ochre-accent");
    expect(html).toContain("simmory-hat-settle");

    // Three loading dots
    expect(html).toContain("simmory-loader-dot-1");
    expect(html).toContain("simmory-loader-dot-2");
    expect(html).toContain("simmory-loader-dot-3");
  });

  it("supports inline / non-fullscreen mode", () => {
    const html = renderToString(<InitialLoader fullscreen={false} className="custom-test-loader" />);

    expect(html).toContain("custom-test-loader");
    expect(html).not.toContain("fixed inset-0");
  });

  it("loading.tsx root boundary renders the initial loader fullscreen", () => {
    const html = renderToString(<Loading />);

    expect(html).toContain("simmory.");
    expect(html).toContain("fixed inset-0");
    expect(html).toContain("bg-[#F2F2EB]");
  });
});
