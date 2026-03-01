import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
    let component: ConfirmDialogComponent;
    let fixture: ComponentFixture<ConfirmDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfirmDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not render dialog when isOpen is false', () => {
        component.isOpen = false;
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('.animate-dialog');
        expect(dialog).toBeNull();
    });

    it('should render dialog when isOpen is true', () => {
        component.isOpen = true;
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('.animate-dialog');
        expect(dialog).toBeTruthy();
    });

    it('should display custom title and message', () => {
        component.isOpen = true;
        component.title = 'Custom Title';
        component.message = 'Custom message';
        fixture.detectChanges();
        const title = fixture.nativeElement.querySelector('h3');
        const message = fixture.nativeElement.querySelector('p');
        expect(title.textContent.trim()).toBe('Custom Title');
        expect(message.textContent.trim()).toBe('Custom message');
    });

    it('should emit confirmed event on confirm click', () => {
        component.isOpen = true;
        fixture.detectChanges();
        spyOn(component.confirmed, 'emit');
        const buttons = fixture.nativeElement.querySelectorAll('button');
        buttons[1].click();
        expect(component.confirmed.emit).toHaveBeenCalled();
    });

    it('should emit cancelled event on cancel click', () => {
        component.isOpen = true;
        fixture.detectChanges();
        spyOn(component.cancelled, 'emit');
        const buttons = fixture.nativeElement.querySelectorAll('button');
        buttons[0].click();
        expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('should emit cancelled event on backdrop click', () => {
        component.isOpen = true;
        fixture.detectChanges();
        spyOn(component.cancelled, 'emit');
        const backdrop = fixture.nativeElement.querySelector('.fixed');
        backdrop.click();
        expect(component.cancelled.emit).toHaveBeenCalled();
    });
});
