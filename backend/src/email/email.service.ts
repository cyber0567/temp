import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationCode(_to: string, _code: string): Promise<boolean> {
    return false;
  }

  async sendSignupLink(_to: string, _signupLink: string): Promise<boolean> {
    return false;
  }

  /** Send invite link for org invitation (Admin invites User). */
  async sendInviteLink(_to: string, inviteLink: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[email] Invite link for', _to, ':', inviteLink);
    }
    return true;
  }
}
