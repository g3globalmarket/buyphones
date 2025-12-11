import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { UpdateMyRequestDto } from '../dto/update-my-request.dto';

@ValidatorConstraint({ name: 'ShippingInfoGroup', async: false })
export class ShippingInfoGroupConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args: ValidationArguments): boolean {
    const dto = args.object as UpdateMyRequestDto;

    const hasAnyShippingField =
      !!dto.shippingMethod ||
      !!dto.shippingTrackingCode ||
      !!dto.shippingTrackingUrl;

    // valid if:
    // - no shipping field is provided
    // - OR shippingMethod and shippingTrackingCode are both provided
    if (!hasAnyShippingField) {
      return true;
    }

    return !!dto.shippingMethod && !!dto.shippingTrackingCode;
  }

  defaultMessage(): string {
    return '배송 정보는 발송 방법과 운송장 번호를 모두 입력해야 합니다.';
  }
}

export function ValidateShippingInfoGroup(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'shippingInfoGroup',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ShippingInfoGroupConstraint,
    });
  };
}
