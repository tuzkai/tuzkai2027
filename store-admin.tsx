import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import {
  useListAdminStoreProducts, useListAdminStoreCategories,
  useCreateAdminStoreProduct, useUpdateAdminStoreProduct, useDeleteAdminStoreProduct,
  useCreateAdminStoreCategory, useUpdateAdminStoreCategory, useDeleteAdminStoreCategory,
  useListAdminStoreSupportTickets, useUpdateAdminStoreSupportTicket,
  getListAdminStoreProductsQueryKey, getListAdminStoreCategoriesQueryKey,
  getListAdminStoreSupportTicketsQueryKey,
  getListStoreProductsQueryKey, getListStoreCategoriesQueryKey,
  type StoreProduct, type StoreCategory, type StoreProductInput, type StoreCategoryInput, type StoreSupportTicket, type StoreSupportTicketUpdate,
} from '@workspace/api-client-react';
import { SiteLink as Link } from '../components/site';

type ProductDraft = { name: string; slug: string; categoryId: string; productType: 'digital' | 'ai_tool'; summary: string; description: string; features: string; requirements: string; imageUrl: string; whopProductId: string; whopProductUrl: string; deliveryInstructions: string };
type CategoryDraft = { name: string; slug: string; description: string; active: boolean };
const emptyProduct: ProductDraft = { name: '', slug: '', categoryId: '', productType: 'digital', summary: '', description: '', features: '', requirements: '', imageUrl: '', whopProductId: '', whopProductUrl: '', deliveryInstructions: '' };
const emptyCategory: CategoryDraft = { name: '', slug: '', description: '', active: true };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const statusOf = (error: unknown) => error && typeof error === 'object' && 'status' in error ? Number(error.status) : undefined;
const errorText = (error: unknown) => error instanceof Error ? error.message : 'The request could not be completed. Please try again.';
const lines = (value: string) => value.split('\n').map(line => line.trim()).filter(Boolean);
const validOptionalUrl = (value: string) => { if (!value) return true; try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const fromProduct = (p: StoreProduct): ProductDraft => ({ name: p.name, slug: p.slug, categoryId: p.categoryId ?? '', productType: p.productType, summary: p.summary ?? '', description: p.description ?? '', features: p.features.join('\n'), requirements: p.requirements.join('\n'), imageUrl: p.imageUrl ?? '', whopProductId: p.whopProductId ?? '', whopProductUrl: p.whopProductUrl ?? '', deliveryInstructions: p.deliveryInstructions ?? '' });
const fromCategory = (c: StoreCategory): CategoryDraft => ({ name: c.name, slug: c.slug, description: c.description ?? '', active: c.active });

function StoreSupportQueue() {
  const cache = useQueryClient();
  const tickets = useListAdminStoreSupportTickets({ query: { queryKey: getListAdminStoreSupportTicketsQueryKey(), retry: (count, error) => statusOf(error) !== 403 && count < 2 } });
  const update = useUpdateAdminStoreSupportTicket();
  const [selected, setSelected] = useState<StoreSupportTicket | null>(null);
  const [status, setStatus] = useState<StoreSupportTicketUpdate['status']>('new');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const open = (ticket: StoreSupportTicket) => { setSelected(ticket); setStatus(ticket.status); setReply(ticket.adminReply ?? ''); setError(''); setSaved(''); };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return;
    setError(''); setSaved('');
    if (reply.length > 10000) { setError('Internal reply cannot exceed 10,000 characters.'); return; }
    try {
      await update.mutateAsync({ id: selected.id, data: { status, adminReply: reply.trim() || null } });
      await cache.invalidateQueries({ queryKey: getListAdminStoreSupportTicketsQueryKey() });
      setSaved('Ticket updated. The reply was saved internally; no email was sent.');
      setSelected(null);
    } catch (e) { setError(errorText(e)); }
  };
  if (tickets.isLoading) return <div className="store-admin-loading" role="status" aria-label="Loading support tickets"><span/><span/><span/></div>;
  if (tickets.isError) return <div className="notice" role="alert">{statusOf(tickets.error) === 403 ? 'Access restricted: you are not authorized to view support tickets.' : `Support tickets could not be loaded. ${errorText(tickets.error)}`} {statusOf(tickets.error) !== 403 && <button type="button" onClick={() => void tickets.refetch()} data-testid="button-retry-tickets"><RefreshCw size={15}/> Retry</button>}</div>;
  return <div className="store-admin-queue"><div className="store-admin-queue-heading"><div><span className="store-kicker">SUPPORT / INBOX</span><h2>Support requests <span>{tickets.data?.length ?? 0}</span></h2></div><p>Replies saved here are internal records. To respond to a customer, use a separately configured contact channel.</p></div>{saved && <div className="store-admin-message success" role="status"><Check size={16}/>{saved}</div>}{!tickets.data?.length ? <div className="store-admin-empty"><h2>No support requests.</h2><p>Submitted requests will appear here for review.</p></div> : <div className="store-admin-list">{tickets.data.map(ticket => <article className="store-admin-ticket" key={ticket.id} data-testid={`row-support-ticket-${ticket.id}`}><div className="store-admin-ticket-head"><div><span className={`store-admin-status status-${ticket.status}`}>{ticket.status}</span><h3>{ticket.subject}</h3><p>{ticket.name} · <a href={`mailto:${ticket.email}`}>{ticket.email}</a> · {new Date(ticket.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => selected?.id === ticket.id ? setSelected(null) : open(ticket)} data-testid={`button-review-ticket-${ticket.id}`}>{selected?.id === ticket.id ? 'Close' : 'Review'}</button></div><p className="store-admin-ticket-message">{ticket.message}</p>{ticket.adminReply && selected?.id !== ticket.id && <div className="store-admin-internal"><strong>Saved internal reply</strong><p>{ticket.adminReply}</p></div>}{selected?.id === ticket.id && <form className="store-admin-ticket-form" onSubmit={e => void save(e)}><label className="field">Status<select className="input" value={status} onChange={e => setStatus(e.target.value as StoreSupportTicketUpdate['status'])} data-testid={`select-ticket-status-${ticket.id}`}><option value="new">New</option><option value="open">Open</option><option value="answered">Answered</option><option value="closed">Closed</option></select></label><label className="field">Internal reply / note<textarea className="input" maxLength={10000} value={reply} onChange={e => setReply(e.target.value)} data-testid={`input-ticket-reply-${ticket.id}`}/></label><p className="store-admin-hint">Saving this text does not email the customer, even if you mark the ticket answered.</p>{error && <div className="store-admin-message error" role="alert">{error}</div>}<button type="submit" className="store-button store-button-dark" disabled={update.isPending} data-testid={`button-save-ticket-${ticket.id}`}>{update.isPending ? 'Saving…' : 'Save internal update'} <ArrowRight size={16}/></button></form>}</article>)}</div>}</div>;
}

export default function StoreAdminPage() {
  const cache = useQueryClient();
  const products = useListAdminStoreProducts({ query: { queryKey: getListAdminStoreProductsQueryKey(), retry: (count, error) => statusOf(error) !== 403 && count < 2 } });
  const categories = useListAdminStoreCategories({ query: { queryKey: getListAdminStoreCategoriesQueryKey(), retry: (count, error) => statusOf(error) !== 403 && count < 2 } });
  const createProduct = useCreateAdminStoreProduct();
  const updateProduct = useUpdateAdminStoreProduct();
  const deleteProduct = useDeleteAdminStoreProduct();
  const createCategory = useCreateAdminStoreCategory();
  const updateCategory = useUpdateAdminStoreCategory();
  const deleteCategory = useDeleteAdminStoreCategory();
  const [tab, setTab] = useState<'products' | 'categories' | 'support'>('products');
  const [editingProduct, setEditingProduct] = useState<StoreProduct | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | 'new' | null>(null);
  const [productForm, setProductForm] = useState<ProductDraft>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<CategoryDraft>(emptyCategory);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');
  const restricted = statusOf(products.error) === 403 || statusOf(categories.error) === 403;
  const invalidate = async () => { await Promise.all([
    cache.invalidateQueries({ queryKey: getListAdminStoreProductsQueryKey() }),
    cache.invalidateQueries({ queryKey: getListAdminStoreCategoriesQueryKey() }),
    cache.invalidateQueries({ queryKey: getListStoreProductsQueryKey() }),
    cache.invalidateQueries({ queryKey: getListStoreCategoriesQueryKey() }),
  ]); };
  const resetNotice = () => { setError(''); setSuccess(''); };
  const openProduct = (item: StoreProduct | 'new') => { resetNotice(); setEditingCategory(null); setEditingProduct(item); setProductForm(item === 'new' ? emptyProduct : fromProduct(item)); };
  const openCategory = (item: StoreCategory | 'new') => { resetNotice(); setEditingProduct(null); setEditingCategory(item); setCategoryForm(item === 'new' ? emptyCategory : fromCategory(item)); };
  const productPayload = (): StoreProductInput => ({
    name: productForm.name.trim(), slug: productForm.slug.trim(), categoryId: productForm.categoryId || null,
    productType: productForm.productType, summary: productForm.summary.trim() || null,
    description: productForm.description.trim() || null, features: lines(productForm.features),
    requirements: lines(productForm.requirements), imageUrl: productForm.imageUrl.trim() || null,
    whopProductId: productForm.whopProductId.trim() || null, whopProductUrl: productForm.whopProductUrl.trim() || null,
    deliveryInstructions: productForm.deliveryInstructions.trim() || null,
    status: editingProduct === 'new' ? 'draft' : editingProduct?.status || 'draft',
  });
  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); resetNotice();
    const p = productPayload();
    if (!p.name || p.name.length > 200 || !slugPattern.test(p.slug) || p.slug.length > 200) { setError('Enter a name (up to 200 characters) and a lowercase hyphenated slug.'); return; }
    if ((p.summary?.length ?? 0) > 500 || (p.description?.length ?? 0) > 10000 || p.features!.some(x => x.length > 500) || p.requirements!.some(x => x.length > 500)) { setError('Summary, description, or list item exceeds its allowed length.'); return; }
    if (!validOptionalUrl(productForm.imageUrl.trim()) || !validOptionalUrl(productForm.whopProductUrl.trim())) { setError('Image and Whop URLs must be valid HTTPS URLs.'); return; }
    if (productForm.whopProductId.length > 200 || productForm.deliveryInstructions.length > 5000) { setError('Whop ID or delivery instructions are too long.'); return; }
    try {
      if (editingProduct === 'new') await createProduct.mutateAsync({ data: p });
      else if (editingProduct) await updateProduct.mutateAsync({ id: editingProduct.id, data: p });
      await invalidate(); setEditingProduct(null); setSuccess(editingProduct === 'new' ? 'Draft product created.' : 'Product updated.');
    } catch (e) { setError(errorText(e)); }
  };
  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); resetNotice();
    const p: StoreCategoryInput = { name: categoryForm.name.trim(), slug: categoryForm.slug.trim(), description: categoryForm.description.trim() || null, active: categoryForm.active };
    if (!p.name || p.name.length > 120 || !slugPattern.test(p.slug) || p.slug.length > 160 || (p.description?.length ?? 0) > 2000) { setError('Check the name, description, and lowercase hyphenated slug.'); return; }
    try {
      if (editingCategory === 'new') await createCategory.mutateAsync({ data: p });
      else if (editingCategory) await updateCategory.mutateAsync({ id: editingCategory.id, data: p });
      await invalidate(); setEditingCategory(null); setSuccess(editingCategory === 'new' ? 'Category created.' : 'Category updated.');
    } catch (e) { setError(errorText(e)); }
  };
  const changeStatus = async (p: StoreProduct, status: 'draft' | 'published' | 'archived') => {
    resetNotice(); setBusyId(p.id);
    try { await updateProduct.mutateAsync({ id: p.id, data: { status } }); await invalidate(); setSuccess(`${p.name} is now ${status}.`); }
    catch (e) { setError(errorText(e)); } finally { setBusyId(''); }
  };
  const removeProduct = async (p: StoreProduct) => {
    if (p.status !== 'draft' || !window.confirm(`Delete draft “${p.name}”? This cannot be undone.`)) return;
    resetNotice(); setBusyId(p.id);
    try { await deleteProduct.mutateAsync({ id: p.id }); await invalidate(); setSuccess('Draft deleted.'); }
    catch (e) { setError(errorText(e)); } finally { setBusyId(''); }
  };
  const toggleCategory = async (c: StoreCategory) => {
    resetNotice(); setBusyId(c.id);
    try { await updateCategory.mutateAsync({ id: c.id, data: { active: !c.active } }); await invalidate(); setSuccess(`${c.name} ${c.active ? 'deactivated' : 'activated'}.`); }
    catch (e) { setError(errorText(e)); } finally { setBusyId(''); }
  };
  const removeCategory = async (c: StoreCategory) => {
    if (!window.confirm(`Delete category “${c.name}”? This cannot be undone.`)) return;
    resetNotice(); setBusyId(c.id);
    try { await deleteCategory.mutateAsync({ id: c.id }); await invalidate(); setSuccess('Category deleted.'); }
    catch (e) { setError(errorText(e)); } finally { setBusyId(''); }
  };
  const field = (key: keyof ProductDraft, label: string, maxLength?: number) => <label className="field" key={key}>{label}<input className="input" value={productForm[key]} maxLength={maxLength} onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))} data-testid={`input-product-${key}`}/></label>;
  return <div className="storefront store-admin"><div className="store-page-intro"><div className="store-container"><div className="store-overline"><span>ADMINISTRATION / CATALOG</span><span>OWNER WORKSPACE</span></div><div className="store-intro-row"><div><h1>Shape the collection.</h1><p>Create drafts, edit details, and manage what appears in the public shop. Publishing is validated by the server.</p></div></div></div></div><div className="store-container store-admin-body"><div className="store-admin-top"><Link href="/account" className="store-text-link"><ArrowLeft size={16}/> Back to account</Link><Link href="/shop" className="store-text-link">View public shop <ArrowRight size={16}/></Link></div>
    {restricted ? <div className="store-state" role="alert"><h2>Access restricted.</h2><p>Your signed-in account is not authorized to manage the store. Access is controlled by the server; signing in alone does not grant it.</p></div> : <>
    {(products.isLoading || categories.isLoading) && <div className="store-admin-loading" role="status"><span/><span/><span/></div>}
    {(products.isError || categories.isError) && !restricted && <div className="notice" role="alert">Catalog data could not be loaded. {errorText(products.error || categories.error)} <button type="button" onClick={() => { void products.refetch(); void categories.refetch(); }} data-testid="button-retry-admin"><RefreshCw size={15}/> Retry</button></div>}
    {error && <div className="store-admin-message error" role="alert">{error}</div>}
    {success && <div className="store-admin-message success" role="status"><Check size={16}/>{success}</div>}
    {!products.isLoading && !categories.isLoading && !products.isError && !categories.isError && <><div className="store-admin-tabs"><div role="tablist" aria-label="Admin sections"><button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setEditingCategory(null); resetNotice(); }} data-testid="tab-admin-products">Products <span>{products.data?.length ?? 0}</span></button><button role="tab" aria-selected={tab === 'categories'} className={tab === 'categories' ? 'active' : ''} onClick={() => { setTab('categories'); setEditingProduct(null); resetNotice(); }} data-testid="tab-admin-categories">Categories <span>{categories.data?.length ?? 0}</span></button><button role="tab" aria-selected={tab === 'support'} className={tab === 'support' ? 'active' : ''} onClick={() => { setTab('support'); setEditingProduct(null); setEditingCategory(null); resetNotice(); }} data-testid="tab-admin-support">Support</button></div>{tab !== 'support' && <button className="store-button store-button-dark" onClick={() => tab === 'products' ? openProduct('new') : openCategory('new')} data-testid="button-add-catalog"><Plus size={16}/> Add {tab === 'products' ? 'product' : 'category'}</button>}</div>
    {tab === 'products' && <div className="store-admin-list">{!products.data?.length ? <div className="store-admin-empty"><h2>No products yet.</h2><p>Create a draft to start building the collection.</p><button className="store-button store-button-dark" onClick={() => openProduct('new')}>Create draft <Plus size={16}/></button></div> : products.data.map(p => <div className="store-admin-row" key={p.id} data-testid={`row-admin-product-${p.id}`}><div className="store-admin-row-main"><span className={`store-admin-status status-${p.status}`}>{p.status}</span><h3>{p.name}</h3><p>{p.productType === 'ai_tool' ? 'AI tool' : 'Digital product'} / {p.categoryName || 'Uncategorized'} / {p.slug}</p></div><div className="store-admin-row-actions"><button onClick={() => openProduct(p)} disabled={!!busyId} data-testid={`button-edit-product-${p.id}`}>Edit</button>{p.status === 'draft' && <button onClick={() => void changeStatus(p, 'published')} disabled={!!busyId} data-testid={`button-publish-product-${p.id}`}>Publish</button>}{p.status === 'published' && <button onClick={() => void changeStatus(p, 'archived')} disabled={!!busyId} data-testid={`button-archive-product-${p.id}`}>Archive</button>}{p.status === 'archived' && <button onClick={() => void changeStatus(p, 'draft')} disabled={!!busyId} data-testid={`button-draft-product-${p.id}`}>Move to draft</button>}{p.status === 'draft' && <button className="danger" onClick={() => void removeProduct(p)} disabled={!!busyId} data-testid={`button-delete-product-${p.id}`}><Trash2 size={15}/> Delete</button>}</div></div>)}</div>}
    {tab === 'categories' && <div className="store-admin-list">{!categories.data?.length ? <div className="store-admin-empty"><h2>No categories yet.</h2><p>Add a category to organize your catalog.</p><button className="store-button store-button-dark" onClick={() => openCategory('new')}>Add category <Plus size={16}/></button></div> : categories.data.map(c => <div className="store-admin-row" key={c.id} data-testid={`row-admin-category-${c.id}`}><div className="store-admin-row-main"><span className={`store-admin-status ${c.active ? 'status-published' : 'status-archived'}`}>{c.active ? 'Active' : 'Inactive'}</span><h3>{c.name}</h3><p>{c.slug}{c.description ? ` / ${c.description}` : ''}</p></div><div className="store-admin-row-actions"><button onClick={() => openCategory(c)} disabled={!!busyId} data-testid={`button-edit-category-${c.id}`}>Edit</button><button onClick={() => void toggleCategory(c)} disabled={!!busyId} data-testid={`button-toggle-category-${c.id}`}>{c.active ? 'Deactivate' : 'Activate'}</button><button className="danger" onClick={() => void removeCategory(c)} disabled={!!busyId} data-testid={`button-delete-category-${c.id}`}><Trash2 size={15}/> Delete</button></div></div>)}</div>}{tab === 'support' && <StoreSupportQueue/>}</>}
    </>}
    {editingProduct && <div className="store-admin-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditingProduct(null); }}><div className="store-admin-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"><div className="store-admin-dialog-head"><div><span className="store-kicker">CATALOG / PRODUCT</span><h2 id="product-dialog-title">{editingProduct === 'new' ? 'New draft product' : 'Edit product'}</h2></div><button className="icon-button" aria-label="Close editor" onClick={() => setEditingProduct(null)}><X size={22}/></button></div><form onSubmit={e => void submitProduct(e)} className="store-admin-form"><p className="store-admin-hint">Save as a draft first. Publishing requires the server's validation; entering payment details here never enables checkout automatically.</p><div className="form-grid"><label className="field">Product name<input className="input" required maxLength={200} value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value, slug: editingProduct === 'new' && (!f.slug || f.slug === slugify(f.name)) ? slugify(e.target.value) : f.slug }))} data-testid="input-product-name"/></label>{field('slug', 'URL slug', 200)}</div><div className="form-grid"><label className="field">Type<select className="input" value={productForm.productType} onChange={e => setProductForm(f => ({ ...f, productType: e.target.value as ProductDraft['productType'] }))} data-testid="select-product-type"><option value="digital">Digital product</option><option value="ai_tool">AI tool</option></select></label><label className="field">Category<select className="input" value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))} data-testid="select-product-category"><option value="">Uncategorized</option>{categories.data?.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}</select></label></div>{field('summary', 'Short summary', 500)}<label className="field">Description<textarea className="input" value={productForm.description} maxLength={10000} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} data-testid="input-product-description"/></label><div className="form-grid"><label className="field">Features — one per line<textarea className="input" value={productForm.features} onChange={e => setProductForm(f => ({ ...f, features: e.target.value }))} data-testid="input-product-features"/></label><label className="field">Requirements — one per line<textarea className="input" value={productForm.requirements} onChange={e => setProductForm(f => ({ ...f, requirements: e.target.value }))} data-testid="input-product-requirements"/></label></div>{field('imageUrl', 'Cover image HTTPS URL') }<div className="store-admin-form-divider">PAYMENT REFERENCE / OPTIONAL</div><p className="store-admin-hint">Enter only verified Whop product information. The storefront will not show a checkout button until a server-confirmed payment flow exists.</p><div className="form-grid">{field('whopProductId', 'Whop product ID', 200)}{field('whopProductUrl', 'Whop product HTTPS URL')}</div><label className="field">Delivery instructions (private administration)<textarea className="input" value={productForm.deliveryInstructions} maxLength={5000} onChange={e => setProductForm(f => ({ ...f, deliveryInstructions: e.target.value }))} data-testid="input-product-delivery-instructions"/></label><p className="store-admin-hint">Do not enter public download links here. File delivery is not configured through this form.</p>{error && <div className="store-admin-message error" role="alert">{error}</div>}<div className="store-admin-form-actions"><button type="button" className="store-button store-button-outline" onClick={() => setEditingProduct(null)}>Cancel</button><button type="submit" className="store-button store-button-dark" disabled={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? 'Saving…' : 'Save product'} <ArrowRight size={16}/></button></div></form></div></div>}
    {editingCategory && <div className="store-admin-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditingCategory(null); }}><div className="store-admin-dialog store-admin-dialog-small" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title"><div className="store-admin-dialog-head"><div><span className="store-kicker">CATALOG / CATEGORY</span><h2 id="category-dialog-title">{editingCategory === 'new' ? 'New category' : 'Edit category'}</h2></div><button className="icon-button" aria-label="Close editor" onClick={() => setEditingCategory(null)}><X size={22}/></button></div><form onSubmit={e => void submitCategory(e)} className="store-admin-form"><label className="field">Name<input className="input" required maxLength={120} value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value, slug: editingCategory === 'new' && (!f.slug || f.slug === slugify(f.name)) ? slugify(e.target.value) : f.slug }))} data-testid="input-category-name"/></label><label className="field">URL slug<input className="input" required maxLength={160} value={categoryForm.slug} onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))} data-testid="input-category-slug"/></label><label className="field">Description<textarea className="input" maxLength={2000} value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} data-testid="input-category-description"/></label><label className="store-admin-check"><input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm(f => ({ ...f, active: e.target.checked }))} data-testid="checkbox-category-active"/> Active category</label>{error && <div className="store-admin-message error" role="alert">{error}</div>}<div className="store-admin-form-actions"><button type="button" className="store-button store-button-outline" onClick={() => setEditingCategory(null)}>Cancel</button><button type="submit" className="store-button store-button-dark" disabled={createCategory.isPending || updateCategory.isPending}>{createCategory.isPending || updateCategory.isPending ? 'Saving…' : 'Save category'} <ArrowRight size={16}/></button></div></form></div></div>}
  </div></div>;
}