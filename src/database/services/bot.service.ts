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
}
