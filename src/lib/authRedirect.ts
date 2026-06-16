export function getAuthRedirectUrl(
  origin = window.location.origin,
  destination = '/profile',
) {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedDestination = `/${destination.replace(/^\/+/, '')}`;

  return `${normalizedOrigin}${normalizedDestination}`;
}
