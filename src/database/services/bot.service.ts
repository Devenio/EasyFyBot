import { DATABASE_MODELS } from "../../utils/constant";
import { BaseService } from "./base.service";
import { BotSchema, BotSchemaType } from "../schemas/Bot";

export class BotService extends BaseService<BotSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.BOT,
            schema: BotSchema,
        });
    }

    async addUser(botToken: string, userId: string) {
        try {
            const bot = await this.findOne({ token: botToken })

            const response = await this.collection.findByIdAndUpdate(
                bot?._id,
                {
                    $push: {
                        users: userId,
                    },
                },
                {
                    new: true,
                    useFindAndModify: false,
                }
            );
            return response;
        } catch (error) {
            console.error("Unable to find: ", error);
        }
    }
}
