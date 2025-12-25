import { SmsService } from '../notifications/sms.service';

export class AuthService {
  private smsService: SmsService;

  constructor() {
    this.smsService = new SmsService();
  }

  async loginOrRegister(mobile: string) {
    // This is a placeholder for the actual logic.
    // In a real application, you would generate a random code,
    // store it, and then send it.
    const templateId = 100000; // Example template ID from sms.ir panel
    const parameters = [{ name: 'CODE', value: '12345' }];

    console.log(`Attempting to send verification code to ${mobile}`);
    return this.smsService.sendVerificationCode(mobile, templateId, parameters);
  }
}
