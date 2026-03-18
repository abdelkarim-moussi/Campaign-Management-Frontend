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
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
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
      loadContacts: rxMethod<{ page?: number; size?: number } | void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          concatMap((params) => {
            const page = params && 'page' in params ? params.page ?? 0 : store.currentPage();
            const size = params && 'size' in params ? params.size ?? 10 : store.pageSize();
            return contactService
              .getContacts(page, size)
              .pipe(
                tap((response) =>
                  patchState(store, {
                    contacts: response.content,
                    currentPage: response.number,
                    totalPages: response.totalPages,
                    totalElements: response.totalElements,
                    pageSize: response.size,
                    isLoading: false,
                  }),
                ),
              );
          }),
        ),
      ),

      addContact: rxMethod<Contact>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          concatMap((newContact) =>
            contactService.createContact(newContact).pipe(
              tap(() => {
                patchState(store, {
                  isLoading: false,
                  saveSuccess: true,
                });

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
                patchState(store, {
                  isLoading: false,
                  saveSuccess: true,
                });
                toastr.success(
                  `${savedContacts.length} contacts imported successfully`,
                );
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

      updateContact: rxMethod<{ id: string; contact: Partial<Contact> }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ id, contact }) =>
            contactService.updateContact(id, contact).pipe(
              tap((updatedContact) => {
                patchState(store, (state) => ({
                  contacts: state.contacts.map((c) =>
                    c.id === id ? updatedContact : c,
                  ),
                  isLoading: false,
                  saveSuccess: true,
                }));
                toastr.success('Contact updated successfully');
              }),
              catchError((error) => {
                toastr.error('Failed to update contact');
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
                patchState(store, {
                  isLoading: false,
                });
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
