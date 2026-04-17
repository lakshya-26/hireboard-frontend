import { BRAND_LOGO_URL } from '../../lib/brand';

export default function BrandLogo({
  className = 'h-9 w-9 shrink-0 rounded-[10px] object-contain shadow-md',
  alt = 'HireBoard',
}) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt={alt}
      width={36}
      height={36}
      decoding="async"
      className={className}
    />
  );
}
