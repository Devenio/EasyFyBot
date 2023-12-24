import { KeyboardButton, Message } from "node-telegram-bot-api";
import { KEYBOARD_BUTTON_TEXT } from "../../utils/constant";
import TelegramBotType from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";
import { Types } from "mongoose";

const osu = require("node-os-utils");
const os = require("os");

// NOTE: You have to set at least one of callbackMessage OR callback function
// NOTE: If set isAdminButton to true all children buttons will be admin button
// NOTE: Set no need callback for repeated buttons
interface IBotKeyboardButton extends KeyboardButton {
    text: KEYBOARD_BUTTON_TEXT;
    isAdminButton?: boolean;
    noNeedCallback?: boolean;
    callbackMessage?: string;
    callback?: (message: Message) => void;
    children?: IBotKeyboardButton[][];
}

export class Keyboard {
    private readonly userService = new UserService();
    private adminChatIds: number[] = [];
    private readonly bot: TelegramBotType;
    private readonly botKeyboards: IBotKeyboardButton[][] = [
        [
            {
                text: KEYBOARD_BUTTON_TEXT.MANAGEMENT,
                callbackMessage: "به پنل ادمین خوش اومدی.",
                isAdminButton: true,
                children: [
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.SERVER_STATUS,
                            callback: this.onServerStatus.bind(this),
                            isAdminButton: true,
                        },
                    ],
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.BOT_STATISTICS,
                            callback: this.onBotStatistics.bind(this),
                            isAdminButton: true,
                        },
                    ],
                    [
                        {
                            text: KEYBOARD_BUTTON_TEXT.EXIT_ADMIN_PANEL,
                            callbackMessage: "از پنل ادمین خارج شدید.",
                            isAdminButton: true,
                            children: [
                                [
                                    {
                                        text: KEYBOARD_BUTTON_TEXT.MANAGEMENT,
                                        noNeedCallback: true,
                                    },
                                ],
                            ],
                        },
                    ],
                ],
            },
        ],
    ];

    constructor(data: {
        bot: TelegramBotType;
        botKeyboards?: IBotKeyboardButton[][];
    }) {
        if (data.botKeyboards) this.botKeyboards = data.botKeyboards;
        this.bot = data.bot;
    }

    private setButtonListener(keyboards: IBotKeyboardButton[]) {
        keyboards.forEach((button) => {
            if (button.children) {
                button.children.forEach((childButton) => {
                    this.setButtonListener(childButton);
                });
            }

            if (button.noNeedCallback) return;

            this.setNewKeyboard(button.text, (message) => {
                if (button.callback) {
                    this.onBeforeCallback(message, button, button.callback);
                }
                if (button.callbackMessage) {
                    this.onBeforeCallback(message, button, (message) => {
                        this.onKeyboardDefaultCallback(
                            message,
                            button.callbackMessage || "",
                            button.children
                        );
                    });
                }
            });
        });
    }

    private async onBeforeCallback(
        message: Message,
        button: IBotKeyboardButton,
        callback: (message: Message) => void
    ) {
        const isAdmin = this.adminChatIds.includes(message.chat.id);

        if (button.isAdminButton && !isAdmin) {
            this.bot.sendMessage(
                message.chat.id,
                "❌ شما به پنل ادمین دسترسی ندارید ❌"
            );
            return;
        }

        callback(message);
    }

    private async onKeyboardDefaultCallback(
        message: Message,
        callbackMessage: string,
        childrenKeyboards?: IBotKeyboardButton[][]
    ) {
        let keyboard: KeyboardButton[][] = [];
        if (childrenKeyboards) {
            keyboard = childrenKeyboards.map((child) => {
                if (!child) return [];

                return child.map((button) => ({
                    text: button.text,
                }));
            });
        }

        this.bot.sendMessage(message.chat.id, callbackMessage, {
            reply_markup: {
                resize_keyboard: true,
                keyboard,
            },
        });
    }

    // Keyboard callbacks
    private async onBotStatistics(message: Message) {
        const countAll = await this.userService.count();
        const countBannedUsers = await this.userService.count({
            is_ban: true,
        });

        this.bot.sendMessage(
            message.chat.id,
            `👤 تعداد کاربران : ${countAll} \n 🔞 تعداد کاربران بن شده : ${countBannedUsers}`
        );
    }

    private async onServerStatus(message: Message) {
        const cpu = osu.cpu;

        const info = await cpu.usage();

        this.bot.sendMessage(
            message.chat.id,
            ` 🗂 RAM : ${(
                os.totalmem() / 1024 / 1024 / 1024 -
                os.freemem() / 1024 / 1024 / 1024
            ).toFixed(2)}/${(os.totalmem() / 1024 / 1024 / 1024).toFixed(
                2
            )} GB\n🖥 Type : ${os.type}\n⚙️ CPU USAGE : ${info}%
                `
        );
    }

    // Set new keyboard button and add listener for it
    private async setNewKeyboard(
        text: KEYBOARD_BUTTON_TEXT,
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

    setupKeyboard() {
        this.botKeyboards.forEach((keyboardRow) => {
            this.setButtonListener(keyboardRow);
        });
    }

    async setAdmins(botObjectId: Types.ObjectId) {
        const admins = await this.userService.getAdmins();

        if (!admins) {
            this.adminChatIds = [];
            return;
        }
        this.adminChatIds = admins?.map((admin) => admin.chat_id);
    }
}
