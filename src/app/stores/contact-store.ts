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

      importContacts: rxMethod<Contact[]>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((contacts) =>
            contactService.createContacts(contacts).pipe(
              tap((savedContacts) => {
                patchState(store, (state) => ({
                  contacts: [...state.contacts, ...savedContacts],
                  isLoading: false,
                  saveSuccess: true,
                }));
                toastr.success(`${savedContacts.length} contacts imported successfully`);
              }),
              catchError((error) => {
                toastr.error('Failed to import contacts');
                patchState(store, { isLoading: false, saveSuccess: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      removeContact: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            contactService.deleteContact(id).pipe(
              tap(() => {
                patchState(store, (state) => ({
                  contacts: state.contacts.filter((c) => c.id !== id),
                  isLoading: false,
                }));
                toastr.success('Contact deleted successfully');
              }),
              catchError((error) => {
                toastr.error('Failed to delete contact');
                patchState(store, { isLoading: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
