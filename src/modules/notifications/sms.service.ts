import { Smsir } from 'smsir-js';
import 'dotenv/config';

export class SmsService {
  private smsir: Smsir;

  constructor() {
    const apiKey = process.env.SMSIR_API_KEY;
    const lineNumber = process.env.SMSIR_LINE_NUMBER;

    if (!apiKey || !lineNumber) {
      throw new Error('SMSIR_API_KEY and SMSIR_LINE_NUMBER must be set in the environment variables.');
    }

    this.smsir = new Smsir(apiKey, parseInt(lineNumber, 10));
  }

  async sendVerificationCode(mobile: string, templateId: number, parameters: Array<{ name: string; value: string }>) {
    // In a real application, you would use the following line:
    // return this.smsir.SendVerifyCode(mobile, templateId, parameters);

    // For now, we will just log the action
    console.log(`Sending verification code to ${mobile} with template ${templateId}`);
    return Promise.resolve({ status: 'success' });
  }
}
