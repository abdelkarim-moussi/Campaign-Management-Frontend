import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplatesComponent } from './templates.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';

describe('TemplatesComponent', () => {
    let component: TemplatesComponent;
    let fixture: ComponentFixture<TemplatesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TemplatesComponent, ToastrModule.forRoot()],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(TemplatesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with empty filters', () => {
        expect(component.searchQuery).toBe('');
        expect(component.typeFilter).toBe('');
        expect(component.statusFilter).toBe('');
    });

    it('should toggle create form', () => {
        expect(component.showCreateForm).toBeFalse();
        component.showCreateForm = true;
        expect(component.showCreateForm).toBeTrue();
    });

    it('should reset form on cancelEdit', () => {
        component.editingTemplateId = 'test-id';
        component.formData = {
            name: 'Test',
            content: 'Content',
            type: 'SMS',
        };
        component.cancelEdit();
        expect(component.editingTemplateId).toBeNull();
        expect(component.formData.name).toBe('');
    });

    it('should set delete target on deleteTemplate', () => {
        component.deleteTemplate('123');
        expect(component.deleteTargetId).toBe('123');
        expect(component.showDeleteConfirm).toBeTrue();
    });

    it('should clear delete state on cancelDelete', () => {
        component.deleteTemplate('123');
        component.cancelDelete();
        expect(component.deleteTargetId).toBeNull();
        expect(component.showDeleteConfirm).toBeFalse();
    });

    it('should return correct status classes', () => {
        expect(component.getStatusClass('ACTIVE')).toContain('green');
        expect(component.getStatusClass('DRAFT')).toContain('yellow');
        expect(component.getStatusClass('ARCHIVED')).toContain('gray');
    });

    it('should return correct type classes', () => {
        expect(component.getTypeClass('EMAIL')).toContain('primary');
        expect(component.getTypeClass('SMS')).toContain('accent');
    });
});
