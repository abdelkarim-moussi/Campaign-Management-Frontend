import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../services/contact.service';
import { ContactStore } from '../../stores/contact-store';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
  selector: 'app-contacts',
  imports: [
    FormsModule,
    CommonModule,
    ConfirmDialogComponent,
    LoadingOverlayComponent,
    PaginationComponent,
    HasRoleDirective,
  ],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.css',
})
export class ContactsComponent implements OnInit {
  filteredContacts: Contact[] = [];
  searchQuery = '';
  groupFilter = '';
  showAddForm = false;
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;

  editingContactId: number | null = null;
  editContact: Partial<Contact> = {};

  tagsInput = '';

  newContact: Partial<Contact> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    group: 'GENERAL',
    status: 'LEAD',
    company: 'uncknown',
    tagIds: [],
  };

  readonly contactStore = inject(ContactStore);
  readonly contacts = this.contactStore.contacts;

  constructor() {
    effect(() => {
      this.filteredContacts = this.contacts();

      if (this.contactStore.saveSuccess()) {
        this.contactStore.resetSaveSuccess();
        this.contactStore.loadContacts({
          page: this.contactStore.currentPage(),
        });
        this.newContact = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          group: 'GENERAL',
          status: 'LEAD',
          company: '',
          tagIds: [],
        };
        this.showAddForm = false;
      }
    });
  }

  ngOnInit(): void {
    this.contactStore.loadContacts({ page: 0 });
  }

  filterContacts(): void {
    this.filteredContacts = this.contacts().filter((contact) => {
      const fullName = `${contact.fullName}`.toLowerCase();
      const matchesSearch =
        !this.searchQuery ||
        fullName.includes(this.searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        contact.phone.includes(this.searchQuery);
      const matchesGroup =
        !this.groupFilter || contact.group === this.groupFilter;
      return matchesSearch && matchesGroup;
    });
  }

  addContact(): void {
    if (
      !this.newContact.firstName ||
      !this.newContact.lastName ||
      !this.newContact.email
    )
      return;

    const contact: Contact = {
      firstName: this.newContact.firstName!,
      lastName: this.newContact.lastName!,
      email: this.newContact.email!,
      phone: this.newContact.phone || '',
      company: this.newContact.company || '',
      group: this.newContact.group || 'GENERAL',
      status: this.newContact.status || 'LEAD',
      tagIds:
        this.tagsInput
          ?.split(',')
          .map((t) => t.trim())
          .filter((t) => t !== '' && !isNaN(Number(t)))
          .map((t) => Number(t)) || [],
    };

    this.contactStore.addContact(contact);
  }

  deleteContact(id: number): void {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.deleteTargetId) {
      this.contactStore.removeContact(this.deleteTargetId);
      // Reload current page after delete
      setTimeout(
        () =>
          this.contactStore.loadContacts({
            page: this.contactStore.currentPage(),
          }),
        300,
      );
    }
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
  }

  startEdit(contact: Contact): void {
    this.editingContactId = contact.id!;
    this.editContact = { ...contact };
  }

  saveEdit(): void {
    if (!this.editingContactId) return;
    this.contactStore.updateContact({
      id: this.editingContactId,
      contact: this.editContact,
    });
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingContactId = null;
    this.editContact = {};
  }

  onPageChange(page: number): void {
    this.contactStore.loadContacts({ page });
  }

  onFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length == 0) return;

    const file = input.files[0];

    const extension = file.name.split('.').pop()?.toLowerCase();

    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;

      let contacts: Contact[] = [];

      try {
        if (extension === 'json') {
          contacts = this.parseJson(content);
        } else if (extension === 'csv') {
          contacts = this.parseCsv(content);
        } else if (extension === 'tsv') {
          contacts = this.parseTsv(content);
        } else {
          alert('File Type Not Supported');
          return;
        }

        if (contacts.length > 0) {
          this.contactStore.importContacts(contacts);
        }
      } catch (e) {
        alert('Failed to parse file. Please check the format.');
        console.log('Imports error: ', e);
      }
    };

    reader.readAsText(file);
  }

  private parseJson(content: string): Contact[] {
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : [data];

    return items.map((item: any) => ({
      firstName: item.firstName || item.first_name || item.prenom || '',
      lastName: item.lastname || item.last_name || item.nom || '',
      email: item.email || '',
      phone: item.phone || item.telephone || '',
      company: item.company || item.entreprise || '',
      group: (item.group || item.segment || 'GENERAL').toUpperCase(),
      status: (item.status || item.type || 'LEAD').toUpperCase(),
      tagIds: Array.isArray(item.tags)
        ? item.tags
            .filter((t: any) => !isNaN(Number(t)))
            .map((t: any) => Number(t))
        : [],
    }));
  }

  private parseCsv(content: string): Contact[] {
    const lines = content.split('\n').filter((line) => line.trim() != '');

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1, lines.length).map((line) => {
      const values = line.split(',').map((v) => v.trim().toLowerCase());
      const row: any = {};

      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      return {
        firstName: row['firstname'] || row['first_name'] || row['prenom'] || '',
        lastName: row['lastname'] || row['last_name'] || row['nom'] || '',
        email: row['email'] || '',
        phone: row['phone'] || row['telephone'] || '',
        company: row['company'] || row['entreprise'] || '',
        group: row['group'] || 'GENERAL',
        status: row['status'] || row['type'] || 'LEAD',
        tagIds: row['tags']
          ? row['tags']
              .split(';')
              .map((t: string) => t.trim())
              .filter((t: string) => t !== '' && !isNaN(Number(t)))
              .map((t: string) => Number(t))
          : [],
      };
    });
  }

  private parseTsv(content: string): Contact[] {
    const lines = content.split('\n').filter((line) => line.trim()! == '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(' ').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(' ').map((v) => v.trim().toLowerCase());
      const row: any = {};

      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      return {
        firstName: row['firstname'] || row['first_name'] || row['prenom'] || '',
        lastName: row['lastname'] || row['last_name'] || row['nom'] || '',
        email: row['email'] || '',
        phone: row['phone'] || row['telephone'] || '',
        company: row['company'] || row['entreprise'] || '',
        group: row['group'] || 'GENERAL',
        status: row['status'] || row['type'] || 'LEAD',
        tagIds: row['tags']
          ? row['tags']
              .split(';')
              .map((t: string) => t.trim())
              .filter((t: string) => t !== '' && !isNaN(Number(t)))
              .map((t: string) => Number(t))
          : [],
      };
    });
  }
}
