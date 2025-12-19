import { ApiResponse } from "~~/server/http/ApiResponse";
import admin from "~~/server/http/middleware/admin";
import { User } from "~~/server/models/User";

export default eventHandler({
  onRequest: [admin],
  handler: async (event) => {
    const query = getQuery(event);

    // Support both ?search= and legacy ?q=
    const rawSearch = typeof query.search === 'string' ? query.search : (typeof query.q === 'string' ? query.q : undefined);
    const search = rawSearch ? rawSearch.trim() : undefined;

    // Pagination
    const rawPerPage = query.per_page ? Number(query.per_page) : undefined;
    const rawPage = query.page ? Number(query.page) : undefined;

    if ((rawPerPage !== undefined && Number.isNaN(rawPerPage)) || (rawPage !== undefined && Number.isNaN(rawPage))) {
      return ApiResponse.error(400, 'Invalid pagination parameters');
    }

    const perPage = rawPerPage !== undefined ? Math.min(Math.max(Math.floor(rawPerPage), 1), 100) : 25;
    const page = rawPage !== undefined ? Math.max(Math.floor(rawPage), 1) : 1;

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

    // Build the query
    let userQuery = User.query();

    // Apply search filter
    if (search) {
      userQuery = userQuery.where({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      });
    }

    // Apply admin filter
    if (adminFilter !== undefined) {
      userQuery = userQuery.where({ admin: adminFilter });
    }

    // Apply resource_id filters
    if (resourceTokens.length > 0) {
      const includes: number[] = [];
      const excludes: number[] = [];

      for (const token of resourceTokens.map(t => t.trim()).filter(Boolean)) {
        if (token.startsWith('!')) {
          const id = parseInt(token.substring(1));
          if (!isNaN(id)) excludes.push(id);
        } else {
          const id = parseInt(token);
          if (!isNaN(id)) includes.push(id);
        }
      }

      if (includes.length > 0) {
        userQuery = userQuery.where({ id: { in: includes } });
      }
      if (excludes.length > 0) {
        userQuery = userQuery.where({ id: { notIn: excludes } });
      }
    }

    // Apply ordering and paginate
    const result = await userQuery
        .orderBy({ created_at: 'desc' })
        .paginate({ page, perPage });

    return ApiResponse.success(result);
  },
});
