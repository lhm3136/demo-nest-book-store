import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SessionGuard } from '../auths/guards/session.guard';
import { QueryBookDto } from './dto/query-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseGuards(SessionGuard)
  @Post('category')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.booksService.createCategory(createCategoryDto);
  }

  @Get('category/query')
  async findAllCategories() {
    return await this.booksService.findAllCategories();
  }

  @UseGuards(SessionGuard)
  @Patch('category/query/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.booksService.updateCategory(+id, updateCategoryDto);
  }

  @UseGuards(SessionGuard)
  @Post('book')
  async createBook(@Body() createBookDto: CreateBookDto) {
    return await this.booksService.createBook(createBookDto);
  }

  @Get('book/query/:id')
  async findOneBook(@Param('id') id: string) {
    return await this.booksService.findOneBook(+id);
  }

  @Get('book/query')
  async findBooks(@Query() query: QueryBookDto) {
    return await this.booksService.findBooks(query);
  }

  @UseGuards(SessionGuard)
  @Patch('book/:id')
  async update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return await this.booksService.updateBook(+id, updateBookDto);
  }

  @UseGuards(SessionGuard)
  @Delete('book/:id')
  async remove(@Param('id') id: string) {
    return await this.booksService.removeBook(+id);
  }
}
