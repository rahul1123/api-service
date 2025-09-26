import {
  Injectable,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';
import { UtilService } from 'src/util/util.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { SignUpDto } from './dto/signup.dto';
import { DbService } from "../db/db.service";
import * as bcrypt from 'bcrypt';
import { SESv2Client, CreateEmailIdentityCommand, GetEmailIdentityCommand } from "@aws-sdk/client-sesv2";
import {
  CognitoIdentityProviderClient,
  SignUpCommand, InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class AuthService {
  private ses: SESv2Client;
  private readonly secretKey: string;
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly cognitoClient: CognitoIdentityProviderClient;
  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly utilService: UtilService,
    public dbService: DbService,
  ) {
  
  }

  //sign up code with cognito 
  async signUp(request: { email: string; password: string; name: string, phone_number: string, role: string, agency_id: number }): Promise<any> {
    const { email, password, name, phone_number, role, agency_id } = request;
    const secretHash = this.utilService.generateSecretHash(email, this.clientId, this.clientSecret);
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: request.email,
        },
        {
          Name: 'name',
          Value: request.name,
        },
        {
          Name: 'phone_number',
          Value: "+917043097908", // Use E.164 format. Example: +11234567890 for US.
        },
      ],
      // MessageAction: 'SUPPRESS'
    });
    try {
      const response = await this.cognitoClient.send(command);
      //confirm the user instant 
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: this.config.get<string>('COGNITO_USER_POOL_ID')!,
        Username: email,
      });
      let confirmResult = await this.cognitoClient.send(confirmCommand);
      console.log('Cognito user confirmed successfully:', confirmResult);
      // 3️⃣ Add user to Cognito group
      const groupName = role; // assuming you want to use `role` as group name
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: this.config.get<string>('COGNITO_USER_POOL_ID')!,
        Username: email,
        GroupName: groupName,
      });
      await this.cognitoClient.send(addToGroupCommand);
      console.log(`User added to group "${groupName}"`);
      // 4️⃣ SES Email Verification
      try {
        const getCmd = new GetEmailIdentityCommand({
          EmailIdentity: email,
        });
        const result = await this.ses.send(getCmd);
        console.log(result, 'result')
        if (result.VerificationStatus === "PENDING") {
          console.log(`⌛ ${email} verification is still pending.`);
        } if (result.VerificationStatus === "FAILED") {
          console.log(`${email} verification failed. You may need to re-verify.`);
        }
        console.log(`${email} status: ${result.VerificationStatus}`);

      } catch (sesErr) {
        if (sesErr.name === "AlreadyExistsException") {
          console.log("Email identity already exists, skipping verification");
        }
        if (sesErr.name !== "NotFoundException") {
          try {
            //case when email id not found in  ses 
            const verifyCmd = new CreateEmailIdentityCommand({
              EmailIdentity: email,
            });
            await this.ses.send(verifyCmd);
            console.log(`📧 SESv2 verification email sent to ${email}`);
          } catch (createErr) {
            console.error(`❌ SES verification failed for ${email}`, createErr);
          } console.error(`Failed to check email identity for ${email}`, sesErr);
          // return;
        }
      }
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      const usercreatePayload = {
        first_name: firstName,
        last_name: lastName || '',
        email,
        phone: phone_number,
        created_dt: new Date(),
        email_verified: 0,
        phone_verified: 0,
        password: hashedPassword,
        cognitoId: response.UserSub,// Add this
        role: role,
        agency_id: agency_id
      };
      // Optional DB sync
      return await this.createUser(usercreatePayload);
    } catch (error) {
      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('User already exists');
      }
      throw new BadRequestException(error.message || 'Signup failed');
    }
  }

  getToken(userId, userEmail) {
    const tokenCreationTime = Math.floor(Date.now() / 1000);
    const jti = uuidv4();
    const payload = {
      iss: this.apiKey,
      iat: tokenCreationTime,
      jti: jti,
      sub: userId,
      email: userEmail
    };
    const token = jwt.sign(payload, this.secretKey);
    return token;
  }

  async createUser(usercreatePayload) {
    try {
      //const hashedPassword = await bcrypt.hash(usercreatePayload.password, 10); // 10 is the salt rounds
      const setData = [
        { set: 'first_name', value: String(usercreatePayload.first_name) },
        { set: 'last_name', value: String(usercreatePayload.last_name) },
        { set: 'email', value: String(usercreatePayload.email) },
        { set: 'password', value: String(usercreatePayload.password ?? '') },
        { set: 'phone', value: String(usercreatePayload.phone_number ?? '') },
        { set: 'role', value: String(usercreatePayload.role ?? '') },
        { set: 'agency_id', value: String(usercreatePayload.agency_id ?? '') },
      ]
      const insertion = await this.dbService.insertData('users', setData);
      return this.utilService.successResponse(insertion, 'User created successfully.');
    } catch (error) {
      console.error('Create User Error:', error);
      throw error;
    }
  }

  async signIn(request: { email: string; password: string }): Promise<any> {
    try {
      const { email, password } = request;
      const user = await this.dbService.execute(`select id,first_name,last_name,password,status from users where email='${email}'`); // implement this method
      if (!user || user.length === 0) {
        throw new UnauthorizedException('Invalid email or password');
      }
 
      // 2. Check if user is active
      if (user[0]?.status !== 1) {
        throw new UnauthorizedException('User is not active');
      }
     
      // const isMatch = await bcrypt.compare(password, user[0].password);
      // if (!isMatch) {
      //   throw new UnauthorizedException('Invalid email or password');
      // }
      const payload = {
        sub: user[0].id,
        email: email,
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '1h',
      });
      return {
        accessToken,
        id: user[0].id,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
      };

    } catch (err) {
      console.error('sign-in error:', err);
      throw new UnauthorizedException('Invalid email or password', err);
    }
  }

  async forgotPassword(email: string): Promise<any> {
    const secretHash = this.utilService.generateSecretHash(email, this.clientId, this.clientSecret);

    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      SecretHash: secretHash,
    });

    try {
      const response = await this.cognitoClient.send(command);
      return {
        success: true,
        message: 'Password reset code sent to your email',
        codeDeliveryDetails: response.CodeDeliveryDetails
      };
    } catch (err) {
      console.error('Cognito forgot password error:', err);
      throw new BadRequestException(err.message || 'Failed to initiate password reset');
    }
  }

  async resetPassword(email: string, verificationCode: string, newPassword: string): Promise<any> {
    const secretHash = this.utilService.generateSecretHash(email, this.clientId, this.clientSecret);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: verificationCode,
      Password: newPassword,
      SecretHash: secretHash,
    });

    try {
      await this.cognitoClient.send(command);
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (err) {
      console.error('Cognito reset password error:', err);
      throw new BadRequestException(err.message || 'Failed to reset password');
    }
  }
}
