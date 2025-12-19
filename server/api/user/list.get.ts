import { ApiResponse } from "~~/server/utils/ApiResponse";
import admin from "~~/server/utils/middleware/admin";
import { UserRepository } from "~~/server/db/UserRepository";

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

    // Admin filter (?admin=true|false)
    let adminFilter: boolean | undefined;
    if (typeof query.admin === 'string') {
      if (query.admin === 'true' || query.admin === 'false') {
        adminFilter = query.admin === 'true';
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

    const filters = {
      search: q,
      admin: adminFilter,
      resourceIds: resourceTokens.map(t => t.trim()).filter(Boolean),
    };

    const [users, total] = await Promise.all([
      UserRepository.list({ skip, take, filters }),
      UserRepository.count(filters),
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
