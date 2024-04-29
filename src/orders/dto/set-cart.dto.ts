import { IsInt, IsNotEmpty } from 'class-validator';

export class SetCartDto {
  @IsInt()
  @IsNotEmpty()
  bookId: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
