import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Contact, ContactService } from '../services/contact.service';
import { catchError, concatMap, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const ContactStore = signalStore(
  { providedIn: 'root' },
  withState({
    contacts: [] as Contact[],
    isLoading: false,
    saveSuccess: false,
  }),

  withComputed(({ contacts }) => ({
    contactsCount: computed(() => contacts().length),
  })),

  withMethods(
    (
      store,
      contactService = inject(ContactService),
      toastr = inject(ToastrService),
    ) => ({
      loadContacts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          concatMap(() =>
            contactService
              .getContacts()
              .pipe(
                tap((contacts) =>
                  patchState(store, { contacts, isLoading: false }),
                ),
              ),
          ),
        ),
      ),

      addContact: rxMethod<Contact>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          concatMap((newContact) =>
            contactService.createContact(newContact).pipe(
              tap((savedContact) => {
                patchState(store, (state) => ({
                  contacts: [...state.contacts, savedContact],
                  isLoading: false,
                  saveSuccess: true,
                }));

                toastr.success('Contact Saved Succefully');
              }),
            ),
          ),
          catchError((error) => {
            toastr.error('Contact Save Failed');
            patchState(store, { isLoading: false, saveSuccess: false });
            return EMPTY;
          }),
        ),
      ),

      removeContact(id: string) {},
    }),
  ),
);
