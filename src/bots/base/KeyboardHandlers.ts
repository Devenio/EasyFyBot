import TelegramBotType, { Message } from "node-telegram-bot-api";
import { KEYBOARD_LAYOUTS } from "./KeyboardConfigurationProvider";

const osu = require("node-os-utils");
const os = require("os");

export class KeyboardHandlersClass {
    botInstance: any;

    constructor(botInstance: TelegramBotType) {
        this.botInstance = botInstance
    }

    
}