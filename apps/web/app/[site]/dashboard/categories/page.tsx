'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import type { Category } from '@beritakarya/types';
import { getCategoryColor, CATEGORIES_CONFIG } from '../../../../lib/constants';

export default function CategoriesDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [order, setOrder] = useState('0');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const params = useParams();
  const siteId = (params.site as string) || 'pusat';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = async () => {
    try {
      const queryParams: Record<string, string> = {};
      if (isGlobalView) {
        queryParams.view = 'all';
      } else {
        queryParams.site = siteId;
      }
      // Use /categories/tree endpoint to get hierarchical structure (synced with homepage & editor)
      const { data } = await api.get('/categories/tree', { params: queryParams });
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error: any) {
      console.error('Gagal mengambil kategori', error);
      showToast('Gagal memuat kategori', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [isGlobalView, siteId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (editingCategory) return; // Don't auto-generate if editing
    const generated = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  }, [name, editingCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name,
        slug,
        parentId: parentId || null,
        order: order ? Number(order) : 0,
        siteId: isGlobalView ? null : siteId
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast('Kategori berhasil diperbarui');
      } else {
        await api.post('/categories', payload);
        showToast('Kategori berhasil dibuat');
      }
      
      setName('');
      setSlug('');
      setParentId('');
      setOrder('0');
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || (editingCategory ? 'Gagal memperbarui kategori' : 'Gagal membuat kategori'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || '');
    setOrder(String(cat.order || 0));
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId('');
    setOrder('0');
  };

  const handleDeleteRequest = (cat: Category) => {
    if (cat.isGlobal && !isGlobalView) {
      showToast('Kategori global hanya dapat dihapus di Global View', 'error');
      return;
    }
    setDeleteConfirm(cat);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/categories/${deleteConfirm.id}`);
      showToast('Kategori berhasil dihapus');
      fetchCategories();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Gagal menghapus kategori', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      // 1. Get existing categories slugs to prevent duplicate insertions
      const existingSlugs = new Map<string, string>(); // slug lowercase -> id
      const flatten = (items: Category[]) => {
        for (const item of items) {
          existingSlugs.set(item.slug.toLowerCase(), item.id);
          if (item.subCategories) {
            flatten(item.subCategories);
          }
        }
      };
      flatten(categories);

      // 2. Filter categories to insert (skipping system/dynamic filters like Terbaru and Tersimpan)
      const defaultCats = CATEGORIES_CONFIG.filter(
        cat => cat.slug !== 'Terbaru' && cat.slug !== 'Tersimpan'
      );

      let createdParentCount = 0;
      let createdSubCount = 0;

      // 3. Insert parent categories first
      for (const cat of defaultCats) {
        const parentSlugNormalized = cat.slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let parentIdToUse = existingSlugs.get(parentSlugNormalized);

        // If parent category does not exist, create it
        if (!parentIdToUse) {
          try {
            const payload = {
              name: cat.name,
              slug: parentSlugNormalized,
              parentId: null,
              order: defaultCats.indexOf(cat) + 1,
              siteId: isGlobalView ? null : siteId
            };
            const { data } = await api.post('/categories', payload);
            if (data.success && data.data?.id) {
              parentIdToUse = data.data.id;
              existingSlugs.set(parentSlugNormalized, parentIdToUse);
              createdParentCount++;
            }
          } catch (err: any) {
            console.error(`Gagal membuat parent ${cat.name}`, err);
          }
        }

        // 4. Insert subcategories under the parent category
        if (parentIdToUse && cat.subCategories) {
          for (const sub of cat.subCategories) {
            const subSlugNormalized = sub.slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            const subExists = existingSlugs.has(subSlugNormalized);

            if (!subExists) {
              try {
                const subPayload = {
                  name: sub.name,
                  slug: subSlugNormalized,
                  parentId: parentIdToUse,
                  order: cat.subCategories.indexOf(sub) + 1,
                  siteId: isGlobalView ? null : siteId
                };
                await api.post('/categories', subPayload);
                existingSlugs.set(subSlugNormalized, 'created');
                createdSubCount++;
              } catch (err: any) {
                console.error(`Gagal membuat subkategori ${sub.name}`, err);
              }
            }
          }
        }
      }

      if (createdParentCount > 0 || createdSubCount > 0) {
        showToast(`Berhasil memuat ${createdParentCount} Kategori Utama dan ${createdSubCount} Sub-Kategori!`);
      } else {
        showToast('Semua kategori default sudah ada di database.', 'success');
      }
      
      fetchCategories();
    } catch (error: any) {
      console.error('Gagal memuat kategori default', error);
      showToast('Gagal memuat kategori default', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Flatten tree structure for table display
  const flattenCategories = (cats: Category[], isSub = false): (Category & { isSub?: boolean })[] => {
    return cats.flatMap(cat => {
      const result: (Category & { isSub?: boolean })[] = [isSub ? { ...cat, isSub: true } : cat];
      if (cat.subCategories && cat.subCategories.length > 0) {
        result.push(...flattenCategories(cat.subCategories, true));
      }
      return result;
    });
  };

  const orderedCategories = flattenCategories(categories);

  // Get parent candidates (only top-level categories) for dropdown, excluding self when editing
  const potentialParents = categories.filter(
    parent => !parent.parentId && (!editingCategory || parent.id !== editingCategory.id)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-4 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Menu Kategori & Rubrikasi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola struktur menu navigasi hierarkis (Parent & Sub-menu)
            {!isGlobalView && <span className="text-rose-600 font-bold dark:text-rose-400"> untuk {siteId}</span>}
          </p>
        </div>

        {/* Superadmin Toggle */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between">
          <button
            onClick={handleSeedDefaults}
            disabled={loading}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-105 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            title="Muat kategori standar homepage ke database"
          >
            <span>✨</span> {loading ? 'Memuat...' : 'Muat Default'}
          </button>

          <button
            onClick={() => setIsGlobalView(!isGlobalView)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 border ${
              isGlobalView 
                ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
            }`}
          >
            {isGlobalView ? '🌐 Global View ON' : '📍 Site View'}
          </button>
          
          {isGlobalView && (
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900/30 hidden md:block">
              Superadmin Mode: Mengelola kategori global / lintas situs.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Add / Edit */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center justify-between">
              <span>{editingCategory ? 'Edit Kategori' : 'Tambah Baru'}</span>
              {editingCategory && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                >
                  BATAL
                </button>
              )}
            </h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Kategori / Rubrik</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Olahraga, Politik Lokal"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-semibold"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Slug URL / Identifier</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={!!editingCategory}
                    placeholder="politik-lokal"
                    className="w-full pl-7 pr-4 py-3 bg-gray-100/50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none font-mono text-rose-600 dark:text-rose-400 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  URL-friendly. Terbentuk otomatis dari nama untuk kategori baru.
                </p>
              </div>

              {/* Parent Category Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Kategori Induk (Parent Menu)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-rose-500 transition-all font-semibold"
                >
                  <option value="">None (Jadikan Kategori Utama / Induk)</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isGlobal ? '(Global)' : ''}
                    </option>
                  ))}
                  {potentialParents.length === 0 && categories.length > 0 && (
                    <option value="" disabled>Semua kategori sudah memiliki induk</option>
                  )}
                </select>
                <p className="text-[11px] text-gray-400 mt-2">
                  Pilih induk jika ingin menjadikan kategori ini sebagai Sub-menu. Hanya kategori utama yang dapat dipilih sebagai induk.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Order Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Urutan (Order)</label>
                  <input 
                    type="number" 
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-rose-500 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Color Info (read-only) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Warna Otomatis</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${getCategoryColor(name || 'umum')}`}>
                      {name || 'Nama Kategori'}
                    </span>
                    <span className="text-[11px] text-gray-400">(otomatis dari nama)</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-rose-600/20 shadow-rose-600/10 hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Buat Kategori')}
              </button>
            </form>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400">
              <span className="text-lg">💡</span>
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-bold">Tips Struktur Navigasi:</p>
                <p>Urutan (Order) menentukan posisi dari kiri-ke-kanan pada navigasi publik. Gunakan urutan yang rapat (misal 1, 2, 3) untuk visualisasi yang rapi.</p>
                <p className="mt-2">Warna kategori ditentukan otomatis berdasarkan nama dan konsisten dengan tampilan homepage.</p>
              </div>
            </div>
          </div>
        </div>

        {/* List Table Hierarchy */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-150 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                      Struktur Menu / Rubrik
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                      Scope
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                      Urutan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400">
                      Warna Tampil (Homepage)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {orderedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto text-gray-400">
                          <span className="text-5xl">📂</span>
                          <span className="text-sm font-bold uppercase tracking-widest text-gray-550 dark:text-gray-300">Belum ada kategori</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Mulai dengan menambahkan kategori baru melalui form di samping, atau langsung muat seluruh kategori bawaan (default) yang sesuai dengan tampilan homepage.
                          </p>
                          <button
                            onClick={handleSeedDefaults}
                            disabled={loading}
                            className="mt-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
                          >
                            <span>✨</span> {loading ? 'Memuat...' : 'Muat Kategori Default'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orderedCategories.map(cat => {
                      return (
                        <tr 
                          key={cat.id} 
                          className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-150 ${
                            cat.isSub 
                              ? 'bg-gray-50/20 dark:bg-gray-900/10' 
                              : 'font-semibold'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {cat.isSub ? (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600 pl-4 font-mono select-none">↳</span>
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {cat.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {cat.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {cat.isGlobal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                                🌐 GLOBAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                {cat.siteId?.toUpperCase() || siteId.toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-gray-500">
                              {cat.order ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={getCategoryColor(cat.name)}>
                              {cat.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1">
                            <button 
                              onClick={() => {
                                if (cat.isGlobal && !isGlobalView) {
                                  showToast('Kategori global hanya dapat diedit di Global View', 'error');
                                  return;
                                }
                                startEdit(cat);
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                cat.isGlobal && !isGlobalView
                                  ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20'
                              }`}
                              title={cat.isGlobal && !isGlobalView ? 'Kategori global hanya bisa diedit dalam Global View' : 'Edit Kategori'}
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(cat)}
                              className={`p-2 rounded-xl transition-all ${
                                cat.isGlobal && !isGlobalView
                                  ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20'
                              }`}
                              title={cat.isGlobal && !isGlobalView ? 'Kategori global hanya bisa dihapus dalam Global View' : 'Hapus Kategori'}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-150 dark:border-gray-700">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                Total: {orderedCategories.length} Rubrik / Menu
              </p>
              {isGlobalView && (
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  Menampilkan semua kategori lintas situs
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Hapus Kategori?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus rubrik <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong>? 
              Jika rubrik ini adalah kategori utama, semua relasi sub-kategori di bawahnya akan kehilangan induknya. Tindakan ini permanen.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/25 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}