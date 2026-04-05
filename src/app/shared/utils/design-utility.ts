/**
 * Design utility functions for consistent styling and behavior
 */

export interface DesignToken {
  spacing: string;
  color: string;
  typography: string;
  shadow: string;
  borderRadius: string;
  transition: string;
}

export interface Breakpoint {
  name: string;
  min: number;
  max?: number;
}

export class DesignUtility {
  // Breakpoint definitions
  static readonly BREAKPOINTS: Breakpoint[] = [
    { name: 'xs', min: 0, max: 575 },
    { name: 'sm', min: 576, max: 767 },
    { name: 'md', min: 768, max: 991 },
    { name: 'lg', min: 992, max: 1199 },
    { name: 'xl', min: 1200, max: 1399 },
    { name: '2xl', min: 1400 }
  ];

  // Spacing scale (in rem)
  static readonly SPACING = {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem'
  };

  // Typography scale
  static readonly TYPOGRAPHY = {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  };

  // Font weights
  static readonly FONT_WEIGHTS = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  };

  // Border radius scale
  static readonly BORDER_RADIUS = {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px'
  };

  // Shadow scale
  static readonly SHADOWS = {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  };

  // Transition durations
  static readonly TRANSITIONS = {
    none: 'none',
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    base: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  /**
   * Get current breakpoint based on window width
   */
  static getCurrentBreakpoint(): string {
    if (typeof window === 'undefined') return 'md';
    
    const width = window.innerWidth;
    
    for (const breakpoint of this.BREAKPOINTS) {
      if (width >= breakpoint.min && (!breakpoint.max || width <= breakpoint.max)) {
        return breakpoint.name;
      }
    }
    
    return '2xl';
  }

  /**
   * Check if current viewport matches breakpoint
   */
  static isBreakpoint(breakpointName: string): boolean {
    return this.getCurrentBreakpoint() === breakpointName;
  }

  /**
   * Check if current viewport is at least the specified breakpoint
   */
  static isMinBreakpoint(breakpointName: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    const breakpoint = this.BREAKPOINTS.find(bp => bp.name === breakpointName);
    
    return breakpoint ? width >= breakpoint.min : false;
  }

  /**
   * Check if current viewport is at most the specified breakpoint
   */
  static isMaxBreakpoint(breakpointName: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    const breakpoint = this.BREAKPOINTS.find(bp => bp.name === breakpointName);
    
    return breakpoint ? breakpoint.max ? width <= breakpoint.max : true : false;
  }

  /**
   * Generate CSS custom property value
   */
  static getCSSVar(name: string): string | null {
    if (typeof window === 'undefined') return null;
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  }

  /**
   * Set CSS custom property value
   */
  static setCSSVar(name: string, value: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(`--${name}`, value);
    }
  }

  /**
   * Generate responsive class names
   */
  static getResponsiveClasses(baseClass: string, variants: Record<string, boolean> = {}): string[] {
    const classes: string[] = [];
    const currentBreakpoint = this.getCurrentBreakpoint();
    
    // Add base class
    classes.push(baseClass);
    
    // Add breakpoint-specific classes
    Object.entries(variants).forEach(([breakpoint, condition]) => {
      if (condition) {
        classes.push(`${baseClass}-${breakpoint}`);
      }
    });
    
    return classes;
  }

  /**
   * Generate spacing utilities
   */
  static getSpacingClasses(property: 'm' | 'p' | 'mt' | 'mb' | 'ml' | 'mr', size: number | string): string {
    const sizeValue = typeof size === 'string' ? size : this.SPACING[size as keyof typeof this.SPACING];
    return `${property}-${size}`;
  }

  /**
   * Generate color utilities
   */
  static getColorClasses(type: 'bg' | 'text' | 'border', color: string, shade?: string): string {
    const baseClass = `${type}-${color}`;
    return shade ? `${baseClass}-${shade}` : baseClass;
  }

  /**
   * Generate typography utilities
   */
  static getTypographyClasses(property: 'text' | 'font', value: string): string {
    return `${property}-${value}`;
  }

  /**
   * Generate utility classes for common patterns
   */
  static getUtilityClasses(options: {
    spacing?: { property: string; size: number | string }[];
    colors?: { type: string; color: string; shade?: string }[];
    typography?: { property: string; value: string }[];
    display?: string[];
    flex?: string[];
    responsive?: Record<string, boolean>;
  }): string[] {
    const classes: string[] = [];
    
    // Spacing utilities
    if (options.spacing) {
      options.spacing.forEach(({ property, size }) => {
        classes.push(this.getSpacingClasses(property as any, size));
      });
    }
    
    // Color utilities
    if (options.colors) {
      options.colors.forEach(({ type, color, shade }) => {
        classes.push(this.getColorClasses(type as any, color, shade));
      });
    }
    
    // Typography utilities
    if (options.typography) {
      options.typography.forEach(({ property, value }) => {
        classes.push(this.getTypographyClasses(property as any, value));
      });
    }
    
    // Display utilities
    if (options.display) {
      classes.push(...options.display);
    }
    
    // Flex utilities
    if (options.flex) {
      classes.push(...options.flex);
    }
    
    // Responsive utilities
    if (options.responsive) {
      Object.entries(options.responsive).forEach(([breakpoint, condition]) => {
        if (condition) {
          classes.push(`block-${breakpoint}`);
        }
      });
    }
    
    return classes;
  }

  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Generate unique ID for components
   */
  static generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is in viewport
   */
  static isInViewport(element: Element): boolean {
    if (typeof window === 'undefined') return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Smooth scroll to element
   */
  static scrollToElement(element: Element, offset: number = 0): void {
    if (typeof window === 'undefined') return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}
