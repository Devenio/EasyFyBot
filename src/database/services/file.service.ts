import { DATABASE_MODELS } from "../../utils/constant";
import { FileSchema, FileSchemaType } from "../schemas/File";
import { BaseService } from "./base.service";

export class FileService extends BaseService<FileSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.FILE,
            schema: FileSchema,
        });
    }
}
