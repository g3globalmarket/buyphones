import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { UpdateMyRequestDto } from '../dto/update-my-request.dto';

@ValidatorConstraint({ name: 'BankInfoGroup', async: false })
export class BankInfoGroupConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const dto = args.object as UpdateMyRequestDto;

    const hasAnyBankField =
      !!dto.bankName || !!dto.bankAccount || !!dto.bankHolder;

    // valid if:
    // - no bank field is provided
    // - OR all 3 are provided
    if (!hasAnyBankField) {
      return true;
    }

    return !!dto.bankName && !!dto.bankAccount && !!dto.bankHolder;
  }

  defaultMessage(): string {
    return '은행 정보는 은행명, 계좌번호, 예금주를 모두 입력해야 합니다.';
  }
}

export function ValidateBankInfoGroup(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'bankInfoGroup',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BankInfoGroupConstraint,
    });
  };
}
