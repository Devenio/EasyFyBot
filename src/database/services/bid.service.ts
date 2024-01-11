import { DATABASE_MODELS } from "../../utils/constant";
import { BidSchema, BidSchemaType } from "../schemas/Bid";
import { BaseService } from "./base.service";

export class BidService extends BaseService<BidSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.BID,
            schema: BidSchema,
        });
    }

    findActiveBids() {
        const currentDate = new Date();
    
        return this.find({
            is_active: true
        });
    }
}
