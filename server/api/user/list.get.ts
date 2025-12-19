import { ApiResponse } from "~~/server/utils/ApiResponse";
import admin from "~~/server/middleware/admin";
import { UserRepository } from "~~/server/db/UserRepository";
import type { Prisma } from "~~/generated/prisma";

export default eventHandler({
  onRequest: [admin],
  handler: async (event) => {
    const query = getQuery(event);

    // Support both ?search= and legacy ?q=
    const rawSearch = typeof query.search === 'string' ? query.search : (typeof query.q === 'string' ? query.q : undefined);
    const q = rawSearch ? rawSearch.trim() : undefined;

    // Pagination
    const rawPerPage = query.per_page ? Number(query.per_page) : undefined;
    const rawPage = query.page ? Number(query.page) : undefined;

    if ((rawPerPage !== undefined && Number.isNaN(rawPerPage)) || (rawPage !== undefined && Number.isNaN(rawPage))) {
      return ApiResponse.error(400, 'Invalid pagination parameters');
    }

    const perPage = rawPerPage !== undefined ? Math.min(Math.max(Math.floor(rawPerPage), 1), 100) : 25;
    const page = rawPage !== undefined ? Math.max(Math.floor(rawPage), 1) : 1;
    const skip = (page - 1) * perPage;
    const take = perPage;

    // Base where from search q
    const searchWhere: Prisma.UserWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : undefined;

    // Admin filter (?admin=true|false)
    let adminWhere: Prisma.UserWhereInput | undefined;
    if (typeof query.admin === 'string') {
      if (query.admin === 'true' || query.admin === 'false') {
        adminWhere = { admin: query.admin === 'true' };
      } else {
        return ApiResponse.error(400, 'Invalid admin filter; expected true|false');
      }
    }

    // resource_id filters:
    //   ?resource_id=1   -> include users linked to resource 1
    //   ?resource_id=!1  -> exclude users linked to resource 1
    // Accept repeated params and comma-separated lists for backward compatibility
    const rawResourceParam = query.resource_id;
    let resourceTokens: string[] = [];
    if (Array.isArray(rawResourceParam)) {
      for (const item of rawResourceParam) {
        if (typeof item === 'string') {
          resourceTokens.push(...item.split(','));
        }
      }
    } else if (typeof rawResourceParam === 'string') {
      resourceTokens = rawResourceParam.split(',');
    }

    // Clean tokens and build prisma filters
    const resourceFilters: Prisma.UserWhereInput[] = [];
    for (const token of resourceTokens) {
      const raw = token.trim();
      if (!raw) continue;
      const negate = raw.startsWith('!');
      const numStr = negate ? raw.slice(1) : raw;
      const id = Number(numStr);
      if (!Number.isFinite(id) || id <= 0) {
        return ApiResponse.error(400, `Invalid resource_id value: ${raw}`);
      }
      const relationFilter: Prisma.UserWhereInput = negate
        ? { resources: { none: { resource_id: id } } }
        : { resources: { some: { resource_id: id } } };
      resourceFilters.push(relationFilter);
    }

    // Compose all filters with AND so all constraints must match
    const andFilters: Prisma.UserWhereInput[] = [];
    if (searchWhere) andFilters.push(searchWhere);
    if (adminWhere) andFilters.push(adminWhere);
    if (resourceFilters.length) andFilters.push(...resourceFilters);

    const where: Prisma.UserWhereInput | undefined =
      andFilters.length ? { AND: andFilters } : undefined;

    const [users, total] = await Promise.all([
      UserRepository.list({ skip, take, where }),
      UserRepository.count(where),
    ]);

    const safeUsers = users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });

    const last_page = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? null : skip + 1;
    const to = total === 0 ? null : Math.min(skip + safeUsers.length, total);

    return ApiResponse.success({
      current_page: page,
      data: safeUsers,
      last_page,
      per_page: perPage,
      from,
      to,
      total,
    });
  },
});
