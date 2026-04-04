export function resolveSecretFieldMeta(isVisible: boolean, fieldLabel: string) {
  return {
    inputType: isVisible ? 'text' : 'password',
    actionLabel: `${isVisible ? '隐藏' : '显示'} ${fieldLabel}`,
    icon: isVisible ? 'eye-off' : 'eye',
  } as const
}
