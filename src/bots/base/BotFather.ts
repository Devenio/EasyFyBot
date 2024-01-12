// TODO: add services to an index for importing
import TelegramBotType, {
    CallbackQuery,
    Message,
    ReplyKeyboardMarkup,
} from "node-telegram-bot-api";
import { ChannelService } from "../../database/services/channel.service";
import { UserService } from "../../database/services/user.service";
import { CALLBACK_QUERY, KEYBOARD_BUTTON_TEXT } from "../../utils/constant";
import { Keyboard } from "./Keyboard";
import {
    KEYBOARD_LAYOUTS,
    KeyboardConfigurationProvider,
} from "./KeyboardConfigurationProvider";
import { BidService } from "../../database/services/bid.service";
import { AVAILABLE_PROP_FIRMS, AccountSchemaType } from "../../database/schemas/Account";
import { BidOrderService } from "../../database/services/bidOrder.service";
import { AccountService } from "../../database/services/account.service";

const TelegramBot = require("node-telegram-bot-api");
const cloneDeep = require("lodash.clonedeep");

export default abstract class BotFather {
    private readonly userService = new UserService();
    private readonly channelService = new ChannelService();
    private readonly bidService = new BidService();
    private readonly bidOrderService = new BidOrderService();
    private readonly accountService = new AccountService();

    // if false video and photos will directly send to channel
    private isOnSaveMode = true;

    private readonly keyboardConfig;
    private readonly token: string = "";
    private botKeyboards: Keyboard | null = null;
    private adminChatIds: number[] = [];

    private lockChannels: ILockChannels[] = [];
    private mainChannelId = "-1001949613578";
    public readonly bot: TelegramBotType;

    constructor(params: { token: string; name: string }) {
        this.token = params.token;
        this.bot = new TelegramBot(params.token, {
            polling: true,
        });

        this.setLockChannels();

        this.keyboardConfig = new KeyboardConfigurationProvider(this.bot);
        this.botKeyboards = new Keyboard(
            this.bot,
            this.keyboardConfig.getLayouts(),
            this.keyboardConfig.getCallbacks()
        );
        this.botKeyboards.initialize();

        this.bot.on("message", (message) => this.onMessage(message));
        this.bot.on("video", (message) => this.onVideo(message));
        this.bot.on("photo", (message) => this.onPhoto(message));
        this.bot.on("text", (message) => this.onText(message));
        this.bot.on("contact", (message) => this.onContact(message));
        this.bot.on("callback_query", (callbackQuery) =>
            this.onCallbackQuery(callbackQuery)
        );
    }

    // Initial setups
    private async setLockChannels() {
        const channels = await this.channelService.find({});

        if (!channels) this.lockChannels = [];

        this.lockChannels = channels?.map(({ channel_id, name, url }) => ({
            id: channel_id,
            name,
            url,
            isJoined: false,
        })) as ILockChannels[];
    }

    private async updateAdmins() {
        const adminChatIds = await this.getAdminChatIds();
        this.adminChatIds = adminChatIds;
        this.botKeyboards?.setAdmins(adminChatIds);
    }

    private async getAdminChatIds() {
        const admins = await this.userService.getAdmins();

        if (!admins) {
            return [];
        }
        return admins?.map((admin) => admin.chat_id);
    }

    // Events
    private async onMessage(message: Message) {
        return;
    }

    private async onPhoto(message: Message) {
        return;
    }

    private async onVideo(message: Message) {
        return;
    }

    private async onContact(message: Message) {
        await this.userService.findOneAndUpdate(
            {
                chat_id: message.chat.id,
            },
            { phone: message.contact?.phone_number },
            { new: true }
        );

        const replyMarkups = await this.getStartReplyMarkups(message);

        this.bot.sendMessage(
            message.chat.id,
            "شماره دریافت شد ✅\n⚡️ حالا میتونید از خدمات ربات استفاده کنید:",
            {
                reply_markup: replyMarkups,
            }
        );
    }

    private async onText(message: Message) {
        const { id: chatId, username, first_name } = message.chat;

        const notJoinedChannels = await this.checkLockedChannels(chatId);
        if (notJoinedChannels.length) {
            await this.sendLockChannels(chatId, notJoinedChannels);
            return;
        }

        if (message.text === "/start") {
            this.updateAdmins();
            const replyMarkups = await this.getStartReplyMarkups(message);
            this.onStart(message, replyMarkups);
        }

        if (
            message.text?.startsWith("/start") &&
            message.text?.split(" ").length == 2
        ) {
            // For Query start
        }

        await this.userService.addOrReplace(
            chatId,
            username || "",
            first_name || ""
        );
    }

    async onStart(message: Message, startReplyMarkups: ReplyKeyboardMarkup) {
        this.bot.sendMessage(
            message.chat.id,
            `❤️‍🔥 سلام ${message.chat.first_name} به ربات مزایده اکانت های پراپ فرم تیم "@BLPMaster" خوش اومدی ❤️‍🔥`,
            {
                reply_markup: {
                    ...startReplyMarkups,
                },
            }
        );
    }

