import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import type { InstitutionalPage } from '@flor/database';
import type { CreatePageDto } from './dto/create-page.dto';
import type { UpdatePageDto } from './dto/update-page.dto';
import type { ListPagesQuery } from './dto/list-pages.query';

function normalizeNullableString(
  v: string | null | undefined,
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function parseSort(sort?: string): {
  field: keyof InstitutionalPage;
  dir: 'asc' | 'desc';
} {
  const raw = sort ?? 'sortOrder:asc';
  const [f, d] = raw.split(':');
  const field = (
    ['title', 'slug', 'sortOrder', 'updatedAt'].includes(f) ? f : 'sortOrder'
  ) as keyof InstitutionalPage;
  const dir = d === 'desc' ? 'desc' : 'asc';
  return { field, dir };
}

@Injectable()
export class PagesService {
  findAllPublicSummary() {
    return prisma.institutionalPage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      select: { slug: true, title: true, sortOrder: true, updatedAt: true },
    });
  }

  async findPublicBySlug(slug: string) {
    const page = await prisma.institutionalPage.findFirst({
      where: { slug, isActive: true },
    });
    if (!page) throw new NotFoundException('Página não encontrada');
    return this.toPublicDto(page);
  }

  private toPublicDto(page: InstitutionalPage) {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImage: page.ogImage,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  async findAllAdmin(query: ListPagesQuery) {
    const search = query.search?.trim();
    const { field, dir } = parseSort(query.sort);
    return prisma.institutionalPage.findMany({
      where: search ? { title: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { [field]: dir },
    });
  }

  async findOneAdmin(id: string) {
    const page = await prisma.institutionalPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Página não encontrada');
    return page;
  }

  async create(dto: CreatePageDto) {
    const existing = await prisma.institutionalPage.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException('Já existe uma página com este slug');

    return prisma.institutionalPage.create({
      data: {
        id: createId(),
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        metaTitle: normalizeNullableString(dto.metaTitle) ?? null,
        metaDescription: normalizeNullableString(dto.metaDescription) ?? null,
        ogImage: normalizeNullableString(dto.ogImage) ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.findOneAdmin(id);

    if (dto.slug) {
      const conflict = await prisma.institutionalPage.findFirst({
        where: { slug: dto.slug, id: { not: id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictException('Slug já está em uso');
    }

    const metaTitle = normalizeNullableString(dto.metaTitle);
    const metaDescription = normalizeNullableString(dto.metaDescription);
    const ogImage = normalizeNullableString(dto.ogImage);

    return prisma.institutionalPage.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(ogImage !== undefined && { ogImage }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await prisma.institutionalPage.delete({ where: { id } });
    return { ok: true };
  }

  async toggleActive(id: string) {
    const page = await this.findOneAdmin(id);
    return prisma.institutionalPage.update({
      where: { id },
      data: { isActive: !page.isActive },
    });
  }
}
