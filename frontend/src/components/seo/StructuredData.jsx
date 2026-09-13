// src/components/seo/StructuredData.jsx
import { useLocation } from 'react-router-dom';
import { useProductSeo } from '../../context/ProductSeoContext';
import { usePageData } from '../../context/PageDataContext';

const SITE_URL = 'https://aasgari.ir';
const AUTHOR_NAME = 'Ali Asgari';
const PUBLISHED_DATE = '2026-07-19T20:45:39+03:30';
const MODIFIED_DATE = '2026-09-10T12:00:00+03:30';

function StructuredData() {
  const location = useLocation();
  const { productSeo } = useProductSeo();
  const { siteSettings } = usePageData() || {};

  let schema;

  // ✅ JSON-LD محصول
  if (productSeo && productSeo.name && !productSeo.isPage) {
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productSeo.name,
      description: productSeo.description || '',
      image: productSeo.image ? [productSeo.image] : [],
      brand: productSeo.brand
        ? { '@type': 'Brand', name: productSeo.brand }
        : undefined,
      offers: {
        '@type': 'Offer',
        url: productSeo.url || `${SITE_URL}${location.pathname}`,
        priceCurrency: 'IRR',
        price: productSeo.price || 0,
        availability: productSeo.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      // ✅ Author برای محصول
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
      },
    };

    if (productSeo.rating && productSeo.totalReviews > 0) {
      productSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: productSeo.rating,
        reviewCount: productSeo.totalReviews,
        bestRating: 5,
        worstRating: 1,
      };
    }

    schema = productSchema;
  } else {
    // ✅ JSON-LD سایت با author
    schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteSettings?.siteName || 'HomeMart',
      url: SITE_URL,
      // ✅ Author
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
      },
      // ✅ Publisher
      publisher: {
        '@type': 'Organization',
        name: siteSettings?.siteName || 'HomeMart',
        logo: {
          '@type': 'ImageObject',
          url: siteSettings?.logo
            ? (siteSettings.logo.startsWith('http') ? siteSettings.logo : `${SITE_URL}${siteSettings.logo}`)
            : `${SITE_URL}/og-default.png`,
        },
      },
      // ✅ Freshness
      datePublished: PUBLISHED_DATE,
      dateModified: MODIFIED_DATE,
    };
  }

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
}

export default StructuredData;