"use client";
import React, { useEffect, useRef } from "react";
import { ChronicleButton } from "./chronicle-button";

const BAUHAUS_CARD_STYLES = `
.bauhaus-card {
  position: relative;
  z-index: 10;
  width: 100%;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  text-align: center;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: var(--card-radius, 20px);
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
  background: var(--card-bg, rgba(15, 15, 20, 0.6));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--card-text-main, #f0f0f1);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --rotation: 4.2rad;
}

.bauhaus-card:hover {
  transform: translateY(-8px);
  background: transparent;
  border-color: transparent;
  border-width: var(--card-border-width, 2px);
  background-image:
    linear-gradient(rgba(10, 10, 10, 0.8), rgba(10, 10, 10, 0.8)),
    linear-gradient(calc(var(--rotation,4.2rad)), var(--card-accent, #156ef6) 0, rgba(10, 10, 10, 0.4) 30%, transparent 80%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
}

.bauhaus-card-header {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0.5rem;
}

.bauhaus-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 1rem 1.5rem 1.5rem;
  width: 100%;
}

.bauhaus-date {
  color: var(--card-text-top, #bfc7d5);
  font-size: 0.75rem;
  text-transform: uppercase;
  tracking: 0.05em;
}

.bauhaus-size6 {
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.bauhaus-size6:hover {
  opacity: 1;
}

.bauhaus-card-body {
  width: 100%;
  padding: 1rem 1.5rem;
  text-align: left;
  flex: 1;
}

.bauhaus-card-body h3 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
  font-weight: 700;
  color: var(--card-text-main, #f0f0f1);
}

.bauhaus-card-body p {
  color: var(--card-text-sub, #a0a1b3);
  font-size: 0.875rem;
  line-height: 1.5;
}

.bauhaus-progress {
  margin-top: 1.25rem;
}

.bauhaus-progress-bar {
  position: relative;
  width: 100%;
  background: var(--card-progress-bar-bg, #363636);
  height: 0.25rem;
  display: block;
  border-radius: 9999px;
  margin: 0.5rem 0;
}

.bauhaus-progress-bar > div {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.bauhaus-progress span:first-of-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--card-text-progress-label, #b4c7e7);
  display: block;
}

.bauhaus-progress span:last-of-type {
  font-size: 0.75rem;
  text-align: right;
  display: block;
  color: var(--card-text-progress-value, #e7e7f7);
  font-weight: 500;
}

.bauhaus-card-footer {
  width: 100%;
  border-top: 0.063rem solid var(--card-separator, #2F2B2A);
}
`;

function injectBauhausCardStyles() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("bauhaus-card-styles")) {
    const style = document.createElement("style");
    style.id = "bauhaus-card-styles";
    style.innerHTML = BAUHAUS_CARD_STYLES;
    document.head.appendChild(style);
  }
}

const isRTL = (text: string): boolean =>
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/.test(text || "");

export interface BauhausCardProps {
  id: string;
  borderRadius?: string;
  backgroundColor?: string;
  separatorColor?: string;
  accentColor: string;
  borderWidth?: string;
  topInscription: string;
  mainText: string;
  subMainText: string;
  progressBarInscription: string;
  progress: number;
  progressValue: string;
  filledButtonInscription?: string;
  outlinedButtonInscription?: string;
  onFilledButtonClick?: (id: string) => void;
  onOutlinedButtonClick?: (id: string) => void;
  onMoreOptionsClick?: (id: string) => void;
  mirrored?: boolean;
  swapButtons?: boolean;
  ChronicleButtonHoverColor?: string;
  textColorTop?: string;
  textColorMain?: string;
  textColorSub?: string;
  textColorProgressLabel?: string;
  textColorProgressValue?: string;
  progressBarBackground?: string;
  chronicleButtonBg?: string;
  chronicleButtonFg?: string;
  chronicleButtonHoverFg?: string;
}

