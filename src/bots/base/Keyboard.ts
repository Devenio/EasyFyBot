import { KeyboardButton, Message } from "node-telegram-bot-api";
import { ADMIN_KEYBOARDS } from "../../utils/constant";
import TelegramBotType from "node-telegram-bot-api";

export class Keyboard {
    private readonly bot: TelegramBotType;

    constructor(data: { bot: TelegramBotType }) {
        this.bot = data.bot;

        

        this.setNewKeyboard(ADMIN_KEYBOARDS.MANAGEMENT, this.onAdminPanel);
        this.setNewKeyboard(ADMIN_KEYBOARDS.BOT_STATISTICS, this.onAdminPanel);
        this.setNewKeyboard(ADMIN_KEYBOARDS.SERVER_STATUS, this.onAdminPanel);
    }

    private async onAdminPanel(message: Message) {
        this.bot.sendMessage(message.chat.id, "به پنل ادمین خوش اومدی.", {
            reply_markup: {
                resize_keyboard: true,
                keyboard: [
                    [{ text: ADMIN_KEYBOARDS.SERVER_STATUS }],
                    [{ text: ADMIN_KEYBOARDS.BOT_STATISTICS }],
                ],
            },
        });
    }

    private async onBotStatistics(message: Message) {
        this.bot.sendMessage(message.chat.id, "به پنل ادمین خوش اومدی.", {
            reply_markup: {
                resize_keyboard: true,
                keyboard: [
                    [{ text: ADMIN_KEYBOARDS.SERVER_STATUS }],
                    [{ text: ADMIN_KEYBOARDS.BOT_STATISTICS }],
                ],
            },
        });
    }

    private async setNewKeyboard(
        text: ADMIN_KEYBOARDS,
        callback: (message: Message) => void
    ) {
        this.bot.on("text", (message) => {
            if (message.text === text) {
                callback(message);
            }
        });

        return {
            text,
        };
    }
}

export const USER_MAIN_PAGE_KEYBOARDS: KeyboardButton[][] = [[]];

export const ADMIN_MAIN_PAGE_KEYBOARDS: KeyboardButton[][] = [
    ...USER_MAIN_PAGE_KEYBOARDS,
    [
        {
            text: ADMIN_KEYBOARDS.MANAGEMENT,
        },
    ],
];

export const BOT_KEYBOARDS: IBotKeyboardButtons[][] = [
    [
        {
            text: ADMIN_KEYBOARDS.MANAGEMENT,
            children: [
                [{ text: ADMIN_KEYBOARDS.SERVER_STATUS }],
                [{ text: ADMIN_KEYBOARDS.BOT_STATISTICS }],
            ],
        },
    ],
];

// interface IBotKeyboardButtons {
//     button: KeyboardButton;
//     children?: IBotKeyboardButtons[][];
// }

interface IBotKeyboardButtons extends KeyboardButton {
    children?: IBotKeyboardButtons[][];
}
