import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        if (metadata.type !== 'body') return value;
        try {
            return this.schema.parse(value);
        } catch (error: any) {
            if (error && error.errors) {
                // Format Zod errors into a readable string or array
                const messages = error.errors.map((e: any) => {
                    const field = e.path.join('.');
                    return `${field ? field + ': ' : ''}${e.message}`;
                });
                throw new BadRequestException(messages);
            }
            throw new BadRequestException('Validation failed');
        }
    }
}
