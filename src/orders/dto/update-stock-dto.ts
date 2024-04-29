import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  @IsNotEmpty()
  bookId: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
