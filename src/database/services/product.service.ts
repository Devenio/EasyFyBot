import { DATABASE_MODELS } from "../../utils/constant";
import { ProductSchema, ProductSchemaType } from './../schemas/Product';
import { BaseService } from "./base.service";

export class ProductService extends BaseService<ProductSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.PRODUCT,
            schema: ProductSchema,
        });
    }
}
