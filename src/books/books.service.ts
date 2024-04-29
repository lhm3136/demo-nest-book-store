import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { OrdersService } from '../orders/orders.service';
import { QueryBookDto } from './dto/query-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private ordersService: OrdersService,
  ) {}

  createCategory(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryRepository.update({ id }, updateCategoryDto);
  }

  findAllCategories() {
    return this.categoryRepository.find();
  }

  async createBook(createBookDto: CreateBookDto) {
    const { currentStock, ...data } = createBookDto;
    return await this.entityManager.transaction(async (txManager) => {
      const bookModel = txManager.create(Book, data);
      const book = await txManager.save(bookModel);
      await this.ordersService.createStock(book.id, currentStock, txManager);
      return book;
    });
  }

  async findBooks(query: QueryBookDto) {
    const qb = this.bookRepository.createQueryBuilder().where('1 = 1');
    if (query.categoryId) {
      qb.andWhere('categoryId = :id', { id: query.categoryId });
    }
    if (query.title) {
      qb.andWhere('title like :title', { title: `%${query.title}%` });
    }
    if (query.author) {
      qb.andWhere('author like :author', { author: `%${query.author}%` });
    }
    if (query.price !== undefined && query.price !== null) {
      qb.andWhere('price <= :price', { price: query.price });
    }
    if (query.rating !== undefined && query.rating !== null) {
      qb.andWhere('rating >= :rating', { rating: query.rating });
    }
    if (query?.page && query.limit) {
      qb.skip(query.page * query.limit);
    }
    if (query?.limit) {
      qb.take(query.limit);
    }
    qb.innerJoin('Book.category', 'Category', 'Category.id = Book.categoryId');
    //Order by created date or other value as needed
    qb.orderBy('Book.createdAt', 'DESC');
    return qb.getMany();
  }

  findOneBook(id: number) {
    return this.bookRepository.findOneBy({ id });
  }

  updateBook(id: number, updateBookDto: UpdateBookDto) {
    return this.bookRepository.update({ id }, updateBookDto);
  }

  removeBook(id: number) {
    return this.bookRepository.softDelete(id);
  }
}
