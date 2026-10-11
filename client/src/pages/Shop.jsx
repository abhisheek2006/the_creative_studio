import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import Pagination from '../components/Pagination';
import Seo from '../components/Seo';
import { PageLoader, EmptyState } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import { IconSearch, IconClose } from '../components/Icons';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'popular', label: 'Most popular' },
];

export default function Shop() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = searchParams.get('sort') || 'newest';
  const categoryParam = slug || searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const minPrice = searchParams.get('min') || '';
  const maxPrice = searchParams.get('max') || '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const debounce = useRef();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { page, sort, limit: 12 };
    if (searchParam) params.search = searchParam;
    if (minPrice) params.min = minPrice;
    if (maxPrice) params.max = maxPrice;

    const request = categoryParam
      ? api.get(`/categories/${categoryParam}/products`, { params })
      : api.get('/products', { params: { ...params, category: categoryParam || undefined } });

    request
      .then((res) => {
        if (!active) return;
        setProducts(res.data.data.products);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setPagination(null);
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [categoryParam, page, sort, searchParam, minPrice, maxPrice]);

  const updateParams = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.set('page', '1');
    if (!slug) setSearchParams(next);
    else {
      // When on /category/:slug, keep the URL but update query params.
      setSearchParams(next);
    }
  };

  const onSearch = (value) => {
    setSearchInput(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => updateParams({ search: value }), 450);
  };

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categoryParam),
    [categories, categoryParam]
  );

  const clearFilters = () => {
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    if (slug) navigate('/shop');
    else setSearchParams(new URLSearchParams());
  };

  return (
    <>
      <Seo
        title={activeCategory ? `${activeCategory.name} — Handmade by The Creative Studio` : 'Shop Handmade Gifts & Flowers'}
        description={
          activeCategory?.description ||
          'Browse handmade gifts, custom paintings, flower bouquets, hampers and printing services. Everything is crafted with love at The Creative Studio.'
        }
        path={activeCategory ? `/category/${activeCategory.slug}` : '/shop'}
      />
      <div className="page-head">
        <div className="container">
          <div className="breadcrumbs">
            <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
            {activeCategory ? ` / ${activeCategory.name}` : ''}
          </div>
          <span className="kicker hand" style={{ color: 'var(--forest)' }}>
            {activeCategory ? activeCategory.name : 'our handmade store'}
          </span>
          <h1>{activeCategory ? activeCategory.name : 'Shop'}</h1>
          <Squiggle color="#F4A6C1" />
          <p>{activeCategory?.description || 'Handmade gifts, flowers, paintings and more — made just for you.'}</p>
        </div>
      </div>

      <div className="container">
        <div className="shop-toolbar">
          <div className="search-box">
            <IconSearch />
            <input
              type="search"
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? 'Hide filters' : 'Filters'}
            </button>
            <select
              className="select-sort"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              aria-label="Sort products"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: '1.2rem' }}>
          <button
            type="button"
            className={`chip ${!categoryParam ? 'active' : ''}`}
            onClick={() => navigate('/shop')}
          >
            All
          </button>
          {categories
            .filter((c) => !c.isRecruitment)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${categoryParam === c.slug ? 'active' : ''}`}
                onClick={() => navigate(`/category/${c.slug}`)}
              >
                {c.name}
              </button>
            ))}
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="min">Minimum price (₹)</label>
              <input
                id="min"
                type="number"
                min="0"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="max">Maximum price (₹)</label>
              <input
                id="max"
                type="number"
                min="0"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                placeholder="Any"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => updateParams({ min: minInput, max: maxInput })}
              >
                Apply
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                <IconClose width="16" height="16" /> Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No products found"
            text="Try a different search or clear the filters."
            action={
              <button type="button" className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {pagination && (
              <p className="muted small" style={{ marginBottom: '0.8rem' }}>
                Showing {products.length} of {pagination.total} products
              </p>
            )}
            <div className="prod-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
            {pagination && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onChange={(p) => {
                  updateParams({ page: p }, false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </>
  );
}