export function getAuthRedirectUrl(origin = window.location.origin) {
  return `${origin.replace(/\/+$/, '')}/profile`;
}
