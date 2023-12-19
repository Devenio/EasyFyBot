import { DATABASE_MODELS } from "../../utils/constant";
import { UserSchema, UserSchemaType } from "../schemas/User";
import { BaseService } from "./base.service";

export class UserService extends BaseService<UserSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.USER,
            schema: UserSchema
        })
    }

    async addOrReplace(chatId: number, username: string, firstName: string) {
        const user = await this.findOne({ chat_id: chatId });

        if(!user) {
            await this.create({chat_id: chatId, user_name: username, first_name: firstName});
        } else {
            await user.set({
                user_name: username,
                first_name: firstName,
            });
            await user.save();
        }

        return user;
    }
}