    private async onCallbackQuery(callbackQuery: CallbackQuery) {
        if (!callbackQuery.message) return;
        const chatId = callbackQuery.message?.chat.id;

        if (callbackQuery.data === CALLBACK_QUERY.JOINED_CHANNELS) {
            const notJoinedChannels = await this.checkLockedChannels(chatId);

            if (!notJoinedChannels.length) {
                this.bot.deleteMessage(
                    chatId,
                    callbackQuery.message.message_id
                );
                this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: "ممنون بابت عضو شدن!",
                });

                this.bot.sendMessage(
                    chatId,
                    "حالا برو از چنل نودلین هر فیلم و عکسی که میخوای رو انتخاب کن @NudeLean ❤️‍🔥"
                );
            } else {
                this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: "هنوز که عضو نشدی🫠",
                });
            }
        }

        if(callbackQuery.data?.startsWith(CALLBACK_QUERY.LIST_BID_ACCOUNTS)) {
            const bidId = callbackQuery.data.substring(CALLBACK_QUERY.LIST_BID_ACCOUNTS.length);


            const bidWithAccounts =  await this.bidService.findBidAccounts(bidId)

            if(!bidWithAccounts) return;

            this.bot.answerCallbackQuery(callbackQuery.id, {
                text: "نمایش اکانت های مزایده "
            });

            await this.bot.sendMessage(chatId, `◀️ لیست اکانت های مزایده شماره ${bidWithAccounts?.bid_id}:`);

            bidWithAccounts.accounts.forEach(async (acc) => {
                const account = (acc as unknown as AccountSchemaType);
                const propfirms = {
                    [AVAILABLE_PROP_FIRMS.SGB]: "سرمایه گذار برتر",
                    [AVAILABLE_PROP_FIRMS.PROPIY]: "پراپی",
                    [AVAILABLE_PROP_FIRMS.TAMIN_SARMAYE]: "تامین سرمایه",
                }
                const propfirm = propfirms[account.prop_firm];
                const fund = account.fund.toLocaleString();
                const minBidPrice = account.min_bid_price.toLocaleString();

                // @ts-ignore
                const highestBidPrice = await this.accountService.findHighestBidPrice(account._id);

                const message = `◀️ پراپ فرم: ${propfirm}\n◀️ سرمایه: ${fund} دلار\n\n🟢 حداقل قیمت پیشنهادی: ${minBidPrice} تتر\n🟢 بالاترین قیمت پیشنهاد شده تا الان: ${highestBidPrice} تتر`

                this.bot.sendMessage(chatId, message);
            })
        }
    }

    // Utils functions
    private async checkLockedChannels(chatId: number) {
        if (!this.lockChannels.length) return [];

        const channels = cloneDeep(this.lockChannels) as ILockChannels[];

        for (const channel of channels) {
            try {
                const chatMember = await this.bot.getChatMember(
                    channel.id,
                    chatId
                );

                if (
                    chatMember.status === "creator" ||
                    chatMember.status === "member" ||
                    chatMember.status === "administrator"
                ) {
                    channel.isJoined = true;
                } else {
                    channel.isJoined = false;
                }
            } catch (error) {
                console.error("Error in checking lock channels: ", error);
            }
        }

        return channels.filter((channel) => !channel.isJoined);
    }

    private async sendLockChannels(
        userId: number,
        notJoinedChannels: ILockChannels[]
    ) {
        const joinMessage = `برای استفاده از ربات تو چنلای زیر عضو شو 🫠:`;

        this.bot.sendMessage(userId, joinMessage, {
            reply_markup: {
                inline_keyboard: [
                    ...notJoinedChannels.map((channel) => {
                        return [{ text: channel.name, url: channel.url }];
                    }),
                    [
                        {
                            text: "جوین شدم ✅",
                            callback_data: CALLBACK_QUERY.JOINED_CHANNELS,
                        },
                    ],
                ],
            },
        });
    }

    private async getStartReplyMarkups(message: Message) {
        const isAdmin = await this.userService.isAdmin(
            message.chat.id
        );

        const replyMarkup: ReplyKeyboardMarkup = {
            resize_keyboard: true,
            keyboard: this.keyboardConfig.getLayoutKeyboards(
                KEYBOARD_LAYOUTS.USER_MAIN
            ),
        };

        if (isAdmin) {
            const adminKeyboardLayout = this.keyboardConfig.getLayoutKeyboards(
                KEYBOARD_LAYOUTS.ADMIN_MAIN
            );
            replyMarkup.keyboard = adminKeyboardLayout;
        }

        return replyMarkup;
    }

    isAdmin(chatId: number) {
        return this.adminChatIds.includes(chatId);
    }
}

interface ILockChannels {
    id: string;
    name: string;
    url: string;
    isJoined: boolean;
}
