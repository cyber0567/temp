import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationCode(_to: string, _code: string): Promise<boolean> {
    return false;
  }

  async sendSignupLink(_to: string, _signupLink: string): Promise<boolean> {
    return false;
  }
}
