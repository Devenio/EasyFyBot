import { KeyboardButton, Message } from "node-telegram-bot-api";
import { ADMIN_KEYBOARDS } from "../../utils/constant";
import TelegramBotType from "node-telegram-bot-api";
import { UserService } from "../../database/services/user.service";

const osu = require("node-os-utils");
const os = require("os");

export class Keyboard {
    private readonly userService = new UserService();
    private isAdmin = false;
    private readonly bot: TelegramBotType;
    private readonly botKeyboards: IBotKeyboardButtons[][] = [
        [
            {
                text: ADMIN_KEYBOARDS.MANAGEMENT,
                callbackMessage: "به پنل ادمین خوش اومدی.",
                isAdminButton: true,
                children: [
                    [
                        {
                            text: ADMIN_KEYBOARDS.SERVER_STATUS,
                            callback: this.onServerStatus.bind(this),
                        },
                    ],
                    [
                        {
                            text: ADMIN_KEYBOARDS.BOT_STATISTICS,
                            callback: this.onBotStatistics.bind(this),
                        },
                    ],
                    [
                        {
                            text: ADMIN_KEYBOARDS.EXIT_ADMIN_PANEL,
                            callbackMessage: "از پنل ادمین خارج شدید.",
                            children: [[{ text: ADMIN_KEYBOARDS.MANAGEMENT }]],
                        },
                    ],
                ],
            },
        ],
    ];

    constructor(data: { bot: TelegramBotType }) {
        this.bot = data.bot;
    }

    private setKeyboardButtonsListeners() {
        this.botKeyboards.forEach((keyboardRow) => {
            this.setButtonListener(keyboardRow);
        });
    }

    private setButtonListener(keyboards: IBotKeyboardButtons[]) {
        keyboards.forEach((button) => {
            if (button.isAdminButton && !this.isAdmin) {
                return;
            }
            if (button.children) {
                button.children.forEach((childButton) => {
                    this.setButtonListener(childButton);
                });
            }

            this.setNewKeyboard(button.text, (message) => {
                if (button.callback) {
                    button.callback(message);
                }
                if (button.callbackMessage) {
                    this.onKeyboardDefaultCallback(
                        message,
                        button.callbackMessage,
                        button.children
                    );
                }
            });
        });
    }

    private async onKeyboardDefaultCallback(
        message: Message,
        callbackMessage: string,
        childrenKeyboards?: IBotKeyboardButtons[][]
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

    setupKeyboard(isAdmin: boolean) {
        this.isAdmin = isAdmin;
        this.setKeyboardButtonsListeners();
    }
}

// NOTE: You have to set at least one of callbackMessage OR callback function
// NOTE: If set isAdminButton to true all children buttons will be admin button
interface IBotKeyboardButtons extends KeyboardButton {
    text: ADMIN_KEYBOARDS;
    isAdminButton?: boolean;
    callbackMessage?: string;
    callback?: (message: Message) => void;
    children?: IBotKeyboardButtons[][];
}
