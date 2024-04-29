import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { OrdersService } from '../orders/orders.service';
import { EntityManager, Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateBookDto } from './dto/create-book.dto';

describe('BooksService', () => {
  let service: BooksService;
  let ordersService: OrdersService;
  let entityManager: EntityManager;
  let bookRepository: Repository<Book>;
  let categoryRepository: Repository<Category>;

  const BOOK_REPOSITORY_TOKEN = getRepositoryToken(Book);
  const CATEGORY_REPOSITORY_TOKEN = getRepositoryToken(Category);

  beforeEach(async () => {
    const mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any as EntityManager;

    entityManager = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    } as any as EntityManager;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: OrdersService,
          useValue: {
            createStock: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
        {
          provide: BOOK_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 } as any),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 } as any),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    ordersService = module.get<OrdersService>(OrdersService);
    bookRepository = module.get<Repository<Book>>(BOOK_REPOSITORY_TOKEN);
    categoryRepository = module.get<Repository<Category>>(
      CATEGORY_REPOSITORY_TOKEN,
    );
  });

  it('Services should be defined', () => {
    expect(service).toBeDefined();
    expect(ordersService).toBeDefined();
  });

  it('repos should be defined', () => {
    expect(bookRepository).toBeDefined();
    expect(categoryRepository).toBeDefined();
  });

  it('createCategory', async () => {
    const createCategoryDto = { name: 'test' };
    const category = { id: 1, ...createCategoryDto };
    jest.spyOn(categoryRepository, 'create').mockReturnValue(category as any);
    jest.spyOn(categoryRepository, 'save').mockResolvedValue(category as any);
    expect(await service.createCategory(createCategoryDto)).toEqual(category);
  });

  it('updateCategory', async () => {
    const updateCategoryDto = { name: 'test' };
    expect(await service.updateCategory(1, updateCategoryDto)).toEqual({
      affected: 1,
    });
  });

  it('findAllCategories', async () => {
    const categories = [{ id: 1, name: 'test' }];
    jest.spyOn(categoryRepository, 'find').mockResolvedValue(categories as any);
    expect(await service.findAllCategories()).toEqual(categories);
  });

  it('createBook', async () => {
    const createBookDto = {
      title: 'test',
      currentStock: 10,
    } as any as CreateBookDto;
    const book = { id: 1, title: createBookDto.title };
    entityManager.transaction = jest.fn().mockImplementation(
      (cb) =>
        cb({
          create: jest.fn().mockReturnValue(book as any),
          save: jest.fn().mockResolvedValue(book as any),
        }) as any,
    );
    expect(await service.createBook(createBookDto)).toEqual(book);
  });

  describe('findBooks', () => {
    it('should find books', async () => {
      const query = { categoryId: 1, title: 'test' };
      const books = [{ id: 1, title: 'test' }];
      jest.spyOn(bookRepository, 'createQueryBuilder').mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(books as any),
      } as any);
      await service.findBooks(query);
      expect(bookRepository.createQueryBuilder).toHaveBeenCalled();
      expect(bookRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        'categoryId = :id',
        { id: query.categoryId },
      );
    });
  });

  describe('findOneBook', () => {
    it('should find book by id', async () => {
      await service.findOneBook(1);
      expect(bookRepository.findOneBy).toHaveBeenCalled();
    });
  });

  describe('updateBook', () => {
    it('should update book', async () => {
      const updateBookDto = { title: 'test' };
      const res = await service.updateBook(1, updateBookDto);
      expect(res).toEqual({
        affected: 1,
      });
    });
  });

  describe('removeBook', () => {
    it('should remove book', async () => {
      await service.removeBook(1);
      expect(bookRepository.softDelete).toHaveBeenCalled();
    });
  });
});
