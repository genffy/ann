import React, { useState, useEffect, useRef } from 'react';

interface ToolbarPosition {
    x: number;
    y: number;
}

interface DrawingCanvasProps {
    area: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    onClose: () => void;
    onSave: (imageData: string) => void;
}

function DrawingCanvas({ area, onClose, onSave }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'highlight'>('pen');
    const [strokeColor, setStrokeColor] = useState('#ff0000');
    const [strokeWidth, setStrokeWidth] = useState(3);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 设置画布大小
        canvas.width = area.width;
        canvas.height = area.height;

        // 设置画布样式
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [area]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = currentTool === 'highlight' ? strokeColor + '80' : strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL('image/png');
        onSave(imageData);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: `${area.x}px`,
                top: `${area.y}px`,
                width: `${area.width}px`,
                height: `${area.height}px`,
                border: '2px solid #007acc',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1000000,
            }}
        >
            {/* 工具栏 */}
            <div
                style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#2d2d2d',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffffff',
                }}
            >
                <button
                    onClick={() => setCurrentTool('pen')}
                    style={{
                        backgroundColor: currentTool === 'pen' ? '#007acc' : 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    ✏️
                </button>
                <button
                    onClick={() => setCurrentTool('highlight')}
                    style={{
                        backgroundColor: currentTool === 'highlight' ? '#007acc' : 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    🖍️
                </button>
                <button
                    onClick={() => setCurrentTool('eraser')}
                    style={{
                        backgroundColor: currentTool === 'eraser' ? '#007acc' : 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    🗑️
                </button>
                <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    style={{ width: '20px', height: '20px', border: 'none', borderRadius: '2px' }}
                />
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    style={{ width: '60px' }}
                />
                <button
                    onClick={handleClear}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    清空
                </button>
                <button
                    onClick={handleSave}
                    style={{
                        backgroundColor: '#28a745',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    保存
                </button>
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                    }}
                >
                    关闭
                </button>
            </div>

            {/* 画布 */}
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    cursor: currentTool === 'eraser' ? 'crosshair' : 'crosshair',
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}

export default function Selection() {
    const [selectedText, setSelectedText] = useState('');
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ x: 0, y: 0 });
    const [selectionRange, setSelectionRange] = useState<Range | null>(null);
    const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
    const [drawingArea, setDrawingArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    // 计算工具条位置基于选中文本的位置
    const calculateToolbarPosition = (range: Range): ToolbarPosition => {
        const rect = range.getBoundingClientRect();
        const toolbarWidth = 350; // 增加宽度以容纳截图按钮
        const toolbarHeight = 50; // 预估工具条高度
        const padding = 10;

        // 优先显示在选中文本上方
        let x = rect.left + (rect.width / 2) - (toolbarWidth / 2);
        let y = rect.top - toolbarHeight - padding + window.scrollY;

        // 边界检查 - X轴
        if (x + toolbarWidth > window.innerWidth) {
            x = window.innerWidth - toolbarWidth - padding;
        }
        if (x < padding) {
            x = padding;
        }

        // 边界检查 - Y轴，如果上方空间不够，显示在下方
        if (rect.top - toolbarHeight - padding < 0) {
            y = rect.bottom + padding + window.scrollY;
        }

        return { x, y };
    };

    // 更新工具条位置
    const updateToolbarPosition = () => {
        if (selectionRange && showToolbar) {
            const newPosition = calculateToolbarPosition(selectionRange);
            setToolbarPosition(newPosition);
        }
    };

    // 从快捷键或按钮触发的截图功能
    const handleScreenshot = () => {
        console.log('Screenshot triggered locally!', { selectedText, selectionRange });

        if (!selectionRange) {
            console.log('No selection range available');
            // 如果没有选中文本，使用全屏模式
            triggerFullScreenshot();
            return;
        }

        try {
            // 使用基础的选中区域
            const rect = selectionRange.getBoundingClientRect();
            console.log('Selection rect:', rect);

            const area = {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: Math.max(rect.width, 100), // 确保最小宽度
                height: Math.max(rect.height, 50), // 确保最小高度
            };

            console.log('Drawing area:', area);

            setDrawingArea(area);
            setShowDrawingCanvas(true);
            setShowToolbar(false);

            console.log('Drawing canvas should now be visible');
        } catch (error) {
            console.error('Screenshot failed:', error);
        }
    };

    // 触发全屏截图
    const triggerFullScreenshot = () => {
        console.log('Triggering full screen screenshot');

        // 使用整个视口作为绘制区域
        const area = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        };

        setDrawingArea(area);
        setShowDrawingCanvas(true);
        setShowToolbar(false);
    };

    useEffect(() => {
        // 监听来自 background script 的消息
        const handleMessage = (message: any) => {
            console.log('Message received in content script:', message);

            if (message.type === 'TRIGGER_SCREENSHOT') {
                console.log('Screenshot triggered from background script');
                handleScreenshot();
            } else if (message.type === 'SCREENSHOT_CAPTURED') {
                console.log('Screenshot captured from background script');
                // 这里可以处理从 background 获取的截图数据
            } else if (message.type === 'SCREENSHOT_ERROR') {
                console.error('Screenshot error from background script:', message.error);
            }
        };

        // 监听自定义事件（来自注入的脚本）
        const handleCustomEvent = (event: CustomEvent) => {
            console.log('Custom event received:', event.detail);

            if (event.type === 'ann-screenshot-trigger') {
                console.log('Screenshot triggered from custom event');
                handleScreenshot();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            console.log('Key pressed:', event.key, event.ctrlKey, event.metaKey, event.shiftKey);

            // 备用快捷键检测（以防 chrome.commands 不工作）
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
                console.log('Screenshot shortcut detected in content script!');
                event.preventDefault();
                handleScreenshot();
            }
        };

        const handleContextMenu = (event: MouseEvent) => {
            // 如果有选中文本，添加右键菜单选项
            if (selectedText && selectionRange) {
                // 这里可以添加自定义右键菜单逻辑
                // 暂时使用快捷键方式触发
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            // 检查是否点击在工具条上或画布上
            if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) {
                return; // 如果点击在工具条上，不重新定位
            }

            // 延迟检查选择，避免在鼠标抬起瞬间选择还未完成
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection?.toString().trim();

                if (text && text.length > 0 && selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    setSelectedText(text);
                    setSelectionRange(range);

                    const position = calculateToolbarPosition(range);
                    setToolbarPosition(position);
                    setShowToolbar(true);

                    console.log('Text selected:', text);
                } else {
                    setShowToolbar(false);
                    setSelectedText('');
                    setSelectionRange(null);
                }
            }, 10);
        };

        const handleMouseDown = (event: MouseEvent) => {
            // 检查是否点击在工具条上或画布上
            if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) {
                return; // 如果点击在工具条上，不隐藏
            }

            // 检查是否点击在画布上
            if (showDrawingCanvas) {
                const target = event.target as Element;
                if (target.closest('[data-drawing-canvas]')) {
                    return; // 如果点击在画布上，不隐藏工具条
                }
            }

            // 鼠标按下时隐藏工具条
            setShowToolbar(false);
        };

        const handleSelectionChange = () => {
            // 延迟检查，避免频繁触发
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection?.toString().trim();

                if (!text || text.length === 0) {
                    setShowToolbar(false);
                    setSelectedText('');
                    setSelectionRange(null);
                }
            }, 50);
        };

        const handleScroll = () => {
            updateToolbarPosition();
        };

        const handleResize = () => {
            updateToolbarPosition();
        };

        // 添加事件监听器
        browser.runtime.onMessage.addListener(handleMessage);
        window.addEventListener('ann-screenshot-trigger', handleCustomEvent as EventListener);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('selectionchange', handleSelectionChange);
        window.addEventListener('scroll', handleScroll, true); // 使用 capture 模式监听所有滚动
        window.addEventListener('resize', handleResize);

        return () => {
            browser.runtime.onMessage.removeListener(handleMessage);
            window.removeEventListener('ann-screenshot-trigger', handleCustomEvent as EventListener);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('selectionchange', handleSelectionChange);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [selectionRange, showToolbar, selectedText, showDrawingCanvas]);

    const handleHighlight = () => {
        console.log('Highlight:', selectedText);
        // TODO: 实现高亮功能
    };

    const handleRespond = () => {
        console.log('Respond:', selectedText);
        // TODO: 实现回复功能
    };

    const handleShare = () => {
        console.log('Share:', selectedText);
        // TODO: 实现分享功能
    };

    const handlePrivateNote = () => {
        console.log('Private note:', selectedText);
        // TODO: 实现私人笔记功能
    };

    const handleDrawingCanvasClose = () => {
        console.log('Closing drawing canvas');
        setShowDrawingCanvas(false);
        setDrawingArea(null);
    };

    const handleDrawingCanvasSave = (imageData: string) => {
        console.log('Drawing saved:', imageData.substring(0, 50) + '...');

        // 可以下载图片
        const link = document.createElement('a');
        link.download = 'screenshot-drawing.png';
        link.href = imageData;
        link.click();

        handleDrawingCanvasClose();
    };

    return (
        <>
            {showToolbar && (
                <div
                    ref={toolbarRef}
                    style={{
                        position: 'absolute',
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
                        userSelect: 'none', // 防止工具条文本被选中
                    }}
                >
                    <button
                        onClick={handleHighlight}
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#404040';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Highlight
                    </button>

                    <button
                        onClick={handleRespond}
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#404040';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Respond
                    </button>

                    <button
                        onClick={handleShare}
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#404040';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Share
                    </button>

                    <button
                        onClick={handlePrivateNote}
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#404040';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Private note
                    </button>

                    <button
                        onClick={handleScreenshot}
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
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#404040';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="截图画板 (Ctrl/Cmd+Shift+A)"
                    >
                        📸 截图
                    </button>
                </div>
            )}

            {showDrawingCanvas && drawingArea && (
                <div data-drawing-canvas>
                    <DrawingCanvas
                        area={drawingArea}
                        onClose={handleDrawingCanvasClose}
                        onSave={handleDrawingCanvasSave}
                    />
                </div>
            )}
        </>
    );
}