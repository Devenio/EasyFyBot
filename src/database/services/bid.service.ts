import { DATABASE_MODELS } from "../../utils/constant";
import { BidSchema, BidSchemaType } from "../schemas/Bid";
import { ChannelSchema } from "../schemas/Channel";
import { BaseService } from "./base.service";

export class BidService extends BaseService<BidSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.BID,
            schema: BidSchema,
        });
    }

    findActiveBids() {
        const now = new Date();

        return this.find({
            start_date: { $lte: now.getTime() },
            expired_date: { $gte: now }
        })
    }
}
