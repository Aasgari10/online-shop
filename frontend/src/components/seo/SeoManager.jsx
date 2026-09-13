// src/components/seo/SeoManager.jsx
import { useLocation } from 'react-router-dom';
import { usePageData } from '../../context/PageDataContext';
import { useProductSeo } from '../../context/ProductSeoContext';

const SITE_URL = 'https://aasgari.ir';
const DEFAULT_TITLE = 'فروشگاه اینترنتی HomeMart';
const DEFAULT_DESCRIPTION = 'خرید بهترین و باکیفیت‌ترین لوازم خانگی با قیمت مناسب از فروشگاه اینترنتی HomeMart';
const DEFAULT_IMAGE = '/og-default.png';
const AUTHOR_NAME = 'Ali Asgari';

const NOINDEX_PATHS = [
  '/login',
  '/register',
  '/cart',
  '/payment',
  '/profile',
  '/wishlist',
  '/support/tickets',
  '/order',
  '/admin',
];

function SeoManager() {
  const location = useLocation();
  const { page, siteSettings } = usePageData() || {};
  const { productSeo } = useProductSeo();

  const shouldNoIndex = NOINDEX_PATHS.some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  const title =
    productSeo?.title ||
    page?.seo_title ||
    page?.title ||
    siteSettings?.seo_title ||
    siteSettings?.siteName ||
    DEFAULT_TITLE;

  const description =
    productSeo?.description ||
    page?.seo_description ||
    siteSettings?.seo_description ||
    siteSettings?.description ||
    DEFAULT_DESCRIPTION;

  const rawImage =
    productSeo?.image ||
    siteSettings?.ogImage ||
    siteSettings?.logo ||
    DEFAULT_IMAGE;

  const image = rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`;

  const canonical = productSeo?.pageUrl || `${SITE_URL}${location.pathname}`;

  const ogType = productSeo && !productSeo.isPage ? 'product' : 'website';

  const siteName = siteSettings?.siteName || 'HomeMart';

  return (
    <>
      {/* ==================== Basic Meta ==================== */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content={AUTHOR_NAME} />

      {/* ==================== Application Identity ==================== */}
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* ==================== Mobile Web App ==================== */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* ==================== Theme Color ==================== */}
      <meta name="theme-color" content="#800E2F" />

      {/* ==================== Canonical ==================== */}
      <link rel="canonical" href={canonical} />

      {/* ==================== Robots ==================== */}
      {shouldNoIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* ==================== Open Graph ==================== */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="fa_IR" />

      {/* ==================== Twitter Card ==================== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ==================== Product Meta ==================== */}
      {productSeo?.price && !productSeo?.isPage && (
        <>
          <meta property="product:price:amount" content={String(productSeo.price)} />
          <meta property="product:price:currency" content="IRR" />
          <meta
            property="product:availability"
            content={productSeo.inStock ? 'in stock' : 'out of stock'}
          />
        </>
      )}
    </>
  );
}

export default SeoManager;