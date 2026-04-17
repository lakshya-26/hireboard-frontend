import { BRAND_LOGO_URL } from '../../lib/brand';

export default function BrandLogo({
  className =
    'h-8 w-auto max-w-[104px] shrink-0 rounded-lg object-contain object-left shadow-sm ring-1 ring-slate-200/80',
  alt = 'HireBoard',
}) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt={alt}
      decoding="async"
      className={className}
    />
  );
}
