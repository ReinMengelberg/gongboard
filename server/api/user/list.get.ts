import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

export default eventHandler({
  onRequest: [authenticated],
  handler: async (event) => {
    try {
      const auth = await Auth.user(event);
      if (!auth?.can('viewAny', new User())) {
        return ApiResponse.error(403, 'Forbidden');
      }

      const query = getQuery(event);
      const search = typeof query.search === 'string' ? query.search.trim() : undefined;

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

      // Apply ordering and paginate
      const result = await userQuery
          .orderBy({ created_at: 'desc' })
          .paginate({ page, perPage });

      return ApiResponse.success(result);
    } catch (e: any) {
      console.error('Failed to fetch users:', e)
      return ApiResponse.error(500, 'Failed to fetch users')
    }
  },
});
