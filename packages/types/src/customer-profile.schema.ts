export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  hasPassword: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailInput {
  newEmail: string;
  currentPassword?: string;
}
