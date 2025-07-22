
// 文件工具
export const FileUtils = {
    // 下载文件
    download: (blob: Blob, filename: string): void => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    },

    // 将 canvas 转换为 Blob
    canvasToBlob: (canvas: HTMLCanvasElement, format = 'image/png', quality = 0.9): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Canvas to blob conversion failed'))
                },
                format,
                quality
            )
        })
    },

    // 图片 URL 转 Blob
    urlToBlob: async (url: string): Promise<Blob> => {
        const response = await fetch(url)
        return response.blob()
    }
}