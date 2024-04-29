import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { getConnection, Repository } from "typeorm";
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { OrdersModule } from '../orders/orders.module';
import { Stock } from '../orders/entities/stock.entity';

describe('BooksController', () => {
  let controller: BooksController;
  let module: TestingModule;
  let bookRepo: Repository<Book>;
  let categoryRepo: Repository<Category>;
  let stockRepo: Repository<Stock>;
  const testCategory1 = {
    name: 'testC',
    description: 'descC',
  };
  const testBook1 = {
    title: 'test1',
    author: 'author1',
    description: 'desc1',
    price: 100,
    currentStock: 10,
  };
  const testBook2 = {
    title: 'test2',
    author: 'author2',
    description: 'desc2',
    price: 200,
    currentStock: 20,
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'test12345',
          password: 'test12345',
          database: 'test12345',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Book, Category]),
        OrdersModule,
      ],
      controllers: [BooksController],
      providers: [BooksService],
    }).compile();
    controller = module.get<BooksController>(BooksController);
    bookRepo = module.get<Repository<Book>>(getRepositoryToken(Book));
    categoryRepo = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    stockRepo = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  beforeEach(async () => {
    await stockRepo.delete({});
    await bookRepo.delete({});
    await categoryRepo.delete({});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const category = await controller.createCategory(testCategory1);
      expect(category).toMatchObject(testCategory1);
      expect(category).toHaveProperty('id');
    });
  });

  describe('findAllCategories', () => {
    it('should return an array of categories', async () => {
      await controller.createCategory(testCategory1);
      await controller.createCategory({ name: 'test222 ' });
      const categories = await controller.findAllCategories();
      expect(categories).toHaveLength(2);
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const category = await controller.createCategory(testCategory1);
      const updatedCategory = await controller.updateCategory(
        category.id.toString(),
        { name: 'test2' },
      );
      expect(updatedCategory).toMatchObject({ affected: 1 });
    });
  });

  describe('createBook', () => {
    it('should create a book', async () => {
      const category = await controller.createCategory(testCategory1);
      const book = await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { currentStock: _, price: __, ...rest } = testBook1;
      expect(book).toMatchObject(rest);
      expect(book).toHaveProperty('id');
      const stock = await stockRepo.findOne({ where: { bookId: book.id } });
      expect(stock).toMatchObject({
        bookId: book.id,
        availableQuantity: testBook1.currentStock,
      });
    });
  });

  describe('findOneBook', () => {
    it('should return a book', async () => {
      const category = await controller.createCategory(testCategory1);
      const book = await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      const foundBook = await controller.findOneBook(book.id.toString());
      expect(foundBook).toMatchObject({
        author: testBook1.author,
        title: testBook1.title,
        categoryId: book.categoryId,
      });
    });
  });

  describe('findBooks', () => {
    it('should return an array of books', async () => {
      const category = await controller.createCategory(testCategory1);
      await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      await controller.createBook({
        ...testBook2,
        categoryId: category.id,
      });
      const books = await controller.findBooks({ categoryId: category.id });
      expect(books).toHaveLength(2);
    });

    it('should return a book with filter', async () => {
      const category = await controller.createCategory(testCategory1);
      await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      await controller.createBook({
        ...testBook2,
        categoryId: category.id,
      });
      const books = await controller.findBooks({
        author: testBook1.author,
      });
      expect(books).toHaveLength(1);
      expect(books[0]).toMatchObject({
        author: testBook1.author,
        title: testBook1.title,
      });
    });
  });

  describe('updateBook', () => {
    it('should update a book', async () => {
      const category = await controller.createCategory(testCategory1);
      const book = await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      const updatedBook = await controller.update(book.id.toString(), {
        title: 'test2',
      });
      expect(updatedBook).toMatchObject({
        affected: 1,
      });
    });
  });

  describe('removeBook', () => {
    it('should remove a book', async () => {
      const category = await controller.createCategory(testCategory1);
      const book = await controller.createBook({
        ...testBook1,
        categoryId: category.id,
      });
      const removedBook = await controller.remove(book.id.toString());
      expect(removedBook).toHaveProperty('affected', 1);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
