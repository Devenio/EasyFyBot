import { DATABASE_MODELS } from "../../utils/constant";
import { ChannelSchema, ChannelSchemaType } from "../schemas/Channel";
import { BaseService } from "./base.service";

export class ChannelService extends BaseService<ChannelSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.CHANNEL,
            schema: ChannelSchema,
        });
    }
}
