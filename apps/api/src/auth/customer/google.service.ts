import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUserInfo {
  email: string;
  name: string;
  googleId: string;
  emailVerified: boolean;
  picture: string | null;
}

@Injectable()
export class GoogleService {
  private isMock: boolean;
  private oauthClient: OAuth2Client | null = null;

  constructor(private config: ConfigService) {
    this.isMock = config.get<string>('MOCK_GOOGLE_OAUTH') === 'true';

    if (!this.isMock) {
      this.oauthClient = new OAuth2Client(
        config.get<string>('GOOGLE_CLIENT_ID'),
        config.get<string>('GOOGLE_CLIENT_SECRET'),
        config.get<string>('GOOGLE_REDIRECT_URI'),
      );
    }
  }

  getAuthUrl(): string {
    if (this.isMock) {
      return 'http://localhost:3000/auth/google/mock-callback';
    }

    return this.oauthClient!.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
    });
  }

  async exchangeCode(code: string): Promise<GoogleUserInfo> {
    if (this.isMock) {
      return {
        email: 'mockuser@gmail.com',
        name: 'Mock User',
        googleId: `mock-google-id-${code.slice(0, 8)}`,
        emailVerified: true,
        picture: null,
      };
    }

    const { tokens } = await this.oauthClient!.getToken(code);
    const ticket = await this.oauthClient!.verifyIdToken({
      idToken: tokens.id_token!,
      audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload()!;
    return {
      email: payload.email!,
      name: payload.name!,
      googleId: payload.sub,
      emailVerified: payload.email_verified ?? false,
      picture: payload.picture ?? null,
    };
  }
}
