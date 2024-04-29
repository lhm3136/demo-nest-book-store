import { IsInt, IsOptional } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';

export class QueryBookDto extends PartialType(
  PickType(CreateBookDto, ['title', 'categoryId', 'author', 'price', 'rating']),
) {
  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}
