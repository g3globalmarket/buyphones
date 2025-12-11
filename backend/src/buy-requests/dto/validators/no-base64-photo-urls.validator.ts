import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'noBase64PhotoUrls', async: false })
export class NoBase64PhotoUrlsConstraint
  implements ValidatorConstraintInterface
{
  validate(photoUrls: any) {
    // If photoUrls is undefined or null, it's valid (optional field)
    if (!photoUrls) {
      return true;
    }

    // Must be an array
    if (!Array.isArray(photoUrls)) {
      return false;
    }

    // Check each URL in the array
    for (const url of photoUrls) {
      // Must be a string
      if (typeof url !== 'string') {
        return false;
      }

      // Must not start with data:image/
      if (url.startsWith('data:image/')) {
        return false;
      }
    }

    return true;
  }

  defaultMessage() {
    return '사진은 파일 업로드를 통해 전송해주세요. (base64 데이터 URL은 지원하지 않습니다.)';
  }
}

/**
 * Validates that photoUrls array does not contain base64 data URLs
 * Each entry must be a string and must not start with "data:image/"
 */
export function NoBase64PhotoUrls(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoBase64PhotoUrlsConstraint,
    });
  };
}
