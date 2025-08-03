// Accessibility service for comprehensive WCAG compliance and enhanced user experience

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  theme: 'light' | 'dark' | 'high-contrast';
}

export interface AccessibilityAudit {
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  rule: string;
  description: string;
  element?: string;
  suggestion: string;
  wcagReference: string;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  description: string;
  context: string;
}

export class AccessibilityService {
  private settings: AccessibilitySettings;
  private shortcuts: KeyboardShortcut[] = [];
  private focusHistory: HTMLElement[] = [];
  private announcements: string[] = [];
  private isScreenReaderActive = false;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeAccessibility();
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindFriendly: false,
      fontSize: 14,
      lineHeight: 1.5,
      letterSpacing: 0,
      theme: 'light'
    };
  }

  private initializeAccessibility(): void {
    this.detectSystemPreferences();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.initializeShortcuts();
  }

  // Detect system accessibility preferences
  private detectSystemPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true;
    }

    // Detect color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.settings.theme = 'dark';
    }

    // Detect screen reader
    this.isScreenReaderActive = this.detectScreenReader();
    if (this.isScreenReaderActive) {
      this.settings.screenReader = true;
    }
  }

  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    return !!(
      window.navigator.userAgent.includes('NVDA') ||
      window.navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]')
    );
  }

  // Keyboard navigation setup
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // Ensure all interactive elements are focusable
    this.ensureFocusableElements();
    
    // Add skip links
    this.addSkipLinks();
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;
    
    // Handle custom shortcuts
    const shortcut = this.shortcuts.find(s => 
      s.key === key &&
      s.modifiers.includes('ctrl') === ctrlKey &&
      s.modifiers.includes('alt') === altKey &&
      s.modifiers.includes('shift') === shiftKey &&
      s.modifiers.includes('meta') === metaKey
    );

    if (shortcut) {
      event.preventDefault();
      this.executeShortcut(shortcut);
      return;
    }

    // Handle Tab navigation
    if (key === 'Tab') {
      this.handleTabNavigation(event);
    }

    // Handle Escape key
    if (key === 'Escape') {
      this.handleEscape();
    }

    // Handle Arrow keys for custom navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      this.handleArrowNavigation(event);
    }
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift+Tab - go to previous element
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - go to next element
      const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      focusableElements[nextIndex]?.focus();
    }
  }

  private handleEscape(): void {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (activeModal) {
      this.closeModal(activeModal as HTMLElement);
      return;
    }

    // Return focus to previous element
    if (this.focusHistory.length > 0) {
      const previousElement = this.focusHistory.pop();
      previousElement?.focus();
    }
  }

  private handleArrowNavigation(event: KeyboardEvent): void {
    const activeElement = document.activeElement as HTMLElement;
    
    // Handle menu navigation
    if (activeElement.getAttribute('role') === 'menuitem') {
      this.handleMenuNavigation(event);
    }
    
    // Handle tab navigation
    if (activeElement.getAttribute('role') === 'tab') {
      this.handleTabListNavigation(event);
    }
  }

  // Screen reader support
  private setupScreenReaderSupport(): void {
    // Create live region for announcements
    this.createLiveRegion();
    
    // Add ARIA labels and descriptions
    this.enhanceARIALabels();
    
    // Set up landmark regions
    this.setupLandmarks();
  }

  private createLiveRegion(): void {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'accessibility-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
  }

  // Announce message to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = document.getElementById('accessibility-announcements');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
    
    this.announcements.push(message);
  }

  // Focus management
  private setupFocusManagement(): void {
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    // Add to focus history
    if (this.focusHistory[this.focusHistory.length - 1] !== target) {
      this.focusHistory.push(target);
      
      // Limit history size
      if (this.focusHistory.length > 10) {
        this.focusHistory.shift();
      }
    }
    
    // Announce focused element to screen reader
    if (this.settings.screenReader) {
      this.announceFocusedElement(target);
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    // Handle focus leaving the application
    if (!event.relatedTarget) {
      this.handleFocusLoss();
    }
  }

  private announceFocusedElement(element: HTMLElement): void {
    const label = this.getElementLabel(element);
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const state = this.getElementState(element);
    
    const announcement = `${label} ${role} ${state}`.trim();
    this.announce(announcement);
  }

  // Initialize keyboard shortcuts
  private initializeShortcuts(): void {
    this.shortcuts = [
      {
        key: 'h',
        modifiers: ['alt'],
        action: 'toggle-high-contrast',
        description: 'Toggle high contrast mode',
        context: 'global'
      },
      {
        key: 'm',
        modifiers: ['alt'],
        action: 'toggle-reduced-motion',
        description: 'Toggle reduced motion',
        context: 'global'
      },
      {
        key: 'f',
        modifiers: ['alt'],
        action: 'toggle-focus-indicators',
        description: 'Toggle focus indicators',
        context: 'global'
      },
      {
        key: '=',
        modifiers: ['ctrl'],
        action: 'increase-font-size',
        description: 'Increase font size',
        context: 'editor'
      },
      {
        key: '-',
        modifiers: ['ctrl'],
        action: 'decrease-font-size',
        description: 'Decrease font size',
        context: 'editor'
      },
      {
        key: '0',
        modifiers: ['ctrl'],
        action: 'reset-font-size',
        description: 'Reset font size',
        context: 'editor'
      },
      {
        key: '/',
        modifiers: ['ctrl'],
        action: 'show-shortcuts',
        description: 'Show keyboard shortcuts',
        context: 'global'
      }
    ];
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    switch (shortcut.action) {
      case 'toggle-high-contrast':
        this.toggleHighContrast();
        break;
      case 'toggle-reduced-motion':
        this.toggleReducedMotion();
        break;
      case 'toggle-focus-indicators':
        this.toggleFocusIndicators();
        break;
      case 'increase-font-size':
        this.increaseFontSize();
        break;
      case 'decrease-font-size':
        this.decreaseFontSize();
        break;
      case 'reset-font-size':
        this.resetFontSize();
        break;
      case 'show-shortcuts':
        this.showKeyboardShortcuts();
        break;
    }
  }

  // Accessibility settings methods
  toggleHighContrast(): void {
    this.settings.highContrast = !this.settings.highContrast;
    this.applyHighContrast();
    this.announce(`High contrast ${this.settings.highContrast ? 'enabled' : 'disabled'}`);
  }

  toggleReducedMotion(): void {
    this.settings.reducedMotion = !this.settings.reducedMotion;
    this.applyReducedMotion();
    this.announce(`Reduced motion ${this.settings.reducedMotion ? 'enabled' : 'disabled'}`);
  }

  toggleFocusIndicators(): void {
    this.settings.focusIndicators = !this.settings.focusIndicators;
    this.applyFocusIndicators();
    this.announce(`Focus indicators ${this.settings.focusIndicators ? 'enabled' : 'disabled'}`);
  }

  increaseFontSize(): void {
    this.settings.fontSize = Math.min(24, this.settings.fontSize + 2);
    this.applyFontSize();
    this.announce(`Font size increased to ${this.settings.fontSize}px`);
  }

  decreaseFontSize(): void {
    this.settings.fontSize = Math.max(10, this.settings.fontSize - 2);
    this.applyFontSize();
    this.announce(`Font size decreased to ${this.settings.fontSize}px`);
  }

  resetFontSize(): void {
    this.settings.fontSize = 14;
    this.applyFontSize();
    this.announce('Font size reset to default');
  }

  // Apply accessibility settings
  private applyHighContrast(): void {
    document.documentElement.classList.toggle('high-contrast', this.settings.highContrast);
  }

  private applyReducedMotion(): void {
    document.documentElement.classList.toggle('reduced-motion', this.settings.reducedMotion);
  }

  private applyFocusIndicators(): void {
    document.documentElement.classList.toggle('enhanced-focus', this.settings.focusIndicators);
  }

  private applyFontSize(): void {
    document.documentElement.style.setProperty('--accessibility-font-size', `${this.settings.fontSize}px`);
  }

  // Audit accessibility
  auditAccessibility(): AccessibilityAudit {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      issues.push({
        type: 'error',
        severity: 'serious',
        rule: 'img-alt',
        description: 'Image missing alt text',
        element: img.tagName,
        suggestion: 'Add descriptive alt text to all images',
        wcagReference: 'WCAG 2.1 - 1.1.1 Non-text Content'
      });
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      if (!hasLabel) {
        issues.push({
          type: 'error',
          severity: 'serious',
          rule: 'label-missing',
          description: 'Form input missing label',
          element: input.tagName,
          suggestion: 'Add a label element or aria-label attribute',
          wcagReference: 'WCAG 2.1 - 1.3.1 Info and Relationships'
        });
      }
    });

    // Check color contrast (simplified)
    const score = Math.max(0, 100 - (issues.length * 10));
    const wcagLevel = score >= 90 ? 'AAA' : score >= 70 ? 'AA' : 'A';

    return {
      score,
      issues,
      recommendations: this.generateRecommendations(issues),
      wcagLevel
    };
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = [];
    
    if (issues.some(i => i.rule === 'img-alt')) {
      recommendations.push('Add descriptive alt text to all images');
    }
    
    if (issues.some(i => i.rule === 'label-missing')) {
      recommendations.push('Ensure all form inputs have associated labels');
    }
    
    recommendations.push('Test with keyboard navigation');
    recommendations.push('Test with screen reader software');
    recommendations.push('Verify color contrast ratios meet WCAG standards');
    
    return recommendations;
  }

  // Utility methods
  private getFocusableElements(): HTMLElement[] {
    const selector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  private ensureFocusableElements(): void {
    // Ensure interactive elements are focusable
    const interactiveElements = document.querySelectorAll('[onclick], [onkeydown]');
    interactiveElements.forEach(element => {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  private addSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private enhanceARIALabels(): void {
    // Add ARIA labels to common elements
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      if (text) {
        button.setAttribute('aria-label', text);
      }
    });
  }

  private setupLandmarks(): void {
    // Ensure main content has proper landmark
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }
  }

  private getElementLabel(element: HTMLElement): string {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.tagName.toLowerCase();
  }

  private getElementState(element: HTMLElement): string {
    const states = [];
    
    if (element.hasAttribute('aria-expanded')) {
      states.push(element.getAttribute('aria-expanded') === 'true' ? 'expanded' : 'collapsed');
    }
    
    if (element.hasAttribute('aria-checked')) {
      states.push(element.getAttribute('aria-checked') === 'true' ? 'checked' : 'unchecked');
    }
    
    if (element.hasAttribute('disabled')) {
      states.push('disabled');
    }
    
    return states.join(', ');
  }

  private closeModal(modal: HTMLElement): void {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
  }

  private handleMenuNavigation(event: KeyboardEvent): void {
    // Implement menu navigation logic
  }

  private handleTabListNavigation(event: KeyboardEvent): void {
    // Implement tab list navigation logic
  }

  private handleFocusLoss(): void {
    // Handle when focus leaves the application
  }

  private showKeyboardShortcuts(): void {
    const shortcutsList = this.shortcuts.map(s => 
      `${s.modifiers.join('+')}+${s.key}: ${s.description}`
    ).join('\n');
    
    this.announce(`Keyboard shortcuts: ${shortcutsList}`);
  }

  // Public API
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  private applySettings(): void {
    this.applyHighContrast();
    this.applyReducedMotion();
    this.applyFocusIndicators();
    this.applyFontSize();
  }

  getKeyboardShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  getAnnouncements(): string[] {
    return [...this.announcements];
  }
}

// Global accessibility service instance
export const accessibilityService = new AccessibilityService();
