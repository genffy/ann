import MessageUtils from "../../../utils/helpers/message-utils"
import { ConfigManager } from "."
import { GetConfigMessage, ResponseMessage, SetConfigMessage } from "../../../types/messages"

export const messageHandlers = {
    // 配置相关
    GET_CONFIG: async (message: GetConfigMessage): Promise<ResponseMessage> => {
        try {
            let config
            if (message.configType === 'translation') {
                config = await ConfigManager.getTranslationConfig()
            } else if (message.configType === 'rules') {
                config = await ConfigManager.getTranslationRules()
            } else {
                throw new Error('Invalid config type')
            }
            return MessageUtils.createResponse(true, config)
        } catch (error) {
            return MessageUtils.createResponse(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    },

    SET_CONFIG: async (message: SetConfigMessage): Promise<ResponseMessage> => {
        try {
            if (message.configType === 'translation') {
                await ConfigManager.setTranslationConfig(message.config as any)
            } else if (message.configType === 'rules') {
                await ConfigManager.setTranslationRules(message.config as any)
            } else {
                throw new Error('Invalid config type')
            }
            return MessageUtils.createResponse(true)
        } catch (error) {
            return MessageUtils.createResponse(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    },

    INITIALIZE_CONFIG: async (): Promise<ResponseMessage> => {
        try {
            await ConfigManager.initialize()
            return MessageUtils.createResponse(true)
        } catch (error) {
            return MessageUtils.createResponse(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    },

    RESET_CONFIG: async (): Promise<ResponseMessage> => {
        try {
            await ConfigManager.resetToDefaults()
            return MessageUtils.createResponse(true)
        } catch (error) {
            return MessageUtils.createResponse(false, undefined, error instanceof Error ? error.message : 'Unknown error')
        }
    },

}