// create-reseller.dto.ts
export class CreateResellerDto {
  domain: string;
  orgDisplayName: string;
  alternateEmail: string;
  primaryContactInfo: {
    email: string;
    firstName: string;
    lastName: string;
  };
}
export class UpdateResellerDto extends  CreateResellerDto  {}