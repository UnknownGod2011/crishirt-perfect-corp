import React, { useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignState } from "../store/AppContext";
import { APPAREL_OPTIONS, getApparelConfig } from "../config/apparel";

interface TShirtMockupProps {
  color: string;
  design?: string | null;
  apparelType?: string;
  material: string;
  size: string;
  side?: "front" | "back";
  onSideSwitch?: (side: "front" | "back") => void;
  onApparelTypeChange?: (type: string) => void;
  onMaterialChange?: (material: string) => void;
  onSizeChange?: (size: string) => void;
}

const isWhite = (color: string) => color.toLowerCase() === "#ffffff" || color === "rgb(255, 255, 255)";

const TShirtMockup: React.FC<TShirtMockupProps> = ({
  color,
  design,
  apparelType = "tshirt",
  material,
  size,
  side = "front",
  onSideSwitch,
  onApparelTypeChange,
  onMaterialChange,
  onSizeChange,
}) => {
  const apparel = getApparelConfig(apparelType);
  const baseMockup = side === "front" ? apparel.assets.front : apparel.assets.back;
  const { currentAlignment, updateAlignment } = useDesignState();
  const [isSwipping, setIsSwipping] = useState(false);
  const rotateRef = useRef<HTMLDivElement | null>(null);

  const getSizeScale = () => {
    switch (size) {
      case "XS": return "scale-75";
      case "S": return "scale-90";
      case "M": return "scale-100";
      case "L": return "scale-110";
      case "XL": return "scale-125";
      case "XXL": return "scale-140";
      case "3XL": return "scale-150";
      default: return "scale-100";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const box = rotateRef.current?.getBoundingClientRect();
    if (!box) return;

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const startRotation = currentAlignment.rotation;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentAngle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX,
      );
      updateAlignment({
        ...currentAlignment,
        rotation: startRotation + (currentAngle - startAngle) * (180 / Math.PI),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const switchSide = (nextSide: "front" | "back") => {
    setIsSwipping(true);
    setTimeout(() => {
      onSideSwitch?.(nextSide);
      setTimeout(() => setIsSwipping(false), 200);
    }, 100);
  };

  const maskStyle = {
    maskImage: `url(${baseMockup})`,
    WebkitMaskImage: `url(${baseMockup})`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  } as React.CSSProperties;

  return (
    <div className="flex h-full flex-col items-center bg-white p-4">
      <div className="relative z-50 mt-2 mb-1 flex flex-wrap items-center justify-center gap-3">
        <select
          value={apparel.id}
          onChange={(e) => onApparelTypeChange?.(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none"
        >
          {APPAREL_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>

        <select
          value={material}
          onChange={(e) => onMaterialChange?.(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none"
        >
          {apparel.materials.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          value={size}
          onChange={(e) => onSizeChange?.(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none"
        >
          {apparel.sizes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => switchSide(side === "front" ? "back" : "front")}
          className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          {side === "front" ? "Back" : "Front"}
        </button>
      </div>

      <div
        className={cn("relative origin-center transform bg-transparent transition-all duration-500", getSizeScale())}
        style={{
          width: 560,
          height: 700,
          marginTop: "-120px",
          marginBottom: 0,
          paddingTop: 0,
          backgroundColor: "transparent",
        }}
      >
        {onSideSwitch && (
          <>
            {side === "back" && (
              <button
                type="button"
                onClick={() => switchSide("front")}
                className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-gray-200 bg-white/80 p-2 shadow-lg transition-all hover:scale-110 hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
            )}
            {side === "front" && (
              <button
                type="button"
                onClick={() => switchSide("back")}
                className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-gray-200 bg-white/80 p-2 shadow-lg transition-all hover:scale-110 hover:bg-white"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            )}
          </>
        )}

        <div className={`absolute inset-0 bg-transparent transition-transform duration-200 ease-out ${isSwipping ? "translate-x-2 opacity-90" : "translate-x-0 opacity-100"}`}>
          <img
            src={baseMockup}
            alt={`${apparel.label} ${side}`}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
            draggable={false}
          />

          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              ...maskStyle,
              backgroundColor: color,
              mixBlendMode: "multiply",
              opacity: isWhite(color) ? 0.05 : 0.88,
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 z-[21]"
            style={{
              ...maskStyle,
              backgroundColor: isWhite(color) ? "#f0f0f0" : color,
              mixBlendMode: "soft-light",
              opacity: 0.25,
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 z-[22]"
            style={{
              ...maskStyle,
              background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.04) 0%, transparent 50%)",
              mixBlendMode: "overlay",
              opacity: 0.4,
            }}
          />

          {design && (
            <Rnd
              bounds="parent"
              size={{ width: currentAlignment.width, height: currentAlignment.height }}
              position={{ x: currentAlignment.x, y: currentAlignment.y }}
              onDragStop={(_, d) => {
                updateAlignment({ ...currentAlignment, x: d.x, y: d.y });
              }}
              onResizeStop={(_, __, ref, ___, position) => {
                updateAlignment({
                  ...currentAlignment,
                  width: parseFloat(ref.style.width),
                  height: parseFloat(ref.style.height),
                  ...position,
                });
              }}
              lockAspectRatio
              className="z-30 group"
            >
              <div
                ref={rotateRef}
                style={{
                  transform: `rotate(${currentAlignment.rotation}deg)`,
                  transformOrigin: "center center",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                <img
                  src={design}
                  alt="Printed design"
                  className="absolute inset-0 h-full w-full select-none rounded-sm object-contain"
                  draggable={false}
                  style={{
                    mixBlendMode: "normal",
                    opacity: 0.95,
                    filter: "contrast(1.08) brightness(1.02) saturate(1.05)",
                    userSelect: "none",
                  }}
                />
                <img
                  src={design}
                  alt="Fabric integration layer"
                  className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-sm object-contain"
                  draggable={false}
                  style={{
                    mixBlendMode: "multiply",
                    opacity: 0.15,
                    filter: "blur(0.3px)",
                    userSelect: "none",
                  }}
                />
                <img
                  src={design}
                  alt="Ink absorption layer"
                  className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-sm object-contain"
                  draggable={false}
                  style={{
                    mixBlendMode: "overlay",
                    opacity: 0.25,
                    filter: "blur(0.2px) brightness(0.95)",
                    userSelect: "none",
                  }}
                />
                <img
                  src={design}
                  alt="Shadow layer"
                  className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-sm object-contain"
                  draggable={false}
                  style={{
                    mixBlendMode: "multiply",
                    opacity: 0.08,
                    filter: "blur(1px) brightness(0.3)",
                    transform: "translate(1px, 1px)",
                    userSelect: "none",
                  }}
                />
                <div
                  onMouseDown={handleMouseDown}
                  className="absolute -top-6 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full bg-indigo-400 opacity-0 transition group-hover:opacity-100"
                  title="Rotate"
                />
              </div>
            </Rnd>
          )}
        </div>
      </div>
    </div>
  );
};

export default TShirtMockup;
