import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
    Template,
    TemplateDTO,
    TemplateType,
    TemplateStatus,
} from '../../services/template.service';
import { TemplateStore } from '../../stores/template-store';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-templates',
    imports: [FormsModule, CommonModule, ConfirmDialogComponent],
    templateUrl: './templates.component.html',
    styleUrl: './templates.component.css',
})
export class TemplatesComponent implements OnInit {
    filteredTemplates: Template[] = [];
    searchQuery = '';
    typeFilter: TemplateType | '' = '';
    statusFilter: TemplateStatus | '' = '';

    showCreateForm = false;
    editingTemplateId: string | null = null;

    showDeleteConfirm = false;
    deleteTargetId: string | null = null;

    formData: TemplateDTO = {
        name: '',
        subject: '',
        content: '',
        type: 'EMAIL',
    };

    readonly templateStore = inject(TemplateStore);
    readonly templates = this.templateStore.templates;

    constructor() {
        effect(() => {
            this.filteredTemplates = this.templates();
            this.filterTemplates();

            if (this.templateStore.saveSuccess()) {
                this.resetForm();
            }
        });
    }

    ngOnInit(): void {
        this.templateStore.loadTemplates();
    }

    filterTemplates(): void {
        this.filteredTemplates = this.templates().filter((template) => {
            const matchesSearch =
                !this.searchQuery ||
                template.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                template.content
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase());
            const matchesType = !this.typeFilter || template.type === this.typeFilter;
            const matchesStatus =
                !this.statusFilter || template.status === this.statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }

    createTemplate(): void {
        if (!this.formData.name || !this.formData.content) return;
        this.templateStore.addTemplate(this.formData);
    }

   
}
