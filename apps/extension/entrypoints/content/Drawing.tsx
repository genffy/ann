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

export default function DrawingCanvas({ area, onClose, onSave }: DrawingCanvasProps) {
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
