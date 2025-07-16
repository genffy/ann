import ReactDOM from 'react-dom/client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce, domUtils } from '../../lib/helpers';
import Highlight from './Highlight';
import { HighlightService } from '../../modules/services/highlight/highlight-service';
interface ToolbarPosition {
  x: number;
  y: number;
}

interface TooltipPlacement {
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

const TOOLBAR_WIDTH = 350;
const TOOLBAR_HEIGHT = 50;
const ARROW_SIZE = 8;
const VIEWPORT_PADDING = 10;

// TODO: config it on the options page
const options = [
  {
    label: 'Highlight',
    desc: 'Highlight the selected text or images',
    available: true,
    onClick: (range: Range) => {
      console.log('Highlight:', range);
    }
  },
  {
    label: 'Comment',
    desc: 'Add a comment to the selected text or images',
    available: true,
    onClick: (range: Range) => {
      console.log('Comment:', range);
    }
  },
  {
    label: 'Share',
    desc: 'Share the selected text or images',
    available: true,
    onClick: (range: Range) => {
      console.log('Share:', range);
    }
  },
  {
    label: 'Collect',
    desc: 'Collect the selected text or images',
    available: true,
    onClick: (range: Range) => {
      console.log('Collect:', range);
    }
  },
  {
    label: 'Screenshot',
    desc: 'Take a screenshot of the selected text or images',
    available: false,
    onClick: (range: Range) => {
      console.log('Screenshot:', range);
    }
  },
  {
    label: 'Translate',
    desc: 'Translate the selected text or images',
    available: false,
    onClick: (range: Range) => {
      console.log('Translate:', range);
      // get translation data from service and update the dom
    }
  }
]

// Get arrow style based on placement
const getArrowStyle = (placement: TooltipPlacement) => {
  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  switch (placement.position) {
    case 'top':
      arrowStyle.top = '100%';
      arrowStyle.left = '50%';
      arrowStyle.marginLeft = -ARROW_SIZE;
      arrowStyle.borderWidth = `${ARROW_SIZE}px ${ARROW_SIZE}px 0 ${ARROW_SIZE}px`;
      arrowStyle.borderColor = '#2d2d2d transparent transparent transparent';
      break;
    case 'bottom':
      arrowStyle.bottom = '100%';
      arrowStyle.left = '50%';
      arrowStyle.marginLeft = -ARROW_SIZE;
      arrowStyle.borderWidth = `0 ${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px`;
      arrowStyle.borderColor = 'transparent transparent #2d2d2d transparent';
      break;
    case 'left':
      arrowStyle.left = '100%';
      arrowStyle.top = '50%';
      arrowStyle.marginTop = -ARROW_SIZE;
      arrowStyle.borderWidth = `${ARROW_SIZE}px 0 ${ARROW_SIZE}px ${ARROW_SIZE}px`;
      arrowStyle.borderColor = 'transparent transparent transparent #2d2d2d';
      break;
    case 'right':
      arrowStyle.right = '100%';
      arrowStyle.top = '50%';
      arrowStyle.marginTop = -ARROW_SIZE;
      arrowStyle.borderWidth = `${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px 0`;
      arrowStyle.borderColor = 'transparent #2d2d2d transparent transparent';
      break;
  }

  return arrowStyle;
};

function Selection() {
  const [visible, setVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<TooltipPlacement>({ position: 'top', align: 'center' });
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Calculate optimal placement based on viewport constraints
  const calculatePlacement = useCallback((rect: DOMRect): { position: ToolbarPosition; placement: TooltipPlacement } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default to top-center
    let position: ToolbarPosition = { x: 0, y: 0 };
    let tooltipPlacement: TooltipPlacement = { position: 'top', align: 'center' };

    // Calculate center position (relative to viewport since we're using fixed position)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Try different placements in order of preference
    const placements = [
      { position: 'top', align: 'center' },
      { position: 'bottom', align: 'center' },
      { position: 'right', align: 'center' },
      { position: 'left', align: 'center' },
    ] as TooltipPlacement[];

    for (const testPlacement of placements) {
      let testX = 0;
      let testY = 0;

      switch (testPlacement.position) {
        case 'top':
          testX = centerX - TOOLBAR_WIDTH / 2;
          testY = rect.top - TOOLBAR_HEIGHT - ARROW_SIZE;
          break;
        case 'bottom':
          testX = centerX - TOOLBAR_WIDTH / 2;
          testY = rect.bottom + ARROW_SIZE;
          break;
        case 'left':
          testX = rect.left - TOOLBAR_WIDTH - ARROW_SIZE;
          testY = centerY - TOOLBAR_HEIGHT / 2;
          break;
        case 'right':
          testX = rect.right + ARROW_SIZE;
          testY = centerY - TOOLBAR_HEIGHT / 2;
          break;
      }

      // Check if this placement fits in viewport (no scroll offset needed with fixed position)
      const fitsHorizontally = testX >= VIEWPORT_PADDING &&
        testX + TOOLBAR_WIDTH <= viewportWidth - VIEWPORT_PADDING;
      const fitsVertically = testY >= VIEWPORT_PADDING &&
        testY + TOOLBAR_HEIGHT <= viewportHeight - VIEWPORT_PADDING;

      if (fitsHorizontally && fitsVertically) {
        position = { x: testX, y: testY };
        tooltipPlacement = testPlacement;
        break;
      }
    }

    // If no placement fits perfectly, use the first one but adjust position
    if (position.x === 0 && position.y === 0) {
      position.x = Math.max(
        VIEWPORT_PADDING,
        Math.min(centerX - TOOLBAR_WIDTH / 2, viewportWidth - TOOLBAR_WIDTH - VIEWPORT_PADDING)
      );
      position.y = rect.top - TOOLBAR_HEIGHT - ARROW_SIZE;

      // If still doesn't fit vertically, place it below
      if (position.y < VIEWPORT_PADDING) {
        position.y = rect.bottom + ARROW_SIZE;
        tooltipPlacement = { position: 'bottom', align: 'center' };
      }
    }

    return { position, placement: tooltipPlacement };
  }, []);

  // Update toolbar position (like rc-tooltip's align)
  const updateToolbarPosition = useCallback(() => {
    if (selectionRange) {
      const rect = selectionRange.getBoundingClientRect();

      // Check if the selection is still visible in the viewport
      const isSelectionVisible = rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (isSelectionVisible) {
        // Show toolbar if selection is visible and calculate position
        const { position, placement: newPlacement } = calculatePlacement(rect);
        setToolbarPosition(position);
        setPlacement(newPlacement);

        // Make sure toolbar is visible
        if (!visible) {
          setVisible(true);
          setIsAnimating(true);
        }
      } else {
        // Hide toolbar if selection is not visible in viewport, but keep selectionRange
        if (visible) {
          setVisible(false);
          // Don't clear selectionRange so we can show toolbar again when it becomes visible
        }
      }
    }
  }, [selectionRange, visible, calculatePlacement]);

  // Toggle tooltip with debounce control
  const toggleTooltip = useCallback(
    debounce((range: Range | null) => {
      if (range) {
        // Show tooltip
        setSelectionRange(range);
        setIsAnimating(true);
        setVisible(true);
      } else {
        // Hide tooltip
        setVisible(false);
        setSelectionRange(null);
        setTimeout(() => setIsAnimating(false), 200);
      }
    }, 50), // 50ms debounce
    []
  );

  // Show tooltip
  const showTooltip = useCallback((range: Range) => {
    toggleTooltip(range);
  }, [toggleTooltip]);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    toggleTooltip(null);
  }, [toggleTooltip]);

  // Clear tooltip immediately (without debounce)
  const clearTooltip = useCallback(() => {
    setVisible(false);
    setSelectionRange(null);
    setActiveFeature(null);
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // Check if the click is on the toolbar
      if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) {
        return;
      }

      // Delay checking the selection
      setTimeout(() => {
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
          const selectionInfo = domUtils.getSelectionInfo(selection);

          if (selectionInfo.hasText || selectionInfo.hasImages) {
            const range = selection.getRangeAt(0);
            showTooltip(range);
          } else {
            hideTooltip();
          }
        } else {
          hideTooltip();
        }
      }, 10);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const selectionInfo = domUtils.getSelectionInfo(selection);

        if (!selectionInfo.hasText && !selectionInfo.hasImages) {
          hideTooltip();
        }
      } else {
        hideTooltip();
      }
    };

    const handleResize = debounce(() => {
      updateToolbarPosition();
    }, 100);

    const handleScroll = debounce(() => {
      // Use requestAnimationFrame for smooth position updates
      requestAnimationFrame(() => {
        updateToolbarPosition();
      });
    }, 16); // ~60fps for smooth scrolling

    // Add event listeners
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('resize', handleResize);

    // Listen to scroll events on all scrollable elements
    // This ensures the toolbar follows the selection even when scrolling in nested containers
    document.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTooltip, hideTooltip, updateToolbarPosition]);

  // Update position when visible or selectionRange changes
  useEffect(() => {
    if (visible && selectionRange) {
      updateToolbarPosition();
    }
  }, [visible, selectionRange, updateToolbarPosition]);

  // Initialize highlight service on page load
  const [highlightService] = useState(() => HighlightService.getInstance());
  useEffect(() => {
    const initializeHighlights = async () => {
      try {
        console.log('[Selection] Initializing highlight service...');
        await highlightService.initialize();
        console.log('[Selection] Highlight service initialized successfully');
      } catch (error) {
        console.error('[Selection] Failed to initialize highlight service:', error);
      }
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeHighlights);
    } else {
      // DOM is already ready
      initializeHighlights();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', initializeHighlights);
    };
  }, [highlightService]);

  // Handle option click
  const handleOptionClick = useCallback((option: typeof options[number]) => {
    if (option.label === 'Highlight') {
      setActiveFeature('highlight');
      return;
    }

    // Clear browser selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // Execute the option callback with the current selection range
    option.onClick(selectionRange!);

    // Clear component state immediately (without debounce)
    clearTooltip();
  }, [selectionRange, clearTooltip]);

  // Handle highlight created
  const handleHighlightCreated = useCallback(() => {
    // Clear browser selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // Clear component state
    clearTooltip();
  }, [clearTooltip]);

  // Handle close feature
  const handleCloseFeature = useCallback(() => {
    setActiveFeature(null);
  }, []);

  // Render active feature component
  const renderActiveFeature = () => {
    if (!activeFeature || !selectionRange) return null;

    switch (activeFeature) {
      case 'highlight':
        return (
          <Highlight
            selectedRange={selectionRange}
            onHighlightCreated={handleHighlightCreated}
            onClose={handleCloseFeature}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Active feature component */}
      {activeFeature && (
        <div
          style={{
            position: 'fixed',
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y + 60}px`, // Position below toolbar
            zIndex: 1000000,
            opacity: 1,
            transform: 'scale(1)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          {renderActiveFeature()}
        </div>
      )}

      {/* Toolbar */}
      {(visible || isAnimating) && (
        <div
          ref={toolbarRef}
          style={{
            position: 'fixed',
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            zIndex: 999999,
            backgroundColor: '#2d2d2d',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            userSelect: 'none',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.8)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            transformOrigin: placement.position === 'top' ? 'center bottom' :
              placement.position === 'bottom' ? 'center top' :
                placement.position === 'left' ? 'right center' : 'left center',
          }}
        >
          {/* Arrow */}
          <div style={getArrowStyle(placement)} />

          {options.filter((option) => option.available).map((option) => (
            <button
              key={option.label}
              onClick={() => handleOptionClick(option)}
              title={option.desc}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#404040';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'ann-selection',
      position: 'inline',
      anchor: 'html',
      onMount: (container) => {
        // Container is a body, and React warns when creating a root on the body, so create a wrapper div
        const app = document.createElement('div');
        container.append(app);
        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(app);
        root.render(<Selection />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root?.unmount();
      },
    })
    ui.mount()
  }
})
