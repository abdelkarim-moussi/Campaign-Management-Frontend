import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignDetailComponent } from './campaign-detail.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

describe('CampaignDetailComponent', () => {
    let component: CampaignDetailComponent;
    let fixture: ComponentFixture<CampaignDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CampaignDetailComponent, ToastrModule.forRoot()],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: (key: string) => '1',
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignDetailComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.isLoading).toBeTrue();
        expect(component.campaign).toBeNull();
        expect(component.summary).toBeNull();
    });

    it('should initialize with empty contacts', () => {
        expect(component.campaignContacts).toEqual([]);
    });

    it('should toggle add contacts panel', () => {
        expect(component.showAddContacts).toBeFalse();
        component.showAddContacts = true;
        expect(component.showAddContacts).toBeTrue();
    });

    it('should toggle new contact selection', () => {
        component.toggleNewContact(1);
        expect(component.isNewContactSelected(1)).toBeTrue();
        component.toggleNewContact(1);
        expect(component.isNewContactSelected(1)).toBeFalse();
    });

    it('should set remove target on removeContact', () => {
        component.removeContact(5);
        expect(component.removeTargetContactId).toBe(5);
        expect(component.showRemoveConfirm).toBeTrue();
    });

    it('should clear remove state on cancelRemove', () => {
        component.removeContact(5);
        component.cancelRemove();
        expect(component.removeTargetContactId).toBeNull();
        expect(component.showRemoveConfirm).toBeFalse();
    });

    it('should return correct status colors', () => {
        component.campaign = {
            name: 'Test', status: 'DRAFT', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getStatusColor()).toContain('yellow');

        component.campaign = {
            name: 'Test', status: 'SCHEDULED', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getStatusColor()).toContain('blue');

        component.campaign = {
            name: 'Test', status: 'SENT', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getStatusColor()).toContain('green');
    });

    it('should return correct status badges', () => {
        component.campaign = {
            name: 'Test', status: 'DRAFT', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getStatusBadge()).toContain('yellow');

        component.campaign = {
            name: 'Test', status: 'SENT', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getStatusBadge()).toContain('green');
    });

    it('should return correct channel badges', () => {
        component.campaign = {
            name: 'Test', status: 'DRAFT', channel: 'EMAIL',
            templateId: 1,
        } as any;
        expect(component.getChannelBadge()).toContain('primary');

        component.campaign = {
            name: 'Test', status: 'DRAFT', channel: 'SMS',
            templateId: 1,
        } as any;
        expect(component.getChannelBadge()).toContain('accent');
    });

    it('should calculate delivery rate', () => {
        component.summary = {
            id: 1, name: 'Test', status: 'SENT', channel: 'EMAIL',
            totalContacts: 10, sentCount: 10, deliveredCount: 8,
            openedCount: 5, failedCount: 2,
        };
        expect(component.getDeliveryRate()).toBe(80);
    });

    it('should calculate open rate', () => {
        component.summary = {
            id: 1, name: 'Test', status: 'SENT', channel: 'EMAIL',
            totalContacts: 10, sentCount: 10, deliveredCount: 8,
            openedCount: 4, failedCount: 2,
        };
        expect(component.getOpenRate()).toBe(50);
    });

    it('should calculate fail rate', () => {
        component.summary = {
            id: 1, name: 'Test', status: 'SENT', channel: 'EMAIL',
            totalContacts: 10, sentCount: 10, deliveredCount: 8,
            openedCount: 5, failedCount: 3,
        };
        expect(component.getFailRate()).toBe(30);
    });

    it('should return 0 rates when no data', () => {
        component.summary = null;
        expect(component.getDeliveryRate()).toBe(0);
        expect(component.getOpenRate()).toBe(0);
        expect(component.getFailRate()).toBe(0);
    });

    it('should not add contacts when none selected', () => {
        component.selectedNewContactIds = [];
        component.addContacts();
        expect(component.selectedNewContactIds.length).toBe(0);
    });

    it('should filter available contacts excluding existing ones', () => {
        component.campaignContacts = [
            { campaignId: 1, contactId: 1 },
            { campaignId: 1, contactId: 2 },
        ];
        const available = component.getAvailableContacts();
        available.forEach((c) => {
            expect([1, 2]).not.toContain(Number(c.id));
        });
    });
});
