import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    Campaign,
    CampaignContact,
    CampaignService,
    CampaignSummaryDto,
} from '../../services/campaign.service';
import { Contact } from '../../services/contact.service';
import { ContactStore } from '../../stores/contact-store';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-campaign-detail',
    imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
    templateUrl: './campaign-detail.component.html',
    styleUrl: './campaign-detail.component.css',
})
export class CampaignDetailComponent implements OnInit {
    campaign: Campaign | null = null;
    summary: CampaignSummaryDto | null = null;
    campaignContacts: CampaignContact[] = [];
    isLoading = true;

    showAddContacts = false;
    selectedNewContactIds: number[] = [];

    showRemoveConfirm = false;
    removeTargetContactId: number | null = null;

    private campaignId!: number;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignService = inject(CampaignService);
    private toastr = inject(ToastrService);
    readonly contactStore = inject(ContactStore);
    readonly allContacts = this.contactStore.contacts;

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (!idParam) {
            this.router.navigate(['/campaigns']);
            return;
        }
        this.campaignId = +idParam;
        this.contactStore.loadContacts();
        this.loadAll();
    }

    loadAll(): void {
        this.isLoading = true;
        this.campaignService.getCampaign(this.campaignId).subscribe({
            next: (campaign) => {
                this.campaign = campaign;
                this.loadSummary();
                this.loadContacts();
            },
            error: () => {
                this.toastr.error('Campaign not found');
                this.router.navigate(['/campaigns']);
            },
        });
    }

    loadSummary(): void {
        this.campaignService.getCampaignSummary(this.campaignId).subscribe({
            next: (summary) => {
                this.summary = summary;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            },
        });
    }

    loadContacts(): void {
        this.campaignService.getCampaignContacts(this.campaignId).subscribe({
            next: (contacts) => {
                this.campaignContacts = contacts;
            },
            error: () => {
                this.toastr.error('Failed to load campaign contacts');
            },
        });
    }

    getContactName(contactId: number): string {
        const contact = this.allContacts().find(
            (c) => c.id === String(contactId),
        );
        return contact
            ? `${contact.firstName} ${contact.lastName}`
            : `Contact #${contactId}`;
    }

    getContactEmail(contactId: number): string {
        const contact = this.allContacts().find(
            (c) => c.id === String(contactId),
        );
        return contact ? contact.email : '';
    }

    getAvailableContacts(): Contact[] {
        const existingIds = new Set(
            this.campaignContacts.map((cc) => cc.contactId),
        );
        return this.allContacts().filter(
            (c) => !existingIds.has(Number(c.id)),
        );
    }

    toggleNewContact(contactId: number): void {
        const idx = this.selectedNewContactIds.indexOf(contactId);
        if (idx > -1) {
            this.selectedNewContactIds.splice(idx, 1);
        } else {
            this.selectedNewContactIds.push(contactId);
        }
    }

    isNewContactSelected(contactId: number): boolean {
        return this.selectedNewContactIds.includes(contactId);
    }

    addContacts(): void {
        if (this.selectedNewContactIds.length === 0) return;
        this.campaignService
            .addContactsToCampaign(this.campaignId, this.selectedNewContactIds)
            .subscribe({
                next: () => {
                    this.toastr.success('Contacts added successfully');
                    this.selectedNewContactIds = [];
                    this.showAddContacts = false;
                    this.loadContacts();
                    this.loadSummary();
                },
                error: () => {
                    this.toastr.error('Failed to add contacts');
                },
            });
    }

    removeContact(contactId: number): void {
        this.removeTargetContactId = contactId;
        this.showRemoveConfirm = true;
    }

    confirmRemove(): void {
        if (this.removeTargetContactId) {
            this.campaignService
                .removeContactFromCampaign(
                    this.campaignId,
                    this.removeTargetContactId,
                )
                .subscribe({
                    next: () => {
                        this.toastr.success('Contact removed from campaign');
                        this.loadContacts();
                        this.loadSummary();
                    },
                    error: () => {
                        this.toastr.error('Failed to remove contact');
                    },
                });
        }
        this.cancelRemove();
    }

    cancelRemove(): void {
        this.showRemoveConfirm = false;
        this.removeTargetContactId = null;
    }

    getStatusColor(): string {
        if (!this.campaign) return '';
        switch (this.campaign.status) {
            case 'DRAFT':
                return 'bg-yellow-400';
            case 'SCHEDULED':
                return 'bg-blue-500';
            case 'SENT':
                return 'bg-green-500';
            default:
                return 'bg-gray-400';
        }
    }

    getStatusBadge(): string {
        if (!this.campaign) return '';
        switch (this.campaign.status) {
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

    getChannelBadge(): string {
        if (!this.campaign) return '';
        return this.campaign.channel === 'EMAIL'
            ? 'bg-primary/10 text-primary'
            : 'bg-accent/20 text-accent';
    }

    getDeliveryRate(): number {
        if (!this.summary || !this.summary.sentCount) return 0;
        return Math.round(
            (this.summary.deliveredCount / this.summary.sentCount) * 100,
        );
    }

    getOpenRate(): number {
        if (!this.summary || !this.summary.deliveredCount) return 0;
        return Math.round(
            (this.summary.openedCount / this.summary.deliveredCount) * 100,
        );
    }

    getFailRate(): number {
        if (!this.summary || !this.summary.sentCount) return 0;
        return Math.round(
            (this.summary.failedCount / this.summary.sentCount) * 100,
        );
    }
}
