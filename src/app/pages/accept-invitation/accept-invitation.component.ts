import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accept-invitation.component.html',
  styleUrls: ['./accept-invitation.component.css'],
})
export class AcceptInvitationComponent implements OnInit {
  invitationForm!: FormGroup;
  isLoading = false;
  formSubmitted = false;
  showPassword = false;
  showConfirmPassword = false;
  invitationToken: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.invitationToken = params['token'] || '';
      if (!this.invitationToken) {
        this.toastr.error('Invitation token is missing');
        this.router.navigate(['/login']);
      }
    });

    this.initializeForm();
  }

  private initializeForm(): void {
    this.invitationForm = this.fb.group(
      {
        token: [this.invitationToken, [Validators.required]],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFormValid(): boolean {
    return (
      this.invitationForm &&
      this.invitationForm.valid &&
      this.invitationForm.get('firstName')?.value.trim() !== '' &&
      this.invitationForm.get('lastName')?.value.trim() !== ''
    );
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (!this.isFormValid()) {
      this.toastr.error('Please fill in all required fields correctly');
      return;
    }

    this.isLoading = true;

    const request = {
      token: this.invitationForm.get('token')?.value,
      firstName: this.invitationForm.get('firstName')?.value.trim(),
      lastName: this.invitationForm.get('lastName')?.value.trim(),
      password: this.invitationForm.get('password')?.value,
    };

    this.authService.acceptInvitation(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Account activated successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.message ||
          'Failed to activate account. Please try again.';
        this.toastr.error(errorMessage);
      },
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.invitationForm.get(fieldName);
    if (!control || (!this.formSubmitted && !control.touched)) {
      return '';
    }

    if (control.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control.hasError('minLength')) {
      const minLength = control.getError('minLength')?.requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`;
    }
    if (
      fieldName === 'confirmPassword' &&
      this.invitationForm.hasError('passwordMismatch')
    ) {
      return 'Passwords do not match';
    }

    return '';
  }
}
