import { errorUtils } from '../../../lib/helpers'

/**
 * 编辑工具类型
 */
export type EditTool = 'brush' | 'mosaic' | 'text' | 'arrow' | 'rectangle' | 'circle' | 'eraser'

/**
 * 编辑配置
 */
export interface EditConfig {
    tool: EditTool
    color: string
    size: number
    opacity: number
    fontSize?: number
    fontFamily?: string
}

/**
 * 编辑操作
 */
export interface EditOperation {
    id: string
    type: EditTool
    config: EditConfig
    points: Array<{ x: number; y: number }>
    text?: string
    timestamp: number
}

/**
 * Canvas图片编辑器类
 * 支持马赛克、画笔标注、文字等编辑功能
 */
export class ImageEditor {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private originalImageData: ImageData | null = null
    private operations: EditOperation[] = []
    private currentOperation: EditOperation | null = null
    private isDrawing = false

    private readonly defaultConfig: EditConfig = {
        tool: 'brush',
        color: '#ff0000',
        size: 5,
        opacity: 1,
        fontSize: 16,
        fontFamily: 'Arial'
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.setupEventListeners()
    }

    /**
     * 加载图片到编辑器
     */
    async loadImage(imageData: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image()

            img.onload = () => {
                // 调整canvas尺寸
                this.canvas.width = img.width
                this.canvas.height = img.height

                // 绘制图片
                this.ctx.drawImage(img, 0, 0)

                // 保存原始图片数据
                this.originalImageData = this.ctx.getImageData(0, 0, img.width, img.height)

                resolve()
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = imageData
        })
    }

    /**
     * 应用编辑工具
     */
    applyTool(config: Partial<EditConfig>): void {
        const finalConfig = { ...this.defaultConfig, ...config }

        // 更新绘制样式
        this.ctx.strokeStyle = finalConfig.color
        this.ctx.fillStyle = finalConfig.color
        this.ctx.lineWidth = finalConfig.size
        this.ctx.globalAlpha = finalConfig.opacity
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'

        if (finalConfig.fontSize && finalConfig.fontFamily) {
            this.ctx.font = `${finalConfig.fontSize}px ${finalConfig.fontFamily}`
        }
    }

    /**
     * 画笔工具
     */
    private drawBrush(points: Array<{ x: number; y: number }>): void {
        if (points.length < 2) return

        this.ctx.beginPath()
        this.ctx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y)
        }

        this.ctx.stroke()
    }

    /**
     * 马赛克工具
     */
    private drawMosaic(points: Array<{ x: number; y: number }>, size: number): void {
        const mosaicSize = Math.max(size, 10)

        points.forEach(point => {
            const imageData = this.ctx.getImageData(
                point.x - mosaicSize / 2,
                point.y - mosaicSize / 2,
                mosaicSize,
                mosaicSize
            )

            // 计算平均颜色
            const avgColor = this.calculateAverageColor(imageData)

            // 绘制马赛克块
            this.ctx.fillStyle = `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`
            this.ctx.fillRect(
                point.x - mosaicSize / 2,
                point.y - mosaicSize / 2,
                mosaicSize,
                mosaicSize
            )
        })
    }

    /**
     * 文字工具
     */
    private drawText(point: { x: number; y: number }, text: string): void {
        this.ctx.fillText(text, point.x, point.y)
    }

    /**
     * 箭头工具
     */
    private drawArrow(start: { x: number; y: number }, end: { x: number; y: number }): void {
        const headLength = 15
        const angle = Math.atan2(end.y - start.y, end.x - start.x)

        // 绘制箭头线
        this.ctx.beginPath()
        this.ctx.moveTo(start.x, start.y)
        this.ctx.lineTo(end.x, end.y)
        this.ctx.stroke()

        // 绘制箭头头部
        this.ctx.beginPath()
        this.ctx.moveTo(end.x, end.y)
        this.ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
        )
        this.ctx.moveTo(end.x, end.y)
        this.ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
        )
        this.ctx.stroke()
    }

    /**
     * 矩形工具
     */
    private drawRectangle(start: { x: number; y: number }, end: { x: number; y: number }): void {
        const width = end.x - start.x
        const height = end.y - start.y

        this.ctx.beginPath()
        this.ctx.rect(start.x, start.y, width, height)
        this.ctx.stroke()
    }

    /**
     * 圆形工具
     */
    private drawCircle(center: { x: number; y: number }, radius: number): void {
        this.ctx.beginPath()
        this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
        this.ctx.stroke()
    }

    /**
     * 橡皮擦工具
     */
    private drawEraser(points: Array<{ x: number; y: number }>, size: number): void {
        if (!this.originalImageData) return

        points.forEach(point => {
            // 从原始图片数据中恢复像素
            const imageData = this.ctx.createImageData(size, size)
            const startX = Math.max(0, point.x - size / 2)
            const startY = Math.max(0, point.y - size / 2)

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const srcX = startX + x
                    const srcY = startY + y

                    if (srcX < this.originalImageData.width && srcY < this.originalImageData.height) {
                        const srcIndex = (srcY * this.originalImageData.width + srcX) * 4
                        const destIndex = (y * size + x) * 4

                        imageData.data[destIndex] = this.originalImageData.data[srcIndex]
                        imageData.data[destIndex + 1] = this.originalImageData.data[srcIndex + 1]
                        imageData.data[destIndex + 2] = this.originalImageData.data[srcIndex + 2]
                        imageData.data[destIndex + 3] = this.originalImageData.data[srcIndex + 3]
                    }
                }
            }

            this.ctx.putImageData(imageData, startX, startY)
        })
    }

    /**
     * 撤销操作
     */
    undo(): void {
        if (this.operations.length === 0) return

        this.operations.pop()
        this.redrawCanvas()
    }

    /**
     * 重做Canvas
     */
    private redrawCanvas(): void {
        if (!this.originalImageData) return

        // 恢复原始图片
        this.ctx.putImageData(this.originalImageData, 0, 0)

        // 重新应用所有操作
        this.operations.forEach(operation => {
            this.applyTool(operation.config)
            this.executeOperation(operation)
        })
    }

    /**
     * 执行编辑操作
     */
    private executeOperation(operation: EditOperation): void {
        switch (operation.type) {
            case 'brush':
                this.drawBrush(operation.points)
                break
            case 'mosaic':
                this.drawMosaic(operation.points, operation.config.size)
                break
            case 'text':
                if (operation.text && operation.points.length > 0) {
                    this.drawText(operation.points[0], operation.text)
                }
                break
            case 'arrow':
                if (operation.points.length >= 2) {
                    this.drawArrow(operation.points[0], operation.points[1])
                }
                break
            case 'rectangle':
                if (operation.points.length >= 2) {
                    this.drawRectangle(operation.points[0], operation.points[1])
                }
                break
            case 'circle':
                if (operation.points.length >= 2) {
                    const center = operation.points[0]
                    const edge = operation.points[1]
                    const radius = Math.sqrt(
                        Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                    )
                    this.drawCircle(center, radius)
                }
                break
            case 'eraser':
                this.drawEraser(operation.points, operation.config.size)
                break
        }
    }

    /**
     * 获取编辑结果
     */
    getEditedImage(format: 'png' | 'jpeg' = 'png', quality = 0.9): string {
        return this.canvas.toDataURL(`image/${format}`, quality)
    }

    /**
     * 清除所有编辑
     */
    clear(): void {
        this.operations = []
        this.redrawCanvas()
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this))
    }

    /**
     * 鼠标按下事件
     */
    private handleMouseDown(event: MouseEvent): void {
        this.isDrawing = true
        const point = this.getMousePosition(event)

        this.currentOperation = {
            id: Date.now().toString(),
            type: this.defaultConfig.tool,
            config: { ...this.defaultConfig },
            points: [point],
            timestamp: Date.now()
        }
    }

    /**
     * 鼠标移动事件
     */
    private handleMouseMove(event: MouseEvent): void {
        if (!this.isDrawing || !this.currentOperation) return

        const point = this.getMousePosition(event)
        this.currentOperation.points.push(point)

        // 实时绘制
        this.applyTool(this.currentOperation.config)

        if (this.currentOperation.type === 'brush' || this.currentOperation.type === 'mosaic') {
            this.executeOperation(this.currentOperation)
        }
    }

    /**
     * 鼠标抬起事件
     */
    private handleMouseUp(): void {
        if (!this.isDrawing || !this.currentOperation) return

        this.isDrawing = false

        // 完成操作
        this.operations.push(this.currentOperation)

        // 对于非连续绘制工具，在这里执行
        if (!['brush', 'mosaic'].includes(this.currentOperation.type)) {
            this.applyTool(this.currentOperation.config)
            this.executeOperation(this.currentOperation)
        }

        this.currentOperation = null
    }

    /**
     * 获取鼠标位置
     */
    private getMousePosition(event: MouseEvent): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    /**
     * 计算平均颜色
     */
    private calculateAverageColor(imageData: ImageData): { r: number; g: number; b: number } {
        let r = 0, g = 0, b = 0
        const pixelCount = imageData.data.length / 4

        for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i]
            g += imageData.data[i + 1]
            b += imageData.data[i + 2]
        }

        return {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount)
        }
    }
} 