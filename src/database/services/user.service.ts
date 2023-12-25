import { Types } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";
import { UserSchema, UserSchemaType } from "../schemas/User";
import { BaseService } from "./base.service";

export class UserService extends BaseService<UserSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.USER,
            schema: UserSchema,
        });
    }

    async addOrReplace(chatId: number, username: string, firstName: string) {
        const user = await this.findOne({ chat_id: chatId });

        if (!user) {
            await this.create({
                chat_id: chatId,
                user_name: username,
                first_name: firstName,
            });
        } else {
            user.user_name = username;
            user.first_name = firstName;

            await user.save();
        }

        return user;
    }

    async isAdmin(chatId: number, botToken: string) {
        try {
            const user = await this.findOne({ chat_id: chatId });

            if (!user) return false;

            return user.is_admin;
        } catch (error) {
            console.error("Error in isAdmin query: ", error);
        }
    }

    async getAdmins() {
        try {
            const users = await this.find({
                $or: [{ is_admin: true }],
            });

            return users;
        } catch (error) {
            console.error("Error in isAdmin query: ", error);
        }
    }
}