export const BauhausCard: React.FC<BauhausCardProps> = ({
  id,
  borderRadius = "1.5rem",
  backgroundColor = "#151419",
  separatorColor = "#2F2B2A",
  accentColor = "#156ef6",
  borderWidth = "2px",
  topInscription = "",
  swapButtons = false,
  mainText = "",
  subMainText = "",
  progressBarInscription = "",
  progress = 0,
  progressValue = "",
  filledButtonInscription = "",
  outlinedButtonInscription = "",
  onFilledButtonClick,
  onOutlinedButtonClick,
  onMoreOptionsClick,
  mirrored = false,
  textColorTop = "#bfc7d5",
  textColorMain = "#f0f0f1",
  textColorSub = "#a0a1b3",
  textColorProgressLabel = "#b4c7e7",
  textColorProgressValue = "#e7e7f7",
  progressBarBackground = "#363636",
  chronicleButtonBg = "#151419",
  chronicleButtonFg = "#fff",
  chronicleButtonHoverFg = "#fff",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausCardStyles();
    const card = cardRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const angle = Math.atan2(-x, y);
        card.style.setProperty("--rotation", angle + "rad");
      }
    };
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (card) {
        card.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <div
      className="bauhaus-card"
      ref={cardRef}
      style={{
        '--card-bg': backgroundColor,
        '--card-border': separatorColor,
        '--card-accent': accentColor,
        '--card-radius': borderRadius,
        '--card-border-width': borderWidth,
        '--card-text-top': textColorTop,
        '--card-text-main': textColorMain,
        '--card-text-sub': textColorSub,
        '--card-text-progress-label': textColorProgressLabel,
        '--card-text-progress-value': textColorProgressValue,
        '--card-separator': separatorColor,
        '--card-progress-bar-bg': progressBarBackground,
      } as React.CSSProperties}
    >
      <div
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
        className="bauhaus-card-header"
      >
        <div
          className="bauhaus-date"
          style={{
            transform: mirrored ? 'scaleX(-1)' : 'none',
            direction: isRTL(topInscription) ? 'rtl' : 'ltr',
          }}
        >
          {topInscription}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onMoreOptionsClick?.(id);
          }}
          style={{ cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="bauhaus-size6">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </div>
      </div>
      <div className="bauhaus-card-body">
        <h3 style={{ direction: isRTL(mainText) ? 'rtl' : 'ltr' }}>{mainText}</h3>
        <p style={{ direction: isRTL(subMainText) ? 'rtl' : 'ltr' }}>{subMainText}</p>
        <div className="bauhaus-progress">
          <span style={{
            direction: isRTL(progressBarInscription) ? 'rtl' : 'ltr',
            textAlign: mirrored ? 'right' : 'left'
          }}>
            {progressBarInscription}
          </span>
          <div
            style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
            className="bauhaus-progress-bar"
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: accentColor
              }}
            />
          </div>
          <span style={{
            direction: isRTL(progressValue) ? 'rtl' : 'ltr',
            textAlign: mirrored ? 'left' : 'right'
          }}>
            {progressValue}
          </span>
        </div>
      </div>
      <div className="bauhaus-card-footer">
        <div className="bauhaus-button-container">
          {swapButtons ? (
            <>
              {outlinedButtonInscription && (
                <ChronicleButton
                  text={outlinedButtonInscription}
                  outlined={true}
                  width="100%"
                  onClick={() => onOutlinedButtonClick?.(id)}
                  borderRadius={borderRadius}
                  hoverColor={accentColor}
                  customBackground={chronicleButtonBg}
                  customForeground={chronicleButtonFg}
                  hoverForeground={chronicleButtonHoverFg}
                />
              )}
              {filledButtonInscription && (
                <ChronicleButton
                  text={filledButtonInscription}
                  width="100%"
                  onClick={() => onFilledButtonClick?.(id)}
                  borderRadius={borderRadius}
                  hoverColor={accentColor}
                  customBackground={chronicleButtonBg}
                  customForeground={chronicleButtonFg}
                  hoverForeground={chronicleButtonHoverFg}
                />
              )}
            </>
          ) : (
            <>
              {filledButtonInscription && (
                <ChronicleButton
                  text={filledButtonInscription}
                  width="100%"
                  onClick={() => onFilledButtonClick?.(id)}
                  borderRadius={borderRadius}
                  hoverColor={accentColor}
                  customBackground={chronicleButtonBg}
                  customForeground={chronicleButtonFg}
                  hoverForeground={chronicleButtonHoverFg}
                />
              )}
              {outlinedButtonInscription && (
                <ChronicleButton
                  text={outlinedButtonInscription}
                  outlined={true}
                  width="100%"
                  onClick={() => onOutlinedButtonClick?.(id)}
                  borderRadius={borderRadius}
                  hoverColor={accentColor}
                  customBackground={chronicleButtonBg}
                  customForeground={chronicleButtonFg}
                  hoverForeground={chronicleButtonHoverFg}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
