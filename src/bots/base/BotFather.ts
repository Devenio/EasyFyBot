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
import {
    AVAILABLE_PROP_FIRMS,
    AccountSchemaType,
} from "../../database/schemas/Account";
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
    private banUsersChatIds: number[] = [];

    private selectedAccountId = "";

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

    private async updateBanUsers() {
        const banUsers = await this.getBanUsersChatIds();
        this.banUsersChatIds = banUsers;
        this.botKeyboards?.setBanUsers(banUsers);
    }

    private async getAdminChatIds() {
        const admins = await this.userService.getAdmins();

        if (!admins) {
            return [];
        }
        return admins?.map((admin) => admin.chat_id);
    }

    private async getBanUsersChatIds() {
        const banUsers = await this.userService.getBanUsers();

        if (!banUsers) {
            return [];
        }
        return banUsers?.map((admin) => admin.chat_id);
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

        this.userService.addOrReplace(chatId, username || "", first_name || "");

        const notJoinedChannels = await this.checkLockedChannels(chatId);
        if (notJoinedChannels.length) {
            await this.sendLockChannels(chatId, notJoinedChannels);
            return;
        }

        if (message.text === "/start") {
            this.updateAdmins();
            this.updateBanUsers();
            const replyMarkups = await this.getStartReplyMarkups(message);
            this.onStart(message, replyMarkups);
        }

        if (
            message.text?.startsWith("/start") &&
            message.text?.split(" ").length == 2
        ) {
            // For Query start
        }

        const numberRegex = /^[0-9]+$/;
        if (numberRegex.test(message.text || "")) {
            if (!this.selectedAccountId) return;
            const bidPrice = +(message.text || 0);

            const account = await this.accountService.findById(
                this.selectedAccountId
            );

            if (!account) return;

            const propfirms = {
                [AVAILABLE_PROP_FIRMS.SGB]: "سرمایه گذار برتر",
                [AVAILABLE_PROP_FIRMS.PROPIY]: "پراپی",
                [AVAILABLE_PROP_FIRMS.TAMIN_SARMAYE]: "تامین سرمایه",
            };
            const propfirm = propfirms[account.prop_firm];

            if (bidPrice < account.min_bid_price) {
                this.bot.sendMessage(
                    chatId,
                    `
❌ قیمت پیشنهادی شما نمیتوانید از حداقل قیمت پیشنهادی اکانت کمتر باشد.

◀️ حداقل قیمت پیشنهادی برای این اکانت: ${account.min_bid_price.toLocaleString()} تتر
                `
                );

                return;
            }

            const bidOrder = await this.bidOrderService.findAccountBidOrder(
                chatId,
                this.selectedAccountId
            );
            if (!bidOrder) {
                await this.bidOrderService.addNewOrder(
                    chatId,
                    this.selectedAccountId,
                    bidPrice
                );

                this.bot.sendMessage(
                    chatId,
                    `✅ پیشنهاد شما به قیمت ${bidPrice.toLocaleString()} تتر روی اکانت ${account.fund.toLocaleString()} دلاری پراپ فرم ${propfirm} ثبت شد.`
                );

                this.selectedAccountId = "";
                return;
            }

            if (
                bidOrder &&
                bidOrder?.bid_price &&
                bidOrder?.bid_price > bidPrice
            ) {
                this.bot.sendMessage(
                    chatId,
                    `
❌ پیشنهاد شما باید از بیشترین قیمت پیشنهاد شده توسط خودتان، بیشتر باشد.

◀️ بیشترین قیمت پیشنهادی شما: ${bidOrder.bid_price} تتر
                `
                );
                return;
            }

            await this.bidOrderService.updateOrder(bidOrder._id, bidPrice);
            this.bot.sendMessage(
                chatId,
                `✅ پیشنهاد شما به قیمت ${bidPrice.toLocaleString()} تتر روی اکانت ${account.fund.toLocaleString()} دلاری پراپ فرم ${propfirm} ثبت شد.`
            );
        }
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

        if (callbackQuery.data?.startsWith(CALLBACK_QUERY.LIST_BID_ACCOUNTS)) {
            const bidId = callbackQuery.data.substring(
                CALLBACK_QUERY.LIST_BID_ACCOUNTS.length
            );

            const bidWithAccounts = await this.bidService.findBidAccounts(
                bidId
            );

            if (!bidWithAccounts) return;

            this.bot.answerCallbackQuery(callbackQuery.id, {
                text: "نمایش اکانت های مزایده ",
            });

            await this.bot.sendMessage(
                chatId,
                `◀️ لیست اکانت های مزایده شماره ${bidWithAccounts?.bid_id}:`
            );

            bidWithAccounts.accounts.forEach(async (acc) => {
                this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: "ثبت پیشنهاد",
                });

                const account = acc as unknown as AccountSchemaType;

                const propfirms = {
                    [AVAILABLE_PROP_FIRMS.SGB]: "سرمایه گذار برتر",
                    [AVAILABLE_PROP_FIRMS.PROPIY]: "پراپی",
                    [AVAILABLE_PROP_FIRMS.TAMIN_SARMAYE]: "تامین سرمایه",
                };
                const propfirm = propfirms[account.prop_firm];
                const fund = account.fund.toLocaleString();
                const minBidPrice = account.min_bid_price.toLocaleString();

                const highestBidPrice =
                    // @ts-ignore
                    await this.accountService.findHighestBidPrice(account._id);

                const highestBidPriceMessage = highestBidPrice
                    ? `${highestBidPrice} تتر`
                    : "پیشنهادی ثبت نشده";
                const message = `◀️ پراپ فرم: ${propfirm}\n◀️ سرمایه: ${fund} دلار\n\n🟢 حداقل قیمت پیشنهادی: ${minBidPrice} تتر\n🟢 بالاترین قیمت پیشنهاد شده تا الان: ${highestBidPriceMessage}`;

                this.bot.sendMessage(chatId, message, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🟢 ثبت پیشنهاد",
                                    callback_data:
                                        // @ts-ignore
                                        CALLBACK_QUERY.BID_ON + account._id,
                                },
                            ],
                        ],
                    },
                });
            });
        }

        if (callbackQuery.data?.startsWith(CALLBACK_QUERY.BID_ON)) {
            const accountId = callbackQuery.data.substring(
                CALLBACK_QUERY.BID_ON.length
            );

            this.bot.answerCallbackQuery(callbackQuery.id, {
                text: "ثبت پیشنهاد",
            });

            this.selectedAccountId = accountId;

            const account = await this.accountService.findById(accountId);

            if (!account) return;

            const propfirms = {
                [AVAILABLE_PROP_FIRMS.SGB]: "سرمایه گذار برتر",
                [AVAILABLE_PROP_FIRMS.PROPIY]: "پراپی",
                [AVAILABLE_PROP_FIRMS.TAMIN_SARMAYE]: "تامین سرمایه",
            };
            const propfirm = propfirms[account.prop_firm];

            const message = `
🔰 قیمت پیشنهادی خود را برای اکانت ${account.fund.toLocaleString()} دلاری پراپ فرم ${propfirm} وارد کنید:

📔 قبل از ثبت پیشنهاد نکات زیر رو مطالعه کنید: 
❗️  لطفا فقط یک عدد در واحد تتر وارد کنید. مثال: 250
❗️ قیمت  پیشنهادی شما نمیتواند کمتر از ${account.min_bid_price.toLocaleString()} تتر باشد.
❗️ در صورت وارد کردن بیشترین پیشنهاد و برنده شدن در مزایده و پرداخت نکردن هزینه به مدت 1 ماه از بات بن میشوید پس قبل از ثبت پیشنهاد دقت کنید.
❗️ میتوانید قیمت پیشنهادی کمتری از بالاترین قیمت پیشنهاد شده داشته باشید و در صورت پرداخت نشدن پیشنهاد های بالاتر شانس در بردن مزایده داشته باشید.
❗️ در صورت وارد کردن قیمت پیشنهادی بیش از یک بار، بالاترین قیمت پیشنهادی شما ثبت میشود.
❗️ در صورت برنده شدن در مزایده از طرف ادمین به شما پیام داده میشود و 30 دقیقه فرصت دارید قیمت پیشنهادی خودتون رو واریز کنید و اکانت را تحویل بگیرید.
`;

            this.bot.sendMessage(chatId, message, {
                // @ts-ignore
                reply_markup: { input_field_placeholder: "مثال: 250" },
            });
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
        const isAdmin = await this.userService.isAdmin(message.chat.id);

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
