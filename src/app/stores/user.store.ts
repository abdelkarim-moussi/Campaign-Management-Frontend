import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { UserService, UserDto, InviteUserRequest } from '../services/user.service';
import { ToastrService } from 'ngx-toastr';

interface UserState {
    users: UserDto[];
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    isLoading: false,
    error: null,
};

export const UserStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed((state) => ({
        hasUsers: computed(() => state.users().length > 0),
    })),
    withMethods(
        (
            store,
            userService = inject(UserService),
            toastr = inject(ToastrService)
        ) => ({
            loadUsers: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() => {
                        return userService.getOrganizationUsers().pipe(
                            tap((users) => {
                                patchState(store, { users, isLoading: false });
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to load users',
                                });
                                toastr.error('Could not load users.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),

            inviteUser: rxMethod<{ request: InviteUserRequest; onSuccess: () => void }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ request, onSuccess }) => {
                        return userService.inviteUser(request).pipe(
                            tap(() => {
                                patchState(store, { isLoading: false });
                                toastr.success('User invited successfully!', 'Success');
                                onSuccess();
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to invite user',
                                });
                                toastr.error('Could not invite user.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),

            updateUserRole: rxMethod<{ userId: number; role: string }>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(({ userId, role }) => {
                        return userService.updateUserRole(userId, role).pipe(
                            tap((updatedUser) => {
                                patchState(store, {
                                    users: store.users().map(u => u.id === updatedUser.id ? updatedUser : u),
                                    isLoading: false
                                });
                                toastr.success('User role updated.', 'Success');
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to update user role',
                                });
                                toastr.error('Could not update role.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),

            deleteUser: rxMethod<number>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap((userId) => {
                        return userService.deleteUser(userId).pipe(
                            tap(() => {
                                patchState(store, {
                                    users: store.users().filter(u => u.id !== userId),
                                    isLoading: false
                                });
                                toastr.success('User removed from organization.', 'Success');
                            }),
                            catchError((err) => {
                                patchState(store, {
                                    isLoading: false,
                                    error: err.message || 'Failed to remove user',
                                });
                                toastr.error('Could not remove user.', 'Error');
                                return EMPTY;
                            })
                        );
                    })
                )
            ),
        })
    )
);
