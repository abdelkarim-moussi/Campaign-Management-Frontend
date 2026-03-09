import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignsComponent } from './campaigns.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';

describe('CampaignsComponent', () => {
    let component: CampaignsComponent;
    let fixture: ComponentFixture<CampaignsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CampaignsComponent, ToastrModule.forRoot()],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CampaignsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with empty filters', () => {
        expect(component.searchQuery).toBe('');
        expect(component.statusFilter).toBe('');
        expect(component.channelFilter).toBe('');
    });

    it('should initialize with default form data', () => {
        expect(component.formData.name).toBe('');
        expect(component.formData.channel).toBe('EMAIL');
        expect(component.formData.templateId).toBe(0);
    });

    it('should toggle create form', () => {
        expect(component.showCreateForm).toBeFalse();
        component.showCreateForm = true;
        expect(component.showCreateForm).toBeTrue();
    });

    it('should not submit when form is invalid', () => {
        component.formData.name = '';
        component.createCampaign();
        expect(component.formSubmitted).toBeTrue();
    });

    it('should reset form on cancelEdit', () => {
        component.editingCampaignId = 1;
        component.formData.name = 'Test Campaign';
        component.cancelEdit();
        expect(component.editingCampaignId).toBeNull();
        expect(component.formData.name).toBe('');
        expect(component.formSubmitted).toBeFalse();
    });

    it('should set delete target on deleteCampaign', () => {
        component.deleteCampaign(5);
        expect(component.deleteTargetId).toBe(5);
        expect(component.showDeleteConfirm).toBeTrue();
    });

    it('should clear delete state on cancelDelete', () => {
        component.deleteCampaign(5);
        component.cancelDelete();
        expect(component.deleteTargetId).toBeNull();
        expect(component.showDeleteConfirm).toBeFalse();
    });

    it('should set send target on sendCampaign', () => {
        component.sendCampaign(3);
        expect(component.sendTargetId).toBe(3);
        expect(component.showSendConfirm).toBeTrue();
    });

    it('should clear send state on cancelSend', () => {
        component.sendCampaign(3);
        component.cancelSend();
        expect(component.sendTargetId).toBeNull();
        expect(component.showSendConfirm).toBeFalse();
    });

    it('should toggle contact selection', () => {
        component.toggleContact(1);
        expect(component.isContactSelected(1)).toBeTrue();
        component.toggleContact(1);
        expect(component.isContactSelected(1)).toBeFalse();
    });

    it('should return correct status classes', () => {
        expect(component.getStatusClass('DRAFT')).toContain('yellow');
        expect(component.getStatusClass('SCHEDULED')).toContain('blue');
        expect(component.getStatusClass('SENT')).toContain('green');
    });

    it('should return correct channel classes', () => {
        expect(component.getChannelClass('EMAIL')).toContain('primary');
        expect(component.getChannelClass('SMS')).toContain('accent');
    });

    it('should detect duplicate campaign names', () => {
        component.formData.name = 'Existing Campaign';
        expect(component.isDuplicateName()).toBeFalse();
    });

    it('should validate form requires name, template, and contacts', () => {
        component.formData.name = '';
        component.formData.templateId = 0;
        component.selectedContactIds = [];
        expect(component.isFormValid()).toBeFalse();

        component.formData.name = 'Test';
        component.formData.templateId = 1;
        component.selectedContactIds = [1];
        expect(component.isFormValid()).toBeTrue();
    });

    it('should reset form completely', () => {
        component.formData.name = 'Test';
        component.selectedContactIds = [1, 2];
        component.formSubmitted = true;
        component.showCreateForm = true;
        component.resetForm();
        expect(component.formData.name).toBe('');
        expect(component.selectedContactIds.length).toBe(0);
        expect(component.formSubmitted).toBeFalse();
        expect(component.showCreateForm).toBeFalse();
    });
});
