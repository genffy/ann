export class CryptoDetector {
    /**
     * 检查文本是否为加密货币合约地址
     * @param text 待检查的文本
     * @returns 是否为加密货币地址
     */
    isCryptoAddress(text: string): boolean {
        const trimmedText = text.trim()

        // 以太坊地址 (0x开头 + 40个十六进制字符)
        if (/^0x[a-fA-F0-9]{40}$/.test(trimmedText)) {
            return true
        }

        // 比特币地址格式
        if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedText) || // Legacy
            /^bc1[a-z0-9]{39,59}$/.test(trimmedText)) { // Bech32
            return true
        }

        // Solana地址 (base58编码，通常32-44个字符)
        if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedText)) {
            return true
        }

        // 通用合约地址格式 (长字母数字字符串)
        if (trimmedText.length >= 26 && /^[a-zA-Z0-9]+$/.test(trimmedText)) {
            // 检查是否看起来像哈希（高熵）
            const hasUpperCase = /[A-Z]/.test(trimmedText)
            const hasLowerCase = /[a-z]/.test(trimmedText)
            const hasNumbers = /[0-9]/.test(trimmedText)

            if ((hasUpperCase && hasLowerCase) || (hasNumbers && (hasUpperCase || hasLowerCase))) {
                return true
            }
        }

        return false
    }

    /**
     * 检查文本是否为以太坊地址
     */
    isEthereumAddress(text: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(text.trim())
    }

    /**
     * 检查文本是否为比特币地址
     */
    isBitcoinAddress(text: string): boolean {
        const trimmedText = text.trim()
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmedText) || // Legacy
            /^bc1[a-z0-9]{39,59}$/.test(trimmedText) // Bech32
    }

    /**
     * 检查文本是否为Solana地址
     */
    isSolanaAddress(text: string): boolean {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text.trim())
    }

    /**
     * 获取加密货币地址类型
     */
    getCryptoAddressType(text: string): string | null {
        if (this.isEthereumAddress(text)) {
            return 'ethereum'
        }
        if (this.isBitcoinAddress(text)) {
            return 'bitcoin'
        }
        if (this.isSolanaAddress(text)) {
            return 'solana'
        }
        if (this.isCryptoAddress(text)) {
            return 'unknown'
        }
        return null
    }
} 