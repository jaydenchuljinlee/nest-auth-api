import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  email: string;

  @IsString()
  resetToken: string;

  @IsString()
  @Length(8, 20)
  newPassword: string;
}
