import { DATABASE_MODELS } from "../../utils/constant";
import { UserSchema, UserSchemaType } from "../schemas/User";
import { BaseService } from "./base.service";
import { BotService } from "./bot.service";

export class UserService extends BaseService<UserSchemaType> {
    private readonly botService = new BotService();

    constructor() {
        super({
            modelName: DATABASE_MODELS.USER,
            schema: UserSchema,
        });
    }

    async addOrReplace(chatId: number, username: string, firstName: string, botToken: string) {
        const user = await this.findOne({ chat_id: chatId });

        if (!user) {
            const createdUser = await this.create({
                chat_id: chatId,
                user_name: username,
                first_name: firstName,
            });

            await this.botService.addUser(botToken, createdUser?._id as string)
        } else {
            await user.set({
                user_name: username,
                first_name: firstName,
            });
            await user.save();
        }

        return user;
    }

    async isAdmin(chatId: number, botToken: string) {
        try {
            const user = await this.findOne({ chat_id: chatId });
            const bot = await this.botService.findOne({ token: botToken });

            if (!user || !bot) return false;

            return user.is_super_admin || user.admin_bot_ids?.includes(bot._id);
        } catch (error) {
            console.error("Error in isAdmin query: ", error);
        }
    }
}