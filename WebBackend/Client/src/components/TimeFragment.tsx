import React from 'react';
import Image from 'next/image';

interface TimeFragmentProps {
  /**
   * Container class name
   */
  className?: string;
  /**
   * Size of the icon in pixels
   * @default 20
   */
  iconSize?: number;
  /**
   * Numeric or string value to display after the icon
   */
  value?: string | number;
  /**
   * Whether to show the currency name "时光碎片"
   * @default false
   */
  showName?: boolean;
  /**
   * Class name for the text element
   * @default "text-white"
   */
  textClassName?: string;
}

/**
 * Standardized component for displaying "Time Fragment" (时光碎片) currency.
 * 
 * Usage examples:
 * - Icon only: <TimeFragment />
 * - Icon + Name: <TimeFragment showName />
 * - Icon + Value: <TimeFragment value={100} />
 * - Icon + Value + Name: <TimeFragment value={100} showName />
 */
export default function TimeFragment({
  className = "",
  iconSize = 20,
  value,
  showName = false,
  textClassName = "text-white"
}: TimeFragmentProps) {
  try {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {/* Use standard img tag to avoid potential Next.js Image issues during preview */}
        <img 
          src="/demo-assets/store/currency-red.png" 
          alt="时光碎片" 
          style={{ width: iconSize, height: iconSize }}
          className="shrink-0 object-contain"
        />
        {(value !== undefined || showName) && (
          <span className={`${textClassName} font-medium`}>
            {value}{value !== undefined && showName ? " " : ""}{showName ? "时光碎片" : ""}
          </span>
        )}
      </div>
    );
  } catch (e) {
    console.error("TimeFragment Error:", e);
    return null;
  }
}
