import type { User } from "~~/server/models/User";

export default class UserPolicy {

    public viewAny(user: User, model?: User): boolean {
        // Only admins can view any user
        return user.admin;
    }

    public view(user: User, model?: User): boolean {
        // Users can view their own profile, admins can view all
        return user.admin || (model ? user.id === model.id : true);
    }

    public create(user: User): boolean {
        // Only admins can create users
        return user.admin;
    }

    public update(user: User, model?: User): boolean {
        // Admins can update anyone, users can update themselves
        return user.admin || (model ? user.id === model.id : false);
    }

    public delete(user: User, model?: User): boolean {
        // Admins can delete anyone, users can update themselves
        return user.admin || (model ? user.id === model.id : false);
    }
}