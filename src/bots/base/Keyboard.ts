import TelegramBotType, {
    KeyboardButton,
    Message,
} from "node-telegram-bot-api";
import { KEYBOARD_LAYOUTS } from "./KeyboardConfigurationProvider";

// NOTE: You have to set at least one of callbackMessage OR callback function
// NOTE: If set isAdminButton to true all children buttons will be admin button
// NOTE: Set no need callback for repeated buttons
export interface IBotKeyboardButton extends KeyboardButton {
    text: string;
    isAdminButton?: boolean;
    callbackMessage?: string;
    callbackId?: string;
    callback?: (message: Message) => void;
    subLayoutId?: string;
}
type KeyboardLayoutFunction = (param?: any) => IBotKeyboardButton[][];
export interface IKeyboardLayout {
    [key: string]: KeyboardLayoutFunction;
}

export class Keyboard {
    private adminChatIds: number[] = [];

    constructor(
        private botInstance: TelegramBotType,
        private layouts: IKeyboardLayout,
        private callbacks: Map<string, Function>
    ) {}

    // Sets up the listeners for button callbacks
    initialize() {
        const layouts = Object.values(this.layouts);

        for (const layout of layouts) {
            layout().forEach((keyboardRow) => {
                this.setButtonListener(keyboardRow);
            });
        }
    }

    private setButtonListener(keyboardRow: IBotKeyboardButton[]) {
        keyboardRow.forEach((button) => {
            this.setNewKeyboard(button.text, (message) => {
                if (button.callbackId) {
                    this.onBeforeCallback(message, button, {
                        callback: button.callback,
                        callbackId: button.callbackId,
                    });
                }
                if (button.callbackMessage) {
                    const buttonSubLayout = button.subLayoutId
                        ? this.layouts[button.subLayoutId]()
                        : [];

                    const callback = (message: Message) => {
                        this.onKeyboardDefaultCallback(
                            message,
                            button.callbackMessage || "",
                            buttonSubLayout
                        );
                    };

                    this.onBeforeCallback(message, button, {
                        callback,
                    });
                }
            });
        });
    }

    private async onBeforeCallback(
        message: Message,
        button: IBotKeyboardButton,
        options: {
            callbackId?: string;
            callback?: (message: Message) => void;
        }
    ) {
        const isAdmin = this.adminChatIds.includes(message.chat.id);

        if (button.isAdminButton && !isAdmin) {
            this.botInstance.sendMessage(
                message.chat.id,
                "❌ شما به پنل ادمین دسترسی ندارید ❌",
                {
                    reply_markup: {
                        remove_keyboard: true,
                    },
                }
            );
            return;
        }

        if (options.callback) {
            options.callback(message);
            return;
        }

        if (!options.callbackId) {
            console.error("Set callback or callback id");
            return;
        }

        const callbackMethod = this.callbacks.get(options.callbackId);

        if (!callbackMethod) {
            console.error(
                `Error in button callback. You don't set any callback with callback id: ${options.callbackId}`
            );
            return;
        }

        callbackMethod(message);
    }

    private async onKeyboardDefaultCallback(
        message: Message,
        callbackMessage: string,
        subLayout?: IBotKeyboardButton[][]
    ) {
        let keyboard: KeyboardButton[][] = [];
        if (subLayout) {
            keyboard = subLayout.map((child) => {
                if (!child) return [];

                return child.map((button) => ({
                    text: button.text,
                    request_contact: button.request_contact
                }));
            });
        }

        this.botInstance.sendMessage(message.chat.id, callbackMessage, {
            reply_markup: {
                resize_keyboard: true,
                keyboard,
            },
        });
    }

    // Set new keyboard button and add listener for it
    private readonly settledButtonsListeners: string[] = [];
    private async setNewKeyboard(
        text: string,
        callback: (message: Message) => void
    ) {
        if (this.settledButtonsListeners.includes(text)) return text;

        this.botInstance.on("text", (message) => {
            if (message.text === text) {
                callback(message);
            }
        });

        this.settledButtonsListeners.push(text);

        return {
            text,
        };
    }

    async setAdmins(adminChatIds: number[]) {
        this.adminChatIds = adminChatIds;
    }
}
