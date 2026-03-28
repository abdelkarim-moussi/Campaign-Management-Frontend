import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    Campaign,
    CampaignChannel,
    CampaignDto,
    CampaignStatus,
} from '../../services/campaign.service';
import { CampaignStore } from '../../stores/campaign-store';
import { TemplateStore } from '../../stores/template-store';
import { ContactStore } from '../../stores/contact-store';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
    selector: 'app-campaigns',
    imports: [FormsModule, CommonModule, ConfirmDialogComponent, LoadingOverlayComponent, PaginationComponent, HasRoleDirective],
    templateUrl: './campaigns.component.html',
    styleUrl: './campaigns.component.css',
})
export class CampaignsComponent implements OnInit {
    filteredCampaigns: Campaign[] = [];
    searchQuery = '';
    statusFilter: CampaignStatus | '' = '';
    channelFilter: CampaignChannel | '' = '';

    showCreateForm = false;
    editingCampaignId: number | null = null;

    showDeleteConfirm = false;
    deleteTargetId: number | null = null;

    showSendConfirm = false;
    sendTargetId: number | null = null;

    selectedContactIds: number[] = [];
    formSubmitted = false;

    formData: CampaignDto = {
        name: '',
        description: '',
        objective: '',
        channel: 'EMAIL',
        templateId: 0,
        contactIds: [],
        scheduledAt: '',
    };

    readonly campaignStore = inject(CampaignStore);
    readonly templateStore = inject(TemplateStore);
    readonly contactStore = inject(ContactStore);

    readonly campaigns = this.campaignStore.campaigns;
    readonly templates = this.templateStore.templates;
    readonly contacts = this.contactStore.contacts;

    private router = inject(Router);

    constructor() {
        effect(() => {
            this.filteredCampaigns = this.campaigns();
            this.filterCampaigns();

            if (this.campaignStore.saveSuccess()) {
                this.campaignStore.resetSaveSuccess();
                this.campaignStore.loadCampaigns({ page: this.campaignStore.currentPage() });
                this.resetForm();
            }
        });
    }

    ngOnInit(): void {
        this.campaignStore.loadCampaigns({ page: 0 });
        this.templateStore.loadTemplates();
        this.contactStore.loadContacts();
    }

    filterCampaigns(): void {
        this.filteredCampaigns = this.campaigns().filter((campaign) => {
            const matchesSearch =
                !this.searchQuery ||
                campaign.name
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()) ||
                (campaign.description || '')
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase());
            const matchesStatus =
                !this.statusFilter || campaign.status === this.statusFilter;
            const matchesChannel =
                !this.channelFilter || campaign.channel === this.channelFilter;
            return matchesSearch && matchesStatus && matchesChannel;
        });
    }

    createCampaign(): void {
        this.formSubmitted = true;
        if (!this.isFormValid()) return;
        this.formData.contactIds = this.selectedContactIds;
        this.campaignStore.addCampaign(this.formData);
    }

    startEdit(campaign: Campaign): void {
        this.editingCampaignId = campaign.id!;
        this.formData = {
            name: campaign.name,
            description: campaign.description || '',
            objective: campaign.objective || '',
            channel: campaign.channel,
            templateId: campaign.templateId,
            contactIds: [],
            scheduledAt: campaign.scheduledAt || '',
        };
        this.selectedContactIds = (campaign.campaignContacts || []).map(
            (cc) => cc.contactId,
        );
        this.showCreateForm = true;
    }

    saveEdit(): void {
        this.formSubmitted = true;
        if (!this.editingCampaignId || !this.isFormValid()) return;
        this.formData.contactIds = this.selectedContactIds;
        this.campaignStore.updateCampaign({
            id: this.editingCampaignId,
            dto: this.formData,
        });
        this.cancelEdit();
    }

    cancelEdit(): void {
        this.editingCampaignId = null;
        this.resetForm();
    }

    deleteCampaign(id: number): void {
        this.deleteTargetId = id;
        this.showDeleteConfirm = true;
    }

    confirmDelete(): void {
        if (this.deleteTargetId) {
            this.campaignStore.removeCampaign(this.deleteTargetId);
            setTimeout(() => this.campaignStore.loadCampaigns({ page: this.campaignStore.currentPage() }), 300);
        }
        this.cancelDelete();
    }

    cancelDelete(): void {
        this.showDeleteConfirm = false;
        this.deleteTargetId = null;
    }

    sendCampaign(id: number): void {
        this.sendTargetId = id;
        this.showSendConfirm = true;
    }

    confirmSend(): void {
        if (this.sendTargetId) {
            this.campaignStore.sendCampaign(this.sendTargetId);
        }
        this.cancelSend();
    }

    cancelSend(): void {
        this.showSendConfirm = false;
        this.sendTargetId = null;
    }

    toggleContact(contactId: number): void {
        const idx = this.selectedContactIds.indexOf(contactId);
        if (idx > -1) {
            this.selectedContactIds.splice(idx, 1);
        } else {
            this.selectedContactIds.push(contactId);
        }
    }

    isContactSelected(contactId: number): boolean {
        return this.selectedContactIds.includes(contactId);
    }

    resetForm(): void {
        this.formData = {
            name: '',
            description: '',
            objective: '',
            channel: 'EMAIL',
            templateId: 0,
            contactIds: [],
            scheduledAt: '',
        };
        this.selectedContactIds = [];
        this.showCreateForm = false;
        this.editingCampaignId = null;
        this.formSubmitted = false;
    }

    isFormValid(): boolean {
        return (
            !!this.formData.name.trim() &&
            !!this.formData.templateId &&
            this.selectedContactIds.length > 0 &&
            !this.isDuplicateName()
        );
    }

    isDuplicateName(): boolean {
        const name = this.formData.name.trim().toLowerCase();
        if (!name) return false;
        return this.campaigns().some(
            (c) =>
                c.name.toLowerCase() === name &&
                c.id !== this.editingCampaignId,
        );
    }

    onPageChange(page: number): void {
        this.campaignStore.loadCampaigns({ page });
    }

    getStatusClass(status: CampaignStatus): string {
        switch (status) {
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-700';
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-700';
            case 'SENT':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-border text-text-muted';
        }
    }

    getChannelClass(channel: CampaignChannel): string {
        return channel === 'EMAIL'
            ? 'bg-primary/10 text-primary'
            : 'bg-accent/20 text-accent';
    }

    getTemplateName(templateId: number): string {
        const template = this.templates().find((t) => t.id === String(templateId));
        return template ? template.name : `Template #${templateId}`;
    }

    getFilteredTemplates() {
        if (!this.formData.channel) return this.templates();
        return this.templates().filter(
            (t) => t.type === this.formData.channel && t.status === 'ACTIVE',
        );
    }

    viewCampaign(id: number): void {
        this.router.navigate(['/campaigns', id]);
    }
}
