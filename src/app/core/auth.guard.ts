import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';
import { ToastService } from './toast.service';

/** Lets the route open only for a logged-in user with this role (hiker space, guide space). */
export function roleGuard(role: Role): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();

    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (user.role !== role) {
      inject(ToastService).error(`This page is for ${role} accounts.`);
      return router.createUrlTree([auth.homeFor(user.role)]);
    }
    return true;
  };
}
