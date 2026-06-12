// Та же политика пароля, что и на backend (app/core/security.py).

export interface PasswordRule {
  label: string;
  ok: boolean;
}

export function checkPassword(password: string): PasswordRule[] {
  return [
    { label: "Не менее 8 символов", ok: password.length >= 8 },
    { label: "Заглавная латинская буква (A–Z)", ok: /[A-Z]/.test(password) },
    { label: "Строчная латинская буква (a–z)", ok: /[a-z]/.test(password) },
    { label: "Цифра (0–9)", ok: /\d/.test(password) },
    {
      label: "Спецсимвол (!@#$%…)",
      ok: /[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]/.test(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return checkPassword(password).every((r) => r.ok);
}
